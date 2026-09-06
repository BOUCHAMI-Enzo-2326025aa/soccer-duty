from __future__ import annotations

import os
import secrets
import string
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import models

load_dotenv()

# En dev, une valeur par défaut permet à l'appli de tourner sans configuration
# manuelle. En production, SECRET_KEY doit être définie dans l'environnement
# (.env, non commité) — sinon tous les tokens émis seraient forgeables par
# quiconque lit ce fichier source.
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-insecure-secret-change-me")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


# Pas de 0/O/l/1/I : ambigus à recopier depuis un écran ou une note manuscrite.
_TEMP_PASSWORD_LETTERS = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ"
_TEMP_PASSWORD_DIGITS = "23456789"


def generate_temporary_password(length: int = 10) -> str:
    """Mot de passe temporaire aléatoire pour un compte créé par un admin.

    Garantit au moins une lettre et un chiffre (règle appliquée aussi au
    changement de mot de passe côté joueur, voir schemas.ChangePasswordPayload).
    """
    alphabet = _TEMP_PASSWORD_LETTERS + _TEMP_PASSWORD_DIGITS
    while True:
        password = "".join(secrets.choice(alphabet) for _ in range(length))
        has_letter = any(c in _TEMP_PASSWORD_LETTERS for c in password)
        has_digit = any(c in _TEMP_PASSWORD_DIGITS for c in password)
        if has_letter and has_digit:
            return password


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except ValueError:
        # Le hash stocké n'est pas un hash bcrypt valide (ex: ancien mot de
        # passe en clair jamais migré) — on refuse plutôt que de planter.
        return False


def create_access_token(user: models.User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "role": user.role.value,
        "agency_id": user.agency_id,
        "iat": now,
        "exp": now + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée, reconnectez-vous")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    """Dépendance FastAPI : identité réelle déduite du token signé, pas d'un
    paramètre fourni par le client. C'est la brique de base pour verrouiller
    les endpoints progressivement (étape 3) — pas encore branchée partout."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentification requise")

    token = auth_header.removeprefix("Bearer ").strip()
    payload = decode_access_token(token)

    user = db.query(models.User).filter(models.User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user
