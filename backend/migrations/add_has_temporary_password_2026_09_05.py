"""One-time migration: add users.has_temporary_password (BOOLEAN NOT NULL
DEFAULT 0). Needed before the "create player" admin flow (which sets this
flag on server-generated passwords) and the first-login change-password
prompt can work.

Safe to re-run: skipped if the column already exists.
"""

from __future__ import annotations

import shutil
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "soccer-duty.db"
BACKUP_PATH = ROOT / f"soccer-duty.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db"

sys.path.insert(0, str(ROOT))


def main() -> None:
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.execute("PRAGMA table_info(users)")
        columns = {row[1] for row in cur.fetchall()}
        if "has_temporary_password" in columns:
            print("Column already exists, nothing to do.")
            return

        shutil.copy2(DB_PATH, BACKUP_PATH)
        print(f"Backup created: {BACKUP_PATH}")

        conn.execute(
            "ALTER TABLE users ADD COLUMN has_temporary_password BOOLEAN NOT NULL DEFAULT 0"
        )
        conn.commit()
        print("Column has_temporary_password added.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
