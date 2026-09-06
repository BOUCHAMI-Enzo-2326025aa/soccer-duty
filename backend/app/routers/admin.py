from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.models import models
from app.security import generate_temporary_password, get_current_user, hash_password
from app.aiden_bridge import reset_aiden_identities

router = APIRouter(prefix="/admin", tags=["admin"])


def _require_admin(current_user: models.User) -> None:
    if current_user.role not in (models.RoleEnum.ADMIN, models.RoleEnum.SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="Réservé aux administrateurs")


def _agency_scope(current_user: models.User) -> int | None:
    """Renvoie l'agence sur laquelle scoper les requêtes, ou None si l'admin
    voit tout (SUPER_ADMIN, ou ADMIN sans agence assignée)."""
    if current_user.role == models.RoleEnum.ADMIN and current_user.agency_id is not None:
        return current_user.agency_id
    return None


@router.get("/accueil")
def admin_home(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    agency_id = _agency_scope(current_user)

    users_query = db.query(models.User)
    players_query = db.query(models.PlayerProfile).join(
        models.User, models.PlayerProfile.user_id == models.User.id
    )
    docs_query = (
        db.query(models.Document)
        .join(models.PlayerProfile, models.Document.player_id == models.PlayerProfile.id)
        .join(models.User, models.PlayerProfile.user_id == models.User.id)
    )
    if agency_id is not None:
        users_query = users_query.filter(models.User.agency_id == agency_id)
        players_query = players_query.filter(models.User.agency_id == agency_id)
        docs_query = docs_query.filter(models.User.agency_id == agency_id)

    return {
        "users_count": users_query.count(),
        "players_count": players_query.count(),
        "documents_count": docs_query.count(),
    }


@router.get("/joueurs")
def admin_players(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    query = (
        db.query(models.PlayerProfile, models.User)
        .join(models.User, models.PlayerProfile.user_id == models.User.id)
        .filter(models.User.role == models.RoleEnum.PLAYER)
    )

    agency_id = _agency_scope(current_user)
    if agency_id is not None:
        query = query.filter(models.User.agency_id == agency_id)

    player_rows = query.order_by(models.PlayerProfile.progress_percentage.desc()).all()
    players = [player for player, _ in player_rows]

    university_ids = {p.university_id for p in players if p.university_id is not None}
    universities: dict[int, models.University] = {}
    if university_ids:
        university_rows = (
            db.query(models.University)
            .filter(models.University.id.in_(list(university_ids)))
            .all()
        )
        universities = {u.id: u for u in university_rows}

    from app.routers.player import _get_applicable_document_templates

    documents_by_player: dict[int, list[models.Document]] = {}
    if players:
        all_documents = (
            db.query(models.Document)
            .filter(models.Document.player_id.in_([p.id for p in players]))
            .all()
        )
        for doc in all_documents:
            documents_by_player.setdefault(doc.player_id, []).append(doc)

    items = []
    for player, user in player_rows:
        templates = _get_applicable_document_templates(player, db)
        template_ids = {t.id for t in templates}
        player_documents = [
            doc
            for doc in documents_by_player.get(player.id, [])
            if doc.document_template_id in template_ids
        ]
        documents_total = len(templates)
        documents_validated = sum(
            1 for doc in player_documents if doc.status == models.DocStatusEnum.VALIDATED
        )
        documents_pending = sum(
            1 for doc in player_documents if doc.status == models.DocStatusEnum.PENDING
        )
        progress_percentage_real = (
            round(documents_validated / documents_total * 100) if documents_total > 0 else 0
        )

        university = universities.get(player.university_id)
        items.append(
            {
                "id": player.id,
                "first_name": player.first_name,
                "last_name": player.last_name,
                "email": user.email,
                "phone": player.phone,
                "date_of_birth": player.date_of_birth.isoformat() if player.date_of_birth else None,
                "university_id": player.university_id,
                "university_name": university.name if university else "Université non renseignée",
                "university_logo": university.logo if university else None,
                "progress_percentage": player.progress_percentage,
                "dossier_stage": player.dossier_stage or "Trad",
                "recruitment_status": player.recruitment_status or "Prospection",
                "service_plan": player.service_plan or "Formule A",
                "acquisition_channel": player.acquisition_channel or "formulaire",
                "intake_period": player.intake_period or "Fall",
                "pending_documents_count": documents_pending,
                "documents_total": documents_total,
                "documents_validated": documents_validated,
                "documents_pending": documents_pending,
                "progress_percentage_real": progress_percentage_real,
            }
        )

    return {"count": len(items), "items": items}


@router.post("/joueurs")
def create_admin_player(
    payload: schemas.AdminCreatePlayerPayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)

    if current_user.agency_id is None:
        raise HTTPException(
            status_code=400,
            detail="Votre compte n'est rattaché à aucune agence : impossible de créer un joueur",
        )

    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already used")

    university_name = "Université non renseignée"
    university_logo = None
    if payload.university_id is not None:
        university = (
            db.query(models.University)
            .filter(models.University.id == payload.university_id)
            .first()
        )
        if not university:
            raise HTTPException(status_code=404, detail="University not found")
        university_name = university.name
        university_logo = university.logo

    temporary_password = generate_temporary_password()

    new_user = models.User(
        email=payload.email,
        hashed_password=hash_password(temporary_password),
        role=models.RoleEnum.PLAYER,
        agency_id=current_user.agency_id,
        has_temporary_password=True,
    )
    db.add(new_user)
    db.flush()  # attribue new_user.id sans clore la transaction

    profile = models.PlayerProfile(
        user_id=new_user.id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        university_id=payload.university_id,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    # Sans ça, AIDEN ignore ce compte jusqu'au prochain redémarrage du serveur.
    reset_aiden_identities()

    return {
        "id": profile.id,
        "first_name": profile.first_name,
        "last_name": profile.last_name,
        "email": new_user.email,
        "university_id": profile.university_id,
        "university_name": university_name,
        "university_logo": university_logo,
        "temporary_password": temporary_password,
    }


def _assert_player_in_scope(current_user: models.User, profile: models.PlayerProfile) -> None:
    agency_id = _agency_scope(current_user)
    if agency_id is None:
        return
    player_agency_id = profile.user.agency_id if profile.user else None
    if player_agency_id != agency_id:
        raise HTTPException(status_code=403, detail="Player is outside your agency")


@router.get("/joueurs/{player_id}/documents")
def admin_player_documents(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    from app.routers.player import (
        _get_applicable_document_templates,
        _serialize_player_document,
    )

    profile = (
        db.query(models.PlayerProfile)
        .filter(models.PlayerProfile.id == player_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Player not found")
    _assert_player_in_scope(current_user, profile)

    templates = _get_applicable_document_templates(profile, db)
    template_ids = [template.id for template in templates]

    existing_documents = (
        db.query(models.Document)
        .filter(
            models.Document.player_id == profile.id,
            models.Document.document_template_id.in_(template_ids),
        )
        .all()
        if template_ids
        else []
    )
    documents_by_template = {
        document.document_template_id: document for document in existing_documents
    }

    items = [
        _serialize_player_document(template, documents_by_template.get(template.id))
        for template in templates
    ]
    return {"count": len(items), "items": items}


@router.patch("/joueurs/{player_id}")
def update_admin_player(
    player_id: int,
    payload: schemas.AdminPlayerUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)

    row = (
        db.query(models.PlayerProfile, models.User)
        .join(models.User, models.PlayerProfile.user_id == models.User.id)
        .filter(models.PlayerProfile.id == player_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Player not found")

    player_profile, player_user = row

    agency_id = _agency_scope(current_user)
    if agency_id is not None and player_user.agency_id != agency_id:
        raise HTTPException(status_code=403, detail="Player is outside your agency")

    player_profile.phone = payload.phone
    player_profile.dossier_stage = payload.dossier_stage
    player_profile.recruitment_status = payload.recruitment_status
    player_profile.service_plan = payload.service_plan
    player_profile.acquisition_channel = payload.acquisition_channel
    player_profile.intake_period = payload.intake_period
    player_profile.university_id = payload.university_id

    db.add(player_profile)
    db.commit()
    db.refresh(player_profile)

    university_name = "Université non renseignée"
    university_logo = None
    if player_profile.university_id is not None:
        university = (
            db.query(models.University)
            .filter(models.University.id == player_profile.university_id)
            .first()
        )
        if university:
            university_name = university.name
            university_logo = university.logo

    return {
        "id": player_profile.id,
        "first_name": player_profile.first_name,
        "last_name": player_profile.last_name,
        "email": player_user.email,
        "phone": player_profile.phone,
        "date_of_birth": player_profile.date_of_birth.isoformat() if player_profile.date_of_birth else None,
        "university_id": player_profile.university_id,
        "university_name": university_name,
        "university_logo": university_logo,
        "progress_percentage": player_profile.progress_percentage,
        "dossier_stage": player_profile.dossier_stage or "Trad",
        "recruitment_status": player_profile.recruitment_status or "Prospection",
        "service_plan": player_profile.service_plan or "Formule A",
        "acquisition_channel": player_profile.acquisition_channel or "formulaire",
        "intake_period": player_profile.intake_period or "Fall",
    }


@router.get("/universites")
def admin_universities(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
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


def _assert_document_template_in_scope(
    admin_user: models.User, template: models.DocumentTemplate
) -> None:
    agency_id = _agency_scope(admin_user)
    if (
        agency_id is not None
        and template.agency_id is not None
        and template.agency_id != agency_id
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
def admin_document_templates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    query = db.query(models.DocumentTemplate)

    agency_id = _agency_scope(current_user)
    if agency_id is not None:
        query = query.filter(
            (models.DocumentTemplate.agency_id == agency_id)
            | (models.DocumentTemplate.agency_id.is_(None))
        )

    templates = query.order_by(models.DocumentTemplate.id).all()
    items = [_serialize_document_template(template) for template in templates]
    return {"count": len(items), "items": items}


@router.post("/documents")
def create_admin_document_template(
    payload: schemas.AdminDocumentTemplateSave,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    target_universities = _resolve_target_universities(payload.target_university_ids, db)

    template = models.DocumentTemplate(
        agency_id=current_user.agency_id,
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
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)

    template = (
        db.query(models.DocumentTemplate)
        .filter(models.DocumentTemplate.id == template_id)
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Document template not found")

    _assert_document_template_in_scope(current_user, template)
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
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)

    template = (
        db.query(models.DocumentTemplate)
        .filter(models.DocumentTemplate.id == template_id)
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Document template not found")

    _assert_document_template_in_scope(current_user, template)

    db.delete(template)
    db.commit()
    return {"message": "Document template deleted"}


@router.get("/todo")
def admin_todo(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    pending_query = (
        db.query(models.Document, models.PlayerProfile, models.User, models.DocumentTemplate)
        .join(models.PlayerProfile, models.Document.player_id == models.PlayerProfile.id)
        .join(models.User, models.PlayerProfile.user_id == models.User.id)
        .join(
            models.DocumentTemplate,
            models.Document.document_template_id == models.DocumentTemplate.id,
        )
        .filter(models.Document.status == models.DocStatusEnum.PENDING)
    )

    agency_id = _agency_scope(current_user)
    if agency_id is not None:
        pending_query = pending_query.filter(models.User.agency_id == agency_id)

    pending_rows = pending_query.order_by(models.Document.updated_at.asc()).all()
    pending_documents = [
        {
            "document_id": document.id,
            "player_id": player.id,
            "player_name": f"{player.first_name} {player.last_name}",
            "document_template_id": template.id,
            "document_name": template.name,
            "category": template.category,
            "submitted_at": document.updated_at.isoformat() if document.updated_at else None,
        }
        for document, player, user, template in pending_rows
    ]

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

    missing_university_query = (
        db.query(models.PlayerProfile, models.User)
        .join(models.User, models.PlayerProfile.user_id == models.User.id)
        .filter(
            models.User.role == models.RoleEnum.PLAYER,
            models.PlayerProfile.university_id.is_(None),
        )
    )
    if agency_id is not None:
        missing_university_query = missing_university_query.filter(
            models.User.agency_id == agency_id
        )
    players_missing_university = [
        {"player_id": player.id, "player_name": f"{player.first_name} {player.last_name}"}
        for player, user in missing_university_query.all()
    ]

    return {
        "pending_documents": pending_documents,
        "upcoming_milestones": upcoming_milestones,
        "rejected_documents": rejected_documents,
        "ready_players": ready_players,
        "players_missing_university": players_missing_university,
    }


@router.get("/notifications")
def admin_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    notifications = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )
    items = [
        {
            "id": n.id,
            "title": n.title,
            "content": n.content,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "related_document_id": n.related_document_id,
        }
        for n in notifications
    ]
    return {"count": len(items), "items": items}


