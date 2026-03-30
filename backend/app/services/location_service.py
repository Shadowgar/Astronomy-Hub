import os
import time
import json

from backend.cache.simple_cache import SimpleCache
from backend.app.services._legacy_scene_logic import (
    SUGGESTION_COORD_MALFORMED,
    validate_suggestions,
)

_location_search_cache = SimpleCache()


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
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        sugg_path = os.path.join(backend_dir, "location_suggestions.json")
        with open(sugg_path, "r", encoding="utf-8") as fh:
            suggestions = json.load(fh)

        cache_key = f"location_search:{q_trim}"
        cached = _location_search_cache.get(cache_key)
        if cached is not None:
            headers = {
                "X-Cache-Hit": "true",
                "X-Cache-At": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            return (200, cached, headers)

        q_lower = q_trim.lower()
        matches = [s for s in suggestions if q_lower in (s.get("name") or "").lower()]
        v_err = validate_suggestions(matches)
        if v_err:
            return (
                400,
                {
                    "error": {
                        "code": "invalid_suggestion",
                        "message": v_err.get("error", SUGGESTION_COORD_MALFORMED),
                        "details": [{"index": v_err.get("index"), "suggestion": v_err.get("suggestion")}],
                    }
                },
                {},
            )

        try:
            _location_search_cache.set(cache_key, matches, ttl=5)
        except Exception:
            pass

        headers = {
            "X-Cache-Hit": "false",
            "X-Cache-At": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        return (200, matches, headers)
    except Exception:
        return (500, {"error": {"code": "load_failed", "message": "failed to load suggestions"}}, {})
