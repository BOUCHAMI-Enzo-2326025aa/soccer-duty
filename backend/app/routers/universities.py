from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models
from app.security import get_current_user

router = APIRouter(prefix="/universities", tags=["universities"])


class UniversityCreate(BaseModel):
    name: str
    state: str | None = None
    division: str | None = None
    logo: str | None = None
    address: str | None = None
    city: str | None = None
    website: str | None = None
    conference: str | None = None
    contact_email: str | None = None


@router.post("/")
def create_university(
    payload: UniversityCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in (models.RoleEnum.ADMIN, models.RoleEnum.SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="Réservé aux administrateurs")

    item = models.University(
        name=payload.name,
        state=payload.state,
        division=payload.division,
        logo=payload.logo,
        address=payload.address,
        city=payload.city,
        website=payload.website,
        conference=payload.conference,
        contact_email=payload.contact_email,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item
