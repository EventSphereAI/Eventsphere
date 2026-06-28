from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel
from app.database.connection import TenantDB
from app.auth.jwt import require_admin
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
    current_user: dict = Depends(require_admin)
):
    """Create a new event"""

    tenant_id = request.state.tenant_id
    event_id = str(uuid.uuid4())

    async with TenantDB(tenant_id) as conn:
        await conn.execute(
            """
            INSERT INTO events (
                id,
                tenant_id,
                title,
                venue,
                start_date,
                end_date,
                description,
                status
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, 'draft'
            )
            """,
            event_id,
            tenant_id,
            body.title,
            body.venue,
            body.start_date,
            body.end_date,
            body.description
        )

    return {
        "message": "Event created",
        "event_id": event_id
    }


@router.get("/")
async def list_events(
    request: Request,
    current_user: dict = Depends(require_admin)
):



    tenant_id = request.state.tenant_id

    async with TenantDB(tenant_id) as conn:

        count = await conn.fetchval("""
            SELECT COUNT(*)
            FROM events
        """)

        events = await conn.fetch("""
            SELECT
                e.id,
                e.title,
                e.venue,
                e.start_date,
                e.end_date,
                e.status,
                e.created_at,

                COUNT(d.id) AS delegate_count,

                COUNT(
                    CASE
                        WHEN d.checked_in = true
                        THEN 1
                    END
                ) AS checked_in_count,

                COUNT(
                    CASE
                        WHEN d.accommodation_required = true
                        THEN 1
                    END
                ) AS accommodation_count

            FROM events e

            LEFT JOIN delegates d
                ON d.event_id = e.id

            GROUP BY
                e.id,
                e.title,
                e.venue,
                e.start_date,
                e.end_date,
                e.status,
                e.created_at

            ORDER BY e.start_date DESC
        """)

        events = await conn.fetch(
            """
            SELECT
                e.id,
                e.title,
                e.venue,
                e.start_date,
                e.end_date,
                e.status,
                e.created_at,

                COUNT(d.id) AS delegate_count,

                COUNT(
                    CASE
                        WHEN d.checked_in = true
                        THEN 1
                    END
                ) AS checked_in_count,

                COUNT(
                    CASE
                        WHEN d.accommodation_required = true
                        THEN 1
                    END
                ) AS accommodation_count

            FROM events e

            LEFT JOIN delegates d
                ON d.event_id = e.id

            WHERE e.tenant_id = $1

            GROUP BY
                e.id,
                e.title,
                e.venue,
                e.start_date,
                e.end_date,
                e.status,
                e.created_at

            ORDER BY e.start_date DESC
            """,
            tenant_id
        )

    return {
        "events": [dict(e) for e in events]
    }


@router.get("/{event_id}")
async def get_event(
    event_id: str,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    """Get event details"""

    tenant_id = request.state.tenant_id

    async with TenantDB(tenant_id) as conn:

        event = await conn.fetchrow(
            """
            SELECT *
            FROM events
            WHERE id = $1
            AND tenant_id = $2
            """,
            event_id,
            tenant_id
        )

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return dict(event)


@router.patch("/{event_id}")
async def update_event(
    event_id: str,
    body: EventUpdate,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    """Update event"""

    tenant_id = request.state.tenant_id

    updates = []
    values = []

    if body.title:
        updates.append(f"title = ${len(values) + 1}")
        values.append(body.title)

    if body.venue:
        updates.append(f"venue = ${len(values) + 1}")
        values.append(body.venue)

    if body.status:
        updates.append(f"status = ${len(values) + 1}")
        values.append(body.status)

    if not updates:
        return {
            "message": "No updates provided"
        }

    event_placeholder = len(values) + 1
    tenant_placeholder = len(values) + 2

    values.append(event_id)
    values.append(tenant_id)

    query = f"""
        UPDATE events
        SET {', '.join(updates)}
        WHERE id = ${event_placeholder}
        AND tenant_id = ${tenant_placeholder}
    """

    async with TenantDB(tenant_id) as conn:
        result = await conn.execute(
            query,
            *values
        )

    return {
        "message": "Event updated"
    }