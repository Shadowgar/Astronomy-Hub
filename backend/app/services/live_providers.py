from __future__ import annotations

from datetime import datetime, timedelta, timezone
import math
import threading
import time
from typing import Any

import httpx


_CACHE_LOCK = threading.Lock()
_CACHE: dict[str, tuple[float, Any]] = {}

PROVIDER_CACHE_TTL_SECONDS: dict[str, int] = {
    "open_meteo": 300,
    "opensky": 90,
    "celestrak": 3600,
    "jpl_ephemeris": 1800,
    "noaa_swpc": 3600,
}


def _cache_get(key: str) -> Any | None:
    now = time.time()
    with _CACHE_LOCK:
        item = _CACHE.get(key)
        if not item:
            return None
        expires_at, payload = item
        if expires_at <= now:
            _CACHE.pop(key, None)
            return None
        return payload


def _cache_set(key: str, payload: Any, ttl_seconds: int) -> None:
    with _CACHE_LOCK:
        _CACHE[key] = (time.time() + max(1, int(ttl_seconds)), payload)


def _http_get_json(url: str, *, params: dict[str, Any] | None = None, timeout_s: float = 5.0) -> Any:
    with httpx.Client(timeout=timeout_s, headers={"User-Agent": "astronomy-hub/live-providers"}) as client:
        response = client.get(url, params=params)
        response.raise_for_status()
        return response.json()


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def fetch_open_meteo_conditions(lat: float, lon: float) -> dict[str, Any] | None:
    now_hour = datetime.now(timezone.utc).strftime("%Y%m%d%H")
    cache_key = f"open_meteo:{round(lat, 3)}:{round(lon, 3)}:{now_hour}"
    cached = _cache_get(cache_key)
    if isinstance(cached, dict):
        return cached

    payload = _http_get_json(
        "https://api.open-meteo.com/v1/forecast",
        params={
            "latitude": lat,
            "longitude": lon,
            "current": "cloud_cover,visibility,temperature_2m,weather_code",
            "timezone": "UTC",
        },
        timeout_s=4.0,
    )
    current = payload.get("current") if isinstance(payload, dict) else None
    if not isinstance(current, dict):
        return None

    cloud_cover = int(round(float(current.get("cloud_cover") or 100)))
    visibility_m = int(round(float(current.get("visibility") or 0)))
    temperature_c = float(current.get("temperature_2m") or 0.0)
    weather_code = int(round(float(current.get("weather_code") or 0)))

    # Deterministic observing label from cloud/visibility.
    if cloud_cover <= 20 and visibility_m >= 12000:
        observing_score = "excellent"
    elif cloud_cover <= 40 and visibility_m >= 8000:
        observing_score = "good"
    elif cloud_cover <= 65 and visibility_m >= 5000:
        observing_score = "fair"
    else:
        observing_score = "poor"

    result = {
        "cloud_cover_pct": max(0, min(100, cloud_cover)),
        "visibility_m": max(0, visibility_m),
        "temperature_c": temperature_c,
        "weather_code": weather_code,
        "observing_score": observing_score,
        "summary": f"Live weather: cloud {cloud_cover}% visibility {visibility_m}m temp {temperature_c:.1f}C",
        "last_updated": current.get("time") or datetime.now(timezone.utc).isoformat(),
    }
    _cache_set(cache_key, result, ttl_seconds=PROVIDER_CACHE_TTL_SECONDS["open_meteo"])
    return result


def fetch_opensky_nearby(lat: float, lon: float, *, radius_km: float = 350.0, limit: int = 4) -> list[dict[str, Any]]:
    now_bucket = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")[:-1]  # 10-minute cache bucket
    cache_key = f"opensky:{round(lat, 2)}:{round(lon, 2)}:{now_bucket}:{int(radius_km)}:{limit}"
    cached = _cache_get(cache_key)
    if isinstance(cached, list):
        return cached

    payload = _http_get_json("https://opensky-network.org/api/states/all", timeout_s=4.0)
    states = payload.get("states") if isinstance(payload, dict) else None
    if not isinstance(states, list):
        return []

    nearby: list[dict[str, Any]] = []
    for row in states:
        if not isinstance(row, list) or len(row) < 14:
            continue
        callsign = (row[1] or "").strip()
        row_lon = row[5]
        row_lat = row[6]
        baro_alt_m = row[7]
        on_ground = bool(row[8])
        geo_alt_m = row[13]
        if row_lon is None or row_lat is None or on_ground:
            continue
        try:
            dist = _haversine_km(lat, lon, float(row_lat), float(row_lon))
        except Exception:
            continue
        if dist > radius_km:
            continue

        altitude_m = float(geo_alt_m or baro_alt_m or 0.0)
        elevation = max(5.0, min(85.0, altitude_m / 250.0))
        name = callsign or f"Flight {str(row[0] or '').upper()}"
        nearby.append(
            {
                "id": str(row[0] or name).strip().lower(),
                "name": name,
                "distance_km": dist,
                "elevation": elevation,
                "longitude": float(row_lon),
                "latitude": float(row_lat),
            }
        )

    nearby.sort(key=lambda entry: (entry["distance_km"], entry["name"]))
    result = nearby[: max(0, int(limit))]
    _cache_set(cache_key, result, ttl_seconds=PROVIDER_CACHE_TTL_SECONDS["opensky"])
    return result


def fetch_celestrak_active(*, limit: int = 500) -> list[dict[str, Any]]:
    now_hour = datetime.now(timezone.utc).strftime("%Y%m%d%H")
    cache_key = f"celestrak:active:{limit}:{now_hour}"
    cached = _cache_get(cache_key)
    if isinstance(cached, list):
        return cached

    payload = _http_get_json(
        "https://celestrak.org/NORAD/elements/gp.php",
        params={"GROUP": "active", "FORMAT": "json"},
        timeout_s=4.0,
    )
    if not isinstance(payload, list):
        return []
    out: list[dict[str, Any]] = []
    for entry in payload[: max(0, int(limit))]:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("OBJECT_NAME") or "").strip()
        if not name:
            continue
        out.append(
            {
                "id": str(entry.get("NORAD_CAT_ID") or name).strip().lower(),
                "name": name,
            }
        )
    _cache_set(cache_key, out, ttl_seconds=PROVIDER_CACHE_TTL_SECONDS["celestrak"])
    return out


def _parse_horizons_first_row(result_text: str) -> tuple[float, float] | None:
    if "$$SOE" not in result_text or "$$EOE" not in result_text:
        return None
    section = result_text.split("$$SOE", 1)[1].split("$$EOE", 1)[0]
    for raw_line in section.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        parts = line.split()
        if len(parts) < 5:
            continue
        try:
            az = float(parts[3])
            el = float(parts[4])
            return (az, el)
        except Exception:
            continue
    return None


def fetch_jpl_ephemeris(lat: float, lon: float, elevation_ft: float | None = None) -> list[dict[str, Any]]:
    now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
    now_hour = now.strftime("%Y%m%d%H")
    cache_key = f"jpl:{round(lat, 3)}:{round(lon, 3)}:{elevation_ft or 0}:{now_hour}"
    cached = _cache_get(cache_key)
    if isinstance(cached, list):
        return cached

    elev_km = float(elevation_ft or 0.0) * 0.0003048
    start = now.strftime("%Y-%m-%d %H:%M")
    stop = (now + timedelta(hours=1)).strftime("%Y-%m-%d %H:%M")
    site_coord = f"{lon:.6f},{lat:.6f},{elev_km:.6f}"
    bodies = [("301", "Moon"), ("499", "Mars")]
    out: list[dict[str, Any]] = []

    for body_id, body_name in bodies:
        try:
            payload = _http_get_json(
                "https://ssd.jpl.nasa.gov/api/horizons.api",
                params={
                    "format": "json",
                    "COMMAND": f"'{body_id}'",
                    "EPHEM_TYPE": "OBSERVER",
                    "CENTER": "'coord@399'",
                    "SITE_COORD": f"'{site_coord}'",
                    "START_TIME": f"'{start}'",
                    "STOP_TIME": f"'{stop}'",
                    "STEP_SIZE": "'1 h'",
                    "QUANTITIES": "'4,20,23'",
                },
                timeout_s=4.0,
            )
            result_text = str(payload.get("result") or "")
            az_el = _parse_horizons_first_row(result_text)
            if az_el is None:
                continue
            azimuth, elevation = az_el
            out.append(
                {
                    "id": body_name.lower(),
                    "name": body_name,
                    "azimuth": azimuth,
                    "elevation": elevation,
                }
            )
        except Exception:
            continue

    _cache_set(cache_key, out, ttl_seconds=PROVIDER_CACHE_TTL_SECONDS["jpl_ephemeris"])
    return out


def fetch_swpc_alerts(limit: int = 3) -> list[dict[str, Any]]:
    now_bucket = datetime.now(timezone.utc).strftime("%Y%m%d%H")
    cache_key = f"swpc:kindex:{limit}:{now_bucket}"
    cached = _cache_get(cache_key)
    if isinstance(cached, list):
        return cached

    payload = _http_get_json(
        "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json",
        timeout_s=4.0,
    )
    if not isinstance(payload, list) or len(payload) < 2:
        return []

    rows = [row for row in payload[1:] if isinstance(row, list) and len(row) >= 2]
    rows = rows[-max(1, limit):]
    alerts: list[dict[str, Any]] = []
    for row in rows:
        time_tag = str(row[0])
        try:
            kp = float(row[1])
        except Exception:
            continue
        if kp >= 5:
            priority = "major"
            relevance = "high"
            summary = f"Geomagnetic storm-level activity (Kp {kp:.2f})"
        elif kp >= 4:
            priority = "notice"
            relevance = "medium"
            summary = f"Elevated geomagnetic activity (Kp {kp:.2f})"
        else:
            priority = "notice"
            relevance = "low"
            summary = f"Calm geomagnetic conditions (Kp {kp:.2f})"
        alerts.append(
            {
                "priority": priority,
                "category": "space_weather",
                "title": f"NOAA Kp update {time_tag}",
                "summary": summary,
                "relevance": relevance,
            }
        )

    _cache_set(cache_key, alerts, ttl_seconds=PROVIDER_CACHE_TTL_SECONDS["noaa_swpc"])
    return alerts
