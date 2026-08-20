import os
import zipfile
import json
import hashlib
import datetime
from pathlib import Path
from flask import Blueprint, request, jsonify, send_file
from server.storage.db import get_db_connection
from server.config import SNAPSHOTS_DIR, PROJECTS_DIR

snapshots_bp = Blueprint("snapshots", __name__, url_prefix="/api/v1/snapshots")

@snapshots_bp.route("", methods=["GET"])
def list_snapshots():
    project_id = request.args.get("projectId")
    with get_db_connection() as conn:
        if project_id:
            cursor = conn.execute("SELECT * FROM snapshots WHERE project_id = ? ORDER BY created_at DESC", (project_id,))
        else:
            cursor = conn.execute("SELECT * FROM snapshots ORDER BY created_at DESC")
        rows = cursor.fetchall()
        snapshots = []
        for r in rows:
            snapshots.append({
                "id": r["id"],
                "projectId": r["project_id"],
                "snapshotName": r["snapshot_name"],
                "filePath": r["file_path"],
                "checksum": r["checksum"],
                "fileSizeBytes": r["file_size_bytes"],
                "manifest": json.loads(r["manifest_json"]) if r["manifest_json"] else {},
                "createdAt": r["created_at"]
            })
    return jsonify({"snapshots": snapshots, "total": len(snapshots)})

@snapshots_bp.route("", methods=["POST"])
def create_snapshot():
    data = request.get_json(force=True) or {}
    project_id = data.get("projectId")
    custom_name = data.get("name")

    if not project_id:
        return jsonify({"error": "Project ID is required"}), 400

    with get_db_connection() as conn:
        cursor = conn.execute("SELECT config_json FROM projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Project not found"}), 404
        config = json.loads(row["config_json"])

    now_dt = datetime.datetime.utcnow()
    name = custom_name.strip() if custom_name else f"{project_id}_{now_dt.strftime('%Y%m%d_%H%M%S')}"
    snapshot_filename = f"{name}.sevelr"
    snapshot_path = SNAPSHOTS_DIR / snapshot_filename

    manifest = {
        "manifestVersion": 1,
        "schemaVersion": config.get("schemaVersion", 2),
        "platformVersion": "2.0.0",
        "projectId": project_id,
        "snapshotName": name,
        "createdAt": now_dt.isoformat(),
        "files": {}
    }

    proj_dir = PROJECTS_DIR / project_id
    with zipfile.ZipFile(snapshot_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
        # 1. Config
        zip_file.writestr("config.json", json.dumps(config, indent=2))

        # 2. Files
        if proj_dir.exists():
            for root, _, files in os.walk(proj_dir):
                for file in files:
                    full_file = Path(root) / file
                    rel_file = str(full_file.relative_to(proj_dir)).replace("\\", "/")
                    if rel_file.endswith(".lock") or rel_file.startswith("logs/"):
                        continue
                    
                    data_bytes = full_file.read_bytes()
                    file_sha = hashlib.sha256(data_bytes).hexdigest()
                    manifest["files"][rel_file] = file_sha
                    zip_file.writestr(f"data/{rel_file}", data_bytes)

        # 3. Manifest
        zip_file.writestr("manifest.json", json.dumps(manifest, indent=2))

    # Calculate overall SHA256 of snapshot
    archive_sha = hashlib.sha256(snapshot_path.read_bytes()).hexdigest()
    file_size = snapshot_path.stat().st_size
    snap_id = f"snap_{now_dt.timestamp()}"

    with get_db_connection() as conn:
        conn.execute("""
            INSERT INTO snapshots (id, project_id, snapshot_name, file_path, checksum, file_size_bytes, manifest_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            snap_id,
            project_id,
            name,
            str(snapshot_path),
            archive_sha,
            file_size,
            json.dumps(manifest),
            now_dt.isoformat()
        ))

    return jsonify({
        "status": "created",
        "snapshot": {
            "id": snap_id,
            "projectId": project_id,
            "snapshotName": name,
            "checksum": archive_sha,
            "fileSizeBytes": file_size,
            "createdAt": now_dt.isoformat()
        }
    }), 201

@snapshots_bp.route("/preview", methods=["POST"])
def preview_restore():
    data = request.get_json(force=True) or {}
    snapshot_id = data.get("snapshotId")
    if not snapshot_id:
        return jsonify({"error": "Snapshot ID is required"}), 400

    with get_db_connection() as conn:
        cursor = conn.execute("SELECT * FROM snapshots WHERE id = ?", (snapshot_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Snapshot not found"}), 404

    snap_path = Path(row["file_path"])
    if not snap_path.exists():
        return jsonify({"error": "Snapshot file is missing from disk"}), 404

    try:
        with zipfile.ZipFile(snap_path, "r") as zip_file:
            manifest_str = zip_file.read("manifest.json").decode("utf-8")
            manifest = json.loads(manifest_str)
            project_id = manifest["projectId"]
            proj_dir = PROJECTS_DIR / project_id

            files_to_create = []
            files_to_overwrite = []

            for name in zip_file.namelist():
                if name.startswith("data/") and not name.endswith("/"):
                    rel = name[len("data/"):]
                    target = proj_dir / rel
                    if target.exists():
                        files_to_overwrite.append(rel)
                    else:
                        files_to_create.append(rel)

        return jsonify({
            "isValid": True,
            "manifest": manifest,
            "filesToCreate": files_to_create,
            "filesToOverwrite": files_to_overwrite,
            "filesToDelete": []
        })
    except Exception as ex:
        return jsonify({"isValid": False, "error": str(ex)}), 400

@snapshots_bp.route("/restore", methods=["POST"])
def apply_restore():
    data = request.get_json(force=True) or {}
    snapshot_id = data.get("snapshotId")
    if not snapshot_id:
        return jsonify({"error": "Snapshot ID is required"}), 400

    with get_db_connection() as conn:
        cursor = conn.execute("SELECT * FROM snapshots WHERE id = ?", (snapshot_id,))
        row = cursor.fetchone()
        if not row:
            return jsonify({"error": "Snapshot not found"}), 404

    snap_path = Path(row["file_path"])
    with zipfile.ZipFile(snap_path, "r") as zip_file:
        manifest = json.loads(zip_file.read("manifest.json").decode("utf-8"))
        config = json.loads(zip_file.read("config.json").decode("utf-8"))
        project_id = manifest["projectId"]
        proj_dir = PROJECTS_DIR / project_id
        proj_dir.mkdir(parents=True, exist_ok=True)

        # Restore config in SQLite
        now = datetime.datetime.utcnow().isoformat()
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
                project_id,
                config["project"]["displayName"],
                config["project"]["description"],
                config["project"]["template"],
                config.get("schemaVersion", 2),
                json.dumps(config),
                config["project"].get("createdAt", now),
                now
            ))

        # Extract data files
        for name in zip_file.namelist():
            if name.startswith("data/") and not name.endswith("/"):
                rel = name[len("data/"):]
                target = (proj_dir / rel).resolve()
                if str(target).startswith(str(proj_dir.resolve())):
                    target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(zip_file.read(name))

    return jsonify({"status": "restored", "projectId": project_id, "snapshotName": manifest["snapshotName"]})
