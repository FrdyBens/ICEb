import os
import secrets
import hashlib
import time
import datetime
from typing import Optional, Dict, Any, Tuple
from server.storage.db import get_db_connection
from server.config import SESSION_EXPIRY_SECONDS

FAILED_ATTEMPTS: Dict[str, Tuple[int, float]] = {}

def hash_secret(secret: str) -> str:
    return hashlib.sha256(secret.encode('utf-8')).hexdigest()

def is_first_run() -> bool:
    with get_db_connection() as conn:
        cursor = conn.execute("SELECT COUNT(*) FROM credentials")
        count = cursor.fetchone()[0]
        return count == 0

def register_initial_credential(credential_type: str, credential_data: Dict[str, Any]) -> str:
    cred_id = secrets.token_hex(16)
    now = datetime.datetime.utcnow().isoformat()
    with get_db_connection() as conn:
        conn.execute(
            "INSERT INTO credentials (id, type, public_key, credential_id, counter, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (
                cred_id,
                credential_type,
                credential_data.get("public_key", ""),
                credential_data.get("credential_id", secrets.token_hex(16)),
                0,
                now
            )
        )
    return cred_id

def create_session(user_agent: str = "") -> str:
    token = secrets.token_urlsafe(32)
    now = datetime.datetime.utcnow()
    expires = now + datetime.timedelta(seconds=SESSION_EXPIRY_SECONDS)
    with get_db_connection() as conn:
        conn.execute(
            "INSERT INTO sessions (token, created_at, expires_at, user_agent) VALUES (?, ?, ?, ?)",
            (token, now.isoformat(), expires.isoformat(), user_agent)
        )
    return token

def validate_session(token: Optional[str]) -> bool:
    if not token:
        return False
    with get_db_connection() as conn:
        cursor = conn.execute("SELECT expires_at FROM sessions WHERE token = ?", (token,))
        row = cursor.fetchone()
        if not row:
            return False
        expires_at = datetime.datetime.fromisoformat(row["expires_at"])
        if datetime.datetime.utcnow() > expires_at:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
            return False
        return True

def revoke_session(token: str):
    with get_db_connection() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))

def generate_recovery_code() -> str:
    # 16-character alphanumeric code separated by dashes
    raw = secrets.token_hex(8).upper()
    return f"{raw[0:4]}-{raw[4:8]}-{raw[8:12]}-{raw[12:16]}"
