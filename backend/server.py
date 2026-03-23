"""
Minimal HTTP server exposing GET /api/conditions with static mock data.

Usage: python3 backend/server.py

Notes:
- No frameworks used.
- Only the exact endpoint `/api/conditions` is implemented.
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
from urllib.parse import urlparse
from conditions_data import MOCK_CONDITIONS
from targets_data import MOCK_TARGETS
from passes_data import MOCK_PASSES
from alerts_data import MOCK_ALERTS


class SimpleHandler(BaseHTTPRequestHandler):
    def _send_json(self, obj, status=200):
        payload = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/conditions":
            # Return the static mock data exactly matching the contract
            self._send_json(MOCK_CONDITIONS)
        elif parsed.path == "/api/targets":
            # Return list of target objects
            self._send_json(MOCK_TARGETS)
        elif parsed.path == "/api/passes":
            # Return list of upcoming passes
            self._send_json(MOCK_PASSES)
        elif parsed.path == "/api/alerts":
            # Return list of alerts
            self._send_json(MOCK_ALERTS)
        else:
            # Only /api/conditions is allowed in Phase 1 for this task
            self.send_error(404, "Not Found")

    def log_message(self, format, *args):
        # Keep logs concise
        print("[server] %s - %s" % (self.address_string(), format % args))


def run(host="127.0.0.1", port=8000):
    server = HTTPServer((host, port), SimpleHandler)
    print(f"Starting server on http://{host}:{port} — only GET /api/conditions is implemented")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Shutting down server")
        server.server_close()


if __name__ == "__main__":
    run()
