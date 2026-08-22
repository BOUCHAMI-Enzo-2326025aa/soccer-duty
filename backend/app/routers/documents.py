from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 Mo


class DocumentCreate(BaseModel):
    player_id: int
    document_template_id: int
    s3_url: str | None = None


class DocumentStatusUpdate(BaseModel):
    status: models.DocStatusEnum


@router.post("/")
def create_document(payload: DocumentCreate, db: Session = Depends(get_db)):
    player = db.query(models.PlayerProfile).filter(models.PlayerProfile.id == payload.player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player profile not found")

    template = (
        db.query(models.DocumentTemplate)
        .filter(models.DocumentTemplate.id == payload.document_template_id)
        .first()
    )
    if not template:
        raise HTTPException(status_code=404, detail="Document template not found")

    document = models.Document(
        player_id=payload.player_id,
        document_template_id=payload.document_template_id,
        s3_url=payload.s3_url,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.post("/upload")
async def upload_document(
    user_id: int = Form(...),
    document_template_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    from app.routers.player import _get_applicable_document_templates

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
    return document


@router.get("/player/{player_id}")
def get_player_documents(player_id: int, db: Session = Depends(get_db)):
    docs = db.query(models.Document).filter(models.Document.player_id == player_id).all()
    return {"count": len(docs), "items": docs}


@router.patch("/{document_id}/status")
def update_document_status(
    document_id: int,
    payload: DocumentStatusUpdate,
    db: Session = Depends(get_db),
):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    document.status = payload.status
    db.add(document)
    db.commit()
    db.refresh(document)
    return document
