import os
import json
import urllib.parse
from datetime import datetime, timedelta, timezone

from backend.app.cache.redis_cache import cache_get, cache_set
from backend.app.services.live_ingestion import fetch_normalized_live_inputs


_DEFAULT_LOCATION = {
    "latitude": 41.321903,
    "longitude": -79.585394,
    "elevation_ft": 1420.0,
}
_RADAR_FRAME_COUNT = 10
_RADAR_FRAME_STEP_MINUTES = 10


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
        "confidence": "low",
        "warnings": ["provider data unavailable"],
        "best_for": [],
        "conditions": {
            "cloud_cover": "unknown",
            "transparency": "unknown",
            "seeing": "unknown",
            "darkness": "unknown",
            "smoke": "unknown",
            "wind": "unknown",
            "humidity": "unknown",
        },
        "transparency": "unknown",
        "seeing": "unknown",
        "darkness": "unknown",
        "smoke": "unknown",
        "wind_mph": None,
        "humidity_pct": None,
        "dew_point_c": None,
        "moon_interference": "unknown",
        "degraded": True,
        "missing_sources": missing,
        "source": "open_meteo",
        "last_updated": timestamp_utc,
    }


def _build_noaa_radar_frame_url(location: dict, end_time_utc: datetime) -> str:
    """Build a location-centered NOAA/NWS event-driven radar frame URL."""
    lat = float(location.get("latitude") or _DEFAULT_LOCATION["latitude"])
    lon = float(location.get("longitude") or _DEFAULT_LOCATION["longitude"])
    lat_min = max(-90.0, lat - 2.0)
    lat_max = min(90.0, lat + 2.0)
    lon_min = max(-180.0, lon - 2.0)
    lon_max = min(180.0, lon + 2.0)
    if end_time_utc.tzinfo is None:
        end_time_utc = end_time_utc.replace(tzinfo=timezone.utc)
    start_time_utc = end_time_utc - timedelta(minutes=_RADAR_FRAME_STEP_MINUTES)
    time_range = f"{int(start_time_utc.timestamp() * 1000)},{int(end_time_utc.timestamp() * 1000)}"
    params = {
        "bbox": f"{lon_min:.3f},{lat_min:.3f},{lon_max:.3f},{lat_max:.3f}",
        "bboxSR": "4326",
        "imageSR": "4326",
        "size": "880,520",
        "format": "png32",
        "f": "image",
        "time": time_range,
    }
    return (
        "https://mapservices.weather.noaa.gov/eventdriven/rest/services/"
        "radar/radar_base_reflectivity_time/ImageServer/exportImage"
        f"?{urllib.parse.urlencode(params)}"
    )


def _build_noaa_radar_frames(location: dict, now_utc: datetime) -> list[str]:
    if now_utc.tzinfo is None:
        now_utc = now_utc.replace(tzinfo=timezone.utc)
    latest = now_utc.replace(second=0, microsecond=0)
    frames: list[str] = []
    for index in range(_RADAR_FRAME_COUNT):
        minutes_ago = (_RADAR_FRAME_COUNT - 1 - index) * _RADAR_FRAME_STEP_MINUTES
        frame_end = latest - timedelta(minutes=minutes_ago)
        frames.append(_build_noaa_radar_frame_url(location, frame_end))
    return frames


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
    radar_frame_urls: list[str] = []
    radar_image_url = ""
    radar_source = "noaa_nws_eventdriven"
    radar_generated_at = now.isoformat()
    radar_frame_step_minutes = _RADAR_FRAME_STEP_MINUTES

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
    radar = live_inputs.get("radar") if isinstance(live_inputs, dict) else None
    if isinstance(radar, dict):
        radar_frame_urls = [
            str(url).strip()
            for url in (radar.get("frame_urls") or [])
            if isinstance(url, str) and str(url).strip()
        ]
        radar_image_url = str(radar.get("image_url") or "").strip()
        if not radar_image_url and radar_frame_urls:
            radar_image_url = radar_frame_urls[-1]
        radar_source = str(radar.get("source") or radar_source)
        radar_generated_at = str(radar.get("generated_at") or radar_generated_at)
        try:
            radar_frame_step_minutes = max(1, int(radar.get("frame_step_minutes") or _RADAR_FRAME_STEP_MINUTES))
        except Exception:
            radar_frame_step_minutes = _RADAR_FRAME_STEP_MINUTES

    if not radar_frame_urls or not radar_image_url:
        fallback_frames = _build_noaa_radar_frames(location, now)
        if fallback_frames:
            radar_frame_urls = fallback_frames
            radar_image_url = fallback_frames[-1]
            radar_source = "noaa_nws_eventdriven"
            radar_generated_at = now.isoformat()
            radar_frame_step_minutes = _RADAR_FRAME_STEP_MINUTES

    if isinstance(conditions, dict):
        data = {
            "observing_score": conditions.get("observing_score") or "unknown",
            "summary": conditions.get("summary") or "Live conditions resolved.",
            "confidence": conditions.get("confidence") or "medium",
            "warnings": list(conditions.get("warnings") or []),
            "best_for": list(conditions.get("best_for") or []),
            "conditions": dict(conditions.get("conditions") or {}),
            "degraded": bool(provider_trace.get("degraded")),
            "missing_sources": missing_sources,
            "source": conditions.get("source") or "open_meteo",
            "last_updated": conditions.get("last_updated"),
            "cloud_cover_pct": conditions.get("cloud_cover_pct"),
            "visibility_m": conditions.get("visibility_m"),
            "temperature_c": conditions.get("temperature_c"),
            "humidity_pct": conditions.get("humidity_pct"),
            "wind_mph": conditions.get("wind_mph"),
            "dew_point_c": conditions.get("dew_point_c"),
            "transparency": conditions.get("transparency"),
            "seeing": conditions.get("seeing"),
            "darkness": conditions.get("darkness"),
            "smoke": conditions.get("smoke"),
            "moon_interference": conditions.get("moon_interference"),
            "weather_code": conditions.get("weather_code"),
            "radar_image_url": radar_image_url,
            "radar_frame_urls": radar_frame_urls,
            "radar_frame_step_minutes": radar_frame_step_minutes,
            "radar_source": radar_source,
            "radar_generated_at": radar_generated_at,
            "location": {
                "latitude": float(location["latitude"]),
                "longitude": float(location["longitude"]),
                "elevation_ft": float(location["elevation_ft"]),
            },
        }
    else:
        data = _build_degraded_conditions_data(
            reason="provider_unavailable",
            missing_sources=missing_sources,
            timestamp_utc=timestamp_utc,
        )
        data["radar_image_url"] = radar_image_url
        data["radar_frame_urls"] = radar_frame_urls
        data["radar_frame_step_minutes"] = radar_frame_step_minutes
        data["radar_source"] = radar_source
        data["radar_generated_at"] = radar_generated_at
        data["location"] = {
            "latitude": float(location["latitude"]),
            "longitude": float(location["longitude"]),
            "elevation_ft": float(location["elevation_ft"]),
        }

    payload = {"status": "ok", "data": data}
    try:
        cache_set(cache_key, json.dumps(payload), ttl_seconds=5)
    except Exception:
        pass
    return (200, payload)
