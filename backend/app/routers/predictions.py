import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import require_role
from app.services.greenpt_prediction import run_greenr_analysis
from app.services.disease_demand import compute_monthly_demand, DISEASE_STATE_PATIENTS
from app.models import GreenRAnalysis

router = APIRouter(prefix="/predictions", tags=["predictions"])

@router.get("/disease-demand")
def disease_demand(
    state: Optional[str] = Query(None, description="State name e.g. Maharashtra. Omit for national totals."),
    _=Depends(require_role("admin")),
):
    """
    Returns epidemiology-driven blood demand forecast per disease.
    Patient counts sourced from peer-reviewed literature (2023-2025).
    """
    demand = compute_monthly_demand(state)
    available_states = sorted({s for d in DISEASE_STATE_PATIENTS.values() for s in d if s != "Others"})
    return {
        "scope": state or "national",
        "demand": demand,
        "available_states": available_states,
        "note": "Counts use diagnosed/treated population only. See /GreenPT/docs/disease-demand-prediction.md for methodology.",
    }

@router.post("/greenr-analyze")
def greenr_analyze(
    state: Optional[str] = Query(None, description="Focus analysis on a specific state"),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin")),
):
    try:
        result = run_greenr_analysis(db, state=state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GreenR analysis failed: {str(e)}")

    # store latest analysis (keep only most recent)
    db.query(GreenRAnalysis).delete()
    db.add(GreenRAnalysis(analysis_json=json.dumps(result)))
    db.commit()
    return result

@router.get("/greenr-latest")
def greenr_latest(db: Session = Depends(get_db), _=Depends(require_role("admin"))):
    row = db.query(GreenRAnalysis).order_by(GreenRAnalysis.generated_at.desc()).first()
    if not row:
        return {"message": "No analysis yet. Click Run GreenR Analysis."}
    return json.loads(row.analysis_json)
