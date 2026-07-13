from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models import Donor, Donation, BloodJourney
from app.deps import require_role
from app.services.gamification import award_points

router = APIRouter(prefix="/donor", tags=["donor"])

class DonorProfileOut(BaseModel):
    id: str
    name: str
    blood_type: str
    city: Optional[str] = None
    state: Optional[str] = None
    is_long_term: bool
    points: int
    badge: str
    last_donation_date: Optional[datetime] = None
    class Config:
        from_attributes = True

class DonationOut(BaseModel):
    id: str
    blood_type: str
    quantity: int
    donated_at: datetime
    class Config:
        from_attributes = True

class DonationIn(BaseModel):
    bank_id: str
    blood_type: str
    quantity: int = 1

@router.get("/profile", response_model=DonorProfileOut)
def get_profile(db: Session = Depends(get_db), user=Depends(require_role("donor"))):
    d = db.query(Donor).filter(Donor.user_id == user.id).first()
    if not d:
        raise HTTPException(404, "Profile not found")
    return d

@router.post("/donate")
def record_donation(data: DonationIn, db: Session = Depends(get_db),
                    user=Depends(require_role("donor"))):
    donor = db.query(Donor).filter(Donor.user_id == user.id).first()
    is_first = db.query(Donation).filter(Donation.donor_id == donor.id).count() == 0
    donation = Donation(donor_id=donor.id, bank_id=data.bank_id,
                        blood_type=data.blood_type, quantity=data.quantity)
    db.add(donation)
    db.flush()
    pts = 100 if is_first else 50
    award_points(donor, db, pts)
    donor.last_donation_date = datetime.utcnow()
    db.commit()
    return {"donation_id": donation.id, "points_earned": pts, "total_points": donor.points}

@router.get("/history", response_model=List[DonationOut])
def donation_history(db: Session = Depends(get_db), user=Depends(require_role("donor"))):
    donor = db.query(Donor).filter(Donor.user_id == user.id).first()
    return db.query(Donation).filter(Donation.donor_id == donor.id).all()

@router.get("/impact")
def get_impact(db: Session = Depends(get_db), user=Depends(require_role("donor"))):
    donor = db.query(Donor).filter(Donor.user_id == user.id).first()
    journeys = db.query(BloodJourney).filter(BloodJourney.donor_id == donor.id).count()
    donations = db.query(Donation).filter(Donation.donor_id == donor.id).count()
    return {"patients_reached": journeys, "total_donations": donations,
            "points": donor.points, "badge": donor.badge}

@router.get("/leaderboard")
def leaderboard(db: Session = Depends(get_db)):
    top = db.query(Donor).order_by(Donor.points.desc()).limit(50).all()
    result = []
    for d in top:
        total_donations = db.query(Donation).filter(Donation.donor_id == d.id).count()
        result.append({
            "name": d.name,
            "points": d.points,
            "badge": d.badge,
            "city": d.city,
            "state": d.state,
            "blood_type": d.blood_type,
            "total_donations": total_donations,
            "last_donation_date": d.last_donation_date.isoformat() if d.last_donation_date else None,
        })
    return result

@router.post("/journey/{journey_id}/accept")
def accept_journey(journey_id: str, db: Session = Depends(get_db),
                   user=Depends(require_role("donor"))):
    j = db.query(BloodJourney).filter(BloodJourney.id == journey_id).first()
    if not j:
        raise HTTPException(404, "Journey not found")
    j.chat_accepted = True
    donor = db.query(Donor).filter(Donor.user_id == user.id).first()
    award_points(donor, db, 25)
    db.commit()
    return {"accepted": True}

@router.post("/journey/{journey_id}/decline")
def decline_journey(journey_id: str, db: Session = Depends(get_db),
                    _=Depends(require_role("donor"))):
    j = db.query(BloodJourney).filter(BloodJourney.id == journey_id).first()
    if not j:
        raise HTTPException(404, "Journey not found")
    j.chat_accepted = False
    db.commit()
    return {"declined": True}
