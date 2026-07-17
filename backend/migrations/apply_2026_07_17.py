from __future__ import annotations

import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB_PATH = ROOT / "soccer-duty.db"
BACKUP_PATH = ROOT / f"soccer-duty.backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.db"

NEW_COLUMNS = {
    "phone": "TEXT",
    "dossier_stage": "TEXT",
    "recruitment_status": "TEXT",
    "service_plan": "TEXT",
    "acquisition_channel": "TEXT",
    "intake_period": "TEXT",
}

DEFAULT_UPDATE_SQL = """
UPDATE player_profiles
SET dossier_stage = COALESCE(dossier_stage, 'Trad'),
    recruitment_status = COALESCE(recruitment_status, 'Prospection'),
    service_plan = COALESCE(service_plan, 'Formule A'),
    acquisition_channel = COALESCE(acquisition_channel, 'formulaire'),
    intake_period = COALESCE(intake_period, 'Fall');
"""


def get_existing_columns(conn: sqlite3.Connection) -> set[str]:
    rows = conn.execute("PRAGMA table_info(player_profiles)").fetchall()
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

            sql = f"ALTER TABLE player_profiles ADD COLUMN {column_name} {column_type};"
            conn.execute(sql)
            print(f"Added column: {column_name}")

        conn.execute(DEFAULT_UPDATE_SQL)
        conn.commit()

        null_count = conn.execute(
            """
            SELECT COUNT(*)
            FROM player_profiles
            WHERE dossier_stage IS NULL
               OR recruitment_status IS NULL
               OR service_plan IS NULL
               OR acquisition_channel IS NULL
               OR intake_period IS NULL
            """
        ).fetchone()[0]

        print(f"Null control count: {null_count}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
