from __future__ import annotations

import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "soccer-duty.db"
BACKUP_PATH = ROOT / f"soccer-duty.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db"

NEW_COLUMNS = {
    "external_url": "TEXT",
    "application_scope": "TEXT",
    "delay_appointment_days": "INTEGER",
    "delay_completion_days": "INTEGER",
    "delay_processing_days": "INTEGER",
}

CATEGORY_FIXUPS = {
    "IDENTITY": "IDENTITE",
    "ACADEMIC": "ACADEMIQUE",
}

CREATE_JUNCTION_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS document_template_universities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_template_id INTEGER NOT NULL REFERENCES document_templates(id),
    university_id INTEGER NOT NULL REFERENCES universities(id)
);
"""


def get_existing_columns(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute("PRAGMA table_info(document_templates)").fetchall()
    return {row[1] for row in rows}


def main() -> None:
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found: {DB_PATH}")

    shutil.copy2(DB_PATH, BACKUP_PATH)
    print(f"Backup created: {BACKUP_PATH}")

    conn = sqlite3.connect(DB_PATH)
    try:
        for old_value, new_value in CATEGORY_FIXUPS.items():
            cursor = conn.execute(
                "UPDATE document_templates SET category = ? WHERE category = ?",
                (new_value, old_value),
            )
            if cursor.rowcount:
                print(f"Fixed {cursor.rowcount} row(s): category {old_value} -> {new_value}")

        existing_columns = get_existing_columns(conn)
        for column_name, column_type in NEW_COLUMNS.items():
            if column_name in existing_columns:
                print(f"Skipping existing column: {column_name}")
                continue

            sql = f"ALTER TABLE document_templates ADD COLUMN {column_name} {column_type};"
            conn.execute(sql)
            print(f"Added column: {column_name}")

        conn.execute(
            "UPDATE document_templates SET application_scope = 'GENERIC' WHERE application_scope IS NULL"
        )

        conn.execute(CREATE_JUNCTION_TABLE_SQL)
        print("Ensured table: document_template_universities")

        conn.commit()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
