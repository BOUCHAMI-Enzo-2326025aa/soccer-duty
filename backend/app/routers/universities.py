from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models

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
def create_university(payload: UniversityCreate, db: Session = Depends(get_db)):
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


@router.get("/")
def list_universities(db: Session = Depends(get_db)):
    items = db.query(models.University).all()
    return {"count": len(items), "items": items}


@router.get("/{university_id}")
def get_university(university_id: int, db: Session = Depends(get_db)):
    item = db.query(models.University).filter(models.University.id == university_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="University not found")
    return item
