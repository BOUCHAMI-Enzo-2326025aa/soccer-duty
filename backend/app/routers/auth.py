from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models
from app import schemas
from app.aiden_bridge import AIDEN_COOKIE_NAME, AIDEN_REFRESH_COOKIE_NAME, get_aiden

router = APIRouter(prefix="/auth", tags=["auth"])
legacy_router = APIRouter(tags=["auth"])


class LogoutResponse(BaseModel):
    message: str


def _login(credentials: schemas.UserLogin, db: Session, response: Response):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()

    if not user or user.hashed_password != credentials.password:
        raise HTTPException(status_code=401, detail="Email or password is incorrect")

    # --- Logique AIDEN : conversion de l'agency_id en tenant (chaîne de caractères) ---
    aiden_tenant = str(user.agency_id) if user.agency_id else "GLOBAL"

    # --- Connexion réelle à AIDEN, en parallèle du login Soccer Duty ---
    # Si l'utilisateur vient d'être créé après le démarrage du serveur, AIDEN ne
    # le connaît pas encore (tant que reset_aiden_identities() n'a pas tourné) :
    # dans ce cas on ignore l'échec, l'IA sera juste indisponible pour cette
    # session jusqu'au prochain login (ou redémarrage du serveur).
    aiden_app = get_aiden()
    code, body = aiden_app.login({"login": user.email, "password": credentials.password})
    if code == 200:
        response.set_cookie(
            key=AIDEN_COOKIE_NAME,
            value=body["access"],
            httponly=True,
            samesite="lax",
            # secure=True,  # à activer dès que le site tourne en HTTPS
        )
        response.set_cookie(
            key=AIDEN_REFRESH_COOKIE_NAME,
            value=body["refresh"],
            httponly=True,
            samesite="lax",
            # secure=True,  # à activer dès que le site tourne en HTTPS
        )

    return {
        "message": "Login successful",
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "tenant": aiden_tenant,
        "token": f"fake_token_for_now_{user.id}",
    }


@router.post("/login")
@router.post("/login/")
def login(credentials: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    return _login(credentials, db, response)


@legacy_router.post("/login/")
def legacy_login(credentials: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    return _login(credentials, db, response)


@router.post("/logout", response_model=LogoutResponse)
def logout(response: Response):
    response.delete_cookie(AIDEN_COOKIE_NAME)
    response.delete_cookie(AIDEN_REFRESH_COOKIE_NAME)
    return {"message": "Logout successful"}


@router.get("/me/{user_id}", response_model=schemas.UserResponse)
def me(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
