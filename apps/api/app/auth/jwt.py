from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.requests import Request
import os

SECRET_KEY = os.getenv("JWT_SECRET", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()

# ── Password helpers ────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

# ── Token helpers ───────────────────────────────────────────

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload["type"] = "access"
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload["type"] = "refresh"
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

# ── FastAPI dependency: get current user ────────────────────

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    payload = decode_token(credentials.credentials)

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    # Token tenant must match request tenant
    tenant_id = getattr(request.state, "tenant_id", None)
    if tenant_id and payload.get("tenant_id") != tenant_id:
        raise HTTPException(status_code=403, detail="Token does not match this organization")

    return {
        "user_id": payload.get("sub"),
        "tenant_id": payload.get("tenant_id"),
        "role": payload.get("role"),
        "email": payload.get("email"),
    }

# ── Role guards ──────────────────────────────────────────────

def require_roles(*roles: str):
    async def _check(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(roles)}"
            )
        return current_user
    return _check

# ── EventSphere Role Guards ─────────────────────────────

require_super_admin = require_roles(
    "super_admin"
)

# Organization Owner
require_admin = require_roles(
    "organizer",
    "super_admin"
)

# Registration Team
require_registration = require_roles(
    "registration_team",
    "organizer",
    "super_admin"
)

# Attendance Scanner Team
require_attendance = require_roles(
    "technical_team",
    "organizer",
    "super_admin"
)

# Food Team
require_food = require_roles(
    "food_staff",
    "organizer",
    "super_admin"
)

# Accommodation Team
require_accommodation = require_roles(
    "hospitality_team",
    "organizer",
    "super_admin"
)

# Kit Distribution Team
require_kit = require_roles(
    "registration_team",
    "organizer",
    "super_admin"
)

# Any Staff
require_any_staff = require_roles(
    "organizer",
    "registration_team",
    "hospitality_team",
    "food_staff",
    "technical_team",
    "logistics_team",
    "volunteer_coordinator",
    "volunteer",
    "super_admin"
)