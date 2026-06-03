╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║              EVENTSPHERE - COMPLETE FINAL FILES PACKAGE                        ║
║                                                                                ║
║               Every File With Final, Updated Content                           ║
║               Copy-Paste Ready Into Your Project                               ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝

## 📋 TABLE OF CONTENTS

This document contains EVERY file organized by folder:

1. ROOT FILES
2. BACKEND FILES (apps/api/)
3. FRONTEND FILES (apps/web/)
4. INFRASTRUCTURE FILES (infra/)
5. DOCUMENTATION FILES

Copy the file name and content exactly as shown.

═══════════════════════════════════════════════════════════════════════════════

## 🔵 ROOT FILES

═══════════════════════════════════════════════════════════════════════════════

### FILE: .gitignore
Location: eventsphere/.gitignore

# Environment variables
.env
.env.local
.env.*.local
.env.local.example

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
pip-wheel-metadata/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST
venv/
env/
.venv
.virtualenv

# Node
node_modules/
.next/
out/
.npm
.eslintcache
.node_repl_history
*.tgz
.yarn-integrity
.cache/
.nuxt
dist/
.cache/
.vuepress/dist
.serverless/
.fusebox/
.dynamodb/
.tern-port

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
*.iml
.project
.pydevproject
.settings/
*.sublime-project
*.sublime-workspace

# Testing
.coverage
.pytest_cache/
htmlcov/
.nyc_output

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store
Thumbs.db
.directory

# Temporary
temp/
tmp/
*.tmp
*.bak

# Project specific
.env.production
secrets.json

---

═══════════════════════════════════════════════════════════════════════════════

## 🟢 BACKEND FILES (apps/api/)

═══════════════════════════════════════════════════════════════════════════════

### FILE: requirements.txt
Location: eventsphere/apps/api/requirements.txt

fastapi==0.111.0
uvicorn[standard]==0.29.0
asyncpg==0.29.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic[email]==2.7.1
python-dotenv==1.0.1
qrcode[pil]==7.4.2
reportlab==4.1.0
pandas==2.2.2
openpyxl==3.1.2
httpx==0.27.0
redis==5.0.4

---

### FILE: .env.example
Location: eventsphere/apps/api/.env.example

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres

# Auth
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
QR_HMAC_SECRET=your-qr-signing-secret-min-32-chars

# Platform
PLATFORM_DOMAIN=eventsphere.app
SUPER_ADMIN_SECRET=your-super-admin-header-secret

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@eventsphere.app

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# Storage
STORAGE_BUCKET=eventsphere-files
STORAGE_URL=https://your-account.r2.cloudflarestorage.com

# Redis
REDIS_URL=redis://localhost:6379

---

### FILE: main.py
Location: eventsphere/apps/api/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database.connection import connect_db, disconnect_db
from app.routes import auth, tenants, events, delegates, scanning, food, accommodation, reports
from app.middleware.tenant import TenantMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_db()
    print("✓ Application started")
    yield
    # Shutdown
    await disconnect_db()
    print("✓ Application shutdown")

app = FastAPI(
    title="EventSphere AI API",
    description="Multi-tenant event management platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "*.eventsphere.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tenant middleware - must be last added (first executed)
app.add_middleware(TenantMiddleware)

# Routes
app.include_router(auth.router,          prefix="/api/auth",          tags=["Auth"])
app.include_router(tenants.router,       prefix="/api/tenants",       tags=["Tenants"])
app.include_router(events.router,        prefix="/api/events",        tags=["Events"])
app.include_router(delegates.router,     prefix="/api/delegates",     tags=["Delegates"])
app.include_router(scanning.router,      prefix="/api/scan",          tags=["Scanning"])
app.include_router(food.router,          prefix="/api/food",          tags=["Food"])
app.include_router(accommodation.router, prefix="/api/accommodation", tags=["Accommodation"])
app.include_router(reports.router,       prefix="/api/reports",       tags=["Reports"])

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "EventSphere API v1.0.0"}

---

### FILE: app/__init__.py
Location: eventsphere/apps/api/app/__init__.py

# EventSphere API

---

### FILE: app/database/__init__.py
Location: eventsphere/apps/api/app/database/__init__.py

# Module init

---

### FILE: app/database/connection.py
Location: eventsphere/apps/api/app/database/connection.py

import asyncpg
from typing import Optional
import os

_pool: Optional[asyncpg.Pool] = None

async def connect_db():
    global _pool
    try:
        _pool = await asyncpg.create_pool(
            dsn=os.getenv("DATABASE_URL"),
            min_size=2,
            max_size=10,
            command_timeout=30
        )
        print("✓ Database connected")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        raise

async def disconnect_db():
    global _pool
    if _pool:
        await _pool.close()
        print("✓ Database disconnected")

def get_pool() -> asyncpg.Pool:
    if not _pool:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _pool

class TenantDB:
    """
    Context manager that sets app.current_tenant_id for RLS queries.
    """
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self._conn = None

    async def __aenter__(self):
        self._conn = await get_pool().acquire()
        await self._conn.execute(
            "SELECT set_config('app.current_tenant_id', $1, true)",
            self.tenant_id
        )
        return self._conn

    async def __aexit__(self, *args):
        if self._conn:
            await get_pool().release(self._conn)

---

### FILE: app/auth/__init__.py
Location: eventsphere/apps/api/app/auth/__init__.py

# Auth module

---

### FILE: app/auth/jwt.py
Location: eventsphere/apps/api/app/auth/jwt.py

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

require_organizer = require_roles("organizer", "super_admin")
require_any_staff = require_roles(
    "organizer", "registration_team", "food_staff",
    "hospitality_team", "logistics_team", "technical_team", "super_admin"
)

---

### FILE: app/middleware/__init__.py
Location: eventsphere/apps/api/app/middleware/__init__.py

# Middleware modules

---

### FILE: app/middleware/tenant.py
Location: eventsphere/apps/api/app/middleware/tenant.py

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.database.connection import get_pool
import os

PLATFORM_DOMAIN = os.getenv("PLATFORM_DOMAIN", "eventsphere.app")

class TenantMiddleware(BaseHTTPMiddleware):
    """
    Resolves tenant from subdomain or header.
    Sets request.state.tenant_id and request.state.tenant.
    """

    async def dispatch(self, request: Request, call_next):
        # Public endpoints — no tenant needed
        if request.url.path in ["/api/health", "/api/auth/register-tenant"]:
            request.state.tenant_id = None
            request.state.tenant = None
            return await call_next(request)

        tenant_slug = self._extract_slug(request)

        if not tenant_slug:
            return JSONResponse({"error": "Tenant not found"}, status_code=404)

        pool = get_pool()
        # Get tenant by slug (bypass RLS)
        tenant = await pool.fetchrow(
            "SELECT id, slug, name, plan, is_active FROM tenants WHERE slug = $1",
            tenant_slug
        )

        if not tenant:
            return JSONResponse({"error": f"Organization '{tenant_slug}' not found"}, status_code=404)

        if not tenant["is_active"]:
            return JSONResponse({"error": "This organization account is suspended"}, status_code=403)

        request.state.tenant_id = str(tenant["id"])
        request.state.tenant = dict(tenant)

        return await call_next(request)

    def _extract_slug(self, request: Request) -> str | None:
        host = request.headers.get("host", "")

        # Dev mode: pass slug via header
        dev_slug = request.headers.get("X-Tenant-Slug")
        if dev_slug:
            return dev_slug

        # Production: parse from subdomain
        if host.endswith(f".{PLATFORM_DOMAIN}"):
            slug = host[: -(len(PLATFORM_DOMAIN) + 1)]
            return slug if slug else None

        return None

---

### FILE: app/routes/__init__.py
Location: eventsphere/apps/api/app/routes/__init__.py

# API routes

---

### FILE: app/routes/auth.py
Location: eventsphere/apps/api/app/routes/auth.py

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, EmailStr
from app.database.connection import get_pool, TenantDB
from app.auth.jwt import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user
)
import uuid

router = APIRouter()

# ── Schemas ──────────────────────────────────────────────────

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

# ── Routes ───────────────────────────────────────────────────

@router.post("/register-tenant", status_code=201)
async def register_tenant(body: RegisterTenantRequest):
    """
    Create new organization + first admin user.
    Public endpoint (no auth needed).
    """
    pool = get_pool()

    # Check slug availability
    existing = await pool.fetchrow(
        "SELECT id FROM tenants WHERE slug = $1",
        body.org_slug
    )
    if existing:
        raise HTTPException(400, detail="This organization slug is already taken")

    tenant_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())

    try:
        async with pool.acquire() as conn:
            async with conn.transaction():
                # Create tenant
                await conn.execute(
                    "INSERT INTO tenants (id, slug, name, plan) VALUES ($1, $2, $3, 'free')",
                    tenant_id, body.org_slug, body.org_name
                )

                # Create first admin user
                await conn.execute("""
                    INSERT INTO users (id, tenant_id, email, password_hash, full_name, role)
                    VALUES ($1, $2, $3, $4, $5, 'organizer')
                """, user_id, tenant_id, body.email,
                    hash_password(body.password), body.name)

    except Exception as e:
        raise HTTPException(400, detail=f"Registration failed: {str(e)}")

    # Create tokens
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


@router.post("/login")
async def login(body: LoginRequest, request: Request):
    """Login for staff/organizers. Tenant resolved from subdomain."""
    tenant_id = getattr(request.state, "tenant_id", None)
    if not tenant_id:
        raise HTTPException(400, detail="No organization found")

    async with TenantDB(tenant_id) as conn:
        user = await conn.fetchrow(
            "SELECT id, email, password_hash, full_name, role, is_active FROM users WHERE email = $1",
            body.email
        )

    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, detail="Invalid email or password")

    if not user["is_active"]:
        raise HTTPException(403, detail="Your account has been deactivated")

    # Update last_login
    pool = get_pool()
    await pool.execute(
        "UPDATE users SET last_login = NOW() WHERE id = $1",
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
            "role": user["role"],
        },
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "token_type": "bearer"
    }


@router.post("/refresh")
async def refresh_token(body: RefreshRequest):
    """Exchange refresh token for new access token."""
    payload = decode_token(body.refresh_token)
    
    if payload.get("type") != "refresh":
        raise HTTPException(401, detail="Invalid refresh token")

    token_data = {
        "sub": payload["sub"],
        "tenant_id": payload["tenant_id"],
        "role": payload["role"],
        "email": payload["email"]
    }

    return {
        "access_token": create_access_token(token_data),
        "token_type": "bearer"
    }


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    """Get current user's profile."""
    async with TenantDB(current_user["tenant_id"]) as conn:
        user = await conn.fetchrow(
            "SELECT id, email, full_name, role, phone, created_at FROM users WHERE id = $1",
            current_user["user_id"]
        )

    if not user:
        raise HTTPException(404, detail="User not found")

    return dict(user)

---

### FILE: app/routes/events.py
Location: eventsphere/apps/api/app/routes/events.py

from fastapi import APIRouter, Request, Depends
from pydantic import BaseModel
from app.database.connection import TenantDB
from app.auth.jwt import get_current_user
from datetime import date
import uuid

router = APIRouter()

class EventCreate(BaseModel):
    title: str
    venue: str
    start_date: date
    end_date: date
    description: str | None = None

class EventUpdate(BaseModel):
    title: str | None = None
    venue: str | None = None
    status: str | None = None

@router.post("/", status_code=201)
async def create_event(
    body: EventCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create a new event"""
    tenant_id = request.state.tenant_id
    event_id = str(uuid.uuid4())
    
    async with TenantDB(tenant_id) as conn:
        await conn.execute("""
            INSERT INTO events (id, tenant_id, title, venue, start_date, end_date, description, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
        """, event_id, tenant_id, body.title, body.venue, body.start_date, 
            body.end_date, body.description)
    
    return {"message": "Event created", "event_id": event_id}

@router.get("/")
async def list_events(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """List all events for this organization"""
    tenant_id = request.state.tenant_id
    
    async with TenantDB(tenant_id) as conn:
        events = await conn.fetch("""
            SELECT id, title, venue, start_date, end_date, status, created_at
            FROM events
            ORDER BY start_date DESC
        """)
    
    return {"events": [dict(e) for e in events]}

@router.get("/{event_id}")
async def get_event(
    event_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get event details"""
    tenant_id = request.state.tenant_id
    
    async with TenantDB(tenant_id) as conn:
        event = await conn.fetchrow(
            "SELECT * FROM events WHERE id = $1",
            event_id
        )
    
    if not event:
        return {"error": "Event not found"}, 404
    
    return dict(event)

@router.patch("/{event_id}")
async def update_event(
    event_id: str,
    body: EventUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update event"""
    tenant_id = request.state.tenant_id
    
    updates = []
    values = []
    
    if body.title:
        updates.append("title = $" + str(len(values) + 1))
        values.append(body.title)
    if body.venue:
        updates.append("venue = $" + str(len(values) + 1))
        values.append(body.venue)
    if body.status:
        updates.append("status = $" + str(len(values) + 1))
        values.append(body.status)
    
    if not updates:
        return {"message": "No updates provided"}
    
    values.extend([event_id])
    
    async with TenantDB(tenant_id) as conn:
        await conn.execute(
            f"UPDATE events SET {', '.join(updates)} WHERE id = ${len(values)}",
            *values
        )
    
    return {"message": "Event updated"}

---

[CONTINUING IN NEXT MESSAGE DUE TO LENGTH...]

The files continue with:
- app/routes/delegates.py
- app/routes/scanning.py
- app/routes/food.py
- app/routes/accommodation.py
- app/routes/tenants.py
- app/routes/reports.py
- app/models/__init__.py
- app/schemas/__init__.py
- app/services/__init__.py
- All frontend files
- All config files
- Database schema

Would you like me to continue with ALL remaining files?

---
