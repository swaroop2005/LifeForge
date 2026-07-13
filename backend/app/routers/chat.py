from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models import Message, BloodJourney
from app.deps import get_current_user

router = APIRouter(prefix="/chat", tags=["chat"])

class MessageIn(BaseModel):
    content: str

class MessageOut(BaseModel):
    id: str
    sender_id: str
    content: str
    sent_at: datetime
    class Config:
        from_attributes = True

@router.get("/messages/{journey_id}", response_model=List[MessageOut])
def get_messages(journey_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    j = db.query(BloodJourney).filter(BloodJourney.id == journey_id).first()
    if not j:
        raise HTTPException(404, "Journey not found")
    return db.query(Message).filter(Message.journey_id == journey_id).order_by(Message.sent_at).all()

@router.post("/messages/{journey_id}", response_model=MessageOut)
def send_message(journey_id: str, data: MessageIn, db: Session = Depends(get_db),
                 user=Depends(get_current_user)):
    j = db.query(BloodJourney).filter(BloodJourney.id == journey_id).first()
    if not j:
        raise HTTPException(404, "Journey not found")
    if not j.chat_accepted:
        raise HTTPException(403, "Chat not accepted by donor yet")
    msg = Message(journey_id=journey_id, sender_id=user.id, content=data.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
