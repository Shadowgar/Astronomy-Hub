from __future__ import annotations

from datetime import datetime, timedelta, timezone
import math
import os
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
    "space_track": 1800,
    "satnogs": 3600,
    "n2yo": 300,
    "tle_api": 3600,
    "g7vrd": 300,
    "wheretheiss": 60,
    "jpl_ephemeris": 1800,
    "noaa_swpc": 3600,
}

JPL_EPHEMERIS_BODIES: tuple[tuple[str, str], ...] = (
    ("301", "Moon"),
    ("199", "Mercury"),
    ("299", "Venus"),
    ("499", "Mars"),
    ("599", "Jupiter"),
    ("699", "Saturn"),
)


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
    temperature_f = (temperature_c * 9.0 / 5.0) + 32.0
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
        "summary": (
            f"Live weather: cloud {cloud_cover}% visibility {visibility_m}m "
            f"temp {temperature_c:.1f}C / {temperature_f:.1f}F"
        ),
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


def fetch_celestrak_active(*, limit: int = 500, lat: float | None = None, lon: float | None = None) -> list[dict[str, Any]]:
    # Prefer Space-Track when credentials are configured.
    space_track_active = fetch_space_track_active(limit=limit)
    if space_track_active:
        return space_track_active

    now_hour = datetime.now(timezone.utc).strftime("%Y%m%d%H")
    cache_key = f"celestrak:active:{limit}:{now_hour}"
    cached = _cache_get(cache_key)
    if isinstance(cached, list):
        return cached

    try:
        payload = _http_get_json(
            "https://celestrak.org/NORAD/elements/gp.php",
            params={"GROUP": "active", "FORMAT": "json"},
            timeout_s=4.0,
        )
    except Exception:
        payload = []
    if not isinstance(payload, list):
        payload = []
    out: list[dict[str, Any]] = []
    for entry in payload[: max(0, int(limit))]:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("OBJECT_NAME") or "").strip()
        if not name:
            continue
        sat = {
            "id": str(entry.get("NORAD_CAT_ID") or name).strip().lower(),
            "name": name,
            "source": "celestrak",
        }
        tle_line1 = str(entry.get("TLE_LINE1") or "").strip()
        tle_line2 = str(entry.get("TLE_LINE2") or "").strip()
        if tle_line1 and tle_line2:
            sat["tle_line1"] = tle_line1
            sat["tle_line2"] = tle_line2
        out.append(
            sat
        )
    if out:
        _cache_set(cache_key, out, ttl_seconds=PROVIDER_CACHE_TTL_SECONDS["celestrak"])
        return out

    satnogs_active = fetch_satnogs_active(limit=limit)
    if satnogs_active:
        return satnogs_active

    if lat is not None and lon is not None:
        n2yo_active = fetch_n2yo_above(lat, lon, limit=min(limit, 100))
        if n2yo_active:
            return n2yo_active

    tle_api_active = fetch_tle_api_active(limit=limit)
    if tle_api_active:
        return tle_api_active

    if lat is not None and lon is not None:
        g7vrd_candidates = fetch_g7vrd_pass_candidates(lat, lon, limit=min(limit, 12))
        if g7vrd_candidates:
            return g7vrd_candidates

    # Last-resort fallback returns ISS only.
    return fetch_wheretheiss_active(limit=limit)


def fetch_space_track_active(*, limit: int = 500) -> list[dict[str, Any]]:
    identity = os.getenv("SPACE_TRACK_IDENTITY") or os.getenv("SPACE_TRACK_USERNAME")
    password = os.getenv("SPACE_TRACK_PASSWORD")
    if not identity or not password:
        return []

    now_hour = datetime.now(timezone.utc).strftime("%Y%m%d%H")
    cache_key = f"space_track:gp:{limit}:{now_hour}"
    cached = _cache_get(cache_key)
    if isinstance(cached, list):
        return cached

    try:
        with httpx.Client(timeout=6.0, headers={"User-Agent": "astronomy-hub/live-providers"}) as client:
            login = client.post(
                "https://www.space-track.org/ajaxauth/login",
                data={"identity": identity, "password": password},
            )
            login.raise_for_status()
            response = client.get(
                "https://www.space-track.org/basicspacedata/query/class/gp/"
                "decay_date/null-val/epoch/%3Enow-30/orderby/NORAD_CAT_ID/"
                f"limit/{max(1, int(limit))}/format/json"
            )
            response.raise_for_status()
            payload = response.json()
    except Exception:
        return []

    if not isinstance(payload, list):
        return []

    out: list[dict[str, Any]] = []
    for entry in payload:
        if not isinstance(entry, dict):
            continue
        sat_id = str(entry.get("NORAD_CAT_ID") or entry.get("norad_cat_id") or "").strip()
        name = str(entry.get("OBJECT_NAME") or entry.get("object_name") or "").strip()
        if not sat_id or not name:
            continue
        sat = {"id": sat_id.lower(), "name": name, "source": "space_track"}
        tle_line1 = str(
            entry.get("TLE_LINE1")
            or entry.get("tle_line1")
            or entry.get("line1")
            or ""
        ).strip()
        tle_line2 = str(
            entry.get("TLE_LINE2")
            or entry.get("tle_line2")
            or entry.get("line2")
            or ""
        ).strip()
        if tle_line1 and tle_line2:
            sat["tle_line1"] = tle_line1
            sat["tle_line2"] = tle_line2
        out.append(sat)

    if out:
        _cache_set(cache_key, out, ttl_seconds=PROVIDER_CACHE_TTL_SECONDS["space_track"])
    return out


def fetch_satnogs_active(*, limit: int = 500) -> list[dict[str, Any]]:
    now_hour = datetime.now(timezone.utc).strftime("%Y%m%d%H")
    cache_key = f"satnogs:active:{limit}:{now_hour}"
    cached = _cache_get(cache_key)
    if isinstance(cached, list):
        return cached

    try:
        payload = _http_get_json(
            "https://db.satnogs.org/api/satellites/",
            params={"format": "json", "status": "alive"},
            timeout_s=6.0,
        )
    except Exception:
        payload = []
    if not isinstance(payload, list):
        return []

    out: list[dict[str, Any]] = []
    for entry in payload:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("name") or "").strip()
        norad = entry.get("norad_cat_id")
        sat_id = str(norad if norad not in (None, "") else entry.get("sat_id") or "").strip()
        if not name or not sat_id:
            continue
        out.append({"id": sat_id.lower(), "name": name, "source": "satnogs"})
        if len(out) >= max(1, int(limit)):
            break

    if out:
        _cache_set(cache_key, out, ttl_seconds=PROVIDER_CACHE_TTL_SECONDS["satnogs"])
    return out


def fetch_n2yo_above(lat: float, lon: float, *, limit: int = 100, radius_km: int = 70) -> list[dict[str, Any]]:
    api_key = os.getenv("N2YO_API_KEY")
    if not api_key:
        return []

    now_bucket = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")[:-1]  # 10-minute cache bucket
    cache_key = f"n2yo:above:{round(lat, 2)}:{round(lon, 2)}:{radius_km}:{limit}:{now_bucket}"
    cached = _cache_get(cache_key)
    if isinstance(cached, list):
        return cached

    try:
        payload = _http_get_json(
            (
                "https://api.n2yo.com/rest/v1/satellite/above/"
                f"{lat:.4f}/{lon:.4f}/0/{max(1, int(radius_km))}/0/&apiKey={api_key}"
            ),
            timeout_s=5.0,
        )
    except Exception:
        return []

    items = payload.get("above") if isinstance(payload, dict) else None
    if not isinstance(items, list):
        return []

    out: list[dict[str, Any]] = []
    for entry in items:
        if not isinstance(entry, dict):
            continue
        sat_id = str(entry.get("satid") or "").strip()
        name = str(entry.get("satname") or "").strip()
        if not sat_id or not name:
            continue
        out.append({"id": sat_id.lower(), "name": name, "source": "n2yo"})
        if len(out) >= max(1, int(limit)):
            break

    if out:
        _cache_set(cache_key, out, ttl_seconds=PROVIDER_CACHE_TTL_SECONDS["n2yo"])
    return out


def fetch_tle_api_active(*, limit: int = 500) -> list[dict[str, Any]]:
    now_hour = datetime.now(timezone.utc).strftime("%Y%m%d%H")
    cache_key = f"tle_api:active:{limit}:{now_hour}"
    cached = _cache_get(cache_key)
    if isinstance(cached, list):
        return cached

    try:
        payload = _http_get_json(
            "https://tle.ivanstanojevic.me/api/tle/",
            params={"format": "json"},
            timeout_s=6.0,
        )
    except Exception:
        return []

    if isinstance(payload, dict):
        items = payload.get("member")
    elif isinstance(payload, list):
        items = payload
    else:
        items = None
    if not isinstance(items, list):
        return []

    out: list[dict[str, Any]] = []
    for entry in items:
        if not isinstance(entry, dict):
            continue
        sat_id = str(entry.get("satelliteId") or entry.get("satellite_id") or "").strip()
        name = str(entry.get("name") or "").strip()
        if not sat_id or not name:
            continue
        sat = {"id": sat_id.lower(), "name": name, "source": "tle_api"}
        tle_line1 = str(entry.get("line1") or entry.get("tle_line1") or "").strip()
        tle_line2 = str(entry.get("line2") or entry.get("tle_line2") or "").strip()
        if tle_line1 and tle_line2:
            sat["tle_line1"] = tle_line1
            sat["tle_line2"] = tle_line2
        out.append(sat)
        if len(out) >= max(1, int(limit)):
            break

    if out:
        _cache_set(cache_key, out, ttl_seconds=PROVIDER_CACHE_TTL_SECONDS["tle_api"])
    return out


def fetch_g7vrd_pass_candidates(lat: float, lon: float, *, limit: int = 12, hours: int = 12) -> list[dict[str, Any]]:
    now_bucket = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")[:-1]  # 10-minute cache bucket
    cache_key = f"g7vrd:passes:{round(lat, 2)}:{round(lon, 2)}:{hours}:{limit}:{now_bucket}"
    cached = _cache_get(cache_key)
    if isinstance(cached, list):
        return cached

    # Small, stable set of commonly observed objects for deterministic pass-candidate fallback.
    candidate_ids = (
        ("25544", "ISS"),
        ("20580", "HST"),
        ("48274", "TIANGONG"),
        ("25338", "NOAA 15"),
        ("28654", "NOAA 18"),
        ("33591", "NOAA 19"),
    )

    out: list[dict[str, Any]] = []
    for sat_id, default_name in candidate_ids:
        try:
            payload = _http_get_json(
                f"https://api.g7vrd.co.uk/v1/satellite-passes/{sat_id}/{lat:.4f}/{lon:.4f}.json",
                params={"minelevation": 12, "hours": max(1, int(hours))},
                timeout_s=4.0,
            )
        except Exception:
            continue
        passes = payload.get("passes") if isinstance(payload, dict) else None
        if not isinstance(passes, list) or not passes:
            continue
        sat_name = str(payload.get("satellite_name") or default_name).strip() or default_name
        sat = {"id": sat_id, "name": sat_name, "source": "g7vrd"}
        first_pass = passes[0] if isinstance(passes[0], dict) else None
        if isinstance(first_pass, dict):
            pass_start = str(first_pass.get("start") or first_pass.get("start_time") or "").strip()
            if pass_start:
                sat["pass_start"] = pass_start
            pass_end = str(first_pass.get("end") or first_pass.get("end_time") or "").strip()
            if pass_end:
                sat["pass_end"] = pass_end
            try:
                sat["max_elevation_deg"] = float(first_pass.get("max_elevation") or 0.0)
            except Exception:
                pass
            try:
                duration_sec = int(float(first_pass.get("duration_sec") or first_pass.get("duration") or 0.0))
                if duration_sec > 0:
                    sat["duration_sec"] = duration_sec
            except Exception:
                pass
        out.append(sat)
        if len(out) >= max(1, int(limit)):
            break

    if out:
        _cache_set(cache_key, out, ttl_seconds=PROVIDER_CACHE_TTL_SECONDS["g7vrd"])
    return out


def fetch_wheretheiss_active(*, limit: int = 500) -> list[dict[str, Any]]:
    if int(limit) <= 0:
        return []

    now_minute = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")
    cache_key = f"wheretheiss:25544:{now_minute}"
    cached = _cache_get(cache_key)
    if isinstance(cached, list):
        return cached

    try:
        payload = _http_get_json("https://api.wheretheiss.at/v1/satellites/25544", timeout_s=4.0)
    except Exception:
        return []
    if not isinstance(payload, dict):
        return []

    sat_id = str(payload.get("id") or "25544").strip()
    sat_name = str(payload.get("name") or "ISS").strip().upper()
    if not sat_id:
        return []

    out = [{"id": sat_id.lower(), "name": sat_name, "source": "wheretheiss"}]
    _cache_set(cache_key, out, ttl_seconds=PROVIDER_CACHE_TTL_SECONDS["wheretheiss"])
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


def fetch_jpl_ephemeris(
    lat: float,
    lon: float,
    elevation_ft: float | None = None,
    as_of: datetime | None = None,
) -> list[dict[str, Any]]:
    if isinstance(as_of, datetime):
        now = as_of.astimezone(timezone.utc).replace(minute=0, second=0, microsecond=0)
    else:
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
    out: list[dict[str, Any]] = []

    for body_id, body_name in JPL_EPHEMERIS_BODIES:
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
