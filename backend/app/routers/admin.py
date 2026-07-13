from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from collections import defaultdict
from app.database import get_db
from app.models import User, Donor, Patient, Hospital, BloodBank, BloodStock, BloodRequest, Donation, BloodJourney, PredictionScore
from app.deps import require_role
from app.services.geo import STATE_CENTROIDS

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    total_stock = db.query(BloodStock.units).all()
    users_by_role = dict(
        db.query(User.role, func.count(User.id)).group_by(User.role).all()
    )
    return {
        "total_users": db.query(User).count(),
        "total_donors": db.query(Donor).count(),
        "total_patients": db.query(Patient).count(),
        "total_hospitals": db.query(Hospital).count(),
        "total_banks": db.query(BloodBank).count(),
        "total_stock_units": sum(s[0] for s in total_stock),
        "pending_requests": db.query(BloodRequest).filter(BloodRequest.status == "pending").count(),
        "fulfilled_requests": db.query(BloodRequest).filter(BloodRequest.status == "fulfilled").count(),
        "total_requests": db.query(BloodRequest).count(),
        "total_donations": db.query(Donation).count(),
        "active_journeys": db.query(BloodJourney).filter(BloodJourney.chat_accepted == True).count(),
        "users_by_role": users_by_role,
        "low_stock_alerts": [
            {"bank_name": bank.name, "blood_type": s.blood_type, "units": s.units}
            for s, bank in db.query(BloodStock, BloodBank)
                .join(BloodBank, BloodStock.bank_id == BloodBank.id)
                .filter(BloodStock.units < 10).limit(20).all()
        ],
    }

@router.get("/heatmap")
def heatmap(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    banks = db.query(BloodBank).all()
    # Group by state for a clean heatmap (4114 overlapping pins → 35 state bubbles)
    by_state = defaultdict(lambda: {"banks": 0, "total_units": 0, "risk_sum": 0.0})
    prediction_scores = {r.region: r.shortage_risk for r in db.query(PredictionScore).all()}

    for bank in banks:
        state = bank.state or "Unknown"
        stock = db.query(BloodStock).filter(BloodStock.bank_id == bank.id).all()
        total = sum(s.units for s in stock)
        risk = prediction_scores.get(bank.city, max(0.0, min(1.0, 1 - (total / 200))))
        by_state[state]["banks"] += 1
        by_state[state]["total_units"] += total
        by_state[state]["risk_sum"] += risk

    result = []
    for state, data in by_state.items():
        lat, lng = STATE_CENTROIDS.get(state, (20.5937, 78.9629))
        n = data["banks"]
        avg_risk = round(data["risk_sum"] / n, 2) if n else 0.0
        result.append({
            "bank_id": state,
            "name": f"{state} ({n} hospitals)",
            "city": state,
            "lat": lat,
            "lng": lng,
            "shortage_risk": avg_risk,
            "total_units": data["total_units"],
            "bank_count": n,
        })
    return sorted(result, key=lambda x: x["shortage_risk"], reverse=True)

@router.get("/requests")
def list_requests(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    rows = db.query(BloodRequest).order_by(BloodRequest.created_at.desc()).limit(200).all()
    result = []
    for r in rows:
        requester_name = None
        if r.requester_type == "patient":
            p = db.query(Patient).filter(Patient.id == r.requester_id).first()
            requester_name = p.name if p else None
        elif r.requester_type == "hospital":
            h = db.query(Hospital).filter(Hospital.id == r.requester_id).first()
            requester_name = h.name if h else None
        result.append({
            "id": r.id,
            "requester_name": requester_name or "Unknown",
            "requester_type": r.requester_type,
            "blood_type": r.blood_type,
            "quantity": r.quantity,
            "urgency": r.urgency,
            "status": r.status,
            "hospital_name": r.hospital_name,
            "created_at": r.created_at,
        })
    return result

@router.get("/users")
def list_users(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "role": u.role, "created_at": u.created_at} for u in users]
