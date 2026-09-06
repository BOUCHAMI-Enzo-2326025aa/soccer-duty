"""One-time migration: hash every plaintext password currently stored in
users.hashed_password. Must run before deploying the new login verification
(app/security.py), otherwise no existing account can log in.

Safe to re-run: any value that already looks like a bcrypt hash is skipped.
"""

from __future__ import annotations

import shutil
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "soccer-duty.db"
BACKUP_PATH = ROOT / f"soccer-duty.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db"

sys.path.insert(0, str(ROOT))

from app.database import SessionLocal  # noqa: E402
from app.models import models  # noqa: E402
from app.security import hash_password  # noqa: E402

BCRYPT_PREFIXES = ("$2a$", "$2b$", "$2y$")


def main() -> None:
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found: {DB_PATH}")

    shutil.copy2(DB_PATH, BACKUP_PATH)
    print(f"Backup created: {BACKUP_PATH}")

    db = SessionLocal()
    try:
        users = db.query(models.User).all()
        migrated = 0
        skipped = 0

        for user in users:
            if user.hashed_password.startswith(BCRYPT_PREFIXES):
                skipped += 1
                continue

            user.hashed_password = hash_password(user.hashed_password)
            migrated += 1

        db.commit()
        print(f"Migrated: {migrated}")
        print(f"Already hashed (skipped): {skipped}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
