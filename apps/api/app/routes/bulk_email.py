from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    Request
)

from app.database.connection import TenantDB
from app.auth.jwt import require_admin
from app.services.email_service import send_registration_email

import asyncio

router = APIRouter()


# ==========================================================
# BACKGROUND EMAIL CAMPAIGN
# ==========================================================

async def process_bulk_email_campaign(
    tenant_id: str,
    event_id: str
):
    """
    Sends registration emails to all delegates whose
    email_status='pending'.

    Runs in the background so the API returns immediately.
    """

    # --------------------------------------------
    # Fetch delegates and event title
    # --------------------------------------------

    async with TenantDB(tenant_id) as conn:

        delegates = await conn.fetch(
            """
            SELECT
                id,
                full_name,
                email,
                qr_code
            FROM delegates
            WHERE tenant_id = $1
            AND event_id = $2
            AND email_status = 'pending'
            """,
            tenant_id,
            event_id
        )

        event = await conn.fetchrow(
            """
            SELECT title
            FROM events
            WHERE id = $1
            """,
            event_id
        )

    event_title = (
        event["title"]
        if event
        else "EventSphere Event"
    )

    print(f"\nStarting Bulk Email Campaign")
    print(f"Total Emails : {len(delegates)}\n")

    # --------------------------------------------
    # Send Emails
    # --------------------------------------------

    for delegate in delegates:

        print(f"Sending -> {delegate['email']}")

        try:

            success = await send_registration_email(

                email=delegate["email"],

                name=delegate["full_name"],

                event_name=event_title,

                qr_token=delegate["qr_code"]

            )

            if success:

                async with TenantDB(tenant_id) as conn:

                    await conn.execute(
                        """
                        UPDATE delegates

                        SET

                            email_status='sent',

                            email_sent_at=NOW(),

                            email_error=NULL

                        WHERE id=$1
                        """,
                        delegate["id"]
                    )

                print(f"SUCCESS -> {delegate['email']}")

            else:

                async with TenantDB(tenant_id) as conn:

                    await conn.execute(
                        """
                        UPDATE delegates

                        SET

                            email_status='failed',

                            email_error='Unknown Error'

                        WHERE id=$1
                        """,
                        delegate["id"]
                    )

                print(f"FAILED -> {delegate['email']}")

        except Exception as e:

            async with TenantDB(tenant_id) as conn:

                await conn.execute(
                    """
                    UPDATE delegates

                    SET

                        email_status='failed',

                        email_error=$1

                    WHERE id=$2
                    """,
                    str(e),
                    delegate["id"]
                )

            print(f"ERROR -> {delegate['email']} : {e}")

        # Prevent hitting Resend API too quickly
        await asyncio.sleep(0.2)

    print("\nBulk Email Campaign Completed.\n")


# ==========================================================
# START EMAIL CAMPAIGN
# ==========================================================

@router.post("/send-emails")
async def send_bulk_emails(
    background_tasks: BackgroundTasks,
    request: Request,
    event_id: str,
    current_user: dict = Depends(require_admin)
):
    tenant_id = request.state.tenant_id

    background_tasks.add_task(
        process_bulk_email_campaign,
        tenant_id,
        event_id
    )

    return {
        "success": True,
        "message": "Bulk email campaign started successfully."
    }