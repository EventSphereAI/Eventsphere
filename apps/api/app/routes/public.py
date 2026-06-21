from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from app.database.connection import TenantDB
from app.routes.scanning import generate_qr_token
from app.services.email_service import send_registration_email

import uuid
import re
import qrcode
import io

from base64 import b64encode

router = APIRouter()


# ==========================================================
# SCHEMAS
# ==========================================================

class PublicRegistration(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    college: str | None = None

    food_pref: str = "veg"

    accommodation_required: bool = False

    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None

    event_id: str
    tenant_id: str


# ==========================================================
# PUBLIC REGISTRATION
# ==========================================================

@router.post("/register")
async def public_register(body: PublicRegistration):

    if not re.match(r"^[6-9]\d{9}$", body.phone):
        raise HTTPException(
            status_code=400,
            detail="Invalid mobile number"
        )

    delegate_id = str(uuid.uuid4())

    qr_token = generate_qr_token(
        body.tenant_id,
        body.event_id,
        delegate_id
    )

    async with TenantDB(body.tenant_id) as conn:

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
            body.tenant_id,
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
            """,
            body.event_id
        )

    event_title = (
        event["title"]
        if event
        else "EventSphere Event"
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
        "success": True,
        "message": "Registration successful",
        "delegate_id": delegate_id,
        "qr_token": qr_token
    }


# ==========================================================
# PUBLIC QR PASS
# ==========================================================

@router.get("/qr/{delegate_id}")
async def public_qr(delegate_id: str):

    async with TenantDB(None) as conn:

        delegate = await conn.fetchrow(
            """
            SELECT
                full_name,
                qr_code
            FROM delegates
            WHERE id = $1
            """,
            delegate_id
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


# ==========================================================
# PUBLIC EVENT DETAILS
# ==========================================================

@router.get("/event/{event_id}")
async def public_event(
    event_id: str,
    tenant_id: str
):

    async with TenantDB(tenant_id) as conn:

        event = await conn.fetchrow(
            """
            SELECT
                id,
                title,
                venue,
                start_date,
                end_date,
                description
            FROM events
            WHERE id = $1
            """,
            event_id
        )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return dict(event)