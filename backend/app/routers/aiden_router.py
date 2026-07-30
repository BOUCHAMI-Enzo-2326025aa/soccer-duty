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

from fastapi import APIRouter, HTTPException, Request

from app.aiden_bridge import AIDEN_COOKIE_NAME, get_aiden

router = APIRouter(prefix="/aiden", tags=["aiden"])


@router.post("/logout")
def aiden_logout(request: Request):
    """Le logout AIDEN proprement dit (le cookie est supprimé côté auth.py)."""
    return {"message": "ok"}


@router.post("/{operation:path}")
def aiden_proxy(operation: str, payload: dict, request: Request):
    """
    Relaie n'importe quelle opération AIDEN (ai/generate, review, workflow,
    analytics, product, inbox-zero/digest, etc.) — voir INTERFACES.pdf pour
    la liste complète des routes et de leurs payloads attendus.
    """
    token = request.cookies.get(AIDEN_COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="non connecté à AIDEN")

    app = get_aiden()
    code, body = app._op(token, f"/v1/{operation}", operation, payload or {})
    if code >= 400:
        raise HTTPException(status_code=code, detail=body)
    return body
