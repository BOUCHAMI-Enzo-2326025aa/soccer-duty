from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models
from app import schemas

router = APIRouter(prefix="/auth", tags=["auth"])
legacy_router = APIRouter(tags=["auth"])


class LogoutResponse(BaseModel):
    message: str


def _login(credentials: schemas.UserLogin, db: Session):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()

    if not user or user.hashed_password != credentials.password:
        raise HTTPException(status_code=401, detail="Email or password is incorrect")

    return {
        "message": "Login successful",
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "token": f"fake_token_for_now_{user.id}",
    }


@router.post("/login")
@router.post("/login/")
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    return _login(credentials, db)


@legacy_router.post("/login/")
def legacy_login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    return _login(credentials, db)


@router.post("/logout", response_model=LogoutResponse)
def logout():
    return {"message": "Logout successful"}


@router.get("/me/{user_id}", response_model=schemas.UserResponse)
def me(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
