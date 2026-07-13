from sqlalchemy.orm import Session
from app.models import User, Patient, Donor, Hospital
from app.auth import hash_password

DEMO_USERS = [
    {
        "email": "admin@vitatrace.com",
        "password": "Admin@123",
        "role": "admin",
        "profile": None,
    },
    {
        "email": "arjun@vitatrace.com",
        "password": "Patient@123",
        "role": "patient",
        "profile": {"name": "Arjun Sharma", "blood_type": "B+", "disease": "thalassemia", "city": "Hyderabad", "state": "Telangana", "lat": 17.385, "lng": 78.486},
    },
    {
        "email": "priya@vitatrace.com",
        "password": "Patient@123",
        "role": "patient",
        "profile": {"name": "Priya Nair", "blood_type": "O+", "disease": "sickle_cell", "city": "Mumbai", "state": "Maharashtra", "lat": 19.076, "lng": 72.877},
    },
    {
        "email": "ravi@vitatrace.com",
        "password": "Donor@123",
        "role": "donor",
        "profile": {"name": "Ravi Kumar", "blood_type": "B+", "city": "Hyderabad", "state": "Telangana", "lat": 17.385, "lng": 78.486, "points": 350, "badge": "Hero"},
    },
    {
        "email": "sneha@vitatrace.com",
        "password": "Donor@123",
        "role": "donor",
        "profile": {"name": "Sneha Reddy", "blood_type": "O-", "city": "Hyderabad", "state": "Telangana", "lat": 17.385, "lng": 78.486, "points": 150, "badge": "Lifesaver"},
    },
    {
        "email": "aiims@vitatrace.com",
        "password": "Hospital@123",
        "role": "hospital",
        "profile": {"name": "AIIMS Delhi", "city": "Delhi", "state": "Delhi", "contact": "011-26588500", "reg_number": "DL-HOSP-2021-0042", "lat": 28.566, "lng": 77.207},
    },
]


def seed_users(db: Session):
    if db.query(User).filter(User.email == "admin@vitatrace.com").first():
        return

    for u in DEMO_USERS:
        user = User(email=u["email"], password_hash=hash_password(u["password"]), role=u["role"])
        db.add(user)
        db.flush()

        p = u["profile"]
        if p is None:
            continue

        if u["role"] == "patient":
            db.add(Patient(user_id=user.id, name=p["name"], blood_type=p["blood_type"],
                           disease=p["disease"], city=p["city"], state=p["state"],
                           lat=p["lat"], lng=p["lng"]))
        elif u["role"] == "donor":
            db.add(Donor(user_id=user.id, name=p["name"], blood_type=p["blood_type"],
                         city=p["city"], state=p["state"], lat=p["lat"], lng=p["lng"],
                         points=p.get("points", 0), badge=p.get("badge", "new")))
        elif u["role"] == "hospital":
            db.add(Hospital(user_id=user.id, name=p["name"], city=p["city"], state=p["state"],
                            contact=p["contact"], reg_number=p["reg_number"],
                            lat=p["lat"], lng=p["lng"]))

    db.commit()
