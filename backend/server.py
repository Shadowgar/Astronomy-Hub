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
            # Parse optional location override params for all API endpoints.
            # Expected params: lat, lon, elevation_ft (optional)
            def parse_location_params(qdict):
                lat_s = qdict.get('lat')
                lon_s = qdict.get('lon')
                elev_s = qdict.get('elevation_ft')
                # If neither lat nor lon provided, treat as no override (use ORAS)
                if lat_s is None and lon_s is None and elev_s is None:
                    return None

                # Both lat and lon must be present for a valid override
                if lat_s is None or lon_s is None:
                    raise ValueError('Both lat and lon are required for a location override')

                try:
                    lat = float(lat_s)
                except Exception:
                    raise ValueError('lat must be a number')
                try:
                    lon = float(lon_s)
                except Exception:
                    raise ValueError('lon must be a number')

                if not (-90.0 <= lat <= 90.0):
                    raise ValueError('lat must be between -90 and 90')
                if not (-180.0 <= lon <= 180.0):
                    raise ValueError('lon must be between -180 and 180')

                elev = None
                if elev_s is not None and elev_s != '':
                    try:
                        elev = float(elev_s)
                    except Exception:
                        raise ValueError('elevation_ft must be numeric')

                return { 'latitude': lat, 'longitude': lon, 'elevation_ft': elev }

            try:
                parsed_location = parse_location_params(q)
            except ValueError as ve:
                # Invalid parameters: return 400 JSON error for API paths
                if parsed.path.startswith('/api/'):
                    self._send_json({'error': str(ve)}, status=400)
                    status = 400
                    return
                else:
                    raise

            if parsed.path == "/api/conditions":
                # Return the static mock data exactly matching the contract
                # but reflect whether this response is for ORAS or a Custom Location
                from copy import deepcopy
                resp = deepcopy(MOCK_CONDITIONS)
                if parsed_location is None:
                    resp['location_label'] = 'ORAS Observatory'
                else:
                    resp['location_label'] = 'Custom Location'
                self._send_json(resp)
                status = 200
            elif parsed.path == "/api/targets":
                # Accept optional location params but return static mock targets for now
                self._send_json(MOCK_TARGETS)
                status = 200
            elif parsed.path == "/api/passes":
                # Accept optional location params but return static mock passes for now
                self._send_json(MOCK_PASSES)
                status = 200
            elif parsed.path == "/api/alerts":
                # Accept optional location params but return static mock alerts for now
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
