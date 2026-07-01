from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.models import models
from app.routers import admin, agencies, auth, documents, messages, notifications, player, universities, users

# Création des tables (si elles n'existent pas déjà)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Soccer Duty API")

# --- Configuration du CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Autorise uniquement ton Next.js
    allow_credentials=True,
    allow_methods=["*"], # Autorise GET, POST, PUT, DELETE...
    allow_headers=["*"],
)

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