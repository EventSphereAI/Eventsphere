from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

router = APIRouter(
    prefix="/public",
    tags=["Public"]
)

class DelegateRegistration(BaseModel):
    full_name: str
    email: EmailStr
    phone: str

@router.post("/register")
async def register_delegate(payload: DelegateRegistration):
    return {
        "success": True,
        "data": payload.dict()
    }