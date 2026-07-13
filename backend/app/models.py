import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def _uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Patient(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    name = Column(String, nullable=False)
    blood_type = Column(String, nullable=False)
    disease = Column(String)
    city = Column(String)
    state = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    next_transfusion_date = Column(DateTime, nullable=True)

class Donor(Base):
    __tablename__ = "donors"
    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    name = Column(String, nullable=False)
    blood_type = Column(String, nullable=False)
    city = Column(String)
    state = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    is_long_term = Column(Boolean, default=False)
    last_donation_date = Column(DateTime, nullable=True)
    points = Column(Integer, default=0)
    badge = Column(String, default="new")

class Hospital(Base):
    __tablename__ = "hospitals"
    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    name = Column(String, nullable=False)
    city = Column(String)
    state = Column(String)
    contact = Column(String)
    reg_number = Column(String)
    lat = Column(Float)
    lng = Column(Float)

class BloodBank(Base):
    __tablename__ = "blood_banks"
    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    city = Column(String)
    state = Column(String)
    contact = Column(String)
    type = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    stock = relationship("BloodStock", back_populates="bank")

class BloodStock(Base):
    __tablename__ = "blood_stock"
    id = Column(String, primary_key=True, default=_uuid)
    bank_id = Column(String, ForeignKey("blood_banks.id"))
    blood_type = Column(String, nullable=False)
    units = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    bank = relationship("BloodBank", back_populates="stock")

class BloodRequest(Base):
    __tablename__ = "blood_requests"
    id = Column(String, primary_key=True, default=_uuid)
    requester_id = Column(String, nullable=False)
    requester_type = Column(String, nullable=False)
    blood_type = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    urgency = Column(String, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    hospital_name = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

class Donation(Base):
    __tablename__ = "donations"
    id = Column(String, primary_key=True, default=_uuid)
    donor_id = Column(String, ForeignKey("donors.id"))
    bank_id = Column(String, ForeignKey("blood_banks.id"))
    blood_type = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    donated_at = Column(DateTime, default=datetime.utcnow)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=True)

class BloodJourney(Base):
    __tablename__ = "blood_journey"
    id = Column(String, primary_key=True, default=_uuid)
    donation_id = Column(String, ForeignKey("donations.id"))
    donor_id = Column(String, ForeignKey("donors.id"))
    patient_id = Column(String, ForeignKey("patients.id"))
    notified_at = Column(DateTime, default=datetime.utcnow)
    chat_accepted = Column(Boolean, default=False)

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True, default=_uuid)
    journey_id = Column(String, ForeignKey("blood_journey.id"))
    sender_id = Column(String, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)

class CommunityPost(Base):
    __tablename__ = "community_posts"
    id = Column(String, primary_key=True, default=_uuid)
    author_id = Column(String, ForeignKey("users.id"))
    author_type = Column(String)
    author_name = Column(String, nullable=True)
    author_blood_type = Column(String, nullable=True)
    author_disease = Column(String, nullable=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    disease_tag = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    likes = Column(Integer, default=0)

class PostLike(Base):
    __tablename__ = "post_likes"
    id = Column(String, primary_key=True, default=_uuid)
    post_id = Column(String, ForeignKey("community_posts.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class PredictionScore(Base):
    __tablename__ = "prediction_scores"
    id = Column(String, primary_key=True, default=_uuid)
    region = Column(String, nullable=False)
    blood_type = Column(String, nullable=False)
    shortage_risk = Column(Float, default=0.0)
    predicted_demand = Column(Integer, default=0)
    generated_at = Column(DateTime, default=datetime.utcnow)

class GreenRAnalysis(Base):
    __tablename__ = "greenr_analyses"
    id = Column(String, primary_key=True, default=_uuid)
    analysis_json = Column(Text, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
