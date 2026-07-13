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
    from app.services.chatbot import _get_df
    df = _get_df()
    users_by_role = dict(
        db.query(User.role, func.count(User.id)).group_by(User.role).all()
    )
    # lowest-stock hospitals from live eRaktKosh data (whole blood / PRBC records)
    low = df[df["availability"] <= 2].head(8)
    low_alerts = [
        {"bank_name": r["hospital_name"][:48], "blood_type": r["blood_group"], "units": int(r["availability"])}
        for _, r in low.iterrows()
    ]
    return {
        "total_users": db.query(User).count(),
        "total_donors": db.query(Donor).count(),
        "total_patients": db.query(Patient).count(),
        "total_hospitals": db.query(Hospital).count(),
        "total_banks": db.query(BloodBank).count(),
        "total_stock_units": int(df["availability"].sum()),
        "pending_requests": db.query(BloodRequest).filter(BloodRequest.status == "pending").count(),
        "fulfilled_requests": db.query(BloodRequest).filter(BloodRequest.status == "fulfilled").count(),
        "total_requests": db.query(BloodRequest).count(),
        "total_donations": db.query(Donation).count(),
        "active_journeys": db.query(BloodJourney).filter(BloodJourney.chat_accepted == True).count(),
        "users_by_role": users_by_role,
        "low_stock_alerts": low_alerts,
    }

@router.get("/heatmap")
def heatmap(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    # Aggregate real eRaktKosh stock per state (47k records → 35 state bubbles).
    # Risk scales with average units per stock record; ~25 units/record is healthy.
    from app.services.chatbot import _get_df
    df = _get_df()
    grouped = df.groupby("state").agg(
        total_units=("availability", "sum"),
        records=("availability", "count"),
        banks=("hospital_code", "nunique"),
    )

    result = []
    for state, row in grouped.iterrows():
        lat, lng = STATE_CENTROIDS.get(state, (20.5937, 78.9629))
        avg_per_record = row["total_units"] / row["records"] if row["records"] else 0
        risk = round(max(0.05, min(0.95, 1 - (avg_per_record / 25))), 2)
        result.append({
            "bank_id": state,
            "name": f"{state} ({int(row['banks'])} hospitals)",
            "city": state,
            "lat": lat,
            "lng": lng,
            "shortage_risk": risk,
            "total_units": int(row["total_units"]),
            "bank_count": int(row["banks"]),
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
