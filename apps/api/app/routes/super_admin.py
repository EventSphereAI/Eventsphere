from fastapi import APIRouter, Depends, HTTPException
from app.database.connection import get_pool
from app.auth.jwt import require_super_admin
from pydantic import BaseModel

router = APIRouter()
class PlanUpdate(BaseModel):
    plan: str

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

    return {
        "success": True,
        "new_plan": body.plan
    }