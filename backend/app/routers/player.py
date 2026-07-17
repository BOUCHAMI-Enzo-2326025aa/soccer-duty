from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models

router = APIRouter(prefix="/player", tags=["player"])


def _get_profile_from_user(user_id: int, db: Session) -> models.PlayerProfile:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = (
        db.query(models.PlayerProfile)
        .filter(models.PlayerProfile.user_id == user_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Player profile not found")
    return profile


@router.get("/dossier/{user_id}")
def player_dossier(user_id: int, db: Session = Depends(get_db)):
    profile = _get_profile_from_user(user_id, db)
    documents = db.query(models.Document).filter(models.Document.player_id == profile.id).all()
    milestones = (
        db.query(models.Milestone)
        .filter(models.Milestone.player_id == profile.id)
        .order_by(models.Milestone.order_index.asc())
        .all()
    )
    return {
        "player": {
            "profile_id": profile.id,
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "progress_percentage": profile.progress_percentage,
        },
        "documents": documents,
        "milestones": milestones,
    }


@router.get("/profil/{user_id}")
def player_profile(user_id: int, db: Session = Depends(get_db)):
    profile = _get_profile_from_user(user_id, db)
    university = None
    if profile.university_id:
        university = (
            db.query(models.University)
            .filter(models.University.id == profile.university_id)
            .first()
        )

    return {
        "profile": profile,
        "university": university,
    }


@router.get("/documents/{user_id}")
def player_documents(user_id: int, db: Session = Depends(get_db)):
    profile = _get_profile_from_user(user_id, db)
    documents = db.query(models.Document).filter(models.Document.player_id == profile.id).all()
    return {"count": len(documents), "items": documents}


@router.get("/messages/{user_id}")
def player_messages(user_id: int, db: Session = Depends(get_db)):
    profile = _get_profile_from_user(user_id, db)
    conversations = (
        db.query(models.Conversation)
        .filter(models.Conversation.player_profile_id == profile.id)
        .all()
    )
    return {"count": len(conversations), "items": conversations}


@router.get("/aide")
def player_help():
    return {
        "title": "Player help",
        "faq": [
            "How to upload a document?",
            "How to message the agency?",
            "How to check my progress?",
        ],
    }
