import os
import sys
import time
import json


def _legacy_server_module():
    """Import legacy backend.server with script-compatible path handling."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    import backend.server as legacy_server

    return legacy_server


def build_location_search_response(q: str | None) -> tuple[int, dict | list, dict]:
    """Thin adapter for legacy location-search behavior."""
    q_param = "" if q is None else q
    q_trim = str(q_param).strip()
    if len(q_trim) < 3:
        return (
            400,
            {
                "error": {
                    "code": "invalid_request",
                    "message": "q must be at least 3 characters",
                    "details": [{"field": "q", "reason": "too_short"}],
                }
            },
            {},
        )

    try:
        legacy_server = _legacy_server_module()
        base = os.path.dirname(legacy_server.__file__)
        sugg_path = os.path.join(base, "location_suggestions.json")
        with open(sugg_path, "r", encoding="utf-8") as fh:
            suggestions = json.load(fh)

        cache_key = f"location_search:{q_trim}"
        try:
            legacy_server._ensure_cache()
        except Exception:
            pass

        cached = (
            legacy_server._simple_cache.get(cache_key)
            if getattr(legacy_server, "_simple_cache", None) is not None
            else None
        )
        if cached is not None:
            headers = {
                "X-Cache-Hit": "true",
                "X-Cache-At": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            return (200, cached, headers)

        q_lower = q_trim.lower()
        matches = [s for s in suggestions if q_lower in (s.get("name") or "").lower()]
        v_err = legacy_server._validate_suggestions(matches)
        if v_err:
            return (
                400,
                {
                    "error": {
                        "code": "invalid_suggestion",
                        "message": v_err.get("error", legacy_server.SUGGESTION_COORD_MALFORMED),
                        "details": [{"index": v_err.get("index"), "suggestion": v_err.get("suggestion")}],
                    }
                },
                {},
            )

        try:
            if getattr(legacy_server, "_simple_cache", None) is not None:
                legacy_server._simple_cache.set(cache_key, matches, ttl=5)
        except Exception:
            pass

        headers = {
            "X-Cache-Hit": "false",
            "X-Cache-At": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        return (200, matches, headers)
    except Exception:
        return (500, {"error": {"code": "load_failed", "message": "failed to load suggestions"}}, {})

