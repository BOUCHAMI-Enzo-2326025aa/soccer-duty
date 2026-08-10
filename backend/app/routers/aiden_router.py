"""
Router AIDEN pour Soccer Duty.

À placer dans : backend/app/routers/aiden.py
Puis, dans main.py, ajouter :
    from app.routers import aiden
    app.include_router(aiden.router)

Et dans app/routers/__init__.py, ajouter "aiden" à l'import et à __all__.

Le token AIDEN vit dans un cookie httpOnly, jamais exposé au frontend en JS
(voir la modification de auth.py livrée à part : le cookie est posé
automatiquement au login existant de Soccer Duty).

Toutes les opérations passent par POST /aiden/{operation}, par exemple :
    await fetch("/aiden/ai/generate", { method: "POST", credentials: "include",
                                         body: JSON.stringify({ ... }) })
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, Response

from app.aiden_bridge import AIDEN_COOKIE_NAME, AIDEN_REFRESH_COOKIE_NAME, get_aiden

router = APIRouter(prefix="/aiden", tags=["aiden"])


def _set_aiden_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie(key=AIDEN_COOKIE_NAME, value=access, httponly=True, samesite="lax")
    response.set_cookie(key=AIDEN_REFRESH_COOKIE_NAME, value=refresh, httponly=True, samesite="lax")


def _try_refresh(request: Request, response: Response) -> str | None:
    """Échange le refresh token AIDEN contre un nouvel access token.

    Renvoie None si le refresh échoue (cookie absent, ou session inconnue —
    par ex. après un redémarrage du serveur, qui vide le suivi de session en
    mémoire côté AIDEN) : l'appelant doit alors répondre 401 pour forcer un
    nouveau login.
    """
    refresh_token = request.cookies.get(AIDEN_REFRESH_COOKIE_NAME)
    if not refresh_token:
        return None

    app = get_aiden()
    code, body = app.refresh({"refresh": refresh_token})
    if code != 200 or "access" not in body:
        return None

    _set_aiden_cookies(response, body["access"], body["refresh"])
    return body["access"]


@router.post("/logout")
def aiden_logout(request: Request):
    """Le logout AIDEN proprement dit (les cookies sont supprimés côté auth.py)."""
    return {"message": "ok"}


@router.post("/{operation:path}")
def aiden_proxy(operation: str, payload: dict, request: Request, response: Response):
    """
    Relaie n'importe quelle opération AIDEN (ai/generate, review, workflow,
    analytics, product, inbox-zero/digest, etc.) — voir INTERFACES.pdf pour
    la liste complète des routes et de leurs payloads attendus.

    Si l'access token est absent ou expiré, on tente un refresh transparent
    via le cookie aiden_refresh avant d'abandonner en 401.
    """
    app = get_aiden()
    token = request.cookies.get(AIDEN_COOKIE_NAME)

    if not token:
        token = _try_refresh(request, response)
        if not token:
            raise HTTPException(status_code=401, detail="non connecté à AIDEN")

    code, body = app._op(token, f"/v1/{operation}", operation, payload or {})

    if code == 401:
        token = _try_refresh(request, response)
        if token:
            code, body = app._op(token, f"/v1/{operation}", operation, payload or {})

    if code >= 400:
        raise HTTPException(status_code=code, detail=body)
    return body
