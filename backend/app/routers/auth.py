from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Patient, Donor, Hospital
from app.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.auth import hash_password, verify_password, create_token

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=TokenResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, password_hash=hash_password(data.password), role=data.role)
    db.add(user)
    db.flush()
    if data.role == "patient":
        db.add(Patient(user_id=user.id, name=data.name, blood_type=data.blood_type or "",
                       disease=data.disease, city=data.city, state=data.state,
                       lat=data.lat, lng=data.lng,
                       next_transfusion_date=data.next_transfusion_date))
    elif data.role == "donor":
        db.add(Donor(user_id=user.id, name=data.name, blood_type=data.blood_type or "",
                     city=data.city, state=data.state, lat=data.lat, lng=data.lng,
                     is_long_term=data.is_long_term or False,
                     last_donation_date=data.last_donation_date))
    elif data.role == "hospital":
        db.add(Hospital(user_id=user.id, name=data.name, city=data.city, state=data.state,
                        contact=data.contact, reg_number=data.reg_number,
                        lat=data.lat, lng=data.lng))
    db.commit()
    return TokenResponse(access_token=create_token(user.id, user.role),
                         role=user.role, user_id=user.id)

@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return TokenResponse(access_token=create_token(user.id, user.role),
                         role=user.role, user_id=user.id)
