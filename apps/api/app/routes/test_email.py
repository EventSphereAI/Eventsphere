from fastapi import APIRouter
from app.services.email_service import send_registration_email

router = APIRouter()


@router.get("/send-test")
async def send_test():

    result = await send_registration_email(
        email="swayam.panchal23@pcu.edu.in",
        name="Swayam Panchal",
        event_name="EventSphere Test Event",
        qr_token="TEST-QR-123456789"
    )

    return {
        "email_result": result
    }
