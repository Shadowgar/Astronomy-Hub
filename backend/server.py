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

# Normalizer imports: prefer local-module import when running the script
# (sys.path[0] may be backend/) but fall back to package-style imports.
try:
    from normalizers import registry
    from normalizers.base import NormalizationError
except Exception:
    from backend.normalizers import registry
    from backend.normalizers.base import NormalizationError

# Response envelope import: prefer `schemas.response_envelope` when
# running as a script, otherwise use package-prefixed import.
try:
    from schemas.response_envelope import ResponseEnvelope
except Exception:
    from backend.schemas.response_envelope import ResponseEnvelope

logger = get_logger("backend.server")

# Constants
SUGGESTION_COORD_MALFORMED = 'suggestion coordinates malformed'

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
            return {'error': SUGGESTION_COORD_MALFORMED, 'index': idx, 'suggestion': s}
        try:
            latf = float(lat)
            lonf = float(lon)
        except Exception:
            return {'error': SUGGESTION_COORD_MALFORMED, 'index': idx, 'suggestion': s}
        if not (-90.0 <= latf <= 90.0) or not (-180.0 <= lonf <= 180.0):
            return {'error': 'suggestion coordinates out of range', 'index': idx, 'suggestion': s}
    return None


def _slugify(name: str) -> str:
    # minimal slug helper for ids
    try:
        s = str(name).strip().lower()
        return s.replace(' ', '-').replace('/', '-').replace("'", '')
    except Exception:
        return str(uuid.uuid4())


def _build_scene_from_targets(parsed_location=None):
    """Construct a minimal SceneContract-compatible payload from targets."""
    from datetime import datetime
    try:
        try:
            from backend.targets_data import get_targets
        except Exception:
            # running as script fallback
            import sys, os
            repo_root = os.path.dirname(os.path.dirname(__file__))
            if repo_root not in sys.path:
                sys.path.insert(0, repo_root)
            from backend.targets_data import get_targets

        targets = get_targets(with_images=False)
    except Exception:
        targets = []

    objects = []
    for t in targets:
        # Map available fields into the SceneObjectSummary shape
        name = t.get('name') or 'unknown'
        category = t.get('category')
        # Only allow Phase 1 types
        if category not in ('planet', 'deep_sky', 'satellite'):
            # skip unknown categories in scene assembly
            continue
        obj = {
            'id': _slugify(name),
            'name': name,
            'type': category,
            'engine': 'mock',
            'summary': t.get('reason') or t.get('summary') or '',
            'position': None,
            'visibility': None,
        }
        objects.append(obj)

    scene = {
        'scope': 'above_me',
        'engine': 'mock',
        'filter': 'default',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'objects': objects,
    }
    return scene


class SimpleHandler(BaseHTTPRequestHandler):
    def _send_json(self, obj, status=200, extra_headers=None):
        payload = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        if extra_headers:
            for k, v in extra_headers.items():
                try:
                    self.send_header(str(k), str(v))
                except Exception:
                    # headers are best-effort; do not fail the request on header issues
                    logger.exception(f"failed to set header {k}")
        self.end_headers()
        self.wfile.write(payload)

    def _build_envelope(self, status_str, data=None, meta=None, error=None):
        """Build and validate a ResponseEnvelope, returning a plain dict.

        Raises Exception when the envelope cannot be validated.
        """
        env = {
            "status": status_str,
            "data": data if data is not None else None,
            "meta": meta if meta is not None else {},
            "error": error if error is not None else None,
        }
        # Validate with authoritative model
        validated = ResponseEnvelope.parse_obj(env)
        return validated.dict()

    def do_GET(self):
        start = time.time()
        request_id = str(uuid.uuid4())
        parsed = urlparse(self.path)
        # shallow query params
        q = {k: v if len(v) > 1 else v[0] for k, v in parse_qs(parsed.query).items()}
        logger.info(f"req={request_id} START {self.command} {parsed.path} q={q}")
        status = 200
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
                    self._send_json({'error': {'code': 'invalid_parameters', 'message': str(ve)}}, status=400)
                    status = 400
                    return
                else:
                    raise

            if parsed.path == "/api/conditions":
                # Per-module isolation guard: ensure failures in assembling
                # the conditions payload don't take down other endpoints.
                try:
                    # Use short TTL in-process cache for conditions responses only.
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


                        # Use the Package 2 registry to discover the Conditions
                        # normalizer and apply it. Treat missing registration or
                        # normalization errors as module assembly failures.
                        try:
                            norm = registry.get("conditions")
                        except KeyError:
                            logger.exception(f"req={request_id} module.conditions.registry.miss")
                            err_env = self._build_envelope(
                                "error",
                                data=None,
                                meta={},
                                error={
                                    'code': 'module_error',
                                    'message': 'no normalizer registered for conditions',
                                    'details': [ { 'module': 'conditions' } ]
                                }
                            )
                            self._send_json(err_env, status=500)
                            status = 500
                            return

                        try:
                            normalized = norm(resp)
                            if isinstance(normalized, dict):
                                resp = normalized
                                logger.info(f"req={request_id} normalize=ok")
                            else:
                                logger.info(f"req={request_id} normalize=skip type={type(normalized)}")
                        except (NormalizationError, KeyError, TypeError) as e:
                            logger.exception(f"req={request_id} normalize.fail")
                            err_env = self._build_envelope(
                                "error",
                                data=None,
                                meta={},
                                error={
                                    'code': 'normalization_error',
                                    'message': str(e),
                                }
                            )
                            self._send_json(err_env, status=500)
                            status = 500
                            return
                        except Exception:
                            logger.exception(f"req={request_id} module.conditions.assembly.fail")
                            err_env = self._build_envelope(
                                "error",
                                data=None,
                                meta={},
                                error={
                                    'code': 'module_error',
                                    'message': 'failed to assemble conditions payload',
                                    'details': [ { 'module': 'conditions' } ]
                                }
                            )
                            self._send_json(err_env, status=500)
                            status = 500
                            return

                        # Cache the response (without meta) for a short TTL
                        try:
                            cache_payload = deepcopy(resp)
                            if 'meta' in cache_payload:
                                cache_payload.pop('meta', None)
                            if _simple_cache is not None:
                                _simple_cache.set(cache_key, cache_payload, ttl=5)
                        except Exception:
                            logger.exception(f"req={request_id} cache.set.fail key={cache_key}")

                        # Return the fresh response wrapped in the ResponseEnvelope
                        meta = {
                            'cached': False,
                            'cached_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                        }
                        try:
                            envelope = self._build_envelope("ok", data=resp, meta=meta, error=None)
                        except Exception:
                            logger.exception(f"req={request_id} envelope.validation.fail")
                            err_env = self._build_envelope(
                                "error",
                                data=None,
                                meta={},
                                error={
                                    'code': 'envelope_validation_failed',
                                    'message': 'response envelope validation failed'
                                }
                            )
                            self._send_json(err_env, status=500)
                            status = 500
                            return

                        self._send_json(envelope)
                        status = 200
                except Exception:
                    # Module-level assembly failure: return a standard error contract
                    logger.exception(f"req={request_id} module.conditions.unhandled")
                    err_payload = {
                        'error': {
                            'code': 'module_error',
                            'message': 'internal error assembling module',
                            'details': [ { 'module': 'conditions' } ]
                        }
                    }
                    self._send_json(err_payload, status=500)
                    status = 500
            elif parsed.path == "/api/scene/above-me":
                # Minimal Phase 1 scene assembly from mock targets
                try:
                    scene = _build_scene_from_targets(parsed_location)
                    # Wrap in ResponseEnvelope
                    try:
                        envelope = self._build_envelope("ok", data=scene, meta={}, error=None)
                    except Exception:
                        logger.exception(f"req={request_id} scene.envelope.validation.fail")
                        err_env = self._build_envelope(
                            "error",
                            data=None,
                            meta={},
                            error={'code': 'envelope_validation_failed', 'message': 'scene response invalid'}
                        )
                        self._send_json(err_env, status=500)
                        status = 500
                        return

                    self._send_json(envelope)
                    status = 200
                except Exception:
                    logger.exception(f"req={request_id} scene.assembly.fail")
                    self._send_json({'error': {'code': 'module_error', 'message': 'failed to assemble scene'}} , status=500)
                    status = 500

            elif parsed.path.startswith("/api/object/"):
                # Minimal object detail resolver: look up by slug id from targets-derived scene
                try:
                    obj_id = parsed.path[len("/api/object/"):].strip()
                    if not obj_id:
                        self._send_json({'error': {'code': 'invalid_request', 'message': 'missing object id'}}, status=400)
                        status = 400
                        return

                    scene = _build_scene_from_targets(parsed_location)
                    found = None
                    for o in scene.get('objects', []):
                        if o.get('id') == obj_id:
                            found = o
                            break

                    if not found:
                        self._send_json({'error': {'code': 'not_found', 'message': 'object not found'}}, status=404)
                        status = 404
                        return

                    # Build a minimal ObjectDetail payload
                    detail = {
                        'id': found.get('id'),
                        'name': found.get('name'),
                        'type': found.get('type'),
                        'engine': found.get('engine'),
                        'summary': found.get('summary') or '',
                        'description': found.get('summary') or '',
                        'position': found.get('position'),
                        'visibility': found.get('visibility'),
                        'media': [],
                        'related_objects': [],
                    }
                    try:
                        env = self._build_envelope('ok', data=detail, meta={}, error=None)
                    except Exception:
                        logger.exception(f"req={request_id} object.envelope.validation.fail")
                        err_env = self._build_envelope('error', data=None, meta={}, error={'code': 'envelope_validation_failed', 'message': 'object response invalid'})
                        self._send_json(err_env, status=500)
                        status = 500
                        return

                    self._send_json(env)
                    status = 200
                except Exception:
                    logger.exception(f"req={request_id} object.detail.fail")
                    self._send_json({'error': {'code': 'module_error', 'message': 'failed to assemble object detail'}}, status=500)
                    status = 500

            elif parsed.path == "/api/targets":
                # Return mock targets enriched with images when available.
                try:
                    try:
                        from backend.targets_data import get_targets
                    except Exception:
                        # when running as script, adjust path and retry
                        import sys, os
                        repo_root = os.path.dirname(os.path.dirname(__file__))
                        if repo_root not in sys.path:
                            sys.path.insert(0, repo_root)
                        from backend.targets_data import get_targets

                    targets_payload = get_targets(with_images=True)
                    # Attempt to normalize targets via registry if available
                    logger.info(f"req={request_id} registry.keys={list(getattr(registry, '_REGISTRY', {}).keys())}")
                    try:
                        try:
                            norm_targets = registry.get("targets")
                        except KeyError:
                            norm_targets = None

                        # If registry doesn't expose a targets normalizer, try a local import
                        if norm_targets is None:
                            try:
                                try:
                                    from normalizers import targets_normalizer
                                except Exception:
                                    from backend.normalizers import targets_normalizer
                                norm_targets = targets_normalizer.normalize
                                logger.info(f"req={request_id} targets.normalize.fallback=imported")
                            except Exception:
                                norm_targets = None

                        if norm_targets is not None:
                            try:
                                normalized_targets = norm_targets(targets_payload)
                                if isinstance(normalized_targets, list):
                                    targets_payload = normalized_targets
                                    logger.info(f"req={request_id} targets.normalize=ok count={len(targets_payload)}")
                                else:
                                    logger.info(f"req={request_id} targets.normalize=skip type={type(normalized_targets)}")
                            except NormalizationError:
                                logger.exception(f"req={request_id} targets.normalize.fail")
                    except Exception:
                        logger.exception(f"req={request_id} targets.normalize.unexpected")
                except Exception:
                    # on any failure, fall back to static mock targets
                    logger.exception(f"req={request_id} targets.enrich.fail")
                    targets_payload = MOCK_TARGETS

                self._send_json(targets_payload)
                status = 200
            elif parsed.path == "/api/location/search":
                # Minimal mock search: require `q` param of length >= 3
                q_param = q.get('q', '') if q else ''
                if q_param is None:
                    q_param = ''
                q_trim = str(q_param).strip()
                if len(q_trim) < 3:
                    # follow the same error contract pattern used elsewhere
                    self._send_json({'error': {'code': 'invalid_request', 'message': 'q must be at least 3 characters', 'details': [ { 'field': 'q', 'reason': 'too_short' } ] }}, status=400)
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
                            # Return cached payload but signal non-invasively via headers
                            headers = {
                                'X-Cache-Hit': 'true',
                                'X-Cache-At': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                            }
                            self._send_json(cached, extra_headers=headers)
                            status = 200
                            return

                        ql = q_trim.lower()
                        matches = [s for s in suggestions if ql in (s.get('name') or '').lower()]
                        # Validate coordinates on matched suggestions and return 400 on error
                        v_err = _validate_suggestions(matches)
                        if v_err:
                            err_payload = {
                                'error': {
                                    'code': 'invalid_suggestion',
                                    'message': v_err.get('error', SUGGESTION_COORD_MALFORMED),
                                    'details': [ { 'index': v_err.get('index'), 'suggestion': v_err.get('suggestion') } ]
                                }
                            }
                            self._send_json(err_payload, status=400)
                            status = 400
                            return

                        # successful response: cache it briefly and return (signal via headers)
                        try:
                            if _simple_cache is not None:
                                _simple_cache.set(cache_key, matches, ttl=5)
                        except Exception:
                            logger.exception(f"req={request_id} cache.set.fail key={cache_key}")

                        headers = {
                            'X-Cache-Hit': 'false',
                            'X-Cache-At': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                        }
                        self._send_json(matches, extra_headers=headers)
                        status = 200
                    except Exception:
                        logger.exception(f"req={request_id} location.search.load.fail")
                        self._send_json({'error': {'code': 'load_failed', 'message': 'failed to load suggestions'}}, status=500)
                        status = 500
            elif parsed.path == "/api/passes":
                # Accept optional location params but return static mock passes for now
                try:
                    # Prefer a registered normalizer to filter/clean passes
                    try:
                        norm_passes = registry.get("passes")
                    except KeyError:
                        norm_passes = None

                    if norm_passes is not None:
                        try:
                            normalized_passes = norm_passes(MOCK_PASSES)
                            if isinstance(normalized_passes, list):
                                self._send_json(normalized_passes)
                                status = 200
                            else:
                                self._send_json(MOCK_PASSES)
                                status = 200
                        except NormalizationError:
                            logger.exception(f"req={request_id} passes.normalize.fail")
                            self._send_json(MOCK_PASSES)
                            status = 200
                    else:
                        self._send_json(MOCK_PASSES)
                        status = 200
                except Exception:
                    logger.exception(f"req={request_id} passes.unhandled")
                    self._send_json({'error': {'code': 'module_error', 'message': 'failed to load passes'}}, status=500)
                    status = 500
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
    # Allow overriding the bind port via the PORT env var for local testing.
    # Allow overriding the bind host/port via the HOST and PORT env vars for
    # Docker and local testing. HOST must be a plain host (e.g. 0.0.0.0), not
    # a URL.
    host = os.environ.get('HOST', '127.0.0.1')
    try:
        port = int(os.environ.get('PORT', '8000'))
    except Exception:
        port = 8000
    run(host=host, port=port)
