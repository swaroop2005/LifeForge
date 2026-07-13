from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.database import get_db
from app.models import CommunityPost, Patient, Donor, Hospital, User, PostLike
from app.deps import get_current_user, get_optional_user

router = APIRouter(prefix="/community", tags=["community"])

class PostIn(BaseModel):
    title: str
    content: str
    disease_tag: Optional[str] = None

class PostOut(BaseModel):
    id: str
    author_type: str
    author_name: Optional[str] = None
    author_blood_type: Optional[str] = None
    author_disease: Optional[str] = None
    title: str
    content: str
    disease_tag: Optional[str] = None
    created_at: datetime
    likes: int
    liked_by_me: bool = False
    class Config:
        from_attributes = True

def _get_profile(user: User, db: Session):
    if user.role == "patient":
        p = db.query(Patient).filter(Patient.user_id == user.id).first()
        return (p.name if p else None, p.blood_type if p else None, p.disease if p else None)
    if user.role == "donor":
        d = db.query(Donor).filter(Donor.user_id == user.id).first()
        return (d.name if d else None, d.blood_type if d else None, None)
    if user.role == "hospital":
        h = db.query(Hospital).filter(Hospital.user_id == user.id).first()
        return (h.name if h else None, None, None)
    return (None, None, None)

@router.get("/posts", response_model=List[PostOut])
def list_posts(db: Session = Depends(get_db), user=Depends(get_optional_user)):
    posts = db.query(CommunityPost).order_by(CommunityPost.created_at.desc()).limit(100).all()
    if user:
        liked_ids = {
            pl.post_id for pl in db.query(PostLike).filter(PostLike.user_id == user.id).all()
        }
        for p in posts:
            p.liked_by_me = p.id in liked_ids
    return posts

@router.post("/posts", response_model=PostOut)
def create_post(data: PostIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    name, blood_type, disease = _get_profile(user, db)
    tag = data.disease_tag or disease or user.role
    post = CommunityPost(
        author_id=user.id,
        author_type=user.role,
        author_name=name,
        author_blood_type=blood_type,
        author_disease=disease,
        title=data.title,
        content=data.content,
        disease_tag=tag,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post

@router.post("/posts/{post_id}/like")
def like_post(post_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    existing = db.query(PostLike).filter(PostLike.post_id == post_id, PostLike.user_id == user.id).first()
    if existing:
        return {"likes": post.likes, "liked_by_me": True}
    db.add(PostLike(post_id=post_id, user_id=user.id))
    post.likes += 1
    db.commit()
    return {"likes": post.likes, "liked_by_me": True}
