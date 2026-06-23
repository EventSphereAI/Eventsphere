from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, EmailStr
from app.database.connection import get_pool, TenantDB
from app.auth.jwt import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user
)
import uuid

router = APIRouter()

# ─────────────────────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────────────────────

class RegisterTenantRequest(BaseModel):
    org_slug: str
    org_name: str
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

# ─────────────────────────────────────────────────────────────
# Register Organization
# ─────────────────────────────────────────────────────────────

@router.post("/register-tenant", status_code=201)
async def register_tenant(body: RegisterTenantRequest):

    pool = get_pool()

    existing = await pool.fetchrow(
        """
        SELECT id
        FROM tenants
        WHERE slug = $1
        """,
        body.org_slug
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="This organization slug is already taken"
        )

    tenant_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())

    try:

        async with pool.acquire() as conn:

            async with conn.transaction():

                await conn.execute(
                    """
                    INSERT INTO tenants (
                        id,
                        slug,
                        name,
                        plan
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        'free'
                    )
                    """,
                    tenant_id,
                    body.org_slug,
                    body.org_name
                )

                await conn.execute(
                    """
                    INSERT INTO users (
                        id,
                        tenant_id,
                        email,
                        password_hash,
                        full_name,
                        role
                    )
                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        'organizer'
                    )
                    """,
                    user_id,
                    tenant_id,
                    body.email,
                    hash_password(body.password),
                    body.name
                )

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Registration failed: {str(e)}"
        )

    token_data = {
        "sub": user_id,
        "tenant_id": tenant_id,
        "role": "organizer",
        "email": body.email
    }

    return {
        "message": "Organization created successfully",
        "tenant": {
            "id": tenant_id,
            "slug": body.org_slug,
            "name": body.org_name
        },
        "user": {
            "id": user_id,
            "email": body.email,
            "name": body.name,
            "role": "organizer"
        },
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer"
    }

# ─────────────────────────────────────────────────────────────
# Login
# ─────────────────────────────────────────────────────────────

@router.post("/login")
async def login(
    body: LoginRequest,
    request: Request
):

    tenant_id = getattr(
        request.state,
        "tenant_id",
        None
    )

    print("LOGIN TENANT ID:", tenant_id)

    if not tenant_id:
        raise HTTPException(
            status_code=400,
            detail="No organization found"
        )

    async with TenantDB(tenant_id) as conn:

        user = await conn.fetchrow(
            """
            SELECT
                id,
                email,
                password_hash,
                full_name,
                role,
                is_active
            FROM users
            WHERE email = $1
            """,
            body.email
        )

        tenant = await conn.fetchrow(
            """
            SELECT
                id,
                name,
                slug
            FROM tenants
            WHERE id = $1
            """,
            tenant_id
        )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        body.password,
        user["password_hash"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="Your account has been deactivated"
        )

    pool = get_pool()

    await pool.execute(
        """
        UPDATE users
        SET last_login = NOW()
        WHERE id = $1
        """,
        user["id"]
    )

    token_data = {
        "sub": str(user["id"]),
        "tenant_id": tenant_id,
        "role": user["role"],
        "email": user["email"]
    }

    return {
        "user": {
            "id": str(user["id"]),
            "name": user["full_name"],
            "email": user["email"],
            "role": user["role"]
        },
        "tenant": {
            "id": str(tenant["id"]),
            "name": tenant["name"],
            "slug": tenant["slug"]
        },
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer"
    }

# ─────────────────────────────────────────────────────────────
# Refresh Token
# ─────────────────────────────────────────────────────────────

@router.post("/refresh")
async def refresh_token(
    body: RefreshRequest
):

    payload = decode_token(
        body.refresh_token
    )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )

    token_data = {
        "sub": payload["sub"],
        "tenant_id": payload["tenant_id"],
        "role": payload["role"],
        "email": payload["email"]
    }

    return {
        "access_token": create_access_token(
            token_data
        ),
        "token_type": "bearer"
    }

# ─────────────────────────────────────────────────────────────
# Current User
# ─────────────────────────────────────────────────────────────

@router.get("/me")
async def me(
    current_user: dict = Depends(
        get_current_user
    )
):

    async with TenantDB(
        current_user["tenant_id"]
    ) as conn:

        user = await conn.fetchrow(
            """
            SELECT
                id,
                email,
                full_name,
                role,
                phone,
                created_at
            FROM users
            WHERE id = $1
            """,
            current_user["user_id"]
        )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return dict(user)