from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.deps import get_optional_user
from app.services.chatbot import chat
from app.models import Patient, Donor

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class HistoryMessage(BaseModel):
    role: str
    content: str

class ChatIn(BaseModel):
    text: str
    language: str = "en"
    history: Optional[List[HistoryMessage]] = None

class ChatOut(BaseModel):
    response: str

@router.post("/message", response_model=ChatOut)
def chatbot_message(data: ChatIn, db: Session = Depends(get_db),
                    user=Depends(get_optional_user)):
    history = [{"role": h.role, "content": h.content} for h in data.history] if data.history else []

    disease_filter = None
    donor_id = None
    user_id = None

    if user:
        user_id = user.id
        if user.role == "patient":
            patient = db.query(Patient).filter(Patient.user_id == user.id).first()
            if patient and patient.disease:
                disease_filter = patient.disease
        if user.role == "donor":
            donor = db.query(Donor).filter(Donor.user_id == user.id).first()
            if donor:
                donor_id = str(donor.id)

    response = chat(data.text, data.language, user_id, db, history,
                    disease_filter=disease_filter, donor_id=donor_id)
    return ChatOut(response=response)
