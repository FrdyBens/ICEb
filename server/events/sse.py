import json
import time
import queue
from flask import Blueprint, Response, request

events_bp = Blueprint("events", __name__, url_prefix="/api/v1/events")

CLIENT_QUEUES = []

def broadcast_event(event_type: str, data: dict):
    payload = json.dumps({"type": event_type, "data": data, "timestamp": time.time()})
    msg = f"event: {event_type}\ndata: {payload}\n\n"
    for q in list(CLIENT_QUEUES):
        try:
            q.put_nowait(msg)
        except Exception:
            try:
                CLIENT_QUEUES.remove(q)
            except Exception:
                pass

@events_bp.route("/stream")
def event_stream():
    def gen():
        q = queue.Queue(maxsize=50)
        CLIENT_QUEUES.append(q)
        # Send initial connection event
        init_payload = json.dumps({"type": "agent.online", "data": {"status": "connected", "server": "Sevelr"}, "timestamp": time.time()})
        yield f"event: agent.online\ndata: {init_payload}\n\n"

        try:
            while True:
                try:
                    msg = q.get(timeout=20.0)
                    yield msg
                except queue.Empty:
                    # Send heartbeat comment to keep connection alive
                    yield ": heartbeat\n\n"
        except GeneratorExit:
            pass
        finally:
            if q in CLIENT_QUEUES:
                CLIENT_QUEUES.remove(q)

    return Response(gen(), mimetype="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive"
    })
