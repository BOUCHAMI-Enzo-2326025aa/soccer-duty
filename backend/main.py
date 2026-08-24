from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.database import engine
from app.models import models
from app.routers import admin, agencies, auth, documents, messages, notifications, player, universities, users, aiden_router

# Création des tables (si elles n'existent pas déjà)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Soccer Duty API")


# Filet de sécurité : une exception non attrapée dans une route (ex: SQLite
# "database is locked" le temps d'un accès concurrent) laisse normalement
# Starlette générer sa propre réponse 500 générique via ServerErrorMiddleware,
# qui se situe EN DEHORS de CORSMiddleware — la réponse part donc sans les
# en-têtes CORS, le navigateur la bloque et fetch() échoue avec "Failed to
# fetch" au lieu de montrer la vraie erreur. Un @app.exception_handler(Exception)
# ne suffit pas ici : Starlette le déplace lui aussi dans ServerErrorMiddleware.
# La seule façon de rester à l'intérieur de CORSMiddleware est d'attraper
# l'exception dans un middleware déclaré AVANT lui (l'ordre d'ajout compte :
# le dernier ajouté devient le plus extérieur).
@app.middleware("http")
async def catch_unhandled_exceptions(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        return JSONResponse(
            status_code=500,
            content={"detail": "Erreur interne du serveur. Réessayez dans quelques instants."},
        )


# --- Configuration du CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Autorise uniquement ton Next.js
    allow_credentials=True,
    allow_methods=["*"], # Autorise GET, POST, PUT, DELETE...
    allow_headers=["*"],
)

# --- Fichiers uploadés par les joueurs (stockage local, pas de cloud configuré) ---
# Hors de backend/ volontairement : uvicorn --reload surveille tout son
# répertoire de travail et redémarrait le serveur au moindre fichier
# uploadé, coupant la requête avant que la réponse soit renvoyée.
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

@app.get("/")
def read_root():
    return {"message": "Hello Soccer Duty! Backend is online."}


# Legacy endpoint kept for current frontend compatibility.
app.include_router(auth.router, prefix="")
app.include_router(auth.legacy_router, prefix="")

# Core business routes.
app.include_router(agencies.router)
app.include_router(users.router)
app.include_router(documents.router)
app.include_router(universities.router)
app.include_router(messages.router)
app.include_router(notifications.router)

# Dashboard routes mapped to front navbars.
app.include_router(player.router)
app.include_router(admin.router)

app.include_router(aiden_router.router)