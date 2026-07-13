from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: str
    name: str
    blood_type: Optional[str] = None
    disease: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_long_term: Optional[bool] = False
    contact: Optional[str] = None
    reg_number: Optional[str] = None
    next_transfusion_date: Optional[datetime] = None
    last_donation_date: Optional[datetime] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
