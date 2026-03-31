from __future__ import annotations

from datetime import datetime, timezone
import threading
import time
from typing import Any

from backend.app.services.live_providers import (
    PROVIDER_CACHE_TTL_SECONDS,
    fetch_celestrak_active,
    fetch_jpl_ephemeris,
    fetch_open_meteo_conditions,
    fetch_opensky_nearby,
    fetch_swpc_alerts,
)


_INGESTION_CACHE_LOCK = threading.Lock()
_INGESTION_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}
_INGESTION_CACHE_TTL_SECONDS = 90


def _iso_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def _cache_key(location: dict[str, Any], time_context: datetime) -> str:
    return (
        f"{round(float(location.get('latitude') or 0.0), 3)}:"
        f"{round(float(location.get('longitude') or 0.0), 3)}:"
        f"{round(float(location.get('elevation_ft') or 0.0), 1)}:"
        f"{time_context.strftime('%Y%m%d%H')}"
    )


def _cache_get(key: str) -> dict[str, Any] | None:
    now = time.time()
    with _INGESTION_CACHE_LOCK:
        payload = _INGESTION_CACHE.get(key)
        if not payload:
            return None
        expires_at, value = payload
        if expires_at <= now:
            _INGESTION_CACHE.pop(key, None)
            return None
        return value


def _cache_set(key: str, value: dict[str, Any], ttl_seconds: int = _INGESTION_CACHE_TTL_SECONDS) -> None:
    with _INGESTION_CACHE_LOCK:
        _INGESTION_CACHE[key] = (time.time() + max(1, int(ttl_seconds)), value)


def _safe_parse_dt(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None


def _adapt_conditions(raw: Any) -> dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None
    try:
        return {
            "cloud_cover_pct": int(raw.get("cloud_cover_pct", 100)),
            "visibility_m": int(raw.get("visibility_m", 0)),
            "temperature_c": float(raw.get("temperature_c", 0.0)),
            "weather_code": int(raw.get("weather_code", 0)),
            "observing_score": str(raw.get("observing_score") or "fair"),
            "summary": str(raw.get("summary") or ""),
            "last_updated": str(raw.get("last_updated") or ""),
        }
    except Exception:
        return None


def _adapt_sats(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    out: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        sat_id = str(item.get("id") or "").strip()
        name = str(item.get("name") or "").strip()
        if not sat_id or not name:
            continue
        source = str(item.get("source") or "celestrak").strip().lower()
        out.append({"id": sat_id, "name": name, "source": source})
    return out


def _adapt_flights(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    out: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        try:
            out.append(
                {
                    "id": str(item.get("id") or "").strip(),
                    "name": str(item.get("name") or "").strip(),
                    "distance_km": float(item.get("distance_km") or 0.0),
                    "elevation": float(item.get("elevation") or 0.0),
                    "longitude": float(item.get("longitude") or 0.0),
                    "latitude": float(item.get("latitude") or 0.0),
                }
            )
        except Exception:
            continue
    return [f for f in out if f["id"] and f["name"]]


def _adapt_ephemeris(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    out: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        ident = str(item.get("id") or "").strip()
        name = str(item.get("name") or "").strip()
        if not ident or not name:
            continue
        try:
            out.append(
                {
                    "id": ident,
                    "name": name,
                    "azimuth": float(item.get("azimuth") or 0.0),
                    "elevation": float(item.get("elevation") or 0.0),
                }
            )
        except Exception:
            continue
    return out


def _adapt_alerts(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    out: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        out.append(
            {
                "priority": str(item.get("priority") or "notice"),
                "category": str(item.get("category") or "space_weather"),
                "title": str(item.get("title") or "Alert"),
                "summary": str(item.get("summary") or ""),
                "relevance": str(item.get("relevance") or "low"),
            }
        )
    return out


def _normalize_conditions(adapted: dict[str, Any] | None) -> dict[str, Any] | None:
    if not isinstance(adapted, dict):
        return None
    return {
        "cloud_cover_pct": max(0, min(100, int(adapted.get("cloud_cover_pct") or 0))),
        "visibility_m": max(0, int(adapted.get("visibility_m") or 0)),
        "temperature_c": float(adapted.get("temperature_c") or 0.0),
        "weather_code": int(adapted.get("weather_code") or 0),
        "observing_score": str(adapted.get("observing_score") or "fair"),
        "summary": str(adapted.get("summary") or ""),
        "last_updated": str(adapted.get("last_updated") or ""),
        "source": "open_meteo",
    }


def _normalize_list(items: list[dict[str, Any]], source: str, allowed: tuple[str, ...]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        normalized = {key: item.get(key) for key in allowed}
        normalized["source"] = source
        out.append(normalized)
    return out


def _validate_conditions(normalized: dict[str, Any] | None, now: datetime) -> tuple[bool, str]:
    if not isinstance(normalized, dict):
        return (False, "invalid_payload")
    required = ("observing_score", "summary", "last_updated")
    if any(not normalized.get(key) for key in required):
        return (False, "missing_required")
    updated_at = _safe_parse_dt(normalized.get("last_updated"))
    if updated_at is None:
        return (False, "invalid_timestamp")
    if (now - updated_at).total_seconds() > 6 * 3600:
        return (False, "stale")
    return (True, "ok")


def _validate_list(items: list[dict[str, Any]], required_keys: tuple[str, ...]) -> tuple[bool, str]:
    if not isinstance(items, list):
        return (False, "invalid_payload")
    for item in items:
        if not isinstance(item, dict):
            return (False, "invalid_item")
        if any(item.get(key) in (None, "") for key in required_keys):
            return (False, "missing_required")
    return (True, "ok")


def _provider_status(ok: bool, reason: str, cache_state: str) -> dict[str, Any]:
    return {
        "ok": bool(ok),
        "reason": reason,
        "stages": {
            "provider": "ok" if ok else "failed",
            "adapter": "ok" if ok else "failed",
            "normalizer": "ok" if ok else "failed",
            "validator": "ok" if ok else "failed",
            "cache": cache_state,
        },
    }


def _freshness_trace(now: datetime, *, cache_state: str) -> dict[str, Any]:
    return {
        "resolved_at_utc": _iso_utc(now),
        "ingestion_cache": {
            "state": cache_state,
            "ttl_seconds": _INGESTION_CACHE_TTL_SECONDS,
        },
        "provider_cache_ttl_seconds": dict(PROVIDER_CACHE_TTL_SECONDS),
    }


def fetch_normalized_live_inputs(location: dict[str, Any], time_context: datetime) -> dict[str, Any]:
    """Pipeline boundary: Provider -> Adapter -> Normalizer -> Validator -> Cache -> Engine Input."""
    now = time_context.astimezone(timezone.utc)
    key = _cache_key(location, now)
    cached = _cache_get(key)
    if isinstance(cached, dict):
        cloned = dict(cached)
        trace = dict(cloned.get("provider_trace") or {})
        providers = dict(trace.get("providers") or {})
        patched_providers: dict[str, Any] = {}
        for provider_name, value in providers.items():
            if isinstance(value, dict):
                stages = dict(value.get("stages") or {})
                stages["cache"] = "hit"
                patched = dict(value)
                patched["stages"] = stages
                patched_providers[provider_name] = patched
            else:
                patched_providers[provider_name] = value
        trace["providers"] = patched_providers
        trace["freshness"] = _freshness_trace(now, cache_state="hit")
        cloned["provider_trace"] = trace
        return cloned

    lat = float(location.get("latitude") or 0.0)
    lon = float(location.get("longitude") or 0.0)
    elevation_ft = float(location.get("elevation_ft") or 0.0)

    raw_conditions = None
    raw_sats = None
    raw_flights = None
    raw_ephemeris = None
    raw_alerts = None

    try:
        raw_conditions = fetch_open_meteo_conditions(lat, lon)
    except Exception:
        raw_conditions = None
    try:
        raw_sats = fetch_celestrak_active(limit=400, lat=lat, lon=lon)
    except Exception:
        raw_sats = None
    try:
        raw_flights = fetch_opensky_nearby(lat, lon, radius_km=450.0, limit=6)
    except Exception:
        raw_flights = None
    try:
        raw_ephemeris = fetch_jpl_ephemeris(lat, lon, elevation_ft=elevation_ft)
    except Exception:
        raw_ephemeris = None
    try:
        raw_alerts = fetch_swpc_alerts(limit=3)
    except Exception:
        raw_alerts = None

    adapted_conditions = _adapt_conditions(raw_conditions)
    adapted_sats = _adapt_sats(raw_sats)
    adapted_flights = _adapt_flights(raw_flights)
    adapted_ephemeris = _adapt_ephemeris(raw_ephemeris)
    adapted_alerts = _adapt_alerts(raw_alerts)

    norm_conditions = _normalize_conditions(adapted_conditions)
    norm_sats = []
    for sat in adapted_sats:
        if not isinstance(sat, dict):
            continue
        sat_id = str(sat.get("id") or "").strip()
        name = str(sat.get("name") or "").strip()
        if not sat_id or not name:
            continue
        norm_sats.append(
            {
                "id": sat_id,
                "name": name,
                "source": str(sat.get("source") or "celestrak").strip().lower(),
            }
        )
    norm_flights = _normalize_list(
        adapted_flights,
        "opensky",
        ("id", "name", "distance_km", "elevation", "longitude", "latitude"),
    )
    norm_ephemeris = _normalize_list(adapted_ephemeris, "jpl_ephemeris", ("id", "name", "azimuth", "elevation"))
    norm_alerts = _normalize_list(adapted_alerts, "noaa_swpc", ("priority", "category", "title", "summary", "relevance"))

    cond_ok, cond_reason = _validate_conditions(norm_conditions, now)
    sat_ok, sat_reason = _validate_list(norm_sats, ("id", "name"))
    if sat_ok and not norm_sats:
        sat_ok = False
        sat_reason = "no_data"
    flight_ok, flight_reason = _validate_list(
        norm_flights,
        ("id", "name", "distance_km", "elevation", "longitude", "latitude"),
    )
    eph_ok, eph_reason = _validate_list(norm_ephemeris, ("id", "name", "azimuth", "elevation"))
    alert_ok, alert_reason = _validate_list(norm_alerts, ("priority", "category", "title", "summary", "relevance"))

    sat_reason_effective = sat_reason
    if sat_ok and norm_sats:
        sat_source = str((norm_sats[0] or {}).get("source") or "").strip().lower()
        if sat_source and sat_source != "celestrak":
            sat_reason_effective = f"fallback:{sat_source}"

    providers = {
        "open_meteo": _provider_status(cond_ok, cond_reason, "miss"),
        "celestrak": _provider_status(sat_ok, sat_reason_effective, "miss"),
        "opensky": _provider_status(flight_ok, flight_reason, "miss"),
        "jpl_ephemeris": _provider_status(eph_ok, eph_reason, "miss"),
        "noaa_swpc": _provider_status(alert_ok, alert_reason, "miss"),
    }

    missing_sources = [name for name, status in providers.items() if not bool(status.get("ok"))]
    payload: dict[str, Any] = {
        "conditions": norm_conditions if cond_ok else None,
        "satellites": norm_sats if sat_ok else [],
        "flights": norm_flights if flight_ok else [],
        "ephemeris": norm_ephemeris if eph_ok else [],
        "alerts": norm_alerts if alert_ok else [],
        "provider_trace": {
            "timestamp_utc": _iso_utc(now),
            "freshness": _freshness_trace(now, cache_state="miss"),
            "location": {
                "latitude": lat,
                "longitude": lon,
                "elevation_ft": elevation_ft,
            },
            "providers": providers,
            "degraded": bool(missing_sources),
            "missing_sources": missing_sources,
            "pipeline": "Provider->Adapter->Normalizer->Validator->Cache->EngineInput",
        },
    }
    _cache_set(key, payload)
    return payload


def _clear_ingestion_cache_for_tests() -> None:
    with _INGESTION_CACHE_LOCK:
        _INGESTION_CACHE.clear()
