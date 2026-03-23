"""
Minimal HTTP server exposing GET /api/conditions with static mock data.

Usage: python3 backend/server.py

Notes:
- No frameworks used.
- Only the exact endpoint `/api/conditions` is implemented.
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import time
import uuid
from urllib.parse import urlparse, parse_qs

from logging_config import get_logger

from conditions_data import MOCK_CONDITIONS
from targets_data import MOCK_TARGETS
from passes_data import MOCK_PASSES
from alerts_data import MOCK_ALERTS

logger = get_logger("backend.server")


class SimpleHandler(BaseHTTPRequestHandler):
    def _send_json(self, obj, status=200):
        payload = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        start = time.time()
        request_id = str(uuid.uuid4())
        parsed = urlparse(self.path)
        # shallow query params
        q = {k: v if len(v) > 1 else v[0] for k, v in parse_qs(parsed.query).items()}
        logger.info(f"req={request_id} START {self.command} {parsed.path} q={q}")
        try:
            if parsed.path == "/api/conditions":
                # Return the static mock data exactly matching the contract
                self._send_json(MOCK_CONDITIONS)
                status = 200
            elif parsed.path == "/api/targets":
                # Return list of target objects
                self._send_json(MOCK_TARGETS)
                status = 200
            elif parsed.path == "/api/passes":
                # Return list of upcoming passes
                self._send_json(MOCK_PASSES)
                status = 200
            elif parsed.path == "/api/alerts":
                # Return list of alerts
                self._send_json(MOCK_ALERTS)
                status = 200
            else:
                # Only known API paths allowed in Phase 1
                self.send_error(404, "Not Found")
                status = 404
        except Exception:
            # Unhandled exception
            logger.exception(f"req={request_id} ERROR unhandled exception")
            self.send_error(500, "Internal Server Error")
            status = 500
        finally:
            duration_ms = int((time.time() - start) * 1000)
            logger.info(f"req={request_id} END status={status} duration_ms={duration_ms}")

    def log_message(self, format, *args):
        # Route BaseHTTPRequestHandler logs through logger
        logger.info("%s - %s" % (self.address_string(), format % args))


def run(host="127.0.0.1", port=8000):
    server = HTTPServer((host, port), SimpleHandler)
    logger.info(f"Starting server on http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down server")
        server.server_close()


if __name__ == "__main__":
    run()
