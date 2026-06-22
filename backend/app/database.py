from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models.models import Base

# 1. On dit à SQLAlchemy de créer un fichier "soccer-duty.db" à la racine
SQLALCHEMY_DATABASE_URL = "sqlite:///./soccer-duty.db"

# 2. Création du moteur (connect_args est une sécurité nécessaire pour SQLite avec FastAPI)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 3. Création de la Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Fonction pour obtenir la base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()