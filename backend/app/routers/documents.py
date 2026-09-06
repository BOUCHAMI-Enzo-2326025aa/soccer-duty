from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models
from app.security import get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])

# Hors du dossier backend/ : uvicorn --reload surveille récursivement son
# répertoire de travail (backend/) et redémarre le serveur à la moindre
# écriture détectée dedans, ce qui coupait la requête d'upload en plein vol
# (fichier bien écrit sur disque mais réponse jamais renvoyée au client).
UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 Mo


class DocumentReviewUpdate(BaseModel):
    status: Literal["VALIDATED", "REJECTED"]
    admin_comment: str | None = None


def _notify_agency_admins_of_pending_document(
    document: models.Document,
    template: models.DocumentTemplate,
    profile: models.PlayerProfile,
    db: Session,
) -> None:
    agency_id = profile.user.agency_id if profile.user else None
    if agency_id is None:
        return

    admins = (
        db.query(models.User)
        .filter(
            models.User.role == models.RoleEnum.ADMIN,
            models.User.agency_id == agency_id,
        )
        .all()
    )
    for admin in admins:
        db.add(
            models.Notification(
                user_id=admin.id,
                title="Document en attente de validation",
                content=f"{profile.first_name} {profile.last_name} a envoyé « {template.name} ».",
                related_document_id=document.id,
            )
        )
    if admins:
        db.commit()


@router.post("/upload")
async def upload_document(
    user_id: int = Form(...),
    document_template_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    from app.routers.player import _get_applicable_document_templates

    if current_user.id != user_id:
        raise HTTPException(
            status_code=403, detail="Vous ne pouvez envoyer un document que pour vous-même"
        )

    profile = (
        db.query(models.PlayerProfile)
        .filter(models.PlayerProfile.user_id == user_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Player profile not found")

    applicable_templates = _get_applicable_document_templates(profile, db)
    if not any(template.id == document_template_id for template in applicable_templates):
        raise HTTPException(
            status_code=403, detail="Document not applicable to this player"
        )

    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, detail="Format non supporté (PDF, JPG, PNG uniquement)"
        )

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (10 Mo max)")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_filename = f"{uuid4().hex}{extension}"
    (UPLOAD_DIR / stored_filename).write_bytes(contents)
    file_url = f"/uploads/{stored_filename}"

    document = (
        db.query(models.Document)
        .filter(
            models.Document.player_id == profile.id,
            models.Document.document_template_id == document_template_id,
        )
        .first()
    )
    if document:
        document.s3_url = file_url
        document.status = models.DocStatusEnum.PENDING
    else:
        document = models.Document(
            player_id=profile.id,
            document_template_id=document_template_id,
            s3_url=file_url,
            status=models.DocStatusEnum.PENDING,
        )
        db.add(document)

    db.commit()
    db.refresh(document)

    matched_template = next(
        template for template in applicable_templates if template.id == document_template_id
    )
    _notify_agency_admins_of_pending_document(document, matched_template, profile, db)

    # Le commit fait par la notification ci-dessus expire les attributs de
    # `document` (comportement par défaut de SQLAlchemy) : sans ce refresh,
    # la sérialisation de la réponse tombe sur un objet vide.
    db.refresh(document)
    return document


def _get_document_or_404(document_id: int, db: Session) -> models.Document:
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document


def _assert_admin_can_review(admin_user: models.User, document: models.Document, db: Session) -> None:
    if admin_user.role not in (models.RoleEnum.ADMIN, models.RoleEnum.SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="Réservé aux administrateurs")

    if admin_user.role != models.RoleEnum.ADMIN or admin_user.agency_id is None:
        return

    player = (
        db.query(models.PlayerProfile)
        .filter(models.PlayerProfile.id == document.player_id)
        .first()
    )
    player_agency_id = player.user.agency_id if player and player.user else None
    if player_agency_id != admin_user.agency_id:
        raise HTTPException(status_code=403, detail="Document is outside your agency")


def _notify_player_of_document_review(
    document: models.Document,
    template: models.DocumentTemplate,
    player: models.PlayerProfile,
    db: Session,
) -> None:
    if not player.user_id:
        return

    if document.status == models.DocStatusEnum.VALIDATED:
        title = "Document validé ✅"
        outcome = "validé"
    else:
        title = "Document refusé ❌"
        outcome = "refusé"

    content = f"Votre document « {template.name} » a été {outcome}."
    if document.admin_comment:
        content += f" Commentaire : {document.admin_comment}"

    db.add(
        models.Notification(
            user_id=player.user_id,
            title=title,
            content=content,
            related_document_id=document.id,
        )
    )
    db.commit()


def _serialize_document_review(document: models.Document, db: Session) -> dict:
    player = (
        db.query(models.PlayerProfile)
        .filter(models.PlayerProfile.id == document.player_id)
        .first()
    )
    template = (
        db.query(models.DocumentTemplate)
        .filter(models.DocumentTemplate.id == document.document_template_id)
        .first()
    )

    return {
        "document_id": document.id,
        "status": document.status,
        "file_url": document.s3_url,
        "admin_comment": document.admin_comment,
        "reviewed_by": document.reviewed_by,
        "reviewed_at": document.reviewed_at.isoformat() if document.reviewed_at else None,
        "submitted_at": document.updated_at.isoformat() if document.updated_at else None,
        "player_id": player.id if player else None,
        "player_name": f"{player.first_name} {player.last_name}" if player else None,
        "document_template_id": template.id if template else None,
        "document_name": template.name if template else None,
        "category": template.category if template else None,
        "description_for_player": template.description_for_player if template else None,
        "external_url": template.external_url if template else None,
    }


@router.get("/{document_id}")
def get_document_detail(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    document = _get_document_or_404(document_id, db)
    _assert_admin_can_review(current_user, document, db)

    # Marque comme lues les notifications liées, côté admin qui consulte —
    # ouvrir la fiche compte comme avoir pris connaissance, indépendamment
    # de la décision (valider/refuser) qui viendra plus tard ou pas.
    db.query(models.Notification).filter(
        models.Notification.related_document_id == document_id,
        models.Notification.user_id == current_user.id,
        models.Notification.is_read.is_(False),
    ).update({"is_read": True})
    db.commit()

    return _serialize_document_review(document, db)


@router.patch("/{document_id}/review")
def review_document(
    document_id: int,
    payload: DocumentReviewUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    document = _get_document_or_404(document_id, db)
    _assert_admin_can_review(current_user, document, db)

    document.status = models.DocStatusEnum[payload.status]
    document.admin_comment = payload.admin_comment
    document.reviewed_by = current_user.id
    document.reviewed_at = datetime.now(timezone.utc)

    db.query(models.Notification).filter(
        models.Notification.related_document_id == document_id,
        models.Notification.is_read.is_(False),
    ).update({"is_read": True})

    db.commit()
    db.refresh(document)

    player = (
        db.query(models.PlayerProfile)
        .filter(models.PlayerProfile.id == document.player_id)
        .first()
    )
    template = (
        db.query(models.DocumentTemplate)
        .filter(models.DocumentTemplate.id == document.document_template_id)
        .first()
    )
    if player and template:
        _notify_player_of_document_review(document, template, player, db)

    # Le commit de la notification ci-dessus expire à nouveau les attributs
    # de `document` (même piège que pour l'upload) : sans ce refresh, la
    # sérialisation retomberait sur des valeurs vides.
    db.refresh(document)
    return _serialize_document_review(document, db)
