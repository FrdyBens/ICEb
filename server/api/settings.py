import json
import datetime
from flask import Blueprint, request, jsonify
from server.storage.db import get_db_connection

settings_bp = Blueprint("settings", __name__, url_prefix="/api/v1/settings")

DEFAULT_SYSTEM_SETTINGS = {
    "theme": "dark",
    "logVerbosity": "Info",
    "localhostOnly": True,
    "trayNotifications": True,
    "autoOpenDashboard": True,
    "debounceMs": 200,
    "windowsAbstractions": [
        {
            "id": "win_firewall_block_all",
            "name": "Windows Firewall Outbound Isolation",
            "category": "Network",
            "description": "Applies Windows Defender Firewall rules to strictly isolate browser network traffic to project allowlisted domains and ports.",
            "currentValue": "Enforced",
            "defaultValue": "Enforced",
            "riskLevel": "Low",
            "requiresElevation": True,
            "status": "Active"
        },
        {
            "id": "chromium_devtools_block",
            "name": "Chromium DevTools & Extension Lock",
            "category": "Browser Policy",
            "description": "Injects Windows Registry policies (HKLM/HKCU Policies) preventing DevTools inspection and unauthorized extension installations.",
            "currentValue": "Enabled",
            "defaultValue": "Enabled",
            "riskLevel": "Low",
            "requiresElevation": False,
            "status": "Active"
        },
        {
            "id": "windows_ntfs_acl",
            "name": "User-Only NTFS Storage ACL",
            "category": "Filesystem",
            "description": "Removes inherited permissions on project folders and grants exclusive Read/Write control to the current Windows user SID.",
            "currentValue": "Enforced",
            "defaultValue": "Enforced",
            "riskLevel": "Low",
            "requiresElevation": False,
            "status": "Active"
        },
        {
            "id": "windows_efs_encryption",
            "name": "Windows EFS Data Encryption",
            "category": "Cryptography",
            "description": "Enables transparent Windows Encrypting File System (EFS) backed by DPAPI for all project storage directories.",
            "currentValue": "Enabled",
            "defaultValue": "Enabled",
            "riskLevel": "Moderate",
            "requiresElevation": False,
            "status": "Active"
        },
        {
            "id": "windows_job_object_limits",
            "name": "Job Object RAM & Process Tree Control",
            "category": "Process Isolation",
            "description": "Assigns launched browser processes to a Windows Job Object with hard memory caps (4GB) and kill-on-close guarantees.",
            "currentValue": "Active",
            "defaultValue": "Active",
            "riskLevel": "Low",
            "requiresElevation": False,
            "status": "Active"
        }
    ]
}

@settings_bp.route("", methods=["GET"])
def get_settings():
    with get_db_connection() as conn:
        cursor = conn.execute("SELECT key, value_json FROM settings")
        rows = cursor.fetchall()
        settings = dict(DEFAULT_SYSTEM_SETTINGS)
        for r in rows:
            try:
                settings[r["key"]] = json.loads(r["value_json"])
            except Exception:
                pass
    return jsonify(settings)

@settings_bp.route("", methods=["POST"])
def update_settings():
    data = request.get_json(force=True) or {}
    now = datetime.datetime.utcnow().isoformat()
    with get_db_connection() as conn:
        for k, v in data.items():
            conn.execute("""
                INSERT INTO settings (key, value_json, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value_json = excluded.value_json,
                    updated_at = excluded.updated_at
            """, (k, json.dumps(v), now))
    return jsonify({"status": "saved", "updated": list(data.keys())})
