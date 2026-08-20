from __future__ import annotations

import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "soccer-duty.db"
BACKUP_PATH = ROOT / f"soccer-duty.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db"

NEW_COLUMNS = {
    "logo": "TEXT",
    "address": "TEXT",
    "city": "TEXT",
    "website": "TEXT",
    "conference": "TEXT",
    "contact_email": "TEXT",
}


def get_existing_columns(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute("PRAGMA table_info(universities)").fetchall()
    return {row[1] for row in rows}


def main() -> None:
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found: {DB_PATH}")

    shutil.copy2(DB_PATH, BACKUP_PATH)
    print(f"Backup created: {BACKUP_PATH}")

    conn = sqlite3.connect(DB_PATH)
    try:
        existing_columns = get_existing_columns(conn)

        for column_name, column_type in NEW_COLUMNS.items():
            if column_name in existing_columns:
                print(f"Skipping existing column: {column_name}")
                continue

            sql = f"ALTER TABLE universities ADD COLUMN {column_name} {column_type};"
            conn.execute(sql)
            print(f"Added column: {column_name}")

        conn.commit()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
