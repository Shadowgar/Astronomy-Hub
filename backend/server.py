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
import os
from urllib.parse import urlparse, parse_qs

from logging_config import get_logger

from conditions_data import MOCK_CONDITIONS
from targets_data import MOCK_TARGETS
from passes_data import MOCK_PASSES
from alerts_data import MOCK_ALERTS

logger = get_logger("backend.server")

# Lazy cache reference; initialize on first use to be compatible with both
# `python3 backend/server.py` and package-based execution.
_simple_cache = None


def _ensure_cache():
    global _simple_cache
    if _simple_cache is not None:
        return
    try:
        from backend.cache.simple_cache import SimpleCache
    except Exception:
        # When running as a script, sys.path[0] may be the backend/ dir.
        # Prepend the repository root to sys.path so package imports resolve.
        import sys
        repo_root = os.path.dirname(os.path.dirname(__file__))
        if repo_root not in sys.path:
            sys.path.insert(0, repo_root)
        from backend.cache.simple_cache import SimpleCache

    _simple_cache = SimpleCache()


def _validate_suggestions(matches):
    """Validate suggestion coordinate values.

    Returns an error dict when a problem is found, otherwise None.
    """
    for idx, s in enumerate(matches):
        lat = s.get('latitude')
        lon = s.get('longitude')
        # If neither coordinate present, skip validation for this suggestion
        if lat is None and lon is None:
            continue
        # Both must be present if either is present
        if lat is None or lon is None:
            return {'error': 'suggestion coordinates malformed', 'index': idx, 'suggestion': s}
        try:
            latf = float(lat)
            lonf = float(lon)
        except Exception:
            return {'error': 'suggestion coordinates malformed', 'index': idx, 'suggestion': s}
        if not (-90.0 <= latf <= 90.0) or not (-180.0 <= lonf <= 180.0):
            return {'error': 'suggestion coordinates out of range', 'index': idx, 'suggestion': s}
    return None


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
                # Use short TTL in-process cache for conditions responses only.
                # Cache key incorporates whether this is ORAS or a custom location
                # so we don't mix responses across locations.
                try:
                    _ensure_cache()
                except Exception:
                    logger.exception(f"req={request_id} cache.init.fail")

                if parsed_location is None:
                    cache_key = "conditions:oras"
                else:
                    # include numeric coords to distinguish custom locations
                    lat = parsed_location.get('latitude')
                    lon = parsed_location.get('longitude')
                    elev = parsed_location.get('elevation_ft')
                    cache_key = f"conditions:custom:{lat}:{lon}:{elev}"

                cached_resp = _simple_cache.get(cache_key) if _simple_cache is not None else None
                if cached_resp is not None:
                    # Return cached payload but append non-invasive meta fields
                    from copy import deepcopy
                    resp = deepcopy(cached_resp)
                    resp['meta'] = {
                        'cached': True,
                        'cached_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                    }
                    logger.info(f"req={request_id} cache.hit key={cache_key}")
                    self._send_json(resp)
                    status = 200
                else:
                    # Build fresh response and populate cache after normalization
                    from copy import deepcopy
                    resp = deepcopy(MOCK_CONDITIONS)
                    if parsed_location is None:
                        resp['location_label'] = 'ORAS Observatory'
                    else:
                        resp['location_label'] = 'Custom Location'

                    # Attempt to normalize through the normalizer stub, but
                    # fall back to the original mock on any error.
                    try:
                        from backend.normalizers.conditions_normalizer import normalize_to_contract
                        try:
                            normalized = normalize_to_contract(resp)
                            if isinstance(normalized, dict):
                                resp = normalized
                                logger.info(f"req={request_id} normalize=ok")
                            else:
                                logger.info(f"req={request_id} normalize=skip type={type(normalized)}")
                        except Exception:
                            logger.exception(f"req={request_id} normalize.fail")
                    except Exception:
                        # Import failure or other issue importing normalizer; continue with mock
                        logger.info(f"req={request_id} normalize=not-available")

                    # Cache the response (without meta) for a short TTL
                    try:
                        cache_payload = deepcopy(resp)
                        if 'meta' in cache_payload:
                            cache_payload.pop('meta', None)
                        if _simple_cache is not None:
                            _simple_cache.set(cache_key, cache_payload, ttl=5)
                    except Exception:
                        logger.exception(f"req={request_id} cache.set.fail key={cache_key}")

                    # Return the fresh response and include meta indicating not-cached
                    resp['meta'] = {
                        'cached': False,
                        'cached_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                    }
                    self._send_json(resp)
                    status = 200
            elif parsed.path == "/api/targets":
                # Accept optional location params but return static mock targets for now
                self._send_json(MOCK_TARGETS)
                status = 200
            elif parsed.path == "/api/location/search":
                # Minimal mock search: require `q` param of length >= 3
                q_param = q.get('q', '') if q else ''
                if q_param is None:
                    q_param = ''
                q_trim = str(q_param).strip()
                if len(q_trim) < 3:
                    # follow the same error contract pattern used elsewhere
                    self._send_json({'error': 'q must be at least 3 characters'}, status=400)
                    status = 400
                else:
                    # load suggestions from backend/location_suggestions.json and filter
                    try:
                        base = os.path.dirname(__file__)
                        sugg_path = os.path.join(base, 'location_suggestions.json')
                        with open(sugg_path, 'r', encoding='utf-8') as fh:
                            suggestions = json.load(fh)

                        # cache key based on trimmed query
                        cache_key = f"location_search:{q_trim}"
                        # ensure cache is initialized in current execution mode
                        try:
                            _ensure_cache()
                        except Exception:
                            logger.exception(f"req={request_id} cache.init.fail")
                        cached = _simple_cache.get(cache_key) if _simple_cache is not None else None
                        if cached is not None:
                            logger.info(f"req={request_id} cache.hit key={cache_key}")
                            self._send_json(cached)
                            status = 200
                            return

                        ql = q_trim.lower()
                        matches = [s for s in suggestions if ql in (s.get('name') or '').lower()]
                        # Validate coordinates on matched suggestions and return 400 on error
                        v_err = _validate_suggestions(matches)
                        if v_err:
                            self._send_json(v_err, status=400)
                            status = 400
                            return

                        # successful response: cache it briefly and return
                        try:
                            _simple_cache.set(cache_key, matches, ttl=5)
                        except Exception:
                            logger.exception(f"req={request_id} cache.set.fail key={cache_key}")

                        self._send_json(matches)
                        status = 200
                    except Exception:
                        logger.exception(f"req={request_id} location.search.load.fail")
                        self._send_json({'error': 'failed to load suggestions'}, status=500)
                        status = 500
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
