from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
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
def admin_players(admin_user_id: int | None = None, db: Session = Depends(get_db)):
    query = (
        db.query(models.PlayerProfile, models.User)
        .join(models.User, models.PlayerProfile.user_id == models.User.id)
        .filter(models.User.role == models.RoleEnum.PLAYER)
    )

    if admin_user_id is not None:
        admin_user = db.query(models.User).filter(models.User.id == admin_user_id).first()
        if (
            admin_user
            and admin_user.role == models.RoleEnum.AGENCY_ADMIN
            and admin_user.agency_id is not None
        ):
            query = query.filter(models.User.agency_id == admin_user.agency_id)

    player_rows = query.order_by(models.PlayerProfile.progress_percentage.desc()).all()
    players = [player for player, _ in player_rows]

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
    for player, user in player_rows:
        items.append(
            {
                "id": player.id,
                "first_name": player.first_name,
                "last_name": player.last_name,
                "email": user.email,
                "phone": player.phone,
                "date_of_birth": player.date_of_birth.isoformat() if player.date_of_birth else None,
                "university_id": player.university_id,
                "university_name": universities.get(player.university_id, "Université non renseignée"),
                "progress_percentage": player.progress_percentage,
                "dossier_stage": player.dossier_stage or "Trad",
                "recruitment_status": player.recruitment_status or "Prospection",
                "service_plan": player.service_plan or "Formule A",
                "acquisition_channel": player.acquisition_channel or "formulaire",
                "intake_period": player.intake_period or "Fall",
            }
        )

    return {"count": len(items), "items": items}


@router.patch("/joueurs/{player_id}")
def update_admin_player(
    player_id: int,
    payload: schemas.AdminPlayerUpdate,
    admin_user_id: int,
    db: Session = Depends(get_db),
):
    admin_user = db.query(models.User).filter(models.User.id == admin_user_id).first()
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")

    row = (
        db.query(models.PlayerProfile, models.User)
        .join(models.User, models.PlayerProfile.user_id == models.User.id)
        .filter(models.PlayerProfile.id == player_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Player not found")

    player_profile, player_user = row

    if (
        admin_user.role == models.RoleEnum.AGENCY_ADMIN
        and admin_user.agency_id is not None
        and player_user.agency_id != admin_user.agency_id
    ):
        raise HTTPException(status_code=403, detail="Player is outside your agency")

    player_profile.phone = payload.phone
    player_profile.dossier_stage = payload.dossier_stage
    player_profile.recruitment_status = payload.recruitment_status
    player_profile.service_plan = payload.service_plan
    player_profile.acquisition_channel = payload.acquisition_channel
    player_profile.intake_period = payload.intake_period

    db.add(player_profile)
    db.commit()
    db.refresh(player_profile)

    university_name = "Université non renseignée"
    if player_profile.university_id is not None:
        university = (
            db.query(models.University)
            .filter(models.University.id == player_profile.university_id)
            .first()
        )
        if university:
            university_name = university.name

    return {
        "id": player_profile.id,
        "first_name": player_profile.first_name,
        "last_name": player_profile.last_name,
        "email": player_user.email,
        "phone": player_profile.phone,
        "date_of_birth": player_profile.date_of_birth.isoformat() if player_profile.date_of_birth else None,
        "university_id": player_profile.university_id,
        "university_name": university_name,
        "progress_percentage": player_profile.progress_percentage,
        "dossier_stage": player_profile.dossier_stage or "Trad",
        "recruitment_status": player_profile.recruitment_status or "Prospection",
        "service_plan": player_profile.service_plan or "Formule A",
        "acquisition_channel": player_profile.acquisition_channel or "formulaire",
        "intake_period": player_profile.intake_period or "Fall",
    }


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
