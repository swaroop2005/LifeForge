from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import defaultdict
from app.database import get_db
from app.models import User, Donor, Patient, Hospital, BloodBank, BloodStock, BloodRequest, PredictionScore
from app.deps import require_role
from app.services.geo import STATE_CENTROIDS

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    total_stock = db.query(BloodStock.units).all()
    return {
        "total_users": db.query(User).count(),
        "total_donors": db.query(Donor).count(),
        "total_patients": db.query(Patient).count(),
        "total_hospitals": db.query(Hospital).count(),
        "total_banks": db.query(BloodBank).count(),
        "total_stock_units": sum(s[0] for s in total_stock),
        "pending_requests": db.query(BloodRequest).filter(BloodRequest.status == "pending").count(),
        "fulfilled_requests": db.query(BloodRequest).filter(BloodRequest.status == "fulfilled").count(),
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

@router.get("/predictions")
def predictions(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    rows = db.query(PredictionScore).order_by(PredictionScore.shortage_risk.desc()).limit(50).all()
    return [{"region": r.region, "blood_type": r.blood_type,
             "shortage_risk": r.shortage_risk, "predicted_demand": r.predicted_demand} for r in rows]

@router.get("/users")
def list_users(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "role": u.role, "created_at": u.created_at} for u in users]
