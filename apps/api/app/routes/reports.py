from fastapi import APIRouter, Request, Depends
from app.database.connection import TenantDB
from app.auth.jwt import require_any_staff
from datetime import date

router = APIRouter()

@router.get("/attendance/{event_id}")
async def attendance_report(
    event_id: str,
    request: Request,
    current_user: dict = Depends(require_any_staff)
):
    """Get attendance report for an event"""
    tenant_id = request.state.tenant_id
    
    async with TenantDB(tenant_id) as conn:
        # Total delegates
        total = await conn.fetchval(
            "SELECT COUNT(*) FROM delegates WHERE event_id = $1",
            event_id
        )
        
        # Checked in
        checked_in = await conn.fetchval(
            "SELECT COUNT(*) FROM delegates WHERE event_id = $1 AND checked_in = true",
            event_id
        )
        
        # Entry scans
        scans = await conn.fetch("""
            SELECT delegate_id, COUNT(*) as scan_count
            FROM scan_logs
            WHERE event_id = $1 AND scan_type = 'entry'
            GROUP BY delegate_id
        """, event_id)
    
    return {
        "event_id": event_id,
        "total_delegates": total,
        "checked_in": checked_in,
        "attendance_rate": round((checked_in / total * 100) if total > 0 else 0, 2),
        "scan_summary": [dict(s) for s in scans]
    }

@router.get("/food/{event_id}")
async def food_report(
    event_id: str,
    request: Request,
    current_user: dict = Depends(require_any_staff)
):
    """Get food distribution report"""
    tenant_id = request.state.tenant_id
    
    async with TenantDB(tenant_id) as conn:
        stats = await conn.fetch("""
            SELECT 
                meal_type,
                meal_date,
                COUNT(*) as count
            FROM food_logs
            WHERE event_id = $1
            GROUP BY meal_type, meal_date
            ORDER BY meal_date DESC, meal_type
        """, event_id)
    
    return {
        "event_id": event_id,
        "food_stats": [dict(s) for s in stats]
    }

@router.get("/accommodation/{event_id}")
async def accommodation_report(
    event_id: str,
    request: Request,
    current_user: dict = Depends(require_any_staff)
):
    """Get accommodation report"""
    tenant_id = request.state.tenant_id
    
    async with TenantDB(tenant_id) as conn:
        # Occupancy per hostel
        occupancy = await conn.fetch("""
            SELECT 
                r.hostel_name,
                COUNT(ra.id) as occupied,
                r.capacity as capacity
            FROM rooms r
            LEFT JOIN room_allocations ra ON r.id = ra.room_id
            WHERE r.event_id = $1
            GROUP BY r.hostel_name, r.capacity
        """, event_id)
    
    return {
        "event_id": event_id,
        "occupancy": [dict(o) for o in occupancy]
    }

@router.get("/attendance-details/{event_id}")
async def attendance_details(
    event_id: str,
    request: Request,
    current_user: dict = Depends(require_any_staff)
):
    tenant_id = request.state.tenant_id

    async with TenantDB(tenant_id) as conn:
        delegates = await conn.fetch("""
            SELECT
                id,
                full_name,
                email,
                college,
                checked_in,
                checked_in_at
            FROM delegates
            WHERE event_id = $1
            ORDER BY full_name
        """, event_id)

    return {
    "event_id": event_id,
    "delegates": [dict(d) for d in delegates]
}


@router.get("/dashboard")
async def dashboard_stats(
    request: Request,
    current_user: dict = Depends(require_any_staff)
):
    tenant_id = request.state.tenant_id

    async with TenantDB(tenant_id) as conn:

        total_events = await conn.fetchval(
            "SELECT COUNT(*) FROM events"
        )

        total_delegates = await conn.fetchval(
            "SELECT COUNT(*) FROM delegates"
        )

        checked_in = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM delegates
            WHERE checked_in = true
            """
        )

        accommodation_needed = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM delegates
            WHERE accommodation_required = true
            """
        )

    return {
        "total_events": total_events,
        "total_delegates": total_delegates,
        "checked_in": checked_in,
        "accommodation_needed": accommodation_needed
    }