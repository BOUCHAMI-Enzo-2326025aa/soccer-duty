from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    content: str


@router.post("/")
def create_notification(payload: NotificationCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    notif = models.Notification(
        user_id=payload.user_id,
        title=payload.title,
        content=payload.content,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.get("/user/{user_id}")
def get_user_notifications(user_id: int, db: Session = Depends(get_db)):
    items = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == user_id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )
    return {"count": len(items), "items": items}


@router.patch("/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db)):
    notif = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.is_read = True
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
