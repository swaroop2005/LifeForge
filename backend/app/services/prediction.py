import pickle, os
import numpy as np
from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models import PredictionScore, BloodBank, BloodStock, BloodRequest

_model = None

def _load():
    global _model
    path = os.path.join(os.path.dirname(__file__), "../../ml/model.pkl")
    if not os.path.exists(path):
        return False
    with open(path, "rb") as f:
        _model = pickle.load(f)
    return True

def run_predictions(db: Session):
    if _model is None:
        if not _load():
            return

    blood_types = _model["blood_types"]
    regions = _model["regions"]
    month = datetime.utcnow().month

    # Real stock: sum units per city per blood_type across all banks in that city
    stock_rows = (
        db.query(BloodBank.city, BloodStock.blood_type, func.sum(BloodStock.units))
        .join(BloodStock, BloodStock.bank_id == BloodBank.id)
        .group_by(BloodBank.city, BloodStock.blood_type)
        .all()
    )
    # {city: {blood_type: units}}
    stock_map = {}
    for city, bt, units in stock_rows:
        stock_map.setdefault(city, {})[bt] = int(units or 0)

    # Real request volume: count pending requests per blood_type
    req_rows = (
        db.query(BloodRequest.blood_type, func.sum(BloodRequest.quantity))
        .filter(BloodRequest.status == "pending")
        .group_by(BloodRequest.blood_type)
        .all()
    )
    req_map = {bt: int(qty or 0) for bt, qty in req_rows}

    db.query(PredictionScore).delete()

    for r_idx, region in enumerate(regions):
        for bt_idx, bt in enumerate(blood_types):
            # Use real stock for this region+blood_type, fallback 30 if no data yet
            stock = stock_map.get(region, {}).get(bt, 30)
            # Use real pending request volume for this blood_type, fallback 5
            req_vol = req_map.get(bt, 5)

            X = np.array([[bt_idx, r_idx, month, stock, req_vol]])
            demand = int(_model["demand"].predict(X)[0])
            risk = float(np.clip(_model["risk"].predict(X)[0], 0, 1))
            db.add(PredictionScore(region=region, blood_type=bt,
                                   shortage_risk=round(risk, 3), predicted_demand=demand))

    db.commit()
