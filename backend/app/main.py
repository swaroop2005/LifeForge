from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, SessionLocal
from app.models import Base
from app.routers import auth, patient, donor, hospital, admin, blood_banks, community, chat, chatbot, predictions
from app.services.seed import seed_blood_banks
from app.services.seed_users import seed_users
from app.services.seed_synthetic import seed_synthetic
from app.services.prediction import run_predictions

Base.metadata.create_all(bind=engine)

app = FastAPI(title="VitaTrace API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(donor.router)
app.include_router(hospital.router)
app.include_router(admin.router)
app.include_router(blood_banks.router)
app.include_router(community.router)
app.include_router(chat.router)
app.include_router(chatbot.router)
app.include_router(predictions.router)

@app.on_event("startup")
def startup():
    from sqlalchemy import text
    with engine.connect() as conn:
        # community_posts columns
        for col, typ in [("author_name", "TEXT"), ("author_blood_type", "TEXT"), ("author_disease", "TEXT")]:
            try:
                conn.execute(text(f"ALTER TABLE community_posts ADD COLUMN {col} {typ}"))
                conn.commit()
            except Exception:
                conn.rollback()
        # patients columns
        for col, typ in [("next_transfusion_date", "TIMESTAMP")]:
            try:
                conn.execute(text(f"ALTER TABLE patients ADD COLUMN {col} {typ}"))
                conn.commit()
            except Exception:
                conn.rollback()
        # blood_requests columns
        for col, typ in [("hospital_name", "TEXT"), ("notes", "TEXT")]:
            try:
                conn.execute(text(f"ALTER TABLE blood_requests ADD COLUMN {col} {typ}"))
                conn.commit()
            except Exception:
                conn.rollback()

    db = SessionLocal()
    try:
        seed_blood_banks(db)
        seed_users(db)
        seed_synthetic(db)
        run_predictions(db)
    finally:
        db.close()
    try:
        from app.services.greenpt import load_kb
        load_kb()
    except Exception as e:
        print(f"GreenPT KB load skipped (add API key to .env): {e}")

@app.get("/health")
def health():
    return {"status": "ok", "service": "VitaTrace"}
