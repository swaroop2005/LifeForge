from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models import Patient, BloodRequest, BloodJourney, Donor, Donation
from app.deps import require_role

router = APIRouter(prefix="/patient", tags=["patient"])

class PatientProfileOut(BaseModel):
    id: str
    name: str
    blood_type: str
    disease: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    next_transfusion_date: Optional[datetime] = None
    class Config:
        from_attributes = True

class PatientProfileUpdate(BaseModel):
    name: Optional[str] = None
    disease: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class BloodRequestIn(BaseModel):
    blood_type: str
    units: int
    urgency: str
    hospital_name: Optional[str] = None
    notes: Optional[str] = None

class BloodRequestOut(BaseModel):
    id: str
    blood_type: str
    quantity: int
    urgency: str
    status: str
    created_at: datetime
    hospital_name: Optional[str] = None
    notes: Optional[str] = None
    class Config:
        from_attributes = True

@router.get("/profile", response_model=PatientProfileOut)
def get_profile(db: Session = Depends(get_db), user=Depends(require_role("patient"))):
    p = db.query(Patient).filter(Patient.user_id == user.id).first()
    if not p:
        raise HTTPException(404, "Profile not found")
    return p

@router.put("/profile")
def update_profile(data: PatientProfileUpdate, db: Session = Depends(get_db),
                   user=Depends(require_role("patient"))):
    p = db.query(Patient).filter(Patient.user_id == user.id).first()
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(p, k, v)
    db.commit()
    return {"updated": True}

@router.post("/request-blood", response_model=BloodRequestOut)
def request_blood(data: BloodRequestIn, db: Session = Depends(get_db),
                  user=Depends(require_role("patient"))):
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    req = BloodRequest(requester_id=patient.id, requester_type="patient",
                       blood_type=data.blood_type, quantity=data.units,
                       urgency=data.urgency, hospital_name=data.hospital_name, notes=data.notes)
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

@router.get("/requests", response_model=List[BloodRequestOut])
def list_requests(db: Session = Depends(get_db), user=Depends(require_role("patient"))):
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    return db.query(BloodRequest).filter(BloodRequest.requester_id == patient.id).all()

def _journey_detail(j: BloodJourney, db: Session):
    donor = db.query(Donor).filter(Donor.id == j.donor_id).first()
    donation = db.query(Donation).filter(Donation.id == j.donation_id).first()
    return {
        "id": j.id,
        "notified_at": j.notified_at,
        "chat_accepted": j.chat_accepted,
        "donor_name": donor.name if donor else "Anonymous donor",
        "donor_blood_type": donor.blood_type if donor else None,
        "donor_badge": donor.badge if donor else None,
        "quantity": donation.quantity if donation else 1,
    }

@router.get("/journey/{journey_id}")
def get_journey(journey_id: str, db: Session = Depends(get_db),
                user=Depends(require_role("patient"))):
    j = db.query(BloodJourney).filter(BloodJourney.id == journey_id).first()
    if not j:
        raise HTTPException(404, "Journey not found")
    return _journey_detail(j, db)

@router.get("/journeys")
def list_journeys(db: Session = Depends(get_db), user=Depends(require_role("patient"))):
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    journeys = db.query(BloodJourney).filter(BloodJourney.patient_id == patient.id)\
        .order_by(BloodJourney.notified_at.desc()).all()
    return [_journey_detail(j, db) for j in journeys]
