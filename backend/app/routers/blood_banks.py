from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pathlib import Path
from pydantic import BaseModel
import pandas as pd
from app.database import get_db
from app.models import BloodBank, BloodStock
from app.deps import get_current_user, require_role

CSV_PATH = Path(__file__).parent.parent.parent / "data" / "eraktkosh_stock.csv"
_df_cache = None

def _load_csv() -> pd.DataFrame:
    global _df_cache
    if _df_cache is None:
        _df_cache = pd.read_csv(CSV_PATH, dtype=str)
        _df_cache["availability"] = pd.to_numeric(_df_cache["availability"], errors="coerce").fillna(0).astype(int)
    return _df_cache

router = APIRouter(prefix="/blood-banks", tags=["blood-banks"])

class BankOut(BaseModel):
    id: str
    name: str
    city: Optional[str] = None
    state: Optional[str] = None
    contact: Optional[str] = None
    type: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    class Config:
        from_attributes = True

class StockOut(BaseModel):
    blood_type: str
    units: int
    last_updated: datetime
    class Config:
        from_attributes = True

@router.get("/", response_model=List[BankOut])
def list_banks(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(BloodBank).all()

@router.get("/search", response_model=List[BankOut])
def search_banks(
    q: str = Query("", min_length=0),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(BloodBank)
    if q:
        query = query.filter(BloodBank.name.ilike(f"%{q}%"))
    if state:
        query = query.filter(BloodBank.state.ilike(f"%{state}%"))
    return query.order_by(BloodBank.name).limit(25).all()

@router.get("/{bank_id}/stock", response_model=List[StockOut])
def get_stock(bank_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    stock = db.query(BloodStock).filter(BloodStock.bank_id == bank_id).all()
    if not stock:
        raise HTTPException(404, "Bank not found")
    return stock

@router.get("/national-search")
def national_search(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    blood_group: Optional[str] = Query(None),
    component: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
):
    df = _load_csv().copy()
    if state:
        df = df[df["state"].str.lower() == state.lower()]
    if district:
        df = df[df["district"].str.lower().str.contains(district.lower(), na=False)]
    if blood_group:
        df = df[df["blood_group"].str.upper() == blood_group.upper()]
    if component:
        df = df[df["component"].str.lower().str.contains(component.lower(), na=False)]
    df = df[df["availability"] > 0].sort_values("availability", ascending=False).head(limit)
    return df.to_dict(orient="records")

@router.get("/national-filters")
def national_filters():
    df = _load_csv()
    return {
        "states": sorted(df["state"].dropna().unique().tolist()),
        "blood_groups": sorted(df["blood_group"].dropna().unique().tolist()),
        "components": sorted(df["component"].dropna().unique().tolist()),
    }

@router.post("/{bank_id}/update-stock")
def update_stock(bank_id: str, blood_type: str, units: int,
                 db: Session = Depends(get_db),
                 user=Depends(require_role("admin", "hospital"))):
    s = db.query(BloodStock).filter(BloodStock.bank_id == bank_id,
                                     BloodStock.blood_type == blood_type).first()
    if not s:
        raise HTTPException(404, "Stock entry not found")
    s.units = units
    s.last_updated = datetime.utcnow()
    db.commit()
    return {"updated": True}
