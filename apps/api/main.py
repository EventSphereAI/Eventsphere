from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routes.public import router as public_router
from app.database.connection import connect_db, disconnect_db
from app.routes import auth, tenants, events, delegates, scanning, food, accommodation, reports, public
from app.middleware.tenant import TenantMiddleware

from app.routes import test_email

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
app.include_router(public_router, prefix="/api")
app.include_router(auth.router,          prefix="/api/auth",          tags=["Auth"])
app.include_router(tenants.router,       prefix="/api/tenants",       tags=["Tenants"])
app.include_router(events.router,        prefix="/api/events",        tags=["Events"])
app.include_router(delegates.router,     prefix="/api/delegates",     tags=["Delegates"])
app.include_router(scanning.router,      prefix="/api/scan",          tags=["Scanning"])
app.include_router(food.router,          prefix="/api/food",          tags=["Food"])
app.include_router(accommodation.router, prefix="/api/accommodation", tags=["Accommodation"])
app.include_router(reports.router,       prefix="/api/reports",       tags=["Reports"])
app.include_router(public.router,        prefix="/api/public",        tags=["Public"])
app.include_router(test_email.router,    prefix="/api/test",          tags=["Testing"])

@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "EventSphere API v1.0.0"}

