from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models

router = APIRouter(prefix="/messages", tags=["messages"])


class ConversationCreate(BaseModel):
    player_profile_id: int
    agency_id: int


class MessageCreate(BaseModel):
    sender_id: int
    content: str


@router.post("/conversations")
def create_conversation(payload: ConversationCreate, db: Session = Depends(get_db)):
    conversation = models.Conversation(
        player_profile_id=payload.player_profile_id,
        agency_id=payload.agency_id,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conversation = (
        db.query(models.Conversation)
        .filter(models.Conversation.id == conversation_id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == conversation_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )
    return {"conversation": conversation, "messages": messages}


@router.post("/conversations/{conversation_id}")
def post_message(
    conversation_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(models.Conversation)
        .filter(models.Conversation.id == conversation_id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg = models.Message(
        conversation_id=conversation_id,
        sender_id=payload.sender_id,
        content=payload.content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/player/{player_profile_id}")
def get_player_conversations(player_profile_id: int, db: Session = Depends(get_db)):
    items = (
        db.query(models.Conversation)
        .filter(models.Conversation.player_profile_id == player_profile_id)
        .order_by(models.Conversation.created_at.desc())
        .all()
    )
    return {"count": len(items), "items": items}
