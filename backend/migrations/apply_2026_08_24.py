from __future__ import annotations

import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "soccer-duty.db"
BACKUP_PATH = ROOT / f"soccer-duty.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db"

NEW_COLUMNS = {
    "documents": {
        "admin_comment": "TEXT",
        "reviewed_by": "INTEGER REFERENCES users(id)",
        "reviewed_at": "DATETIME",
    },
    "notifications": {
        "related_document_id": "INTEGER REFERENCES documents(id)",
    },
}


def get_existing_columns(conn: sqlite3.Connection, table: str) -> set[str]:
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return {row[1] for row in rows}


def main() -> None:
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found: {DB_PATH}")

    shutil.copy2(DB_PATH, BACKUP_PATH)
    print(f"Backup created: {BACKUP_PATH}")

    conn = sqlite3.connect(DB_PATH)
    try:
        for table, columns in NEW_COLUMNS.items():
            existing_columns = get_existing_columns(conn, table)
            for column_name, column_type in columns.items():
                if column_name in existing_columns:
                    print(f"Skipping existing column: {table}.{column_name}")
                    continue

                sql = f"ALTER TABLE {table} ADD COLUMN {column_name} {column_type};"
                conn.execute(sql)
                print(f"Added column: {table}.{column_name}")

        conn.commit()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
