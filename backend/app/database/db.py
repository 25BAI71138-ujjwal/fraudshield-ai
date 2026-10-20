import sqlite3
import json
import os
from contextlib import contextmanager
from app.core.config import settings


def get_db_path() -> str:
    db_dir = os.path.dirname(settings.DATABASE_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)
    return settings.DATABASE_PATH


@contextmanager
def get_db():
    conn = sqlite3.connect(get_db_path(), timeout=15.0)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                transaction_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                amount REAL NOT NULL,
                transaction_hour INTEGER NOT NULL,
                transaction_frequency_24h INTEGER NOT NULL,
                failed_attempts_24h INTEGER NOT NULL,
                is_new_device INTEGER NOT NULL,
                is_new_beneficiary INTEGER NOT NULL,
                amount_deviation_score REAL NOT NULL,
                location_risk_score REAL NOT NULL,
                payment_method TEXT NOT NULL,
                merchant_category TEXT NOT NULL,
                fraud_probability REAL NOT NULL,
                risk_score INTEGER NOT NULL,
                risk_level TEXT NOT NULL,
                decision TEXT NOT NULL,
                reasons TEXT NOT NULL,
                inference_time_ms REAL NOT NULL,
                is_demo INTEGER NOT NULL DEFAULT 1,
                verification_status TEXT NOT NULL DEFAULT 'NONE'
            )
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)

        # Initialize default thresholds if not present
        cursor.execute("SELECT value FROM settings WHERE key = 'approve_threshold'")
        if not cursor.fetchone():
            cursor.execute("INSERT INTO settings (key, value) VALUES ('approve_threshold', ?)", (str(settings.DEFAULT_APPROVE_THRESHOLD),))
            cursor.execute("INSERT INTO settings (key, value) VALUES ('verify_threshold', ?)", (str(settings.DEFAULT_VERIFY_THRESHOLD),))


def get_thresholds():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT key, value FROM settings")
        rows = cursor.fetchall()
        configs = {row["key"]: row["value"] for row in rows}
        approve = int(configs.get("approve_threshold", settings.DEFAULT_APPROVE_THRESHOLD))
        verify = int(configs.get("verify_threshold", settings.DEFAULT_VERIFY_THRESHOLD))
        return approve, verify


def set_thresholds(approve: int, verify: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('approve_threshold', ?)", (str(approve),))
        cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('verify_threshold', ?)", (str(verify),))
