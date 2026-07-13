import os, random
from pathlib import Path
from sqlalchemy.orm import Session
from app.models import BloodBank, BloodStock
from app.services.geo import get_coords

BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
ERAKTKOSH_CSV = Path(__file__).parent.parent.parent / "data" / "eraktkosh_stock.csv"

def seed_blood_banks(db: Session):
    count = db.query(BloodBank).count()
    if count >= 4000:
        # Patch existing banks that have null lat/lng
        _patch_coords(db)
        return

    from app.models import Donation
    db.query(BloodStock).delete()
    db.execute(__import__("sqlalchemy").text("UPDATE donations SET bank_id = NULL WHERE bank_id IS NOT NULL"))
    db.query(BloodBank).delete()
    db.commit()

    try:
        import pandas as pd
        df = pd.read_csv(ERAKTKOSH_CSV, dtype=str)
        unique = (
            df.drop_duplicates("hospital_code")
              [["hospital_code", "hospital_name", "district", "state"]]
              .dropna(subset=["hospital_name"])
        )
        for _, row in unique.iterrows():
            state = row.get("state") or None
            district = row.get("district") or None
            lat, lng = get_coords(state, district)
            bank = BloodBank(
                name=row["hospital_name"],
                city=district,
                state=state,
                contact=None,
                type="govt",
                lat=lat,
                lng=lng,
            )
            db.add(bank)
        db.commit()
        print(f"Seeded {len(unique)} real blood banks from eRaktKosh")
    except Exception as e:
        print(f"eRaktKosh seed failed, falling back to demo banks: {e}")
        db.rollback()
        _seed_demo_banks(db)

def _patch_coords(db: Session):
    """Assign coords to existing banks that have null lat/lng."""
    banks = db.query(BloodBank).filter(BloodBank.lat == None).all()
    if not banks:
        return
    for bank in banks:
        lat, lng = get_coords(bank.state, bank.city)
        bank.lat = lat
        bank.lng = lng
    db.commit()
    print(f"Patched coords for {len(banks)} blood banks")

def _seed_demo_banks(db: Session):
    demo = [
        ("Apollo Blood Bank", "Hyderabad", "Telangana", "040-23607777", "pvt", 17.4065, 78.4772),
        ("NIMS Blood Bank", "Hyderabad", "Telangana", "040-23489000", "govt", 17.3850, 78.4867),
        ("Rotary Blood Bank", "Delhi", "Delhi", "011-23370737", "ngo", 28.6139, 77.2090),
        ("AIIMS Blood Bank", "Delhi", "Delhi", "011-26588500", "govt", 28.5672, 77.2100),
        ("KEM Hospital Blood Bank", "Mumbai", "Maharashtra", "022-24136051", "govt", 18.9928, 72.8418),
        ("Tata Memorial Blood Bank", "Mumbai", "Maharashtra", "022-24177000", "pvt", 19.0067, 72.8388),
        ("PGIMER Blood Bank", "Chandigarh", "Punjab", "0172-2756565", "govt", 30.7650, 76.7785),
        ("CMC Blood Bank", "Vellore", "Tamil Nadu", "0416-2281000", "pvt", 12.9246, 79.1348),
        ("NIMHANS Blood Bank", "Bengaluru", "Karnataka", "080-46110007", "govt", 12.9438, 77.5953),
        ("SGPGI Blood Bank", "Lucknow", "Uttar Pradesh", "0522-2668700", "govt", 26.8467, 80.9462),
    ]
    for name, city, state, contact, typ, lat, lng in demo:
        bank = BloodBank(name=name, city=city, state=state, contact=contact, type=typ, lat=lat, lng=lng)
        db.add(bank)
        db.flush()
        for bt in BLOOD_TYPES:
            db.add(BloodStock(bank_id=bank.id, blood_type=bt, units=random.randint(5, 50)))
    db.commit()
    print("Seeded 10 demo blood banks (fallback)")
