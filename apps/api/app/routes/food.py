from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel
from app.database.connection import TenantDB
from app.auth.jwt import require_permission
from datetime import date
import uuid

router = APIRouter()

class FoodScanRequest(BaseModel):
    delegate_id: str
    event_id: str
    meal_type: str  # breakfast, lunch, dinner

@router.post("/scan")
async def record_food(
    body: FoodScanRequest,
    request: Request,
    current_user: dict = Depends(require_permission("food"))
):
    """Record food distribution for a delegate"""
    tenant_id = request.state.tenant_id
    
    # Check if already claimed today
    async with TenantDB(tenant_id) as conn:
        existing = await conn.fetchrow("""
            SELECT id FROM food_logs
            WHERE delegate_id = $1 AND meal_type = $2 AND meal_date = CURRENT_DATE
        """, body.delegate_id, body.meal_type)
        
        if existing:
            return {
                "success": False,
                "message": f"{body.meal_type.capitalize()} already claimed today"
            }
        
        # Record the food log
        log_id = str(uuid.uuid4())
        await conn.execute("""
            INSERT INTO food_logs (id, tenant_id, delegate_id, event_id, meal_type, staff_id)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, log_id, tenant_id, body.delegate_id, body.event_id, body.meal_type,
            current_user["user_id"])
    
    return {
        "success": True,
        "message": f"Food recorded for {body.meal_type}"
    }

@router.get("/stats/{event_id}")
async def food_stats(
    event_id: str,
    request: Request,
    current_user: dict = Depends(require_permission("food"))
):
    """Get food consumption stats for an event"""
    tenant_id = request.state.tenant_id
    
    async with TenantDB(tenant_id) as conn:
        stats = await conn.fetch("""
            SELECT meal_type, COUNT(*) as count
            FROM food_logs
            WHERE event_id = $1 AND meal_date = CURRENT_DATE
            GROUP BY meal_type
        """, event_id)
    
    return {
        "event_id": event_id,
        "date": str(date.today()),
        "stats": {row["meal_type"]: row["count"] for row in stats}
    }
