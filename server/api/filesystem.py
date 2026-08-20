import os
import mimetypes
import datetime
from pathlib import Path
from flask import Blueprint, request, jsonify, send_file
from server.config import PROJECTS_DIR

filesystem_bp = Blueprint("filesystem", __name__, url_prefix="/api/v1/projects/<project_id>/files")

def resolve_safe_path(project_id: str, relative_path: str) -> Path:
    base_dir = (PROJECTS_DIR / project_id).resolve()
    base_dir.mkdir(parents=True, exist_ok=True)

    if not relative_path or relative_path in [".", "/"]:
        return base_dir

    # Normalize and prevent traversal
    clean_rel = relative_path.replace("\\", "/").lstrip("/")
    target = (base_dir / clean_rel).resolve()

    if not str(target).startswith(str(base_dir)):
        raise PermissionError(f"Path traversal detected: '{relative_path}' escapes project root.")

    return target

@filesystem_bp.route("", methods=["GET"])
def list_files(project_id):
    req_path = request.args.get("path", "")
    try:
        target_dir = resolve_safe_path(project_id, req_path)
        if not target_dir.exists():
            return jsonify({"error": "Directory not found"}), 404
        if not target_dir.is_dir():
            return jsonify({"error": "Path is not a directory"}), 400

        items = []
        base_dir = (PROJECTS_DIR / project_id).resolve()

        for entry in os.scandir(target_dir):
            stat = entry.stat()
            rel_path = str(Path(entry.path).relative_to(base_dir)).replace("\\", "/")
            items.append({
                "name": entry.name,
                "path": rel_path,
                "isDirectory": entry.is_dir(),
                "size": stat.st_size if entry.is_file() else 0,
                "modified": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "type": "folder" if entry.is_dir() else (mimetypes.guess_type(entry.name)[0] or "application/octet-stream")
            })

        # Sort folders first, then alphabetically
        items.sort(key=lambda x: (not x["isDirectory"], x["name"].lower()))
        
        current_rel = str(target_dir.relative_to(base_dir)).replace("\\", "/")
        if current_rel == ".":
            current_rel = ""

        return jsonify({
            "projectId": project_id,
            "currentPath": current_rel,
            "items": items
        })
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 403
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

@filesystem_bp.route("/content", methods=["GET"])
def get_file_content(project_id):
    req_path = request.args.get("path", "")
    if not req_path:
        return jsonify({"error": "File path is required"}), 400
    try:
        target_file = resolve_safe_path(project_id, req_path)
        if not target_file.exists() or not target_file.is_file():
            return jsonify({"error": "File not found"}), 404

        # Read text if under 5MB
        if target_file.stat().st_size > 5 * 1024 * 1024:
            return jsonify({"error": "File is too large for web preview (>5MB)"}), 400

        try:
            content = target_file.read_text(encoding="utf-8")
            return jsonify({
                "path": req_path,
                "size": target_file.stat().st_size,
                "content": content,
                "isBinary": False
            })
        except UnicodeDecodeError:
            return jsonify({
                "path": req_path,
                "size": target_file.stat().st_size,
                "isBinary": True,
                "downloadUrl": f"/api/v1/projects/{project_id}/files/download?path={req_path}"
            })
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 403
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

@filesystem_bp.route("/content", methods=["POST"])
def save_file_content(project_id):
    data = request.get_json(force=True) or {}
    req_path = data.get("path", "")
    content = data.get("content", "")
    if not req_path:
        return jsonify({"error": "Path is required"}), 400
    try:
        target_file = resolve_safe_path(project_id, req_path)
        target_file.parent.mkdir(parents=True, exist_ok=True)
        target_file.write_text(content, encoding="utf-8")
        return jsonify({"status": "saved", "path": req_path, "size": len(content)})
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 403
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

@filesystem_bp.route("/mkdir", methods=["POST"])
def create_directory(project_id):
    data = request.get_json(force=True) or {}
    req_path = data.get("path", "")
    if not req_path:
        return jsonify({"error": "Path is required"}), 400
    try:
        target_dir = resolve_safe_path(project_id, req_path)
        target_dir.mkdir(parents=True, exist_ok=True)
        return jsonify({"status": "created", "path": req_path})
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 403
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

@filesystem_bp.route("", methods=["DELETE"])
def delete_file_or_folder(project_id):
    req_path = request.args.get("path", "")
    if not req_path:
        return jsonify({"error": "Path is required"}), 400
    try:
        target = resolve_safe_path(project_id, req_path)
        if not target.exists():
            return jsonify({"error": "Target does not exist"}), 404

        base_dir = (PROJECTS_DIR / project_id).resolve()
        if target == base_dir:
            return jsonify({"error": "Cannot delete project root directly"}), 400

        if target.is_dir():
            import shutil
            shutil.rmtree(target)
        else:
            target.unlink()

        return jsonify({"status": "deleted", "path": req_path})
    except PermissionError as pe:
        return jsonify({"error": str(pe)}), 403
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500
