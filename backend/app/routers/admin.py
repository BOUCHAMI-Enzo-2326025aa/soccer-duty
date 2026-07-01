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
    players = (
        db.query(models.PlayerProfile)
        .order_by(models.PlayerProfile.progress_percentage.desc())
        .all()
    )

    university_ids = {p.university_id for p in players if p.university_id is not None}
    universities = {}
    if university_ids:
        university_rows = (
            db.query(models.University)
            .filter(models.University.id.in_(list(university_ids)))
            .all()
        )
        universities = {u.id: u.name for u in university_rows}

    items = []
    for player in players:
        items.append(
            {
                "id": player.id,
                "first_name": player.first_name,
                "last_name": player.last_name,
                "date_of_birth": player.date_of_birth.isoformat() if player.date_of_birth else None,
                "university_id": player.university_id,
                "university_name": universities.get(player.university_id, "Université non renseignée"),
                "progress_percentage": player.progress_percentage,
            }
        )

    return {"count": len(items), "items": items}


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
    rejected_documents = (
        db.query(models.Document)
        .filter(models.Document.status == models.DocStatusEnum.REJECTED)
        .all()
    )
    ready_players = (
        db.query(models.PlayerProfile)
        .filter(models.PlayerProfile.progress_percentage >= 80)
        .all()
    )
    return {
        "pending_documents": pending_documents,
        "upcoming_milestones": upcoming_milestones,
        "rejected_documents": rejected_documents,
        "ready_players": ready_players,
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
