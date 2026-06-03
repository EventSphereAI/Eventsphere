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
