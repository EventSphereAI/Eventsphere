from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from app.database.connection import TenantDB
from app.auth.jwt import require_any_staff
import hmac, hashlib, os, uuid
from datetime import date

router = APIRouter()

QR_SECRET = os.getenv("QR_HMAC_SECRET", "change-me-qr-secret")

# ── QR helpers ────────────────────────────────────────────────

def generate_qr_token(tenant_id: str, event_id: str, delegate_id: str) -> str:
    """Creates an HMAC-signed QR token that cannot be faked."""
    raw = f"{tenant_id}:{event_id}:{delegate_id}"
    sig = hmac.new(QR_SECRET.encode(), raw.encode(), hashlib.sha256).hexdigest()[:16]
    return f"{delegate_id}:{sig}"

def verify_qr_token(token: str, tenant_id: str, event_id: str) -> str | None:
    """Returns delegate_id if valid, None if tampered."""
    try:
        delegate_id, sig = token.rsplit(":", 1)
        expected = hmac.new(QR_SECRET.encode(),
                            f"{tenant_id}:{event_id}:{delegate_id}".encode(),
                            hashlib.sha256).hexdigest()[:16]
        if hmac.compare_digest(sig, expected):
            return delegate_id
    except Exception:
        pass
    return None

# ── Schemas ───────────────────────────────────────────────────

class ScanRequest(BaseModel):
    qr_token: str
    event_id: str
    scan_type: str          # entry | exit | food_breakfast | food_lunch | food_dinner | kit_collection
    session_id: str | None = None
    location: str | None = None
    device_id: str | None = None

# ── Routes ────────────────────────────────────────────────────

@router.post("/")
async def scan_qr(
    body: ScanRequest,
    request: Request,
    current_user: dict = Depends(require_any_staff)
):
    """
    Core scan endpoint. Validates QR, checks for duplicates, logs scan.
    Returns immediate feedback for the scanner UI.
    """
    tenant_id = request.state.tenant_id

    # 1. Verify QR signature
    delegate_id = verify_qr_token(body.qr_token, tenant_id, body.event_id)
    if not delegate_id:
        return _scan_result(False, "INVALID_QR", "Invalid or tampered QR code", None)

    async with TenantDB(tenant_id) as conn:
        # 2. Fetch delegate
        delegate = await conn.fetchrow(
        """
        SELECT
            id,
            full_name,
            college,
            payment_status,
            food_pref,
            accommodation_required,
            emergency_contact_name,
            emergency_contact_phone
        FROM delegates
        WHERE id = $1
        AND event_id = $2
        """,
        delegate_id,
        body.event_id
    )
        if not delegate:
            return _scan_result(False, "NOT_FOUND", "Delegate not found for this event", None)

        # 3. Check payment (for entry scans)
        if body.scan_type == "entry" and delegate["payment_status"] not in ("paid", "waived"):
            return _scan_result(False, "UNPAID",
                                f"Payment pending for {delegate['full_name']}", dict(delegate))

        # 4. Duplicate check — depends on scan type
        rejection = await _check_duplicate(conn, tenant_id, delegate_id, body)
        if rejection:
            return _scan_result(False, "DUPLICATE", rejection, dict(delegate))

        # 5. Log the scan
        log_id = str(uuid.uuid4())
        await conn.execute("""
            INSERT INTO scan_logs
              (id, tenant_id, delegate_id, event_id, scan_type, scanned_by,
               session_id, location, device_id, is_valid, scan_date)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,CURRENT_DATE)
        """, log_id, tenant_id, delegate_id, body.event_id, body.scan_type,
            current_user["user_id"], body.session_id, body.location, body.device_id)

              # 6. Side effects per scan type

        if body.scan_type == "entry":

            await conn.execute(
                """
                UPDATE delegates
                SET checked_in = true,
                    checked_in_at = NOW()
                WHERE id = $1
                """,
                delegate_id
            )

        elif body.scan_type == "exit":

            await conn.execute(
                """
                UPDATE delegates
                SET checked_in = false
                WHERE id = $1
                """,
                delegate_id
            )

        elif body.scan_type == "accommodation_checkin":

            allocation = await conn.fetchrow(
                """
                SELECT id
                FROM room_allocations
                WHERE delegate_id = $1
                AND event_id = $2
                """,
                delegate_id,
                body.event_id
            )

            if not allocation:
                return _scan_result(
                    False,
                    "NO_ROOM",
                    "Delegate has no room allocation",
                    dict(delegate)
                )

            await conn.execute(
                """
                UPDATE room_allocations
                SET checkin_time = NOW()
                WHERE id = $1
                """,
                allocation["id"]
            )

        elif body.scan_type == "accommodation_checkout":

            allocation = await conn.fetchrow(
                """
                SELECT id, checkin_time
                FROM room_allocations
                WHERE delegate_id = $1
                AND event_id = $2
                """,
                delegate_id,
                body.event_id
            )

            if not allocation:
                return _scan_result(
                    False,
                    "NO_ROOM",
                    "Delegate has no room allocation",
                    dict(delegate)
                )

            if not allocation["checkin_time"]:
                return _scan_result(
                    False,
                    "NOT_CHECKED_IN",
                    "Delegate has not checked in",
                    dict(delegate)
                )

            await conn.execute(
                """
                UPDATE room_allocations
                SET checkout_time = NOW()
                WHERE id = $1
                """,
                allocation["id"]
            )

        elif body.scan_type in (
            "food_breakfast",
            "food_lunch",
            "food_dinner"
        ):

            meal = body.scan_type.replace(
                "food_",
                ""
            )

            await conn.execute(
                """
                INSERT INTO food_logs
                (
                    id,
                    tenant_id,
                    delegate_id,
                    event_id,
                    meal_type,
                    staff_id
                )
                VALUES
                (
                    $1,$2,$3,$4,$5,$6
                )
                """,
                str(uuid.uuid4()),
                tenant_id,
                delegate_id,
                body.event_id,
                meal,
                current_user["user_id"]
            )

    return _scan_result(
        True,
        "OK",
        f"Welcome, {delegate['full_name']}!",
        dict(delegate)
    )


async def _check_duplicate(conn, tenant_id, delegate_id, body: ScanRequest) -> str | None:
    """Returns a rejection message if this is a duplicate scan, else None."""
    scan_type = body.scan_type

    # Entry: allow if not already checked in, or if exit happened after last entry
    if scan_type in ("entry", "exit"):

     last = await conn.fetchrow(
        """
        SELECT scan_type
        FROM scan_logs
        WHERE tenant_id = $1
        AND delegate_id = $2
        AND event_id = $3
        AND scan_type IN ('entry','exit')
        AND scan_date = CURRENT_DATE
        ORDER BY scanned_at DESC
        LIMIT 1
        """,
        tenant_id,
        delegate_id,
        body.event_id
    )

    if scan_type == "entry":

        if last and last["scan_type"] == "entry":
            return "Delegate already checked in."

    elif scan_type == "exit":

        if not last:
            return "Delegate is not checked in."

        if last["scan_type"] == "exit":
            return "Delegate already checked out."

    # Food: one meal per type per day
    elif scan_type in ("food_breakfast", "food_lunch", "food_dinner"):
        meal = scan_type.replace("food_", "")
        exists = await conn.fetchrow("""
            SELECT id FROM food_logs
            WHERE tenant_id=$1 AND delegate_id=$2 AND meal_type=$3 AND meal_date=CURRENT_DATE
        """, tenant_id, delegate_id, meal)
        if exists:
            return f"{meal.capitalize()} already collected today."

    # Kit: one per event
    elif scan_type == "kit_collection":
        exists = await conn.fetchrow("""
            SELECT id FROM kit_distribution
            WHERE tenant_id=$1 AND delegate_id=$2 AND event_id=$3
        """, tenant_id, delegate_id, body.event_id)
        if exists:
            return "Delegate kit already collected."

    return None


def _scan_result(success: bool, code: str, message: str, delegate: dict | None) -> dict:
    return {
        "success":  success,
        "code":     code,
        "message":  message,
        "delegate": delegate
    }
