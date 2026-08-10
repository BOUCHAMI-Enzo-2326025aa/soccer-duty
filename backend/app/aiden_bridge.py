"""
Pont entre Soccer Duty et AIDEN.

À placer dans : backend/app/aiden_bridge.py

Construit AIDEN une seule fois (singleton), peuple son IdentityStore depuis
la base Soccer Duty (table users), et branche le vrai LLM (+ l'OCR si les
dépendances Tesseract sont installées).

Prérequis : le package `aiden` doit être installable dans ton environnement.
Depuis le dossier extrait du zip (celui qui contient pyproject.toml) :

    cd backend   # ou l'endroit où vit ton venv
    pip install -e /chemin/vers/aiden

Variables d'environnement attendues (.env, à ne JAMAIS committer) :
    AIDEN_ENV=dev                 # ou prod
    AIDEN_TOKEN_SECRET=...        # secrets.token_urlsafe(48), obligatoire en prod
    AIDEN_CONTEXT_SECRET=...      # idem
    AIDEN_PERSISTENCE=sqlite
    AIDEN_DB_PATH=./aiden.db
    ANTHROPIC_API_KEY=sk-ant-...  # ou OPENAI_API_KEY
"""
from __future__ import annotations

from app.database import SessionLocal
from app.models import models

from aiden.config import load_config
from aiden.api.gateway_server import AidenApp
from aiden.api.identity import IdentityStore
from aiden.engines.prompt.real_providers import install_real_llm

try:
    from aiden.engines.ocr.tesseract_provider import install_tesseract
except ImportError:  # Tesseract pas installé : pas grave, OCR reste simulé.
    install_tesseract = None


# ---------------------------------------------------------------------------
# Mapping du modèle de rôles Soccer Duty -> rôles attendus par AIDEN
# (AIDEN connaît aussi DEVELOPER, SUPPORT, AI, non utilisés ici pour l'instant)
# ---------------------------------------------------------------------------
ROLE_MAP: dict[models.RoleEnum, str] = {
    models.RoleEnum.SUPER_ADMIN: "SUPER_ADMIN",
    models.RoleEnum.ADMIN: "ADMIN",
    models.RoleEnum.PLAYER: "PLAYER",
}

# Valeur de tenant de repli pour les comptes sans agence (ex. Super Admin).
# AIDEN exige une chaîne non vide pour le tenant.
GLOBAL_TENANT = "GLOBAL"

# Nom du cookie qui portera le token d'accès AIDEN (posé au login, voir auth.py)
AIDEN_COOKIE_NAME = "aiden_access"

# Nom du cookie qui portera le refresh token AIDEN, utilisé pour réémettre un
# access token sans repasser par le login (voir routers/aiden_router.py).
AIDEN_REFRESH_COOKIE_NAME = "aiden_refresh"


_app: AidenApp | None = None


def _build_identity_store() -> IdentityStore:
    """Recharge tous les utilisateurs Soccer Duty dans un IdentityStore AIDEN."""
    identities = IdentityStore()
    db = SessionLocal()
    try:
        for user in db.query(models.User).all():
            tenant = str(user.agency_id) if user.agency_id is not None else GLOBAL_TENANT
            role = ROLE_MAP.get(user.role, "PLAYER")
            identities.add(
                login=user.email,
                # TODO SÉCURITÉ : `hashed_password` contient aujourd'hui le mot de
                # passe EN CLAIR (voir auth.py : comparaison directe, pas de hash).
                # IdentityStore le hache lui-même en SHA-256 en interne, donc ça
                # fonctionne pour l'instant. Le jour où hashed_password devient un
                # vrai hash bcrypt/argon2, il faudra arrêter de le repasser ici et
                # déléguer la vérification à ton système existant (voir le guide,
                # étape 2 : "Note importante sur les mots de passe").
                password=user.hashed_password,
                tenant=tenant,
                roles=[role],
            )
    finally:
        db.close()
    return identities


def get_aiden() -> AidenApp:
    """Retourne l'instance AIDEN, en la construisant au premier appel (singleton)."""
    global _app
    if _app is None:
        cfg = load_config()
        _app = AidenApp(
            persistence=cfg.persistence,
            db_path=cfg.db_path,
            identities=_build_identity_store(),
            token_secret=cfg.token_secret,
            context_secret=cfg.context_secret,
            allow_demo_users=False,
        )
        resultat_llm = install_real_llm(_app.gateway._orch)
        print(f"[AIDEN] LLM réel : {resultat_llm}")
        if install_tesseract is not None:
            install_tesseract(_app.gateway._orch)
            print("[AIDEN] OCR Tesseract activé")
        else:
            print("[AIDEN] Tesseract non installé -> OCR simulé")
    return _app


def reset_aiden_identities() -> None:
    """
    À appeler après la création/modification d'un utilisateur Soccer Duty,
    pour qu'AIDEN connaisse le compte sans redémarrer le serveur.
    Voir users.py : à ajouter après chaque db.commit() sur un User.
    """
    app = get_aiden()
    app.identities = _build_identity_store()
