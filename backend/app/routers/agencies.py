from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models
from app import schemas
from app.security import get_current_user

router = APIRouter(prefix="/agencies", tags=["agencies"])


def _require_super_admin(current_user: models.User) -> None:
    if current_user.role != models.RoleEnum.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Réservé aux super-administrateurs")


@router.post("/", response_model=schemas.AgencyResponse)
def create_agency(
    agency: schemas.AgencyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_super_admin(current_user)
    db_agency = models.Agency(name=agency.name)
    db.add(db_agency)
    db.commit()
    db.refresh(db_agency)
    return db_agency


@router.get("/", response_model=list[schemas.AgencyResponse])
def get_agencies(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_super_admin(current_user)
    return db.query(models.Agency).all()


@router.get("/{agency_id}", response_model=schemas.AgencyResponse)
def get_agency(
    agency_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_super_admin(current_user)
    agency = db.query(models.Agency).filter(models.Agency.id == agency_id).first()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency


@router.get("/{agency_id}/users", response_model=list[schemas.UserResponse])
def get_agency_users(
    agency_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_super_admin(current_user)
    return db.query(models.User).filter(models.User.agency_id == agency_id).all()
