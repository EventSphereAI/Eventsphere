from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from app.database.connection import TenantDB
from app.auth.jwt import (
    require_admin,
    hash_password
)
import uuid

router = APIRouter()


# ==========================================================
# Schemas
# ==========================================================

class CreateStaffRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str


class ResetPasswordRequest(BaseModel):
    password: str


# ==========================================================
# List Staff
# ==========================================================

@router.get("/")
async def list_staff(
    current_user: dict = Depends(require_admin)
):
    async with TenantDB(current_user["tenant_id"]) as conn:

        staff = await conn.fetch(
            """
            SELECT
                id,
                full_name,
                email,
                role,
                phone,
                is_active,
                last_login,
                created_at
            FROM users
            WHERE tenant_id = $1
            ORDER BY created_at DESC
            """,
            current_user["tenant_id"]
        )

    return [dict(s) for s in staff]


# ==========================================================
# Create Staff
# ==========================================================

@router.post("/")
async def create_staff(
    body: CreateStaffRequest,
    current_user: dict = Depends(require_admin)
):
    allowed_roles = [
        "registration_team",
        "technical_team",
        "food_staff",
        "hospitality_team",
        "logistics_team",
        "volunteer_coordinator",
        "volunteer"
    ]

    if body.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    async with TenantDB(current_user["tenant_id"]) as conn:

        existing = await conn.fetchrow(
            """
            SELECT id
            FROM users
            WHERE email = $1
            """,
            body.email
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        user_id = str(uuid.uuid4())

        await conn.execute(
            """
            INSERT INTO users (
                id,
                tenant_id,
                email,
                password_hash,
                full_name,
                role,
                is_active
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,true
            )
            """,
            user_id,
            current_user["tenant_id"],
            body.email,
            hash_password(body.password),
            body.full_name,
            body.role
        )

    return {
        "success": True,
        "message": "Staff created successfully"
    }


# ==========================================================
# Disable Staff
# ==========================================================

@router.patch("/{staff_id}/disable")
async def disable_staff(
    staff_id: str,
    current_user: dict = Depends(require_admin)
):
    async with TenantDB(current_user["tenant_id"]) as conn:

        await conn.execute(
            """
            UPDATE users
            SET is_active = false
            WHERE id = $1
            """,
            staff_id
        )

    return {
        "success": True,
        "message": "Staff disabled"
    }


# ==========================================================
# Reset Password
# ==========================================================

@router.patch("/{staff_id}/reset-password")
async def reset_password(
    staff_id: str,
    body: ResetPasswordRequest,
    current_user: dict = Depends(require_admin)
):
    async with TenantDB(current_user["tenant_id"]) as conn:

        await conn.execute(
            """
            UPDATE users
            SET password_hash = $1
            WHERE id = $2
            """,
            hash_password(body.password),
            staff_id
        )

    return {
        "success": True,
        "message": "Password updated"
    }