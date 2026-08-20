import json
import datetime
from flask import Blueprint, request, jsonify, g
from server.storage.db import get_db_connection
from server.config import PROJECTS_DIR

projects_bp = Blueprint("projects", __name__, url_prefix="/api/v1/projects")

@projects_bp.route("", methods=["GET"])
def list_projects():
    with get_db_connection() as conn:
        cursor = conn.execute("SELECT config_json FROM projects WHERE is_archived = 0 ORDER BY updated_at DESC")
        rows = cursor.fetchall()
        projects = [json.loads(row["config_json"]) for row in rows]
    return jsonify({"projects": projects, "total": len(projects)})

@projects_bp.route("/<project_id>", methods=["GET"])
def get_project(project_id):
    with get_db_connection() as conn:
        cursor = conn.execute("SELECT config_json FROM projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Project not found"}), 404
        return jsonify(json.loads(row["config_json"]))

@projects_bp.route("", methods=["POST"])
def create_project():
    data = request.get_json(force=True) or {}
    proj_id = data.get("id") or data.get("displayName", "").lower().replace(" ", "-")
    if not proj_id:
        return jsonify({"error": "Project ID or display name is required"}), 400

    now = datetime.datetime.utcnow().isoformat()
    config = {
        "schemaVersion": 2,
        "project": {
            "id": proj_id,
            "displayName": data.get("displayName", proj_id),
            "description": data.get("description", ""),
            "template": data.get("template", "strict"),
            "createdAt": now,
            "updatedAt": now
        },
        "application": data.get("application", {
            "provider": data.get("provider", "brave"),
            "executable": data.get("executable", None),
            "arguments": [],
            "initialUrl": data.get("initialUrl", "about:blank"),
            "environmentVariables": {}
        }),
        "network": data.get("network", {
            "mode": "allowlist",
            "allowedDomains": data.get("allowedDomains", ["brave.com"]),
            "deniedDomains": [],
            "allowedPorts": [80, 443],
            "allowHttp": False,
            "allowHttps": True,
            "allowWebSocket": False,
            "allowQuic": False,
            "allowIpv6": True,
            "allowLocalhost": False,
            "allowPrivateNetworks": False
        }),
        "dns": {"mode": "policy", "allowDirectIp": False, "allowDoh": False, "allowDot": False, "customResolvers": []},
        "filesystem": {"encrypted": True, "downloads": "isolated", "temporaryFiles": "isolated", "allowSharedDirectories": False},
        "process": {"monitor": True, "allowChildProcesses": True, "allowedExecutables": [], "maxMemoryMb": 4096, "singleInstancePerProject": True},
        "privacy": {"sync": False, "telemetry": False, "passwordSaving": False, "autofill": False, "clearOnExit": False},
        "security": {"mode": data.get("template", "strict"), "failClosed": True, "tamperDetection": True, "integrityVerification": True, "preventDevTools": True, "preventExtensionsModification": True}
    }

    # Initialize physical folder
    proj_path = PROJECTS_DIR / proj_id
    proj_path.mkdir(parents=True, exist_ok=True)
    (proj_path / "files").mkdir(exist_ok=True)
    (proj_path / "downloads").mkdir(exist_ok=True)

    with get_db_connection() as conn:
        conn.execute("""
            INSERT INTO projects (id, display_name, description, template, schema_version, config_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                display_name=excluded.display_name,
                description=excluded.description,
                template=excluded.template,
                config_json=excluded.config_json,
                updated_at=excluded.updated_at
        """, (
            proj_id,
            config["project"]["displayName"],
            config["project"]["description"],
            config["project"]["template"],
            2,
            json.dumps(config),
            now,
            now
        ))

        # Log event
        conn.execute("""
            INSERT INTO audit_events (id, timestamp, severity, component, project_id, event_type, message)
            VALUES (?, ?, 'Info', 'ProjectManager', ?, 'project.created', ?)
        """, (f"evt_{datetime.datetime.utcnow().timestamp()}", now, proj_id, f"Project '{proj_id}' created with template '{config['project']['template']}'"))

    return jsonify({"status": "created", "project": config}), 201

@projects_bp.route("/<project_id>", methods=["PUT"])
def update_project(project_id):
    data = request.get_json(force=True) or {}
    now = datetime.datetime.utcnow().isoformat()

    with get_db_connection() as conn:
        cursor = conn.execute("SELECT config_json FROM projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Project not found"}), 404

        existing = json.loads(row["config_json"])
        if "project" in data:
            existing["project"].update(data["project"])
        if "application" in data:
            existing["application"].update(data["application"])
        if "network" in data:
            existing["network"].update(data["network"])
        if "filesystem" in data:
            existing["filesystem"].update(data["filesystem"])
        if "security" in data:
            existing["security"].update(data["security"])
        if "privacy" in data:
            existing["privacy"].update(data["privacy"])

        existing["project"]["updatedAt"] = now

        conn.execute("""
            UPDATE projects SET
                display_name = ?,
                description = ?,
                template = ?,
                config_json = ?,
                updated_at = ?
            WHERE id = ?
        """, (
            existing["project"].get("displayName", project_id),
            existing["project"].get("description", ""),
            existing["project"].get("template", "strict"),
            json.dumps(existing),
            now,
            project_id
        ))

    return jsonify({"status": "updated", "project": existing})

@projects_bp.route("/<project_id>", methods=["DELETE"])
def delete_project(project_id):
    with get_db_connection() as conn:
        conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        conn.execute("DELETE FROM runtime_sessions WHERE project_id = ?", (project_id,))
        now = datetime.datetime.utcnow().isoformat()
        conn.execute("""
            INSERT INTO audit_events (id, timestamp, severity, component, project_id, event_type, message)
            VALUES (?, ?, 'Warning', 'ProjectManager', ?, 'project.deleted', ?)
        """, (f"evt_{datetime.datetime.utcnow().timestamp()}", now, project_id, f"Project '{project_id}' was removed"))

    return jsonify({"status": "deleted", "id": project_id})
