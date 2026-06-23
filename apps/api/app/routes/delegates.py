from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel, EmailStr, field_validator
from app.database.connection import TenantDB
from app.auth.jwt import get_current_user
from app.routes.scanning import generate_qr_token
from app.services.email_service import send_registration_email

import uuid
import qrcode
import io
import re

from base64 import b64encode

router = APIRouter()


# ==========================================================
# SCHEMAS
# ==========================================================

class DelegateCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    college: str | None = None

    food_pref: str = "veg"

    accommodation_required: bool = False

    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None

    event_id: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value):
        if value and not re.match(r"^[6-9]\d{9}$", value):
            raise ValueError("Invalid Indian mobile number")
        return value

    @field_validator("emergency_contact_phone")
    @classmethod
    def validate_emergency_phone(cls, value):
        if value and not re.match(r"^[6-9]\d{9}$", value):
            raise ValueError("Invalid emergency mobile number")
        return value


class DelegateUpdate(BaseModel):
    payment_status: str | None = None
    food_pref: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None


# ==========================================================
# CREATE DELEGATE
# ==========================================================

@router.post("/", status_code=201)
async def create_delegate(
    body: DelegateCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant_id
    delegate_id = str(uuid.uuid4())

    qr_token = generate_qr_token(
        tenant_id,
        body.event_id,
        delegate_id
    )

    async with TenantDB(tenant_id) as conn:

        try:
            await conn.execute(
                """
                INSERT INTO delegates (
                    id,
                    tenant_id,
                    event_id,
                    full_name,
                    email,
                    phone,
                    college,
                    qr_code,
                    food_pref,
                    accommodation_required,
                    emergency_contact_name,
                    emergency_contact_phone
                )
                VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
                )
                """,
                delegate_id,
                tenant_id,
                body.event_id,
                body.full_name,
                body.email,
                body.phone,
                body.college,
                qr_token,
                body.food_pref,
                body.accommodation_required,
                body.emergency_contact_name,
                body.emergency_contact_phone
            )

            event = await conn.fetchrow(
                """
                SELECT title
                FROM events
                WHERE id = $1
                AND tenant_id = $2
                """,
                body.event_id,
                tenant_id
            )

            event_title = (
                event["title"]
                if event
                else "EventSphere Event"
            )

        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to create delegate: {str(e)}"
            )

    try:
        await send_registration_email(
            email=body.email,
            name=body.full_name,
            event_name=event_title,
            qr_token=qr_token
        )
    except Exception as e:
        print("Email Error:", e)

    return {
        "message": "Delegate registered",
        "delegate_id": delegate_id,
        "qr_code": qr_token
    }


# ==========================================================
# LIST DELEGATES
# ==========================================================

@router.get("/")
async def list_delegates(
    event_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant_id

    async with TenantDB(tenant_id) as conn:

        delegates = await conn.fetch(
            """
            SELECT
                id,
                full_name,
                email,
                phone,
                college,
                payment_status,
                food_pref,
                accommodation_required,
                emergency_contact_name,
                emergency_contact_phone,
                created_at

            FROM delegates

            WHERE event_id = $1
            AND tenant_id = $2

            ORDER BY created_at DESC
            """,
            event_id,
            tenant_id
        )

    return {
        "delegates": [dict(d) for d in delegates]
    }


# ==========================================================
# GET DELEGATE
# ==========================================================

@router.get("/{delegate_id}")
async def get_delegate(
    delegate_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant_id

    async with TenantDB(tenant_id) as conn:

        delegate = await conn.fetchrow(
            """
            SELECT *
            FROM delegates
            WHERE id = $1
            AND tenant_id = $2
            """,
            delegate_id,
            tenant_id
        )

    if not delegate:
        raise HTTPException(
            status_code=404,
            detail="Delegate not found"
        )

    return dict(delegate)


# ==========================================================
# UPDATE DELEGATE
# ==========================================================

@router.patch("/{delegate_id}")
async def update_delegate(
    delegate_id: str,
    body: DelegateUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant_id

    updates = []
    values = []

    if body.payment_status:
        updates.append(f"payment_status = ${len(values)+1}")
        values.append(body.payment_status)

    if body.food_pref:
        updates.append(f"food_pref = ${len(values)+1}")
        values.append(body.food_pref)

    if body.emergency_contact_name:
        updates.append(
            f"emergency_contact_name = ${len(values)+1}"
        )
        values.append(body.emergency_contact_name)

    if body.emergency_contact_phone:
        updates.append(
            f"emergency_contact_phone = ${len(values)+1}"
        )
        values.append(body.emergency_contact_phone)

    if not updates:
        return {
            "message": "No updates provided"
        }

    values.append(delegate_id)
    values.append(tenant_id)

    query = f"""
        UPDATE delegates
        SET {', '.join(updates)}
        WHERE id = ${len(values)-1}
        AND tenant_id = ${len(values)}
    """

    async with TenantDB(tenant_id) as conn:
        await conn.execute(
            query,
            *values
        )

    return {
        "message": "Delegate updated"
    }


# ==========================================================
# QR PASS
# ==========================================================

@router.get("/{delegate_id}/qr-pass")
async def get_qr_pass(
    delegate_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    tenant_id = request.state.tenant_id

    async with TenantDB(tenant_id) as conn:

        delegate = await conn.fetchrow(
            """
            SELECT
                full_name,
                qr_code
            FROM delegates
            WHERE id = $1
            AND tenant_id = $2
            """,
            delegate_id,
            tenant_id
        )

    if not delegate:
        raise HTTPException(
            status_code=404,
            detail="Delegate not found"
        )

    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=2
    )

    qr.add_data(delegate["qr_code"])
    qr.make(fit=True)

    img = qr.make_image()

    img_bytes = io.BytesIO()

    img.save(
        img_bytes,
        format="PNG"
    )

    img_bytes.seek(0)

    return {
        "name": delegate["full_name"],
        "qr_code": b64encode(
            img_bytes.getvalue()
        ).decode()
    }