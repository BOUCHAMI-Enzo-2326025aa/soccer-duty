from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models

router = APIRouter(prefix="/player", tags=["player"])


def _get_applicable_document_templates(
    profile: models.PlayerProfile, db: Session
) -> list[models.DocumentTemplate]:
    agency_id = profile.user.agency_id if profile.user else None

    generic = (
        db.query(models.DocumentTemplate)
        .filter(
            models.DocumentTemplate.application_scope
            == models.ApplicationScopeEnum.GENERIC,
            or_(
                models.DocumentTemplate.agency_id.is_(None),
                models.DocumentTemplate.agency_id == agency_id,
            ),
        )
        .all()
    )

    specific: list[models.DocumentTemplate] = []
    if profile.university_id is not None:
        specific = (
            db.query(models.DocumentTemplate)
            .join(models.DocumentTemplate.target_universities)
            .filter(
                models.DocumentTemplate.application_scope
                == models.ApplicationScopeEnum.SPECIFIC,
                models.University.id == profile.university_id,
                or_(
                    models.DocumentTemplate.agency_id.is_(None),
                    models.DocumentTemplate.agency_id == agency_id,
                ),
            )
            .all()
        )

    return generic + specific


def _serialize_player_document(
    template: models.DocumentTemplate, document: models.Document | None
) -> dict:
    delays = [
        template.delay_appointment_days,
        template.delay_completion_days,
        template.delay_processing_days,
    ]
    delay_total_days = (
        sum(delay or 0 for delay in delays) if any(delay is not None for delay in delays) else None
    )

    return {
        "document_template_id": template.id,
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
        "document_id": document.id if document else None,
        "status": document.status if document else models.DocStatusEnum.MISSING,
        "file_url": document.s3_url if document else None,
        "admin_comment": document.admin_comment if document else None,
        "updated_at": document.updated_at.isoformat()
        if document and document.updated_at
        else None,
    }


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
