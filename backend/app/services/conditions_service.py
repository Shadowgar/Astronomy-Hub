import os
import json
from copy import deepcopy

from backend.app.cache.redis_cache import cache_get, cache_set
from backend.conditions_data import MOCK_CONDITIONS


def _build_conditions_cache_key(
    lat: str | None = None, lon: str | None = None, elevation_ft: str | None = None
) -> str:
    if lat is None and lon is None and elevation_ft is None:
        return "conditions:oras"
    return f"conditions:custom:{lat}:{lon}:{elevation_ft}"


def build_conditions_response(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
) -> tuple[int, dict]:
    """Build the conditions response while preserving degraded-mode behavior."""
    simulate = os.environ.get("SIMULATE_NORMALIZER_FAIL", "").strip().lower()

    if simulate == "conditions":
        return (
            500,
            {
                "module": "conditions",
                "error": {
                    "code": "module_error",
                    "message": "failed to assemble conditions payload",
                    "details": [{"module": "conditions"}],
                },
            },
        )

    cache_key = _build_conditions_cache_key(lat=lat, lon=lon, elevation_ft=elevation_ft)
    cached_raw = cache_get(cache_key)
    if cached_raw is not None:
        try:
            cached_payload = json.loads(cached_raw)
            if isinstance(cached_payload, dict):
                return (200, cached_payload)
        except Exception:
            pass

    payload = {"status": "ok", "data": deepcopy(MOCK_CONDITIONS)}
    try:
        cache_set(cache_key, json.dumps(payload), ttl_seconds=5)
    except Exception:
        pass
    return (200, payload)
