import os
import json
from datetime import datetime, timezone

from backend.app.cache.redis_cache import cache_get, cache_set
from backend.app.services.live_ingestion import fetch_normalized_live_inputs


_DEFAULT_LOCATION = {
    "latitude": 41.321903,
    "longitude": -79.585394,
    "elevation_ft": 1420.0,
}


def _build_conditions_cache_key(
    lat: str | None = None, lon: str | None = None, elevation_ft: str | None = None
) -> str:
    if lat is None and lon is None and elevation_ft is None:
        return "conditions:oras"
    return f"conditions:custom:{lat}:{lon}:{elevation_ft}"


def _resolve_location(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
) -> dict:
    if lat is None and lon is None and elevation_ft is None:
        return dict(_DEFAULT_LOCATION)
    try:
        if lat is None or lon is None:
            raise ValueError
        out = {
            "latitude": float(lat),
            "longitude": float(lon),
            "elevation_ft": float(elevation_ft) if elevation_ft not in (None, "") else _DEFAULT_LOCATION["elevation_ft"],
        }
        return out
    except Exception:
        return dict(_DEFAULT_LOCATION)


def _build_degraded_conditions_data(
    *,
    reason: str,
    missing_sources: list[str] | None = None,
    timestamp_utc: str | None = None,
) -> dict:
    missing = list(missing_sources or [])
    if not missing:
        missing = ["open_meteo"]
    return {
        "observing_score": "unknown",
        "summary": f"Live conditions unavailable ({reason}); degraded mode is active.",
        "degraded": True,
        "missing_sources": missing,
        "source": "open_meteo",
        "last_updated": timestamp_utc,
    }


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

    location = _resolve_location(lat=lat, lon=lon, elevation_ft=elevation_ft)
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)

    try:
        live_inputs = fetch_normalized_live_inputs(location, now)
    except Exception:
        live_inputs = {
            "conditions": None,
            "provider_trace": {
                "timestamp_utc": now.isoformat(),
                "degraded": True,
                "missing_sources": ["open_meteo"],
            },
        }

    conditions = live_inputs.get("conditions") if isinstance(live_inputs, dict) else None
    provider_trace = live_inputs.get("provider_trace") if isinstance(live_inputs, dict) else None
    if not isinstance(provider_trace, dict):
        provider_trace = {}
    missing_sources = list(provider_trace.get("missing_sources") or [])
    timestamp_utc = provider_trace.get("timestamp_utc")

    if isinstance(conditions, dict):
        data = {
            "observing_score": conditions.get("observing_score") or "unknown",
            "summary": conditions.get("summary") or "Live conditions resolved.",
            "degraded": bool(provider_trace.get("degraded")),
            "missing_sources": missing_sources,
            "source": conditions.get("source") or "open_meteo",
            "last_updated": conditions.get("last_updated"),
            "cloud_cover_pct": conditions.get("cloud_cover_pct"),
            "visibility_m": conditions.get("visibility_m"),
            "temperature_c": conditions.get("temperature_c"),
            "weather_code": conditions.get("weather_code"),
        }
    else:
        data = _build_degraded_conditions_data(
            reason="provider_unavailable",
            missing_sources=missing_sources,
            timestamp_utc=timestamp_utc,
        )

    payload = {"status": "ok", "data": data}
    try:
        cache_set(cache_key, json.dumps(payload), ttl_seconds=5)
    except Exception:
        pass
    return (200, payload)
