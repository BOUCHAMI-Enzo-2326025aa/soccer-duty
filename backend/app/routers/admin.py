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
            and admin_user.role == models.RoleEnum.ADMIN
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
        admin_user.role == models.RoleEnum.ADMIN
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


def _serialize_document_template(template: models.DocumentTemplate) -> dict:
    delays = [
        template.delay_appointment_days,
        template.delay_completion_days,
        template.delay_processing_days,
    ]
    delay_total_days = (
        sum(delay or 0 for delay in delays) if any(delay is not None for delay in delays) else None
    )

    return {
        "id": template.id,
        "agency_id": template.agency_id,
        "name": template.name,
        "category": template.category,
        "is_required_by_default": template.is_required_by_default,
        "description_for_player": template.description_for_player,
        "external_url": template.external_url,
        "application_scope": template.application_scope,
        "delay_appointment_days": template.delay_appointment_days,
        "delay_completion_days": template.delay_completion_days,
        "delay_processing_days": template.delay_processing_days,
        "delay_total_days": delay_total_days,
        "target_universities": [
            {"id": university.id, "name": university.name}
            for university in template.target_universities
        ],
    }


def _get_admin_user_or_404(admin_user_id: int, db: Session) -> models.User:
    admin_user = db.query(models.User).filter(models.User.id == admin_user_id).first()
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    return admin_user


def _assert_document_template_in_scope(
    admin_user: models.User, template: models.DocumentTemplate
) -> None:
    if (
        admin_user.role == models.RoleEnum.ADMIN
        and admin_user.agency_id is not None
        and template.agency_id is not None
        and template.agency_id != admin_user.agency_id
    ):
        raise HTTPException(status_code=403, detail="Document template is outside your agency")


def _resolve_target_universities(
    university_ids: list[int], db: Session
) -> list[models.University]:
    if not university_ids:
        return []

    found = (
        db.query(models.University)
        .filter(models.University.id.in_(university_ids))
        .all()
    )
    if len(found) != len(set(university_ids)):
        raise HTTPException(status_code=404, detail="One or more universities not found")
    return found


@router.get("/documents")
def admin_document_templates(admin_user_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(models.DocumentTemplate)

    if admin_user_id is not None:
        admin_user = db.query(models.User).filter(models.User.id == admin_user_id).first()
        if (
            admin_user
            and admin_user.role == models.RoleEnum.ADMIN
            and admin_user.agency_id is not None
        ):
            query = query.filter(
                (models.DocumentTemplate.agency_id == admin_user.agency_id)
                | (models.DocumentTemplate.agency_id.is_(None))
            )

    templates = query.order_by(models.DocumentTemplate.id).all()
    items = [_serialize_document_template(template) for template in templates]
    return {"count": len(items), "items": items}


@router.post("/documents")
def create_admin_document_template(
    payload: schemas.AdminDocumentTemplateSave,
    admin_user_id: int,
    db: Session = Depends(get_db),
):
    admin_user = _get_admin_user_or_404(admin_user_id, db)
    target_universities = _resolve_target_universities(payload.target_university_ids, db)

    template = models.DocumentTemplate(
        agency_id=admin_user.agency_id,
        name=payload.name,
        category=payload.category,
        description_for_player=payload.description_for_player,
        is_required_by_default=payload.is_required_by_default,
        external_url=payload.external_url,
        application_scope=payload.application_scope,
        delay_appointment_days=payload.delay_appointment_days,
        delay_completion_days=payload.delay_completion_days,
        delay_processing_days=payload.delay_processing_days,
    )
    template.target_universities = target_universities

    db.add(template)
    db.commit()
    db.refresh(template)
    return _serialize_document_template(template)


@router.patch("/documents/{template_id}")
def update_admin_document_template(
    template_id: int,
    payload: schemas.AdminDocumentTemplateSave,
    admin_user_id: int,
    db: Session = Depends(get_db),
):
    admin_user = _get_admin_user_or_404(admin_user_id, db)

    template = (
        db.query(models.DocumentTemplate)
        .filter(models.DocumentTemplate.id == template_id)
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Document template not found")

    _assert_document_template_in_scope(admin_user, template)
    target_universities = _resolve_target_universities(payload.target_university_ids, db)

    template.name = payload.name
    template.category = payload.category
    template.description_for_player = payload.description_for_player
    template.is_required_by_default = payload.is_required_by_default
    template.external_url = payload.external_url
    template.application_scope = payload.application_scope
    template.delay_appointment_days = payload.delay_appointment_days
    template.delay_completion_days = payload.delay_completion_days
    template.delay_processing_days = payload.delay_processing_days
    template.target_universities = target_universities

    db.add(template)
    db.commit()
    db.refresh(template)
    return _serialize_document_template(template)


@router.delete("/documents/{template_id}")
def delete_admin_document_template(
    template_id: int,
    admin_user_id: int,
    db: Session = Depends(get_db),
):
    admin_user = _get_admin_user_or_404(admin_user_id, db)

    template = (
        db.query(models.DocumentTemplate)
        .filter(models.DocumentTemplate.id == template_id)
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Document template not found")

    _assert_document_template_in_scope(admin_user, template)

    db.delete(template)
    db.commit()
    return {"message": "Document template deleted"}


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
