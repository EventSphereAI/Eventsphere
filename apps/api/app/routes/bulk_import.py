from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    HTTPException,
    Request,
    Depends
)

from app.database.connection import TenantDB
from app.auth.jwt import require_admin
from app.routes.scanning import generate_qr_token

import pandas as pd
import uuid
import io
import re

router = APIRouter()

@router.post("/import")
async def import_delegates(
    request: Request,
    event_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin)
):
    tenant_id = request.state.tenant_id

    # Fix #1, #2, #5 — file reading and column validation now reachable
    if file.filename.endswith(".csv"):
        contents = await file.read()          # Fix #5 — read as bytes like XLSX
        df = pd.read_csv(io.BytesIO(contents))

    elif file.filename.endswith(".xlsx"):
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))

    else:
        raise HTTPException(
            status_code=400,
            detail="Only CSV or XLSX files are supported."
        )

    # Fix #1 — required_columns check moved outside else block, now always runs
    required_columns = [
        "full_name",
        "email",
        "phone",
        "college"
    ]

    missing = [
        c for c in required_columns
        if c not in df.columns
    ]

    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing columns: {missing}"
        )

    # Fix #2 — counters declared at correct scope, outside loop
    imported = 0
    skipped = 0
    errors = []

    # Fix #3 — correct 4-space indentation on async with blocks
    async with TenantDB(tenant_id) as conn:
        async with conn.transaction():

            for index, row in df.iterrows():

                try:
                    if pd.isna(row["full_name"]):
                        raise Exception("Missing name")

                    if pd.isna(row["email"]):
                        raise Exception("Missing email")

                    if pd.isna(row["phone"]):
                        raise Exception("Missing phone")

                    email = str(row["email"]).strip().lower()
                    phone = str(row["phone"]).strip()

                    if not re.match(r"^[6-9]\d{9}$", phone):
                        raise Exception("Invalid phone")

                    existing = await conn.fetchrow(
                        """
                        SELECT id
                        FROM delegates
                        WHERE tenant_id=$1
                        AND event_id=$2
                        AND email=$3
                        """,
                        tenant_id,
                        event_id,
                        email
                    )

                    if existing:
                        skipped += 1
                        errors.append({
                            "row": index + 2,
                            "email": email,
                            "reason": "Already exists"
                        })
                        continue

                    delegate_id = str(uuid.uuid4())

                    qr_token = generate_qr_token(
                        tenant_id,
                        event_id,
                        delegate_id
                    )

                    await conn.execute(
                        """
                        INSERT INTO delegates (
                            id,
                            tenant_id,
                            event_id,
                            full_name,
                            email,
                            phone,
                            college,
                            qr_code,
                            food_pref,
                            accommodation_required,
                            email_status
                        )
                        VALUES(
                            $1,$2,$3,$4,$5,
                            $6,$7,$8,$9,
                            $10,$11
                        )
                        """,
                        delegate_id,
                        tenant_id,
                        event_id,
                        row["full_name"],
                        email,
                        phone,
                        row["college"],
                        qr_token,
                        "veg",
                        False,
                        "pending"
                    )

                    imported += 1

                except Exception as e:
                    skipped += 1
                    errors.append({
                        "row": index + 2,
                        "email": str(row.get("email", "")),
                        "reason": str(e)
                    })

    # Fix #4 — return is now OUTSIDE the for loop, after all rows processed
    return {
        "success": True,
        "imported": imported,
        "skipped": skipped,
        "errors": errors
    }