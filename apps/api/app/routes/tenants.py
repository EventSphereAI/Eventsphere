from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel
from app.database.connection import get_pool, TenantDB
from app.auth.jwt import (get_current_user,require_admin)

router = APIRouter()

class TenantUpdate(BaseModel):
    name: str | None = None
    plan: str | None = None

@router.get("/me")
async def get_current_tenant(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get current organization info"""
    tenant = getattr(request.state, "tenant", None)
    if not tenant:
        raise HTTPException(404, "Tenant not found")
    
    return tenant

@router.patch("/{tenant_id}")
async def update_tenant(
    tenant_id: str,
    body: TenantUpdate,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    """Update tenant info (admin only)"""
    # Verify ownership
    if request.state.tenant_id != tenant_id:
        raise HTTPException(403, "Not authorized")
    
    pool = get_pool()
    
    updates = []
    values = []
    
    if body.name:
        updates.append("name = $" + str(len(values) + 1))
        values.append(body.name)
    
    if body.plan:
        updates.append("plan = $" + str(len(values) + 1))
        values.append(body.plan)
    
    if not updates:
        return {"message": "No updates"}
    
    values.append(tenant_id)
    
    await pool.execute(
        f"UPDATE tenants SET {', '.join(updates)} WHERE id = ${len(values)}",
        *values
    )
    
    return {"message": "Tenant updated"}

@router.get("/{tenant_id}/users")
async def list_tenant_users(
    tenant_id: str,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    """List all users in organization"""
    if request.state.tenant_id != tenant_id:
        raise HTTPException(403, "Not authorized")
    
    async with TenantDB(tenant_id) as conn:
        users = await conn.fetch("""
            SELECT id, email, full_name, role, is_active, created_at
            FROM users
            ORDER BY created_at DESC
        """)
    
    return {"users": [dict(u) for u in users]}
