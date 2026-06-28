from fastapi import APIRouter, Request, Depends
from app.database.connection import TenantDB
from app.auth.jwt import require_admin
from datetime import date
from fastapi.responses import StreamingResponse

from fastapi import Query
import csv
import io

router = APIRouter()

@router.get("/attendance/{event_id}")
async def attendance_report(
    event_id: str,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    """Get attendance report for an event"""
    tenant_id = request.state.tenant_id

    async with TenantDB(tenant_id) as conn:

            total = await conn.fetchval(
                """
                SELECT COUNT(*)
                FROM delegates
                WHERE event_id = $1
                """,
                event_id
            )

            currently_inside = await conn.fetchval(
                """
                SELECT COUNT(*)
                FROM delegates
                WHERE event_id = $1
                AND checked_in = true
                """,
                event_id
            )

            checked_out = await conn.fetchval(
                """
                SELECT COUNT(*)
                FROM attendance
                WHERE event_id = $1
                AND checkout_time IS NOT NULL
                """,
                event_id
            )

            present_today = await conn.fetchval(
                """
                SELECT COUNT(DISTINCT delegate_id)
                FROM attendance
                WHERE event_id = $1
                AND DATE(checkin_time)=CURRENT_DATE
                """,
                event_id
            )

    attendance_rate = (
            round((present_today / total) * 100, 2)
            if total else 0
        )

    return {
            "event_id": event_id,
            "total_delegates": total,
            "present_today": present_today,
            "currently_inside": currently_inside,
            "checked_out": checked_out,
            "attendance_rate": attendance_rate
        }

@router.get("/food/{event_id}")
async def food_report(
    event_id: str,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    """
    Food dashboard statistics.
    """

    tenant_id = request.state.tenant_id

    print("========== FOOD REPORT ==========")
    print("EVENT ID:", event_id)
    print("TENANT:", tenant_id)
    print("=================================")

    async with TenantDB(tenant_id) as conn:

        breakfast = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM food_logs
            WHERE event_id = $1
            AND meal_type = 'breakfast'
            """,
            event_id
        )

        lunch = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM food_logs
            WHERE event_id = $1
            AND meal_type = 'lunch'
            """,
            event_id
        )

        high_tea = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM food_logs
            WHERE event_id = $1
            AND meal_type = 'high_tea'
            """,
            event_id
        )

        dinner = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM food_logs
            WHERE event_id = $1
            AND meal_type = 'dinner'
            """,
            event_id
        )

    return {
        "total_meals": breakfast + lunch + high_tea + dinner,
        "breakfast": breakfast,
        "lunch": lunch,
        "high_tea": high_tea,
        "dinner": dinner
    }

@router.get("/accommodation/{event_id}")
async def accommodation_report(
    event_id: str,
    request: Request,
    current_user: dict = Depends(require_admin)
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
    current_user: dict = Depends(require_admin)
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

@router.get("/registration/{event_id}")
async def registration_report(
    event_id: str,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    """
    Registration kit distribution statistics.
    """

    tenant_id = request.state.tenant_id

    async with TenantDB(tenant_id) as conn:

        total_delegates = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM delegates
            WHERE event_id = $1
            """,
            event_id
        )

        kits_distributed = await conn.fetchval(
            """
            SELECT COUNT(*)
            FROM kit_distribution
            WHERE event_id = $1
            """,
            event_id
        )

        pending_distribution = (
            total_delegates - kits_distributed
        )

        distribution_rate = round(
            (
                kits_distributed / total_delegates * 100
            ) if total_delegates > 0 else 0,
            2
        )

    return {
        "total_delegates": total_delegates,
        "kits_distributed": kits_distributed,
        "pending_distribution": pending_distribution,
        "distribution_rate": distribution_rate
    }

@router.get("/registration-export/{event_id}")
async def registration_export(
        event_id: str,
        request: Request,
        current_user: dict = Depends(require_admin)
    ):
        tenant_id = request.state.tenant_id

        async with TenantDB(tenant_id) as conn:

            rows = await conn.fetch(
                """
                SELECT
                    d.full_name,
                    d.email,
                    d.college,
                    kd.distributed_at
                FROM kit_distribution kd
                JOIN delegates d
                    ON kd.delegate_id = d.id
                WHERE kd.event_id = $1
                ORDER BY kd.distributed_at DESC
                """,
                event_id
            )

        return {
            "rows": [dict(r) for r in rows]
        }


@router.get("/food-export/{event_id}")
async def food_export(
    event_id: str,
    request: Request,
    meal: str | None = Query(None),
    current_user: dict = Depends(require_admin)
):
    tenant_id = request.state.tenant_id

    async with TenantDB(tenant_id) as conn:

        if meal:

            rows = await conn.fetch(
                """
                SELECT
                    d.full_name,
                    d.email,
                    d.college,
                    fl.meal_type,
                    fl.meal_date,
                    fl.claimed_at
                FROM food_logs fl
                JOIN delegates d
                    ON d.id = fl.delegate_id
                WHERE fl.event_id = $1
                AND fl.meal_type = $2
                ORDER BY fl.claimed_at DESC
                """,
                event_id,
                meal
            )

        else:

            rows = await conn.fetch(
                """
                SELECT
                    d.full_name,
                    d.email,
                    d.college,
                    fl.meal_type,
                    fl.meal_date,
                    fl.claimed_at
                FROM food_logs fl
                JOIN delegates d
                    ON d.id = fl.delegate_id
                WHERE fl.event_id = $1
                ORDER BY fl.claimed_at DESC
                """,
                event_id
            )

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "Full Name",
        "Email",
        "College",
        "Meal",
        "Meal Date",
        "Claimed At"
    ])

    for row in rows:

        writer.writerow([
            row["full_name"],
            row["email"],
            row["college"],
            row["meal_type"],
            row["meal_date"],
            row["claimed_at"]
        ])

    output.seek(0)

    filename = (
        f"food_{meal}_{event_id}.csv"
        if meal
        else f"food_all_{event_id}.csv"
    )

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            f"attachment; filename={filename}"
        }
    )

@router.get("/accommodation-export/{event_id}")
async def accommodation_export(
    event_id: str,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    tenant_id = request.state.tenant_id

    async with TenantDB(tenant_id) as conn:

        rows = await conn.fetch(
            """
            SELECT
                d.full_name,
                d.email,
                r.hostel_name,
                r.room_number,
                ra.checkin_time,
                ra.checkout_time
            FROM room_allocations ra
            JOIN delegates d
                ON d.id = ra.delegate_id
            JOIN rooms r
                ON r.id = ra.room_id
            WHERE ra.event_id = $1
            ORDER BY
                r.hostel_name,
                r.room_number,
                d.full_name
            """,
            event_id
        )

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "Delegate",
        "Email",
        "Hostel",
        "Room",
        "Check In",
        "Check Out"
    ])

    for row in rows:

        writer.writerow([
            row["full_name"],
            row["email"],
            row["hostel_name"],
            row["room_number"],
            row["checkin_time"],
            row["checkout_time"]
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            f"attachment; filename=accommodation_{event_id}.csv"
        }
    )

@router.get("/dashboard")
async def dashboard_stats(
    request: Request,
    current_user: dict = Depends(require_admin)
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


@router.get("/attendance-export/{event_id}")
async def attendance_export(
    event_id: str,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    tenant_id = request.state.tenant_id

    async with TenantDB(tenant_id) as conn:

        rows = await conn.fetch(
            """
            SELECT
                d.full_name,
                d.email,
                d.college,
                a.checkin_time,
                a.checkout_time,
                a.duration_minutes
            FROM attendance a
            JOIN delegates d
                ON d.id = a.delegate_id
            WHERE a.event_id = $1
            ORDER BY d.full_name
            """,
            event_id
        )

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "Full Name",
        "Email",
        "College",
        "Check In",
        "Check Out",
        "Duration (mins)"
    ])

    for row in rows:
        writer.writerow([
            row["full_name"],
            row["email"],
            row["college"],
            row["checkin_time"],
            row["checkout_time"],
            row["duration_minutes"]
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            f"attachment; filename=attendance_{event_id}.csv"
        }
    )