import sqlite3
import json
import datetime
from typing import Dict, Any, List, Optional
from server.config import DATABASE_PATH

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn

def init_db():
    with get_db_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                description TEXT,
                template TEXT NOT NULL DEFAULT 'strict',
                schema_version INTEGER NOT NULL DEFAULT 2,
                config_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                is_archived INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS runtime_sessions (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                process_id INTEGER,
                is_running INTEGER NOT NULL DEFAULT 0,
                started_at TEXT NOT NULL,
                stopped_at TEXT,
                metrics_json TEXT
            );

            CREATE TABLE IF NOT EXISTS audit_events (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                severity TEXT NOT NULL,
                component TEXT NOT NULL,
                project_id TEXT,
                event_type TEXT NOT NULL,
                message TEXT NOT NULL,
                details_json TEXT
            );

            CREATE TABLE IF NOT EXISTS snapshots (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                snapshot_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                checksum TEXT NOT NULL,
                file_size_bytes INTEGER NOT NULL,
                manifest_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS credentials (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL, -- 'passkey' or 'recovery' or 'master'
                public_key TEXT,
                credential_id TEXT,
                counter INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                user_agent TEXT
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value_json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp DESC);
            CREATE INDEX IF NOT EXISTS idx_audit_project ON audit_events(project_id);
            CREATE INDEX IF NOT EXISTS idx_snapshots_project ON snapshots(project_id);
        """)
