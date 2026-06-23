from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, get_db
from app.models import models
from app import schemas

# Création des tables (si elles n'existent pas déjà)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Soccer Duty API")

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
    return {"message": "Hello Soccer Duty! Le backend est en ligne 🚀"}

# --- NOUVELLE ROUTE : Créer une agence ---
@app.post("/agencies/", response_model=schemas.AgencyResponse)
def create_agency(agency: schemas.AgencyCreate, db: Session = Depends(get_db)):
    # 1. On prépare la donnée pour la base de données
    db_agency = models.Agency(name=agency.name)
    
    # 2. On l'ajoute et on sauvegarde
    db.add(db_agency)
    db.commit()
    db.refresh(db_agency)
    
    # 3. On renvoie l'agence créée
    return db_agency

# --- NOUVELLE ROUTE : Lire toutes les agences ---
@app.get("/agencies/", response_model=list[schemas.AgencyResponse])
def get_agencies(db: Session = Depends(get_db)):
    # On va chercher toutes les agences dans la table
    agencies = db.query(models.Agency).all()
    return agencies

# --- ROUTE : Créer un Utilisateur ---
@app.post("/users/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. On vérifie si un utilisateur possède déjà cet email
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    # 2. Si c'est le cas, on lève une erreur propre (Code 400 : Mauvaise requête)
    if existing_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé.")

    # 3. S'il n'existe pas, on le crée normalement
    db_user = models.User(
        email=user.email,
        hashed_password=user.password, 
        role=user.role,
        agency_id=user.agency_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- ROUTE : Créer un Modèle de Document pour une Agence ---
# Note l'URL RESTful : on met l'ID de l'agence directement dans l'URL !
@app.post("/agencies/{agency_id}/templates/", response_model=schemas.DocumentTemplateResponse)
def create_document_template(agency_id: int, template: schemas.DocumentTemplateCreate, db: Session = Depends(get_db)):
    db_template = models.DocumentTemplate(
        agency_id=agency_id,
        name=template.name,
        category=template.category,
        description_for_player=template.description_for_player,
        is_required_by_default=template.is_required_by_default,
        ai_validation_rules=template.ai_validation_rules
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template

@app.post("/login/")
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    # 1. On cherche l'utilisateur par son email
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    
    # 2. On vérifie si l'utilisateur existe ET si le mot de passe correspond
    # (Actuellement, on vérifie en texte brut, on cryptera ça plus tard pour la prod)
    if not user or user.hashed_password != user_credentials.password:
        raise HTTPException(
            status_code=401, 
            detail="Email ou mot de passe incorrect"
        )
    
    # 3. Si tout est bon, on renvoie un "feu vert" avec le rôle pour que Next.js sache où le rediriger
    return {
        "message": "Connexion réussie",
        "user_id": user.id,
        "email": user.email,
        "role": user.role,
        "token": f"fake_token_pour_le_moment_{user.id}" 
    }