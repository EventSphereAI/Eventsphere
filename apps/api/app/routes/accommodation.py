from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel
from app.database.connection import TenantDB
from app.auth.jwt import require_any_staff
import uuid

router = APIRouter()

class RoomCreate(BaseModel):
    event_id: str
    room_number: str
    hostel_name: str
    capacity: int = 2
    room_type: str = "shared"

class RoomAllocation(BaseModel):
    room_id: str
    delegate_id: str
    event_id: str

@router.post("/rooms", status_code=201)
async def create_room(
    body: RoomCreate,
    request: Request,
    current_user: dict = Depends(require_any_staff)
):
    """Create a room"""
    tenant_id = request.state.tenant_id
    room_id = str(uuid.uuid4())
    
    async with TenantDB(tenant_id) as conn:
        await conn.execute("""
            INSERT INTO rooms (id, tenant_id, event_id, room_number, hostel_name, capacity, room_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        """, room_id, tenant_id, body.event_id, body.room_number,
            body.hostel_name, body.capacity, body.room_type)
    
    return {"message": "Room created", "room_id": room_id}

@router.get("/rooms/{event_id}")
async def list_rooms(
    event_id: str,
    request: Request,
    current_user: dict = Depends(require_any_staff)
):
    """List all rooms for an event"""
    tenant_id = request.state.tenant_id
    
    async with TenantDB(tenant_id) as conn:
        rooms = await conn.fetch("""
            SELECT id, room_number, hostel_name, capacity, is_available
            FROM rooms
            WHERE event_id = $1
            ORDER BY hostel_name, room_number
        """, event_id)
    
    return {"rooms": [dict(r) for r in rooms]}

@router.post("/allocate", status_code=201)
async def allocate_delegate_to_room(
    body: RoomAllocation,
    request: Request,
    current_user: dict = Depends(require_any_staff)
):
    """Allocate a delegate to a room"""
    tenant_id = request.state.tenant_id
    allocation_id = str(uuid.uuid4())
    
    async with TenantDB(tenant_id) as conn:
        # Check if room exists and has space
        room = await conn.fetchrow(
            "SELECT capacity FROM rooms WHERE id = $1",
            body.room_id
        )
        
        if not room:
            raise HTTPException(404, "Room not found")
        
        # Count current occupancy
        occupied = await conn.fetchval(
            "SELECT COUNT(*) FROM room_allocations WHERE room_id = $1",
            body.room_id
        )
        
        if occupied >= room["capacity"]:
            raise HTTPException(400, "Room is full")
        
        # Allocate
        await conn.execute("""
            INSERT INTO room_allocations (id, tenant_id, room_id, delegate_id, event_id, allocated_by)
            VALUES ($1, $2, $3, $4, $5, $6)
        """, allocation_id, tenant_id, body.room_id, body.delegate_id,
            body.event_id, current_user["user_id"])
    
    return {"message": "Delegate allocated to room"}

@router.post("/checkin/{allocation_id}")
async def checkin_to_room(
    allocation_id: str,
    request: Request,
    current_user: dict = Depends(require_any_staff)
):
    """Check in delegate to room"""
    tenant_id = request.state.tenant_id
    
    async with TenantDB(tenant_id) as conn:
        await conn.execute(
            "UPDATE room_allocations SET checkin_time = NOW() WHERE id = $1",
            allocation_id
        )
    
    return {"message": "Checked in"}

@router.post("/checkout/{allocation_id}")
async def checkout_from_room(
    allocation_id: str,
    request: Request,
    current_user: dict = Depends(require_any_staff)
):
    """Check out delegate from room"""
    tenant_id = request.state.tenant_id
    
    async with TenantDB(tenant_id) as conn:
        await conn.execute(
            "UPDATE room_allocations SET checkout_time = NOW() WHERE id = $1",
            allocation_id
        )
    
    return {"message": "Checked out"}
