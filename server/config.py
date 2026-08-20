import os
from pathlib import Path

PLATFORM_NAME = "Sevelr"
PLATFORM_VERSION = "2.0.0"
SCHEMA_VERSION = 2

# Local AppData root (or fallback on non-Windows)
if os.name == 'nt':
    APPDATA_ROOT = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local")) / PLATFORM_NAME
else:
    APPDATA_ROOT = Path(os.path.expanduser(f"~/.local/share/{PLATFORM_NAME}"))

PROJECTS_DIR = APPDATA_ROOT / "projects"
CONFIG_DIR = APPDATA_ROOT / "config"
LOGS_DIR = APPDATA_ROOT / "logs"
SNAPSHOTS_DIR = APPDATA_ROOT / "snapshots"
TEMPLATES_DIR = APPDATA_ROOT / "templates"
DATABASE_PATH = APPDATA_ROOT / "sevelr.db"

# Ensure core directories exist
for p in [APPDATA_ROOT, PROJECTS_DIR, CONFIG_DIR, LOGS_DIR, SNAPSHOTS_DIR, TEMPLATES_DIR]:
    p.mkdir(parents=True, exist_ok=True)

DEFAULT_PORT = 3000
HOST = "127.0.0.1"
SESSION_COOKIE_NAME = "sevelr_session"
SESSION_EXPIRY_SECONDS = 86400 * 7 # 7 days
