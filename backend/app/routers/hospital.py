from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models import Hospital, BloodRequest, BloodBank, Donation, BloodJourney
from app.deps import require_role
import math

router = APIRouter(prefix="/hospital", tags=["hospital"])

class BloodRequestIn(BaseModel):
    blood_type: str
    units: int
    urgency: str
    notes: Optional[str] = None

class BloodRequestOut(BaseModel):
    id: str
    blood_type: str
    quantity: int
    urgency: str
    status: str
    created_at: datetime
    notes: Optional[str] = None
    class Config:
        from_attributes = True

class TraceBloodIn(BaseModel):
    donation_id: str
    patient_request_id: str
    blood_type: Optional[str] = None
    units: Optional[int] = None
    message: Optional[str] = None

def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))

@router.post("/request-blood", response_model=BloodRequestOut)
def request_blood(data: BloodRequestIn, db: Session = Depends(get_db),
                  user=Depends(require_role("hospital"))):
    hospital = db.query(Hospital).filter(Hospital.user_id == user.id).first()
    req = BloodRequest(requester_id=hospital.id, requester_type="hospital",
                       blood_type=data.blood_type, quantity=data.units,
                       urgency=data.urgency, notes=data.notes)
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

@router.get("/requests", response_model=List[BloodRequestOut])
def list_requests(db: Session = Depends(get_db), user=Depends(require_role("hospital"))):
    hospital = db.query(Hospital).filter(Hospital.user_id == user.id).first()
    return db.query(BloodRequest).filter(BloodRequest.requester_id == hospital.id).all()

@router.get("/nearby-banks")
def nearby_banks(db: Session = Depends(get_db), user=Depends(require_role("hospital"))):
    from app.services.geo import get_coords
    hospital = db.query(Hospital).filter(Hospital.user_id == user.id).first()
    banks = db.query(BloodBank).all()

    # Use hospital coords or derive from city/state
    if hospital and hospital.lat:
        h_lat, h_lng = hospital.lat, hospital.lng
    elif hospital:
        h_lat, h_lng = get_coords(hospital.state, hospital.city)
    else:
        return [{"id": b.id, "name": b.name, "city": b.city, "state": b.state} for b in banks[:10]]

    def bank_dist(b):
        b_lat = b.lat or get_coords(b.state, b.city)[0]
        b_lng = b.lng or get_coords(b.state, b.city)[1]
        return haversine(h_lat, h_lng, b_lat, b_lng)

    nearby = sorted(banks, key=bank_dist)
    return [{"id": b.id, "name": b.name, "city": b.city, "state": b.state,
             "distance_km": round(bank_dist(b), 1)}
            for b in nearby[:15]]

@router.post("/trace-blood")
def trace_blood(data: TraceBloodIn, db: Session = Depends(get_db),
                user=Depends(require_role("hospital", "admin"))):
    donation = db.query(Donation).filter(Donation.id == data.donation_id).first()
    if not donation:
        raise HTTPException(404, "Donation not found")
    donation.patient_id = data.patient_request_id
    journey = BloodJourney(donation_id=donation.id, donor_id=donation.donor_id,
                           patient_id=data.patient_request_id)
    db.add(journey)
    db.commit()
    db.refresh(journey)
    return {"journey_id": journey.id, "message": "Patient notified of blood journey"}
