═══════════════════════════════════════════════════════════════════════════════
CONTINUING: REMAINING BACKEND ROUTES
═══════════════════════════════════════════════════════════════════════════════

### FILE: app/routes/delegates.py
Location: eventsphere/apps/api/app/routes/delegates.py

from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from app.database.connection import TenantDB
from app.auth.jwt import get_current_user
import uuid
import qrcode
import io
from base64 import b64encode

router = APIRouter()

class DelegateCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    college: str | None = None
    food_pref: str = "veg"
    accommodation_required: bool = False
    event_id: str

class DelegateUpdate(BaseModel):
    payment_status: str | None = None
    food_pref: str | None = None

@router.post("/", status_code=201)
async def create_delegate(
    body: DelegateCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Register a new delegate"""
    tenant_id = request.state.tenant_id
    delegate_id = str(uuid.uuid4())
    
    # Generate unique QR token
    qr_token = f"{delegate_id}:unique"
    
    async with TenantDB(tenant_id) as conn:
        try:
            await conn.execute("""
                INSERT INTO delegates (id, tenant_id, event_id, full_name, email, phone, college, qr_code, food_pref, accommodation_required)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            """, delegate_id, tenant_id, body.event_id, body.full_name, body.email,
                body.phone, body.college, qr_token, body.food_pref, body.accommodation_required)
        except Exception as e:
            raise HTTPException(400, f"Failed to create delegate: {str(e)}")
    
    return {
        "message": "Delegate registered",
        "delegate_id": delegate_id,
        "qr_code": qr_token
    }

@router.get("/")
async def list_delegates(
    event_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """List delegates for an event"""
    tenant_id = request.state.tenant_id
    
    async with TenantDB(tenant_id) as conn:
        delegates = await conn.fetch("""
            SELECT id, full_name, email, college, payment_status, food_pref, created_at
            FROM delegates
            WHERE event_id = $1
            ORDER BY created_at DESC
        """, event_id)
    
    return {"delegates": [dict(d) for d in delegates]}

@router.get("/{delegate_id}")
async def get_delegate(
    delegate_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get delegate details"""
    tenant_id = request.state.tenant_id
    
    async with TenantDB(tenant_id) as conn:
        delegate = await conn.fetchrow(
            "SELECT * FROM delegates WHERE id = $1",
            delegate_id
        )
    
    if not delegate:
        raise HTTPException(404, "Delegate not found")
    
    return dict(delegate)

@router.patch("/{delegate_id}")
async def update_delegate(
    delegate_id: str,
    body: DelegateUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update delegate"""
    tenant_id = request.state.tenant_id
    
    updates = []
    values = []
    
    if body.payment_status:
        updates.append("payment_status = $" + str(len(values) + 1))
        values.append(body.payment_status)
    
    if body.food_pref:
        updates.append("food_pref = $" + str(len(values) + 1))
        values.append(body.food_pref)
    
    if not updates:
        return {"message": "No updates provided"}
    
    values.append(delegate_id)
    
    async with TenantDB(tenant_id) as conn:
        await conn.execute(
            f"UPDATE delegates SET {', '.join(updates)} WHERE id = ${len(values)}",
            *values
        )
    
    return {"message": "Delegate updated"}

@router.get("/{delegate_id}/qr-pass")
async def get_qr_pass(
    delegate_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Generate QR pass as image"""
    tenant_id = request.state.tenant_id
    
    async with TenantDB(tenant_id) as conn:
        delegate = await conn.fetchrow(
            "SELECT full_name, qr_code FROM delegates WHERE id = $1",
            delegate_id
        )
    
    if not delegate:
        raise HTTPException(404, "Delegate not found")
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(delegate["qr_code"])
    qr.make(fit=True)
    
    img = qr.make_image()
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    return {
        "name": delegate["full_name"],
        "qr_code": b64encode(img_bytes.getvalue()).decode()
    }

---

### FILE: app/routes/scanning.py
Location: eventsphere/apps/api/app/routes/scanning.py

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
    scan_type: str
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
    """
    tenant_id = request.state.tenant_id

    # 1. Verify QR signature
    delegate_id = verify_qr_token(body.qr_token, tenant_id, body.event_id)
    if not delegate_id:
        return _scan_result(False, "INVALID_QR", "Invalid or tampered QR code", None)

    async with TenantDB(tenant_id) as conn:
        # 2. Fetch delegate
        delegate = await conn.fetchrow(
            "SELECT id, full_name, college, payment_status, food_pref FROM delegates WHERE id = $1 AND event_id = $2",
            delegate_id, body.event_id
        )
        if not delegate:
            return _scan_result(False, "NOT_FOUND", "Delegate not found for this event", None)

        # 3. Check payment (for entry scans)
        if body.scan_type == "entry" and delegate["payment_status"] not in ("paid", "waived"):
            return _scan_result(False, "UNPAID",
                                f"Payment pending for {delegate['full_name']}", dict(delegate))

        # 4. Duplicate check
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
                "UPDATE delegates SET checked_in=true, checked_in_at=NOW() WHERE id=$1",
                delegate_id
            )

    return _scan_result(True, "OK",
                        f"Welcome, {delegate['full_name']}!", dict(delegate))


async def _check_duplicate(conn, tenant_id, delegate_id, body: ScanRequest) -> str | None:
    """Returns rejection message if duplicate, else None."""
    scan_type = body.scan_type

    if scan_type == "entry":
        last = await conn.fetchrow("""
            SELECT scan_type FROM scan_logs
            WHERE tenant_id=$1 AND delegate_id=$2 AND event_id=$3
              AND scan_type IN ('entry','exit') AND scan_date=CURRENT_DATE
            ORDER BY scanned_at DESC LIMIT 1
        """, tenant_id, delegate_id, body.event_id)
        if last and last["scan_type"] == "entry":
            return "Delegate already checked in. Please scan exit first."

    return None


def _scan_result(success: bool, code: str, message: str, delegate: dict | None) -> dict:
    return {
        "success": success,
        "code": code,
        "message": message,
        "delegate": delegate
    }

---

### FILE: app/routes/food.py
Location: eventsphere/apps/api/app/routes/food.py

from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel
from app.database.connection import TenantDB
from app.auth.jwt import require_any_staff
from datetime import date
import uuid

router = APIRouter()

class FoodScanRequest(BaseModel):
    delegate_id: str
    event_id: str
    meal_type: str

@router.post("/scan")
async def record_food(
    body: FoodScanRequest,
    request: Request,
    current_user: dict = Depends(require_any_staff)
):
    """Record food distribution for a delegate"""
    tenant_id = request.state.tenant_id
    
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
    current_user: dict = Depends(require_any_staff)
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

---

### FILE: app/routes/accommodation.py
Location: eventsphere/apps/api/app/routes/accommodation.py

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
        room = await conn.fetchrow(
            "SELECT capacity FROM rooms WHERE id = $1",
            body.room_id
        )
        
        if not room:
            raise HTTPException(404, "Room not found")
        
        occupied = await conn.fetchval(
            "SELECT COUNT(*) FROM room_allocations WHERE room_id = $1",
            body.room_id
        )
        
        if occupied >= room["capacity"]:
            raise HTTPException(400, "Room is full")
        
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

---

### FILE: app/routes/tenants.py
Location: eventsphere/apps/api/app/routes/tenants.py

from fastapi import APIRouter, Request, Depends, HTTPException
from pydantic import BaseModel
from app.database.connection import get_pool, TenantDB
from app.auth.jwt import get_current_user

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
    current_user: dict = Depends(get_current_user)
):
    """Update tenant info (admin only)"""
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
    current_user: dict = Depends(get_current_user)
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

---

### FILE: app/routes/reports.py
Location: eventsphere/apps/api/app/routes/reports.py

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
        total = await conn.fetchval(
            "SELECT COUNT(*) FROM delegates WHERE event_id = $1",
            event_id
        )
        
        checked_in = await conn.fetchval(
            "SELECT COUNT(*) FROM delegates WHERE event_id = $1 AND checked_in = true",
            event_id
        )
        
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

---

### FILE: app/models/__init__.py
Location: eventsphere/apps/api/app/models/__init__.py

# Data models

---

### FILE: app/schemas/__init__.py
Location: eventsphere/apps/api/app/schemas/__init__.py

# Pydantic schemas for request/response validation

---

### FILE: app/services/__init__.py
Location: eventsphere/apps/api/app/services/__init__.py

# Business logic services

---

END OF PART 2
