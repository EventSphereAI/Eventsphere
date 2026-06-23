import uuid
import json

from fastapi import APIRouter, Depends, HTTPException
from app.database.connection import get_pool
from app.auth.jwt import require_super_admin
from pydantic import BaseModel
from app.auth.jwt import hash_password

router = APIRouter()


class PlanUpdate(BaseModel):
    plan: str


class CreateFounder(BaseModel):
    full_name: str
    email: str
    password: str

class PasswordReset(BaseModel):
    password: str

async def create_log(
    admin_id,
    action,
    target_type,
    target_id,
    metadata={}
):
    pool = get_pool()

    await pool.execute(
        """
        INSERT INTO admin_logs (
            admin_id,
            action,
            target_type,
            target_id,
            metadata
        )
        VALUES ($1,$2,$3,$4,$5)
        """,
        admin_id,
        action,
        target_type,
        target_id,
        json.dumps(metadata)
    )


@router.get("/dashboard")
async def super_admin_dashboard(
    current_user: dict = Depends(require_super_admin)
):
    pool = get_pool()

    total_tenants = await pool.fetchval(
        "SELECT COUNT(*) FROM tenants"
    )

    total_users = await pool.fetchval(
        "SELECT COUNT(*) FROM users"
    )

    total_events = await pool.fetchval(
        "SELECT COUNT(*) FROM events"
    )

    total_delegates = await pool.fetchval(
        "SELECT COUNT(*) FROM delegates"
    )

    return {
        "total_tenants": total_tenants,
        "total_users": total_users,
        "total_events": total_events,
        "total_delegates": total_delegates
    }


@router.get("/tenants")
async def list_tenants(
    current_user: dict = Depends(require_super_admin)
):
    pool = get_pool()

    tenants = await pool.fetch(
        """
        SELECT
            id,
            name,
            slug,
            plan,
            is_active,
            max_events,
            max_delegates,
            created_at
        FROM tenants
        ORDER BY created_at DESC
        """
    )

    return [dict(t) for t in tenants]


@router.patch("/tenant/{tenant_id}/suspend")
async def suspend_tenant(
    tenant_id: str,
    current_user: dict = Depends(require_super_admin)
):
    if tenant_id == "00000000-0000-0000-0000-000000000001":
        raise HTTPException(
            status_code=400,
            detail="Cannot suspend EventSphere Platform"
        )

    pool = get_pool()

    await pool.execute(
        """
        UPDATE tenants
        SET is_active = false
        WHERE id = $1
        """,
        tenant_id
    )

    await create_log(
        current_user["user_id"],
        "tenant_suspended",
        "tenant",
        tenant_id
    )

    return {
        "success": True,
        "message": "Tenant suspended"
    }


@router.patch("/tenant/{tenant_id}/activate")
async def activate_tenant(
    tenant_id: str,
    current_user: dict = Depends(require_super_admin)
):
    pool = get_pool()

    await pool.execute(
        """
        UPDATE tenants
        SET is_active = true
        WHERE id = $1
        """,
        tenant_id
    )

    await create_log(
        current_user["user_id"],
        "tenant_activated",
        "tenant",
        tenant_id
    )

    return {
        "success": True,
        "message": "Tenant activated"
    }


@router.get("/users")
async def list_users(
    current_user: dict = Depends(require_super_admin)
):
    pool = get_pool()

    users = await pool.fetch(
        """
        SELECT
            u.id,
            u.full_name,
            u.email,
            u.role,
            t.name AS tenant_name
        FROM users u
        JOIN tenants t
        ON u.tenant_id = t.id
        ORDER BY u.created_at DESC
        """
    )

    return [dict(u) for u in users]


@router.get("/tenant/{tenant_id}")
async def tenant_details(
    tenant_id: str,
    current_user: dict = Depends(require_super_admin)
):
    pool = get_pool()

    tenant = await pool.fetchrow(
        """
        SELECT
            id,
            name,
            slug,
            plan,
            is_active,
            max_events,
            max_delegates,
            created_at
        FROM tenants
        WHERE id = $1
        """,
        tenant_id
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found"
        )

    total_users = await pool.fetchval(
        """
        SELECT COUNT(*)
        FROM users
        WHERE tenant_id = $1
        """,
        tenant_id
    )

    total_events = await pool.fetchval(
        """
        SELECT COUNT(*)
        FROM events
        WHERE tenant_id = $1
        """,
        tenant_id
    )

    total_delegates = await pool.fetchval(
        """
        SELECT COUNT(*)
        FROM delegates
        WHERE tenant_id = $1
        """,
        tenant_id
    )

    return {
        **dict(tenant),
        "total_users": total_users,
        "total_events": total_events,
        "total_delegates": total_delegates
    }


@router.get("/analytics")
async def analytics(
    current_user: dict = Depends(require_super_admin)
):
    pool = get_pool()

    free_plan = await pool.fetchval(
        "SELECT COUNT(*) FROM tenants WHERE plan = 'free'"
    )

    pro_plan = await pool.fetchval(
        "SELECT COUNT(*) FROM tenants WHERE plan = 'pro'"
    )

    enterprise_plan = await pool.fetchval(
        "SELECT COUNT(*) FROM tenants WHERE plan = 'enterprise'"
    )

    active_tenants = await pool.fetchval(
        "SELECT COUNT(*) FROM tenants WHERE is_active = true"
    )

    inactive_tenants = await pool.fetchval(
        "SELECT COUNT(*) FROM tenants WHERE is_active = false"
    )

    return {
        "free_plan": free_plan,
        "pro_plan": pro_plan,
        "enterprise_plan": enterprise_plan,
        "active_tenants": active_tenants,
        "inactive_tenants": inactive_tenants
    }


@router.patch("/tenant/{tenant_id}/plan")
async def update_plan(
    tenant_id: str,
    body: PlanUpdate,
    current_user: dict = Depends(require_super_admin)
):
    plans = {
        "free": {
            "max_events": 1,
            "max_delegates": 100
        },
        "pro": {
            "max_events": 25,
            "max_delegates": 5000
        },
        "enterprise": {
            "max_events": 9999,
            "max_delegates": 9999999
        }
    }

    if body.plan not in plans:
        raise HTTPException(
            status_code=400,
            detail="Invalid plan"
        )

    pool = get_pool()

    await pool.execute(
        """
        UPDATE tenants
        SET
            plan = $1,
            max_events = $2,
            max_delegates = $3
        WHERE id = $4
        """,
        body.plan,
        plans[body.plan]["max_events"],
        plans[body.plan]["max_delegates"],
        tenant_id
    )

    await create_log(
        current_user["user_id"],
        "plan_updated",
        "tenant",
        tenant_id,
        {"new_plan": body.plan}
    )

    return {
        "success": True,
        "new_plan": body.plan
    }



# ==========================================================
# FOUNDERS
# ==========================================================

@router.get("/founders")
async def list_founders(
    current_user: dict = Depends(require_super_admin)
):
    pool = get_pool()

    founders = await pool.fetch(
        """
        SELECT
            id,
            full_name,
            email,
            role,
            is_active,
            last_login,
            created_at
        FROM users
        WHERE tenant_id = $1
        AND role = 'super_admin'
        ORDER BY created_at ASC
        """,
        "00000000-0000-0000-0000-000000000001"
    )

    return [dict(f) for f in founders]

@router.post("/founders")
async def create_founder(
    body: CreateFounder,
    current_user: dict = Depends(require_super_admin)
):
    pool = get_pool()

    existing = await pool.fetchrow(
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

    founder_id = str(uuid.uuid4())

    await pool.execute(
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
        founder_id,
        "00000000-0000-0000-0000-000000000001",
        body.email,
        hash_password(body.password),
        body.full_name,
        "super_admin"
    )

    await create_log(
        current_user["user_id"],
        "founder_created",
        "user",
        founder_id
    )

    return {
        "success": True,
        "message": "Founder created"
    }


@router.patch("/founders/{founder_id}/deactivate")
async def deactivate_founder(
    founder_id: str,
    current_user: dict = Depends(require_super_admin)
):
    if founder_id == current_user["user_id"]:
        raise HTTPException(
            status_code=400,
            detail="You cannot deactivate yourself"
        )

    pool = get_pool()

    await pool.execute(
        """
        UPDATE users
        SET is_active = false
        WHERE id = $1
        """,
        founder_id
    )

    await create_log(
        current_user["user_id"],
        "founder_disabled",
        "user",
        founder_id
    )

    return {
        "success": True,
        "message": "Founder deactivated"
    }

@router.patch("/founders/{founder_id}/reset-password")
async def reset_founder_password(
    founder_id: str,
    body: PasswordReset,
    current_user: dict = Depends(require_super_admin)
):
    pool = get_pool()

    await pool.execute(
        """
        UPDATE users
        SET password_hash = $1
        WHERE id = $2
        """,
        hash_password(body.password),
        founder_id
    )

    await create_log(
        current_user["user_id"],
        "founder_password_reset",
        "user",
        founder_id
    )

    return {
        "success": True,
        "message": "Password reset successful"
    }

@router.get("/audit-logs")
async def audit_logs(
    current_user: dict = Depends(require_super_admin)
):
    pool = get_pool()

    logs = await pool.fetch(
        """
        SELECT
            l.id,
            l.action,
            l.target_type,
            l.target_id,
            l.metadata,
            l.created_at,
            u.full_name
        FROM admin_logs l
        JOIN users u
            ON u.id = l.admin_id
        ORDER BY l.created_at DESC
        LIMIT 100
        """
    )

    return [dict(log) for log in logs]