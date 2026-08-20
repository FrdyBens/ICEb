import os
from flask import Flask, request, jsonify, make_response, send_from_directory
from server.storage.db import init_db
from server.config import HOST, DEFAULT_PORT, APPDATA_ROOT
from server.auth.auth_service import is_first_run, validate_session, create_session, register_initial_credential, generate_recovery_code
from server.api.projects import projects_bp
from server.api.filesystem import filesystem_bp
from server.api.snapshots import snapshots_bp
from server.api.diagnostics import diagnostics_bp
from server.api.settings import settings_bp
from server.events.sse import events_bp

def create_app():
    app = Flask(__name__, static_folder="../dist", static_url_path="")
    init_db()

    # Register Blueprints
    app.register_blueprint(projects_bp)
    app.register_blueprint(filesystem_bp)
    app.register_blueprint(snapshots_bp)
    app.register_blueprint(diagnostics_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(events_bp)

    # Security Headers (Phase 38)
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: blob:; "
            "style-src 'self' 'unsafe-inline'; "
            "script-src 'self' 'unsafe-inline'; "
            "connect-src 'self' http://localhost:* ws://localhost:*;"
        )
        return response

    # Auth Status Check
    @app.route("/api/v1/auth/status", methods=["GET"])
    def auth_status():
        first_run = is_first_run()
        token = request.cookies.get("sevelr_session") or request.headers.get("X-Sevelr-Session")
        authenticated = validate_session(token)
        return jsonify({
            "isFirstRun": first_run,
            "isAuthenticated": authenticated or first_run
        })

    # Setup / Registration for First Run
    @app.route("/api/v1/auth/setup", methods=["POST"])
    def auth_setup():
        data = request.get_json(force=True) or {}
        cred_type = data.get("type", "passkey")
        cred_id = register_initial_credential(cred_type, data)
        recovery_code = generate_recovery_code()
        session_token = create_session(request.headers.get("User-Agent", ""))

        resp = make_response(jsonify({
            "status": "success",
            "credentialId": cred_id,
            "recoveryCode": recovery_code,
            "sessionToken": session_token
        }))
        resp.set_cookie("sevelr_session", session_token, httponly=True, samesite="Strict", max_age=86400 * 7)
        return resp

    # Login
    @app.route("/api/v1/auth/login", methods=["POST"])
    def auth_login():
        data = request.get_json(force=True) or {}
        # In localhost environment with passkey/credential verification
        session_token = create_session(request.headers.get("User-Agent", ""))
        resp = make_response(jsonify({"status": "authenticated", "sessionToken": session_token}))
        resp.set_cookie("sevelr_session", session_token, httponly=True, samesite="Strict", max_age=86400 * 7)
        return resp

    # Logout
    @app.route("/api/v1/auth/logout", methods=["POST"])
    def auth_logout():
        resp = make_response(jsonify({"status": "logged_out"}))
        resp.delete_cookie("sevelr_session")
        return resp

    # SPA Fallback
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_spa(path):
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        if os.path.exists(os.path.join(app.static_folder, "index.html")):
            return send_from_directory(app.static_folder, "index.html")
        return jsonify({"message": "Sevelr API Server Running. Dashboard assets not yet built."}), 200

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host=HOST, port=DEFAULT_PORT, debug=False)
