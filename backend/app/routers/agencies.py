from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models
from app import schemas

router = APIRouter(prefix="/agencies", tags=["agencies"])


@router.post("/", response_model=schemas.AgencyResponse)
def create_agency(agency: schemas.AgencyCreate, db: Session = Depends(get_db)):
    db_agency = models.Agency(name=agency.name)
    db.add(db_agency)
    db.commit()
    db.refresh(db_agency)
    return db_agency


@router.get("/", response_model=list[schemas.AgencyResponse])
def get_agencies(db: Session = Depends(get_db)):
    return db.query(models.Agency).all()


@router.get("/{agency_id}", response_model=schemas.AgencyResponse)
def get_agency(agency_id: int, db: Session = Depends(get_db)):
    agency = db.query(models.Agency).filter(models.Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency


@router.get("/{agency_id}/users", response_model=list[schemas.UserResponse])
def get_agency_users(agency_id: int, db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.agency_id == agency_id).all()


@router.post("/{agency_id}/templates/", response_model=schemas.DocumentTemplateResponse)
def create_document_template(
    agency_id: int,
    template: schemas.DocumentTemplateCreate,
    db: Session = Depends(get_db),
):
    agency = db.query(models.Agency).filter(models.Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")

    db_template = models.DocumentTemplate(
        agency_id=agency_id,
        name=template.name,
        category=template.category,
        description_for_player=template.description_for_player,
        is_required_by_default=template.is_required_by_default,
        ai_validation_rules=template.ai_validation_rules,
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template
