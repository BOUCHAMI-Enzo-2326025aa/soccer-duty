from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/accueil")
def admin_home(db: Session = Depends(get_db)):
    users_count = db.query(models.User).count()
    players_count = db.query(models.PlayerProfile).count()
    docs_count = db.query(models.Document).count()
    return {
        "users_count": users_count,
        "players_count": players_count,
        "documents_count": docs_count,
    }


@router.get("/joueurs")
def admin_players(db: Session = Depends(get_db)):
    players = db.query(models.PlayerProfile).all()
    return {"count": len(players), "items": players}


@router.get("/universites")
def admin_universities(db: Session = Depends(get_db)):
    universities = db.query(models.University).all()
    return {"count": len(universities), "items": universities}


@router.get("/todo")
def admin_todo(db: Session = Depends(get_db)):
    pending_documents = (
        db.query(models.Document)
        .filter(models.Document.status == models.DocStatusEnum.PENDING)
        .all()
    )
    upcoming_milestones = (
        db.query(models.Milestone)
        .filter(models.Milestone.status == models.MilestoneStatusEnum.UPCOMING)
        .all()
    )
    return {
        "pending_documents": pending_documents,
        "upcoming_milestones": upcoming_milestones,
    }


@router.get("/notifications")
def admin_notifications(db: Session = Depends(get_db)):
    notifications = db.query(models.Notification).order_by(models.Notification.created_at.desc()).all()
    return {"count": len(notifications), "items": notifications}


@router.get("/messages")
def admin_messages(db: Session = Depends(get_db)):
    conversations = db.query(models.Conversation).order_by(models.Conversation.created_at.desc()).all()
    return {"count": len(conversations), "items": conversations}


@router.get("/ia")
def admin_ai_assistant():
    return {
        "assistant": "Soccer Duty AI",
        "features": [
            "Document pre-check",
            "Player question support",
            "Priority suggestion",
        ],
    }


@router.get("/aide")
def admin_help():
    return {
        "title": "Admin help",
        "topics": [
            "Validate documents",
            "Manage players",
            "Manage templates",
        ],
    }


@router.get("/parametres")
def admin_settings():
    return {
        "application": "Soccer Duty",
        "version": "1.0",
        "security": {
            "auth": "cookie",
            "token": "fake-token-dev-only",
        },
    }
