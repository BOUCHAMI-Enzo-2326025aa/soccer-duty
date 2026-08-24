from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from .models.models import Base

# 1. On dit à SQLAlchemy de créer un fichier "soccer-duty.db" à la racine
SQLALCHEMY_DATABASE_URL = "sqlite:///./soccer-duty.db"

# 2. Création du moteur (connect_args est une sécurité nécessaire pour SQLite avec FastAPI)
# timeout plus élevé : SQLite n'autorise qu'un seul writer à la fois. Le
# défaut (5s) suffit pour un simple script, mais avec plusieurs connexions
# ouvertes en parallèle (dev server + requêtes concurrentes), une écriture
# peut échouer avec "database is locked" avant que l'autre connexion ait
# fini. 10s laisse un peu de marge sans bloquer trop longtemps un démarrage.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 10},
)


# WAL (Write-Ahead Logging) : les lecteurs ne bloquent plus les écrivains et
# inversement, ce qui réduit les erreurs "database is locked" quand plusieurs
# connexions accèdent au fichier en même temps. Non bloquant volontairement :
# si une autre connexion empêche le changement de mode à cet instant précis,
# on ignore et on continue (le mode WAL, une fois activé, est persisté dans
# le fichier .db et n'a pas besoin d'être redemandé à chaque connexion) —
# sinon un démarrage qui tombe sur un verrou transitoire plante toute
# l'application au lieu de simplement servir en mode par défaut.
@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=10000")
    except Exception:
        pass
    finally:
        cursor.close()

# 3. Création de la Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Fonction pour obtenir la base de données
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()