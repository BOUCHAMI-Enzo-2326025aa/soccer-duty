from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models

router = APIRouter(prefix="/documents", tags=["documents"])


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
