from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models
from app.security import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])


def _get_own_notification_or_404(
    notification_id: int, current_user: models.User, db: Session
) -> models.Notification:
    notif = (
        db.query(models.Notification)
        .filter(models.Notification.id == notification_id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notif.user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Cette notification ne vous appartient pas"
        )
    return notif


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    notif = _get_own_notification_or_404(notification_id, current_user, db)
    notif.is_read = True
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@router.patch("/{notification_id}/unread")
def mark_notification_unread(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    notif = _get_own_notification_or_404(notification_id, current_user, db)
    notif.is_read = False
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
