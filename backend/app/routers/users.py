from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models
from app import schemas
from app.security import hash_password, get_current_user
from app.aiden_bridge import reset_aiden_identities

router = APIRouter(prefix="/users", tags=["users"])


def _require_admin(current_user: models.User) -> None:
    if current_user.role not in (models.RoleEnum.ADMIN, models.RoleEnum.SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="Réservé aux administrateurs")


@router.post("/", response_model=schemas.UserResponse)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)

    if current_user.role == models.RoleEnum.ADMIN and (
        user.role != models.RoleEnum.PLAYER
        or user.agency_id != current_user.agency_id
    ):
        raise HTTPException(
            status_code=403,
            detail="Un admin ne peut créer que des joueurs dans sa propre agence",
        )

    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already used")

    db_user = models.User(
        email=user.email,
        hashed_password=hash_password(user.password),
        role=user.role,
        agency_id=user.agency_id,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Sans ça, AIDEN ignore ce compte jusqu'au prochain redémarrage du serveur
    # (son IdentityStore n'est chargé qu'une fois, au premier appel).
    reset_aiden_identities()
    return db_user


@router.get("/", response_model=list[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    query = db.query(models.User)
    if current_user.role == models.RoleEnum.ADMIN and current_user.agency_id is not None:
        query = query.filter(models.User.agency_id == current_user.agency_id)
    return query.all()


@router.get("/{user_id}", response_model=schemas.UserResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    _require_admin(current_user)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if (
        current_user.role == models.RoleEnum.ADMIN
        and current_user.agency_id is not None
        and user.agency_id != current_user.agency_id
    ):
        raise HTTPException(status_code=403, detail="User is outside your agency")
    return user
