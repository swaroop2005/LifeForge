import numpy as np
import pickle, os
from sklearn.ensemble import RandomForestRegressor

BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
REGIONS = ["Hyderabad", "Delhi", "Mumbai", "Chandigarh", "Lucknow", "Vellore", "Bengaluru"]
DISEASE_PREVALENCE = {
    "Hyderabad": 0.8, "Delhi": 0.6, "Mumbai": 0.5,
    "Chandigarh": 0.3, "Lucknow": 0.4, "Vellore": 0.7, "Bengaluru": 0.5
}

def generate_data(n=1000):
    np.random.seed(42)
    rows = []
    for _ in range(n):
        region = np.random.choice(REGIONS)
        bt = np.random.choice(BLOOD_TYPES)
        month = np.random.randint(1, 13)
        stock = np.random.randint(0, 100)
        prev = DISEASE_PREVALENCE.get(region, 0.5)
        req_vol = np.random.poisson(prev * 20)
        seasonal = 1.2 if month in [3, 4, 5, 10, 11] else 0.9
        demand = int(req_vol * seasonal + np.random.normal(0, 2))
        risk = max(0.0, min(1.0, (demand - stock * 0.3) / (max(demand, 1) + 1)))
        rows.append([BLOOD_TYPES.index(bt), REGIONS.index(region), month, stock, req_vol, demand, risk])
    return np.array(rows)

def train():
    data = generate_data()
    X = data[:, :5]
    model_demand = RandomForestRegressor(n_estimators=100, random_state=42)
    model_demand.fit(X, data[:, 5])
    model_risk = RandomForestRegressor(n_estimators=100, random_state=42)
    model_risk.fit(X, data[:, 6])
    out = os.path.join(os.path.dirname(__file__), "model.pkl")
    with open(out, "wb") as f:
        pickle.dump({"demand": model_demand, "risk": model_risk,
                     "blood_types": BLOOD_TYPES, "regions": REGIONS}, f)
    print(f"Model saved to {out}")

if __name__ == "__main__":
    train()
