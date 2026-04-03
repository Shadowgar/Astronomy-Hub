import logging
import time
from copy import deepcopy
from datetime import datetime, timedelta, timezone
import hashlib
import math
from typing import Any

from backend.normalizers import registry
from backend.app.services.live_ingestion import fetch_normalized_live_inputs


logger = logging.getLogger("backend.app.services.legacy_scene_logic")

SUGGESTION_COORD_MALFORMED = "suggestion coordinates malformed"

PHASE2_SCOPES = ("sky", "solar_system", "earth")
PHASE2_FILTERS = (
    "visible_now",
    "bright_only",
    "high_altitude",
    "short_window",
    "naked_eye",
)
PHASE2_ENGINE_REGISTRY = {
    "above_me": {
        "scope": "sky",
        "optional": False,
        "allowed_filters": ["visible_now", "high_altitude", "short_window"],
        "default_filter": "visible_now",
    },
    "deep_sky": {
        "scope": "sky",
        "optional": False,
        "allowed_filters": ["visible_now", "bright_only", "naked_eye"],
        "default_filter": "visible_now",
    },
    "planets": {
        "scope": "solar_system",
        "optional": False,
        "allowed_filters": ["visible_now", "bright_only", "high_altitude"],
        "default_filter": "visible_now",
    },
    "moon": {
        "scope": "solar_system",
        "optional": False,
        "allowed_filters": ["visible_now", "high_altitude"],
        "default_filter": "visible_now",
    },
    "satellites": {
        "scope": "earth",
        "optional": False,
        "allowed_filters": ["visible_now", "high_altitude", "short_window"],
        "default_filter": "visible_now",
    },
    "flights": {
        "scope": "earth",
        "optional": True,
        "allowed_filters": ["visible_now", "high_altitude", "short_window"],
        "default_filter": "visible_now",
    },
}

_PHASE2_OBJECT_LOOKUP_TTL_SECONDS = 5
_phase2_object_lookup_cache: dict[object, dict] = {}
_DEFAULT_LOCATION = {
    "label": "ORAS Observatory",
    "latitude": 41.321903,
    "longitude": -79.585394,
    "elevation_ft": 1420.0,
}

_DEEP_SKY_MESSIER_CATALOG = [
    {"catalog": "M31", "name": "Andromeda Galaxy", "ra_hours": 0.712, "dec_deg": 41.269, "magnitude": 3.4, "object_type": "galaxy", "constellation": "Andromeda"},
    {"catalog": "M42", "name": "Orion Nebula", "ra_hours": 5.588, "dec_deg": -5.391, "magnitude": 4.0, "object_type": "nebula", "constellation": "Orion"},
    {"catalog": "M13", "name": "Hercules Cluster", "ra_hours": 16.698, "dec_deg": 36.467, "magnitude": 5.8, "object_type": "globular_cluster", "constellation": "Hercules"},
    {"catalog": "M8", "name": "Lagoon Nebula", "ra_hours": 18.06, "dec_deg": -24.38, "magnitude": 6.0, "object_type": "nebula", "constellation": "Sagittarius"},
    {"catalog": "M17", "name": "Omega Nebula", "ra_hours": 18.346, "dec_deg": -16.171, "magnitude": 6.0, "object_type": "nebula", "constellation": "Sagittarius"},
    {"catalog": "M20", "name": "Trifid Nebula", "ra_hours": 18.038, "dec_deg": -23.023, "magnitude": 6.3, "object_type": "nebula", "constellation": "Sagittarius"},
    {"catalog": "M22", "name": "Sagittarius Cluster", "ra_hours": 18.607, "dec_deg": -23.904, "magnitude": 5.1, "object_type": "globular_cluster", "constellation": "Sagittarius"},
    {"catalog": "M27", "name": "Dumbbell Nebula", "ra_hours": 19.993, "dec_deg": 22.721, "magnitude": 7.5, "object_type": "planetary_nebula", "constellation": "Vulpecula"},
    {"catalog": "M45", "name": "Pleiades", "ra_hours": 3.792, "dec_deg": 24.117, "magnitude": 1.6, "object_type": "open_cluster", "constellation": "Taurus"},
    {"catalog": "M57", "name": "Ring Nebula", "ra_hours": 18.893, "dec_deg": 33.028, "magnitude": 8.8, "object_type": "planetary_nebula", "constellation": "Lyra"},
    {"catalog": "M81", "name": "Bode's Galaxy", "ra_hours": 9.926, "dec_deg": 69.065, "magnitude": 6.9, "object_type": "galaxy", "constellation": "Ursa Major"},
    {"catalog": "M82", "name": "Cigar Galaxy", "ra_hours": 9.936, "dec_deg": 69.679, "magnitude": 8.4, "object_type": "galaxy", "constellation": "Ursa Major"},
    {"catalog": "M92", "name": "Hercules Cluster (M92)", "ra_hours": 17.285, "dec_deg": 43.136, "magnitude": 6.4, "object_type": "globular_cluster", "constellation": "Hercules"},
]


def parse_location_override(
    lat: str | None,
    lon: str | None,
    elevation_ft: str | None,
) -> dict | None:
    """Match legacy location-override validation behavior."""
    if lat is None and lon is None and elevation_ft is None:
        return None
    if lat is None or lon is None:
        raise ValueError("Both lat and lon are required for a location override")

    try:
        lat_value = float(lat)
    except Exception as exc:
        raise ValueError("lat must be a number") from exc

    try:
        lon_value = float(lon)
    except Exception as exc:
        raise ValueError("lon must be a number") from exc

    if not (-90.0 <= lat_value <= 90.0):
        raise ValueError("lat must be between -90 and 90")
    if not (-180.0 <= lon_value <= 180.0):
        raise ValueError("lon must be between -180 and 180")

    elev_value = None
    if elevation_ft is not None and elevation_ft != "":
        try:
            elev_value = float(elevation_ft)
        except Exception as exc:
            raise ValueError("elevation_ft must be numeric") from exc

    return {"latitude": lat_value, "longitude": lon_value, "elevation_ft": elev_value}


def _resolve_location(parsed_location=None):
    if isinstance(parsed_location, dict):
        try:
            lat = float(parsed_location.get("latitude"))
            lon = float(parsed_location.get("longitude"))
            elev = parsed_location.get("elevation_ft")
            elev_ft = float(elev) if elev is not None else _DEFAULT_LOCATION["elevation_ft"]
            return {
                "label": "Custom Location",
                "latitude": lat,
                "longitude": lon,
                "elevation_ft": elev_ft,
            }
        except Exception:
            pass
    return dict(_DEFAULT_LOCATION)


def _resolve_time_context(as_of: str | None = None) -> datetime:
    if isinstance(as_of, str) and as_of.strip():
        value = as_of.strip()
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            resolved = parsed.astimezone(timezone.utc)
            return resolved.replace(minute=0, second=0, microsecond=0)
        except Exception:
            logger.warning("time_context.invalid value=%s", value)
    return datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)


def _parse_iso_utc(value: str | None) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)
    except Exception:
        return None


def _parse_tle_epoch(line1: str) -> datetime | None:
    """Parse TLE epoch (YYDDD.DDDDDDDD) from line 1."""
    if not isinstance(line1, str) or len(line1) < 32:
        return None
    raw = line1[18:32].strip()
    if not raw:
        return None
    try:
        yy = int(raw[:2])
        day_fraction = float(raw[2:])
    except Exception:
        return None
    year = 2000 + yy if yy < 57 else 1900 + yy
    day_index = int(day_fraction)
    frac = day_fraction - day_index
    base = datetime(year, 1, 1, tzinfo=timezone.utc) + timedelta(days=max(0, day_index - 1))
    return base + timedelta(seconds=round(frac * 86400.0))


def _parse_tle_mean_motion(line2: str) -> float | None:
    """Parse mean motion (revolutions/day) from TLE line 2."""
    if not isinstance(line2, str) or len(line2) < 63:
        return None
    raw = line2[52:63].strip()
    if not raw:
        return None
    try:
        value = float(raw)
    except Exception:
        return None
    return value if value > 0.0 else None


def _parse_tle_inclination(line2: str) -> float | None:
    """Parse inclination degrees from TLE line 2."""
    if not isinstance(line2, str) or len(line2) < 16:
        return None
    raw = line2[8:16].strip()
    if not raw:
        return None
    try:
        value = float(raw)
    except Exception:
        return None
    return max(0.0, min(180.0, value))


def _estimate_tle_pass_window(
    *,
    tle_line1: str,
    tle_line2: str,
    time_context: datetime,
    observer_lat: float,
    observer_lon: float,
) -> dict[str, Any] | None:
    """
    Minimal local pass estimate from TLE epoch + mean motion.

    This is Phase 2-safe local computation that avoids pass-API dependency and
    provides deterministic windows tied to TLE + location + time context.
    """
    epoch = _parse_tle_epoch(tle_line1)
    mean_motion = _parse_tle_mean_motion(tle_line2)
    inclination = _parse_tle_inclination(tle_line2)
    if epoch is None or mean_motion is None or inclination is None:
        return None

    period_minutes = 1440.0 / mean_motion
    period_minutes = max(60.0, min(180.0, period_minutes))
    elapsed_minutes = (time_context - epoch).total_seconds() / 60.0
    phase_minutes = elapsed_minutes % period_minutes

    next_peak_delta = (period_minutes - phase_minutes) % period_minutes
    next_peak = time_context + timedelta(minutes=next_peak_delta)
    start_dt = next_peak - timedelta(minutes=4)
    end_dt = next_peak + timedelta(minutes=4)

    # Deterministic visibility quality from orbital inclination + observer latitude.
    lat_gap = abs(abs(observer_lat) - min(inclination, 180.0 - inclination))
    lat_factor = max(0.0, 1.0 - min(1.0, lat_gap / 75.0))
    lon_factor = 0.85 + (abs(observer_lon) % 30.0) / 200.0
    max_elevation = max(10.0, min(84.0, 15.0 + (lat_factor * 55.0 * lon_factor)))

    return {
        "start": start_dt.isoformat(),
        "end": end_dt.isoformat(),
        "max_elevation_deg": round(max_elevation, 1),
        "is_visible_now": bool(start_dt <= time_context <= end_dt),
    }


def _stable_float(seed: str, minimum: float, maximum: float) -> float:
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()
    bucket = int(digest[:8], 16) / float(0xFFFFFFFF)
    return minimum + (maximum - minimum) * bucket


def _fetch_live_inputs(location: dict, time_context: datetime) -> dict:
    return fetch_normalized_live_inputs(location, time_context)


def validate_suggestions(matches):
    """Validate suggestion coordinate values."""
    for idx, suggestion in enumerate(matches):
        lat = suggestion.get("latitude")
        lon = suggestion.get("longitude")
        if lat is None and lon is None:
            continue
        if lat is None or lon is None:
            return {"error": SUGGESTION_COORD_MALFORMED, "index": idx, "suggestion": suggestion}
        try:
            latf = float(lat)
            lonf = float(lon)
        except Exception:
            return {"error": SUGGESTION_COORD_MALFORMED, "index": idx, "suggestion": suggestion}
        if not (-90.0 <= latf <= 90.0) or not (-180.0 <= lonf <= 180.0):
            return {
                "error": "suggestion coordinates out of range",
                "index": idx,
                "suggestion": suggestion,
            }
    return None


def _slugify(name: str) -> str:
    try:
        value = str(name).strip().lower()
        return value.replace(" ", "-").replace("/", "-").replace("'", "")
    except Exception:
        return str(name)


def _ensure_object_id(obj):
    if not isinstance(obj, dict):
        return None

    existing = obj.get("id")
    if isinstance(existing, str) and existing.strip():
        return existing.strip()

    name = obj.get("name")
    if isinstance(name, str) and name.strip():
        return _slugify(name)

    return None


def _build_satellite_engine_slice(parsed_location=None, time_context=None, live_inputs=None):
    """Provider-backed satellite slice with deterministic location/time influence."""
    location = _resolve_location(parsed_location)
    time_context = time_context or _resolve_time_context()
    hour_key = time_context.strftime("%Y%m%d%H")

    provider_satellites = []
    if isinstance(live_inputs, dict):
        provider_satellites = live_inputs.get("satellites") or []

    out = []
    for sat in provider_satellites[:160]:
        if not isinstance(sat, dict):
            continue
        sat_id = str(sat.get("id") or sat.get("name") or "").strip()
        name = str(sat.get("name") or sat_id).strip()
        if not sat_id or not name:
            continue
        seed = (
            f"{sat_id}:{round(float(location['latitude']),2)}:"
            f"{round(float(location['longitude']),2)}:{hour_key}"
        )
        # Prefer provider-derived pass windows when available.
        pass_start = str(sat.get("pass_start") or "").strip() or None
        try:
            max_elevation = float(sat.get("max_elevation_deg"))
            if max_elevation <= 0.0:
                max_elevation = None
        except Exception:
            max_elevation = None

        if pass_start and max_elevation is not None:
            pass_start_dt = _parse_iso_utc(pass_start)
            duration_sec = 360
            try:
                candidate_duration = int(float(sat.get("duration_sec") or 0.0))
                if candidate_duration > 0:
                    duration_sec = candidate_duration
            except Exception:
                duration_sec = 360
            pass_end_dt = _parse_iso_utc(str(sat.get("pass_end") or "").strip())
            if pass_start_dt is not None and pass_end_dt is None:
                pass_end_dt = pass_start_dt + timedelta(seconds=duration_sec)
            start_time = pass_start
            end_time = (
                str(sat.get("pass_end") or "").strip()
                or (pass_end_dt.isoformat() if pass_end_dt is not None else None)
            )
            elevation = round(max(5.0, min(84.0, max_elevation)), 1)
            is_visible_now = bool(
                pass_start_dt is not None
                and pass_end_dt is not None
                and pass_start_dt <= time_context <= pass_end_dt
                and elevation >= 10.0
            )
            if is_visible_now:
                summary = f"Visible pass in progress (peak {elevation:.1f} deg)"
            else:
                summary = f"Predicted pass window starts at {start_time}"
            relevance_score = max(0.0, min(1.0, elevation / 90.0))
        else:
            # Keep satellite lane provider-pure and avoid collapsing into flight-derived fallbacks.
            has_tle = bool(
                str(sat.get("tle_line1") or "").strip()
                and str(sat.get("tle_line2") or "").strip()
            )
            if has_tle:
                tle_estimate = _estimate_tle_pass_window(
                    tle_line1=str(sat.get("tle_line1") or ""),
                    tle_line2=str(sat.get("tle_line2") or ""),
                    time_context=time_context,
                    observer_lat=float(location["latitude"]),
                    observer_lon=float(location["longitude"]),
                )
                if isinstance(tle_estimate, dict):
                    start_time = str(tle_estimate.get("start") or time_context.isoformat())
                    end_time = str(tle_estimate.get("end") or "")
                    elevation = float(tle_estimate.get("max_elevation_deg") or 15.0)
                    is_visible_now = bool(tle_estimate.get("is_visible_now"))
                    summary = f"TLE-propagated pass estimate around {start_time}"
                else:
                    elevation = round(_stable_float(seed, 12.0, 84.0), 1)
                    window_minute = int(_stable_float(seed + ":minute", 0.0, 59.0))
                    start_dt = time_context.replace(
                        minute=window_minute, second=0, microsecond=0
                    )
                    start_time = start_dt.isoformat()
                    end_time = (start_dt + timedelta(minutes=6)).isoformat()
                    is_visible_now = True
                    summary = f"TLE track available; pass window around {start_time}"
            else:
                elevation = round(_stable_float(seed, 12.0, 84.0), 1)
                window_minute = int(_stable_float(seed + ":minute", 0.0, 59.0))
                start_dt = time_context.replace(
                    minute=window_minute, second=0, microsecond=0
                )
                start_time = start_dt.isoformat()
                end_time = (start_dt + timedelta(minutes=6)).isoformat()
                is_visible_now = True
                summary = f"Live pass candidate around {start_time}"
            relevance_score = max(0.0, min(1.0, elevation / 90.0))
        if elevation < 10.0:
            continue
        out.append(
            {
                "id": _slugify(sat_id),
                "name": name,
                "type": "satellite",
                "engine": "satellite",
                "provider_source": sat.get("source") or "celestrak",
                "summary": summary,
                "position": {
                    "elevation": elevation,
                    "azimuth": round(_stable_float(seed + ":az", 0.0, 359.0), 1),
                },
                "visibility": {
                    "is_visible": True,
                    "visibility_window_start": start_time,
                    "visibility_window_end": end_time,
                },
                "relevance_score": relevance_score,
            }
        )

    out = _rank_scene_objects(out)
    if out:
        return out

    # Explicit degraded path when live sky-track sources are unavailable.
    return []


def _build_solar_system_engine_slice(
    parsed_location=None,
    time_context=None,
    live_inputs=None,
    limit=4,
    include_below_horizon=False,
):
    """Provider-backed solar-system slice from JPL ephemeris."""
    visibility_threshold_deg = 5.0
    time_context = time_context or _resolve_time_context()
    window_start = time_context.replace(microsecond=0).isoformat()
    window_end = (time_context.replace(microsecond=0) + timedelta(hours=2)).isoformat()
    out = []
    ephemeris = []
    if isinstance(live_inputs, dict):
        ephemeris = live_inputs.get("ephemeris") or []
    conditions = live_inputs.get("conditions") if isinstance(live_inputs, dict) else None
    observing_score = ""
    if isinstance(conditions, dict):
        observing_score = str(conditions.get("observing_score") or "").strip().lower()
    conditions_factor = {
        "excellent": 1.0,
        "good": 0.92,
        "fair": 0.82,
        "poor": 0.72,
    }.get(observing_score, 0.85)

    for entry in ephemeris:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("name") or "").strip()
        if not name:
            continue
        body_slug = _slugify(entry.get("id") or name)
        body_type = "moon" if body_slug in {"moon", "301"} else "planet"
        try:
            elevation = float(entry.get("elevation") or 0.0)
        except Exception:
            elevation = 0.0
        if (
            elevation <= visibility_threshold_deg
            and body_type != "moon"
            and not include_below_horizon
        ):
            continue
        try:
            azimuth = float(entry.get("azimuth") or 0.0)
        except Exception:
            azimuth = 0.0
        is_visible_now = elevation > visibility_threshold_deg
        if is_visible_now:
            summary = (
                f"Live ephemeris position az {azimuth:.1f} el {elevation:.1f}; "
                f"best viewing around {window_start}"
            )
        else:
            summary = (
                f"Ephemeris position az {azimuth:.1f} el {elevation:.1f}; "
                f"currently below horizon, next context window around {window_start}"
            )

        visible_relevance = max(0.0, min(1.0, (elevation / 90.0) * conditions_factor))
        out.append(
            {
                "id": body_slug,
                "name": name,
                "type": body_type,
                "engine": "solar_system",
                "provider_source": entry.get("source") or "jpl_ephemeris",
                "summary": summary,
                "position": {"azimuth": azimuth, "elevation": elevation},
                "visibility": {
                    "is_visible": is_visible_now,
                    "visibility_window_start": window_start,
                    "visibility_window_end": window_end,
                },
                "relevance_score": visible_relevance if is_visible_now else 0.05,
            }
        )

    if out:
        ranked = _rank_scene_objects(out)
        if limit is None:
            return ranked
        try:
            max_items = max(1, int(limit))
        except Exception:
            max_items = 4
        return ranked[:max_items]
    return []


def _julian_date(dt: datetime) -> float:
    return (dt.astimezone(timezone.utc).timestamp() / 86400.0) + 2440587.5


def _local_sidereal_time_hours(dt: datetime, longitude_deg: float) -> float:
    # Sufficient precision for Phase 2 visibility/ranking decisions.
    jd = _julian_date(dt)
    d = jd - 2451545.0
    gmst_hours = (18.697374558 + 24.06570982441908 * d) % 24.0
    return (gmst_hours + (longitude_deg / 15.0)) % 24.0


def _ra_dec_to_alt_az(
    ra_hours: float,
    dec_deg: float,
    observer_lat_deg: float,
    observer_lon_deg: float,
    dt: datetime,
) -> tuple[float, float]:
    lst_hours = _local_sidereal_time_hours(dt, observer_lon_deg)
    hour_angle_deg = ((lst_hours - ra_hours) * 15.0 + 540.0) % 360.0 - 180.0

    lat_rad = math.radians(observer_lat_deg)
    dec_rad = math.radians(dec_deg)
    ha_rad = math.radians(hour_angle_deg)

    sin_alt = (
        math.sin(dec_rad) * math.sin(lat_rad)
        + math.cos(dec_rad) * math.cos(lat_rad) * math.cos(ha_rad)
    )
    sin_alt = max(-1.0, min(1.0, sin_alt))
    alt_rad = math.asin(sin_alt)

    cos_az = (math.sin(dec_rad) - math.sin(alt_rad) * math.sin(lat_rad)) / (
        max(1e-9, math.cos(alt_rad) * math.cos(lat_rad))
    )
    cos_az = max(-1.0, min(1.0, cos_az))
    az_rad = math.acos(cos_az)
    if math.sin(ha_rad) > 0:
        az_rad = (2.0 * math.pi) - az_rad

    return math.degrees(alt_rad), math.degrees(az_rad)


def _deep_sky_reason(
    catalog: str,
    object_type: str,
    altitude_deg: float,
    visibility_band: str,
    conditions_score: str,
) -> str:
    base = f"{catalog} {object_type.replace('_', ' ')} at {altitude_deg:.1f}° altitude."
    if visibility_band == "excellent":
        window = "High in sky with strong observing window."
    elif visibility_band == "good":
        window = "Clear observing window with useful altitude."
    elif visibility_band == "below_horizon":
        window = "Currently below horizon; retained for catalog continuity."
    else:
        window = "Marginal altitude; shorter viewing window."

    if conditions_score == "poor":
        conditions_note = " Conditions currently reduce deep-sky contrast."
    elif conditions_score in {"excellent", "good"}:
        conditions_note = " Conditions support deep-sky observing."
    else:
        conditions_note = ""
    return f"{base} {window}{conditions_note}".strip()


def _build_deep_sky_engine_slice(
    parsed_location=None,
    time_context=None,
    live_inputs=None,
    limit=8,
    include_below_horizon=False,
):
    """Catalog-backed deep-sky targets computed from RA/Dec and local sky position."""
    location = _resolve_location(parsed_location)
    time_context = time_context or _resolve_time_context()
    conditions = live_inputs.get("conditions") if isinstance(live_inputs, dict) else None
    conditions_score = str((conditions or {}).get("observing_score") or "").strip().lower()
    moon_interference = str((conditions or {}).get("moon_interference") or "").strip().lower()

    conditions_factor = {
        "excellent": 1.0,
        "good": 0.9,
        "fair": 0.78,
        "poor": 0.6,
    }.get(conditions_score, 0.82)
    moon_penalty = 0.12 if moon_interference in {"high", "severe"} else 0.0

    window_start = time_context.replace(microsecond=0).isoformat()
    window_end = (time_context.replace(microsecond=0) + timedelta(hours=2)).isoformat()

    out = []
    for row in _DEEP_SKY_MESSIER_CATALOG:
        try:
            alt_deg, az_deg = _ra_dec_to_alt_az(
                float(row["ra_hours"]),
                float(row["dec_deg"]),
                float(location["latitude"]),
                float(location["longitude"]),
                time_context,
            )
        except Exception:
            continue

        # Visibility bands: >20 good, 10–20 marginal, <10 below horizon.
        if alt_deg < 10.0 and not include_below_horizon:
            continue
        visibility_band = (
            "excellent"
            if alt_deg >= 45.0
            else ("good" if alt_deg >= 20.0 else ("marginal" if alt_deg >= 10.0 else "below_horizon"))
        )
        is_visible = alt_deg >= 20.0

        magnitude = float(row["magnitude"])
        altitude_score = max(0.0, min(1.0, (alt_deg - 10.0) / 80.0))
        magnitude_score = max(0.0, min(1.0, (9.5 - magnitude) / 7.0))
        type_boost = 1.0 if row["object_type"] in {"globular_cluster", "open_cluster", "nebula"} else 0.9
        score = ((0.55 * altitude_score) + (0.3 * magnitude_score) + (0.15 * type_boost)) * conditions_factor
        if magnitude > 6.5:
            score -= moon_penalty
        score = max(0.0, min(1.0, score))

        catalog = str(row["catalog"])
        name = f"{catalog} {row['name']}"
        out.append(
            {
                "id": _slugify(catalog),
                "name": name,
                "type": "deep_sky",
                "engine": "deep_sky",
                "provider_source": "messier_catalog",
                "summary": _deep_sky_reason(
                    catalog,
                    str(row["object_type"]),
                    alt_deg,
                    visibility_band,
                    conditions_score,
                ),
                "position": {"azimuth": round(az_deg, 1), "elevation": round(alt_deg, 1)},
                "visibility": {
                    "is_visible": is_visible,
                    "visibility_window_start": window_start,
                    "visibility_window_end": window_end,
                },
                "relevance_score": round(score, 3),
                "catalog": catalog,
                "constellation": row["constellation"],
                "magnitude": magnitude,
                "object_class": row["object_type"],
            }
        )

    ranked = _rank_scene_objects(out)
    if limit is None:
        return ranked
    try:
        max_items = max(1, int(limit))
    except Exception:
        max_items = 8
    return ranked[:max_items]


def _build_flights_engine_slice(live_inputs=None):
    """Provider-backed flight slice derived from live OpenSky inputs."""
    flights = []
    if isinstance(live_inputs, dict):
        flights = live_inputs.get("flights") or []

    out = []
    for flight in flights:
        if not isinstance(flight, dict):
            continue
        flight_id = str(flight.get("id") or "").strip()
        name = str(flight.get("name") or "").strip()
        if not flight_id or not name:
            continue
        try:
            elevation = float(flight.get("elevation") or 0.0)
        except Exception:
            elevation = 0.0
        if elevation <= 0.0:
            continue
        distance_km = float(flight.get("distance_km") or 0.0)
        lat = flight.get("latitude")
        lon = flight.get("longitude")
        out.append(
            {
                "id": _slugify(f"flight-{flight_id}"),
                "name": name,
                "type": "satellite",
                "engine": "flight",
                "provider_source": flight.get("source") or "opensky",
                "summary": f"Live flight track ({distance_km:.0f} km)",
                "position": {
                    "elevation": elevation,
                    "lat": float(lat) if lat is not None else None,
                    "lon": float(lon) if lon is not None else None,
                },
                "visibility": {"is_visible": True},
                "relevance_score": max(0.0, min(1.0, elevation / 90.0)),
            }
        )
    return _rank_scene_objects(out)[:6]


def _build_earth_engine_slice(parsed_location=None, live_inputs=None):
    """Provider-backed observing conditions with explicit degraded fallback."""
    location = _resolve_location(parsed_location)
    response = {
        "location_label": location.get("label"),
        "observing_score": "fair",
        "moon_phase": "Unknown",
        "summary": "Live conditions unavailable; degraded fallback is active.",
        "degraded": True,
        "missing_sources": ["open_meteo"],
    }

    if isinstance(live_inputs, dict):
        conditions = live_inputs.get("conditions")
        provider_trace = live_inputs.get("provider_trace") or {}
        missing_sources = list(provider_trace.get("missing_sources") or [])
        if isinstance(conditions, dict):
            response = {
                "location_label": location.get("label"),
                "observing_score": conditions.get("observing_score") or "fair",
                "moon_phase": "Unknown",
                "summary": conditions.get("summary") or "Live observing conditions.",
                "confidence": conditions.get("confidence") or "medium",
                "warnings": list(conditions.get("warnings") or []),
                "best_for": list(conditions.get("best_for") or []),
                "degraded": bool(missing_sources),
                "missing_sources": missing_sources,
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
            }

    if response.get("degraded") and parsed_location is None:
        response["location_label"] = "ORAS Observatory"

    try:
        norm = registry.get("conditions")
        normalized = norm(response)
        if isinstance(normalized, dict):
            response = normalized
            response.setdefault("degraded", bool(response.get("missing_sources")))
    except Exception:
        pass

    return response


def _is_above_horizon(obj):
    """Best-effort horizon filter for Phase 1 scene assembly."""
    visibility = obj.get("visibility")
    if isinstance(visibility, dict) and visibility.get("is_visible") is False:
        return False
    position = obj.get("position")
    if not isinstance(position, dict):
        return True
    elevation = position.get("elevation")
    if elevation is None:
        return True
    try:
        return float(elevation) > 0.0
    except Exception:
        return True


def _rank_scene_objects(objects):
    def _rank_key(item):
        score = item.get("relevance_score") or 0.0
        type_order = {"satellite": 0, "planet": 1, "deep_sky": 2}
        order = type_order.get(item.get("type"), 99)
        return (-float(score), order, item.get("name") or "")

    try:
        return sorted(objects, key=_rank_key)
    except Exception:
        return objects


def _select_diverse_scene_objects(objects, limit=10):
    ranked = _rank_scene_objects(list(objects))
    selected = []
    seen_ids = set()
    required_types = ("planet", "deep_sky", "satellite")

    for required_type in required_types:
        candidate = next((obj for obj in ranked if obj.get("type") == required_type), None)
        if not isinstance(candidate, dict):
            continue
        object_id = str(candidate.get("id") or candidate.get("name") or "")
        if object_id and object_id in seen_ids:
            continue
        selected.append(candidate)
        if object_id:
            seen_ids.add(object_id)

    for candidate in ranked:
        if len(selected) >= limit:
            break
        object_id = str(candidate.get("id") or candidate.get("name") or "")
        if object_id and object_id in seen_ids:
            continue
        selected.append(candidate)
        if object_id:
            seen_ids.add(object_id)

    return _rank_scene_objects(selected)[:limit]


def _derive_time_relevance(obj):
    visibility = obj.get("visibility") if isinstance(obj, dict) else None
    if isinstance(visibility, dict):
        window_start = visibility.get("visibility_window_start")
        if window_start:
            return f"window_start:{window_start}"
    return "currently_visible"


def _derive_provider_source(obj):
    source = obj.get("provider_source") if isinstance(obj, dict) else None
    if isinstance(source, str) and source.strip():
        return source.strip()

    engine = str(obj.get("engine") or "").strip().lower() if isinstance(obj, dict) else ""
    if engine in ("satellite", "satellites"):
        return "celestrak"
    if engine in ("solar_system", "planets", "moon"):
        return "jpl_ephemeris"
    if engine == "deep_sky":
        return "messier_catalog"
    return "unknown"


def _enforce_phase1_object_contract(obj):
    """Ensure surfaced scene objects carry the full Phase 1 contract fields."""
    normalized = dict(obj)
    object_id = _ensure_object_id(normalized)
    if object_id:
        normalized["id"] = object_id
    normalized["reason_for_inclusion"] = (
        normalized.get("reason_for_inclusion")
        or normalized.get("reason")
        or normalized.get("summary")
        or ""
    )
    normalized["time_relevance"] = normalized.get("time_relevance") or _derive_time_relevance(normalized)
    normalized["provider_source"] = normalized.get("provider_source") or _derive_provider_source(normalized)
    normalized["detail_route"] = normalized.get("detail_route") or f"/object/{normalized.get('id', '')}"
    return normalized


def _phase2_timestamp() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def _build_phase2_observing_context(parsed_location=None):
    conditions = _build_earth_engine_slice(parsed_location)
    return {
        "location_label": conditions.get("location_label"),
        "observing_score": conditions.get("observing_score"),
        "moon_phase": conditions.get("moon_phase"),
        "summary": conditions.get("summary"),
        "confidence": conditions.get("confidence"),
        "warnings": conditions.get("warnings"),
        "best_for": conditions.get("best_for"),
        "transparency": conditions.get("transparency"),
        "seeing": conditions.get("seeing"),
        "darkness": conditions.get("darkness"),
        "smoke": conditions.get("smoke"),
    }


def _to_phase2_scene_objects(raw_objects, engine_slug):
    scene_objects = []
    satellite_detail_keys = (
        "satellite_status",
        "satellite_operator",
        "satellite_countries",
        "satellite_website",
        "satellite_launched",
        "satellite_deployed",
        "satellite_citation",
        "satellite_image_url",
        "satellite_norad_id",
    )
    deep_sky_detail_keys = (
        "catalog",
        "constellation",
        "magnitude",
        "object_class",
    )
    for obj in raw_objects:
        if not isinstance(obj, dict):
            continue
        object_id = _ensure_object_id(obj)
        if not object_id:
            continue
        reason = obj.get("reason") or obj.get("summary") or f"Selected by {engine_slug} engine"
        scene_objects.append(
            {
                "id": object_id,
                "name": obj.get("name"),
                "type": obj.get("type"),
                "engine": engine_slug,
                "provider_source": obj.get("provider_source") or _derive_provider_source(obj),
                "summary": obj.get("summary") or "",
                "reason": reason,
                "position": obj.get("position"),
                "visibility": obj.get("visibility"),
            }
        )
        for key in satellite_detail_keys:
            value = obj.get(key)
            if value not in (None, ""):
                scene_objects[-1][key] = value
        for key in deep_sky_detail_keys:
            value = obj.get(key)
            if value not in (None, ""):
                scene_objects[-1][key] = value
    return scene_objects


def _build_phase2_scene_group(title, reason, objects):
    return {
        "title": title,
        "reason": reason,
        "objects": objects,
    }


def _build_satellite_meta_lookup(live_inputs):
    lookup = {}
    satellites = (live_inputs.get("satellites") or []) if isinstance(live_inputs, dict) else []
    for sat in satellites:
        if not isinstance(sat, dict):
            continue
        sat_id = str(sat.get("id") or sat.get("norad_cat_id") or sat.get("name") or "").strip()
        if not sat_id:
            continue
        lookup[_slugify(sat_id)] = sat
    return lookup


def _apply_satellite_metadata(objects, satellite_meta_by_id):
    if not isinstance(objects, list) or not isinstance(satellite_meta_by_id, dict):
        return
    for obj in objects:
        sat_meta = satellite_meta_by_id.get(str(obj.get("id") or "").strip().lower()) or {}
        if not isinstance(sat_meta, dict):
            continue
        if sat_meta.get("status") not in (None, ""):
            obj["satellite_status"] = sat_meta.get("status")
        if sat_meta.get("operator") not in (None, ""):
            obj["satellite_operator"] = sat_meta.get("operator")
        if sat_meta.get("countries") not in (None, ""):
            obj["satellite_countries"] = sat_meta.get("countries")
        if sat_meta.get("website") not in (None, ""):
            obj["satellite_website"] = sat_meta.get("website")
        if sat_meta.get("launched") not in (None, ""):
            obj["satellite_launched"] = sat_meta.get("launched")
        if sat_meta.get("deployed") not in (None, ""):
            obj["satellite_deployed"] = sat_meta.get("deployed")
        if sat_meta.get("citation") not in (None, ""):
            obj["satellite_citation"] = sat_meta.get("citation")
        if sat_meta.get("image_url") not in (None, ""):
            obj["satellite_image_url"] = sat_meta.get("image_url")
        if sat_meta.get("norad_cat_id") not in (None, ""):
            obj["satellite_norad_id"] = sat_meta.get("norad_cat_id")


def _build_phase2_deep_sky_scene(filter_slug, parsed_location=None):
    location = _resolve_location(parsed_location)
    time_context = _resolve_time_context()
    live_inputs = _fetch_live_inputs(location, time_context)
    objects = _to_phase2_scene_objects(
        _build_deep_sky_engine_slice(
            parsed_location=parsed_location,
            time_context=time_context,
            live_inputs=live_inputs,
        ),
        "deep_sky",
    )
    scene_summary = "Deep-sky targets that are currently practical to observe."
    if filter_slug == "naked_eye":
        scene_summary = "Deep-sky targets surfaced for easier visual observing context."
    groups = [
        _build_phase2_scene_group(
            "Deep Sky Targets",
            "Targets grouped for current deep-sky observing opportunities.",
            objects,
        )
    ]
    return {
        "scope": "sky",
        "engine": "deep_sky",
        "filter": filter_slug,
        "timestamp": _phase2_timestamp(),
        "title": "Deep Sky Scene",
        "summary": scene_summary,
        "groups": groups,
        "observing_context": _build_phase2_observing_context(parsed_location),
    }


def _build_phase2_planets_scene(filter_slug, parsed_location=None):
    location = _resolve_location(parsed_location)
    time_context = _resolve_time_context()
    live_inputs = _fetch_live_inputs(location, time_context)
    objects = _to_phase2_scene_objects(
        _build_solar_system_engine_slice(
            parsed_location=parsed_location,
            time_context=time_context,
            live_inputs=live_inputs,
        ),
        "planets",
    )
    groups = [
        _build_phase2_scene_group(
            "Planets Visible",
            "Planet targets grouped for immediate observing decisions.",
            objects,
        )
    ]
    return {
        "scope": "solar_system",
        "engine": "planets",
        "filter": filter_slug,
        "timestamp": _phase2_timestamp(),
        "title": "Planets Scene",
        "summary": "Planets that are currently available in the observing window.",
        "groups": groups,
        "observing_context": _build_phase2_observing_context(parsed_location),
    }


def _build_phase2_moon_scene(filter_slug, parsed_location=None):
    location = _resolve_location(parsed_location)
    time_context = _resolve_time_context()
    live_inputs = _fetch_live_inputs(location, time_context)
    solar_objects = _build_solar_system_engine_slice(
        parsed_location=parsed_location,
        time_context=time_context,
        live_inputs=live_inputs,
        limit=None,
    )
    moon_object = next((obj for obj in solar_objects if str(obj.get("id") or "") == "moon"), None)
    moon_scene_object = (
        _to_phase2_scene_objects([moon_object], "moon")[0]
        if isinstance(moon_object, dict)
        else None
    )
    groups = [
        _build_phase2_scene_group(
            "Moon Conditions",
            "Moon phase and observing impact grouped for quick planning.",
            [moon_scene_object] if isinstance(moon_scene_object, dict) else [],
        )
    ]
    return {
        "scope": "solar_system",
        "engine": "moon",
        "filter": filter_slug,
        "timestamp": _phase2_timestamp(),
        "title": "Moon Scene",
        "summary": "Current lunar context for observing decisions.",
        "groups": groups,
        "observing_context": _build_phase2_observing_context(parsed_location),
    }


def _build_phase2_satellites_scene(filter_slug, parsed_location=None):
    location = _resolve_location(parsed_location)
    time_context = _resolve_time_context()
    live_inputs = _fetch_live_inputs(location, time_context)
    objects = _to_phase2_scene_objects(
        _build_satellite_engine_slice(
            parsed_location=parsed_location,
            time_context=time_context,
            live_inputs=live_inputs,
        ),
        "satellites",
    )
    _apply_satellite_metadata(objects, _build_satellite_meta_lookup(live_inputs))

    high_priority = []
    secondary = []
    for obj in objects:
        if (obj.get("summary") or "").lower().find("visible pass") >= 0:
            high_priority.append(obj)
        else:
            secondary.append(obj)
    groups = []
    if high_priority:
        groups.append(
            _build_phase2_scene_group(
                "Upcoming Passes",
                "Passes surfaced as immediate opportunities.",
                high_priority,
            )
        )
    if secondary:
        groups.append(
            _build_phase2_scene_group(
                "Additional Passes",
                "Secondary passes that may still be observable.",
                secondary,
            )
        )
    if not groups:
        groups = [
            _build_phase2_scene_group(
                "Satellite Passes",
                "No pass data available, but the scene structure remains consistent.",
                [],
            )
        ]
    return {
        "scope": "earth",
        "engine": "satellites",
        "filter": filter_slug,
        "timestamp": _phase2_timestamp(),
        "title": "Satellites Scene",
        "summary": "Near-term satellite pass opportunities.",
        "groups": groups,
        "observing_context": _build_phase2_observing_context(parsed_location),
    }


def _build_phase2_flights_scene(filter_slug, parsed_location=None):
    location = _resolve_location(parsed_location)
    time_context = _resolve_time_context()
    live_inputs = _fetch_live_inputs(location, time_context)
    objects = _to_phase2_scene_objects(
        _build_flights_engine_slice(live_inputs=live_inputs),
        "flights",
    )
    groups = [
        _build_phase2_scene_group(
            "Flights Nearby",
            "Live flights grouped as air-traffic context.",
            objects,
        )
    ]
    return {
        "scope": "earth",
        "engine": "flights",
        "filter": filter_slug,
        "timestamp": _phase2_timestamp(),
        "title": "Flights Scene",
        "summary": "Nearby live flight tracks for air-traffic context.",
        "groups": groups,
        "observing_context": _build_phase2_observing_context(parsed_location),
    }


def _build_phase2_above_me_scene(filter_slug, parsed_location=None):
    phase1_state = build_phase1_scene_state(parsed_location)
    phase1_scene = phase1_state.get("scene") or {}
    phase1_objects = phase1_scene.get("objects") or []
    objects = _to_phase2_scene_objects(phase1_objects, "above_me")
    location = _resolve_location(parsed_location)
    time_context = _resolve_time_context(phase1_scene.get("timestamp"))
    live_inputs = _fetch_live_inputs(location, time_context)
    _apply_satellite_metadata(objects, _build_satellite_meta_lookup(live_inputs))

    groups = [
        _build_phase2_scene_group(
            "Above Me Now",
            "Validated Phase 1 scene objects grouped for Phase 2 pipeline compatibility.",
            objects,
        )
    ]

    return {
        "scope": "sky",
        "engine": "above_me",
        "filter": filter_slug,
        "timestamp": phase1_scene.get("timestamp") or _phase2_timestamp(),
        "title": "Above Me Scene",
        "summary": "Current observing surface aligned with the Phase 2 engine pipeline.",
        "groups": groups,
        "observing_context": _build_phase2_observing_context(parsed_location),
    }


def _build_phase2_scene(scope_slug, engine_slug, filter_slug, parsed_location=None):
    engine_meta = PHASE2_ENGINE_REGISTRY.get(engine_slug)
    if engine_meta is None:
        raise ValueError("invalid_engine")
    if engine_meta.get("scope") != scope_slug:
        raise ValueError("engine_out_of_scope")
    allowed_filters = list(engine_meta.get("allowed_filters") or [])
    if filter_slug not in PHASE2_FILTERS or filter_slug not in allowed_filters:
        raise ValueError("invalid_filter")

    builders = {
        "above_me": _build_phase2_above_me_scene,
        "deep_sky": _build_phase2_deep_sky_scene,
        "planets": _build_phase2_planets_scene,
        "moon": _build_phase2_moon_scene,
        "satellites": _build_phase2_satellites_scene,
        "flights": _build_phase2_flights_scene,
    }
    builder = builders.get(engine_slug)
    if builder is None:
        raise ValueError("scene_builder_not_available")
    return builder(filter_slug=filter_slug, parsed_location=parsed_location)


def _iter_phase2_grouped_objects(scene):
    groups = scene.get("groups") if isinstance(scene, dict) else None
    if not isinstance(groups, list):
        return
    for group in groups:
        if not isinstance(group, dict):
            continue
        objects = group.get("objects")
        if not isinstance(objects, list):
            continue
        for obj in objects:
            if isinstance(obj, dict):
                yield obj


def _build_phase2_object_lookup(parsed_location=None):
    required_engines = ("above_me", "deep_sky", "planets", "moon", "satellites", "flights")
    lookup = {}

    for engine_slug in required_engines:
        engine_meta = PHASE2_ENGINE_REGISTRY.get(engine_slug) or {}
        scope_slug = engine_meta.get("scope")
        default_filter = engine_meta.get("default_filter")
        if not scope_slug or not default_filter:
            continue

        try:
            scene = _build_phase2_scene(
                scope_slug,
                engine_slug,
                default_filter,
                parsed_location=parsed_location,
            )
        except Exception:
            logger.exception("phase2.object.lookup.scene.failed engine=%s", engine_slug)
            continue

        for scene_obj in _iter_phase2_grouped_objects(scene):
            object_id = _ensure_object_id(scene_obj)
            if not object_id:
                continue
            normalized = dict(scene_obj)
            normalized["id"] = object_id
            lookup.setdefault(object_id, normalized)

    # Object lookup must remain stable for solar-system object ids across time contexts.
    # Include an uncapped solar ephemeris set so object detail resolution doesn't depend on
    # the currently visible/capped scene subset.
    try:
        location = _resolve_location(parsed_location)
        time_context = _resolve_time_context()
        live_inputs = _fetch_live_inputs(location, time_context)
        solar_objects = _build_solar_system_engine_slice(
            parsed_location=parsed_location,
            time_context=time_context,
            live_inputs=live_inputs,
            limit=None,
            include_below_horizon=True,
        )
        for raw in solar_objects:
            if not isinstance(raw, dict):
                continue
            raw_id = str(raw.get("id") or "").strip().lower()
            engine_name = "moon" if raw_id in {"moon", "301"} else "planets"
            for scene_obj in _to_phase2_scene_objects([raw], engine_name):
                object_id = _ensure_object_id(scene_obj)
                if not object_id:
                    continue
                normalized = dict(scene_obj)
                normalized["id"] = object_id
                lookup.setdefault(object_id, normalized)
    except Exception:
        logger.exception("phase2.object.lookup.solar.failed")

    # Deep-sky ids must also remain resolvable independent of current visibility window.
    try:
        location = _resolve_location(parsed_location)
        time_context = _resolve_time_context()
        live_inputs = _fetch_live_inputs(location, time_context)
        deep_sky_objects = _build_deep_sky_engine_slice(
            parsed_location=parsed_location,
            time_context=time_context,
            live_inputs=live_inputs,
            limit=None,
            include_below_horizon=True,
        )
        for scene_obj in _to_phase2_scene_objects(deep_sky_objects, "deep_sky"):
            object_id = _ensure_object_id(scene_obj)
            if not object_id:
                continue
            normalized = dict(scene_obj)
            normalized["id"] = object_id
            lookup.setdefault(object_id, normalized)
    except Exception:
        logger.exception("phase2.object.lookup.deep_sky.failed")

    return lookup


def _phase2_object_lookup_cache_key(parsed_location=None):
    if not isinstance(parsed_location, dict):
        return "oras"

    return (
        parsed_location.get("latitude"),
        parsed_location.get("longitude"),
        parsed_location.get("elevation_ft"),
    )


def get_phase2_object_lookup(parsed_location=None):
    cache_key = _phase2_object_lookup_cache_key(parsed_location)
    now = time.time()
    cached = _phase2_object_lookup_cache.get(cache_key)
    if isinstance(cached, dict) and cached.get("expires_at", 0) > now:
        return cached.get("lookup") or {}

    lookup = _build_phase2_object_lookup(parsed_location=parsed_location)
    _phase2_object_lookup_cache[cache_key] = {
        "lookup": lookup,
        "expires_at": now + _PHASE2_OBJECT_LOOKUP_TTL_SECONDS,
    }
    return lookup


def build_phase1_scene_state(parsed_location=None, as_of: str | None = None):
    """Assemble the unified backend-owned Phase 1 scene state."""
    time_context = _resolve_time_context(as_of)
    location = _resolve_location(parsed_location)
    live_inputs = _fetch_live_inputs(location, time_context)

    satellite_objects = _build_satellite_engine_slice(
        parsed_location=parsed_location,
        time_context=time_context,
        live_inputs=live_inputs,
    )
    planet_objects = _build_solar_system_engine_slice(
        parsed_location=parsed_location,
        time_context=time_context,
        live_inputs=live_inputs,
    )
    deep_sky_objects = _build_deep_sky_engine_slice(
        parsed_location=parsed_location,
        time_context=time_context,
        live_inputs=live_inputs,
    )

    objects = [
        obj
        for obj in (satellite_objects + planet_objects + deep_sky_objects)
        if obj.get("type") in ("satellite", "planet", "moon", "deep_sky")
    ]
    normalized_objects = []
    for obj in objects:
        if not isinstance(obj, dict):
            continue
        if obj.get("type") == "moon":
            moon_as_planet = dict(obj)
            moon_as_planet["type"] = "planet"
            normalized_objects.append(moon_as_planet)
        else:
            normalized_objects.append(obj)
    objects = normalized_objects
    objects = [obj for obj in objects if _is_above_horizon(obj)]
    objects = _select_diverse_scene_objects(objects, limit=10)
    objects = [_enforce_phase1_object_contract(obj) for obj in objects]

    scene = {
        "scope": "above_me",
        "engine": "main",
        "filter": "visible",
        "timestamp": time_context.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "objects": objects,
    }

    try:
        from backend.app.contracts.phase1 import SceneContract

        contract_keys = (
            "id",
            "name",
            "type",
            "engine",
            "provider_source",
            "summary",
            "time_relevance",
            "reason_for_inclusion",
            "detail_route",
            "position",
            "visibility",
            "relevance_score",
        )
        contract_scene = dict(scene)
        contract_scene["objects"] = [
            {key: obj.get(key) for key in contract_keys if key in obj}
            for obj in objects
            if isinstance(obj, dict)
        ]
        SceneContract.parse_obj(contract_scene)
    except Exception:
        logger.exception("scene.validation.warn")

    conditions = _build_earth_engine_slice(parsed_location=parsed_location, live_inputs=live_inputs)
    top_target = next((obj for obj in objects if obj.get("type") in ("planet", "deep_sky")), None)
    next_pass = next((obj for obj in objects if obj.get("type") == "satellite"), None)

    briefing = {
        "observing_score": conditions.get("observing_score"),
        "top_target_id": top_target.get("id") if top_target else None,
        "top_target_name": top_target.get("name") if top_target else None,
        "next_event": next_pass.get("name") if next_pass else None,
        "conditions_summary": conditions.get("summary"),
    }

    def _elevation_band(elevation):
        try:
            value = float(elevation)
        except Exception:
            value = None
        if value is None:
            return "mid"
        if value >= 50:
            return "high"
        if value >= 20:
            return "mid"
        return "low"

    supporting_targets = []
    supporting_passes = []
    for obj in objects:
        if obj.get("type") in ("planet", "deep_sky"):
            position = obj.get("position") if isinstance(obj.get("position"), dict) else {}
            supporting_targets.append(
                {
                    "id": obj.get("id"),
                    "name": obj.get("name"),
                    "type": obj.get("type"),
                    "category": obj.get("type"),
                    "engine": obj.get("engine"),
                    "direction": "SE",
                    "elevation_band": _elevation_band(position.get("elevation")),
                    "best_time": "Tonight",
                    "difficulty": "beginner" if obj.get("type") == "planet" else "intermediate",
                    "reason": obj.get("summary") or "",
                    "summary": obj.get("summary") or "",
                }
            )
        elif obj.get("type") == "satellite":
            position = obj.get("position") if isinstance(obj.get("position"), dict) else {}
            visibility = obj.get("visibility") if isinstance(obj.get("visibility"), dict) else {}
            supporting_passes.append(
                {
                    "object_id": obj.get("id"),
                    "object_name": obj.get("name"),
                    "start_time": visibility.get("visibility_window_start"),
                    "max_elevation_deg": position.get("elevation"),
                    "start_direction": "W",
                    "end_direction": "E",
                    "visibility": "high" if (obj.get("relevance_score") or 0) >= 0.66 else "medium",
                }
            )

    supporting_flights = _build_flights_engine_slice(live_inputs=live_inputs)
    supporting_flights = [_enforce_phase1_object_contract(obj) for obj in supporting_flights]

    supporting_alerts = live_inputs.get("alerts") if isinstance(live_inputs, dict) else None
    if not isinstance(supporting_alerts, list) or not supporting_alerts:
        supporting_alerts = [
            {
                "priority": "notice",
                "category": "system",
                "title": "Provider degraded mode",
                "summary": "Live alert inputs unavailable; operating with reduced context.",
                "relevance": "medium",
            }
        ]
    events = supporting_alerts[:3]
    provider_trace = live_inputs.get("provider_trace") if isinstance(live_inputs, dict) else None
    if not isinstance(provider_trace, dict):
        provider_trace = {
            "timestamp_utc": time_context.isoformat(),
            "location": {
                "latitude": location.get("latitude"),
                "longitude": location.get("longitude"),
                "elevation_ft": location.get("elevation_ft"),
            },
            "providers": {},
            "degraded": True,
            "missing_sources": ["provider_trace_unavailable"],
        }

    return {
        "scene": scene,
        "briefing": briefing,
        "events": events,
        "provider_trace": provider_trace,
        "supporting": {
            "targets": supporting_targets,
            "passes": supporting_passes,
            "flights": supporting_flights,
            "alerts": supporting_alerts,
            "conditions": conditions,
            "provider_trace": provider_trace,
        },
        "degraded": bool(provider_trace.get("degraded")),
    }


def _fallback_media_for_type(obj_type):
    """Deterministic fallback media to keep detail payloads usable."""
    obj_type = str(obj_type or "").strip().lower()
    if obj_type in ("planet", "moon"):
        return {
            "type": "image",
            "url": "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg",
            "source": "Wikimedia",
        }
    if obj_type == "deep_sky":
        return {
            "type": "image",
            "url": "https://upload.wikimedia.org/wikipedia/commons/5/5f/Messier_13_HST.jpg",
            "source": "Wikimedia",
        }
    return None


def _is_blocked_image_url(url):
    if not isinstance(url, str):
        return True
    value = url.strip().lower()
    if not value:
        return True
    # Block only known URLs that currently return AccessDenied.
    if "images-assets.nasa.gov/image/iss071e099123" in value:
        return True
    return False


def _fallback_media_for_object(found):
    obj_type = str((found or {}).get("type") or "").strip().lower()
    object_key = str((found or {}).get("id") or (found or {}).get("name") or "").strip().lower()
    planet_fallbacks = {
        "mercury": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg",
        "venus": "https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg",
        "mars": "https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg",
        "jupiter": "https://upload.wikimedia.org/wikipedia/commons/e/e2/Jupiter.jpg",
        "saturn": "https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg",
        "uranus": "https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg",
        "neptune": "https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_Full.jpg",
        "moon": "https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg",
        "301": "https://upload.wikimedia.org/wikipedia/commons/e/e1/FullMoon2010.jpg",
    }
    if obj_type in ("planet", "moon"):
        url = planet_fallbacks.get(object_key)
        if url:
            return {"type": "image", "url": url, "source": "Wikimedia"}
    return _fallback_media_for_type(obj_type)


def _is_mismatched_satellite_image(found, url):
    if not isinstance(found, dict) or not isinstance(url, str):
        return False
    value = url.strip().lower()
    name = str(found.get("name") or "").strip().lower()
    if not value or not name:
        return False
    # Prevent known mis-assignment where non-ISS satellites resolve to ISS image.
    if "iss.jpg" in value and "iss" not in name:
        return True
    return False


def _normalize_satellite_metadata_value(value):
    text = str(value or "").strip()
    if not text:
        return "Classified"
    if text.lower() in ("none", "null", "n/a", "unknown"):
        return "Classified"
    return text


def _normalize_satellite_purpose(value):
    text = _normalize_satellite_metadata_value(value)
    if text == "Classified":
        return text
    lower_text = text.lower()
    if "citation needed" in lower_text:
        return "Classified"
    if "http://" in lower_text or "https://" in lower_text:
        prefix = text.split("http://", 1)[0].split("https://", 1)[0].strip(" -:;,.")
        return prefix or "Reference-linked mission context"
    return text


def _format_detail_value(value, fallback="Classified"):
    if value is None:
        return fallback
    text = str(value).strip()
    if not text:
        return fallback
    return text


def _build_solar_system_related(found):
    position = found.get("position") if isinstance(found.get("position"), dict) else {}
    visibility = found.get("visibility") if isinstance(found.get("visibility"), dict) else {}

    azimuth = position.get("azimuth")
    elevation = position.get("elevation")
    window_start = visibility.get("visibility_window_start")
    window_end = visibility.get("visibility_window_end")
    is_visible = visibility.get("is_visible")
    provider = found.get("provider_source") or "jpl_ephemeris"

    try:
        azimuth_text = f"{float(azimuth):.1f} deg"
    except Exception:
        azimuth_text = "Classified"

    try:
        elevation_text = f"{float(elevation):.1f} deg"
    except Exception:
        elevation_text = "Classified"

    if is_visible is True:
        visibility_text = "Visible now"
    elif is_visible is False:
        visibility_text = "Not visible now"
    else:
        visibility_text = "Classified"

    best_time = _format_detail_value(window_start)
    return [
        {
            "id": _slugify(f"{found.get('id')}-body-type"),
            "type": "object",
            "title": "Body type",
            "summary": (
                "Moon"
                if (
                    str(found.get("type") or "").strip().lower() == "moon"
                    or str(found.get("id") or "").strip().lower() in {"moon", "301"}
                )
                else "Planet"
            ),
            "relevance": "high",
        },
        {
            "id": _slugify(f"{found.get('id')}-azimuth"),
            "type": "object",
            "title": "Azimuth",
            "summary": azimuth_text,
            "relevance": "high",
        },
        {
            "id": _slugify(f"{found.get('id')}-elevation"),
            "type": "object",
            "title": "Elevation",
            "summary": elevation_text,
            "relevance": "high",
        },
        {
            "id": _slugify(f"{found.get('id')}-visibility"),
            "type": "object",
            "title": "Visibility",
            "summary": visibility_text,
            "relevance": "high",
        },
        {
            "id": _slugify(f"{found.get('id')}-window-start"),
            "type": "object",
            "title": "Visibility window start",
            "summary": _format_detail_value(window_start),
            "relevance": "medium",
        },
        {
            "id": _slugify(f"{found.get('id')}-window-end"),
            "type": "object",
            "title": "Visibility window end",
            "summary": _format_detail_value(window_end),
            "relevance": "medium",
        },
        {
            "id": _slugify(f"{found.get('id')}-best-viewing-time"),
            "type": "object",
            "title": "Best viewing time",
            "summary": best_time,
            "relevance": "high",
        },
        {
            "id": _slugify(f"{found.get('id')}-ephemeris-source"),
            "type": "object",
            "title": "Ephemeris source",
            "summary": _format_detail_value(provider, fallback="jpl_ephemeris"),
            "relevance": "medium",
        },
    ]


def build_phase1_object_detail(found, scene_objects=None):
    """Build canonical Phase 1 object detail payload."""
    scene_objects = scene_objects or []
    summary = found.get("summary") or ""
    detail = {
        "id": found.get("id"),
        "name": found.get("name"),
        "type": found.get("type"),
        "engine": found.get("engine"),
        "provider_source": found.get("provider_source") or _derive_provider_source(found),
        "summary": summary,
        "description": (
            f"{summary} This matters now because it is currently visible in your Above Me scene."
        ).strip(),
        "position": found.get("position"),
        "visibility": found.get("visibility"),
        "media": [],
        "related_objects": [],
    }

    if not isinstance(detail.get("visibility"), dict):
        detail["visibility"] = {"is_visible": True}

    related = []
    if detail.get("type") == "satellite":
        purpose_for_summary = "Classified"
        metadata_rows = [
            ("Status", found.get("satellite_status")),
            ("Operator / company", found.get("satellite_operator")),
            ("Countries", found.get("satellite_countries")),
            ("NORAD catalog ID", found.get("satellite_norad_id")),
            ("Launched", found.get("satellite_launched")),
            ("Deployed", found.get("satellite_deployed")),
            ("Mission / purpose", found.get("satellite_citation")),
            ("Website", found.get("satellite_website")),
        ]
        for title, value in metadata_rows:
            metadata_value = (
                _normalize_satellite_purpose(value)
                if title == "Mission / purpose"
                else _normalize_satellite_metadata_value(value)
            )
            if title == "Mission / purpose":
                purpose_for_summary = metadata_value
            related.append(
                {
                    "id": _slugify(f"{found.get('id')}-{title}"),
                    "type": "object",
                    "title": title,
                    "summary": metadata_value,
                    "relevance": "high",
                }
            )
        if purpose_for_summary == "Classified":
            detail["summary"] = f"{detail.get('name') or 'Satellite'} — mission classified."
        else:
            detail["summary"] = f"{detail.get('name') or 'Satellite'} — {purpose_for_summary}."
        detail["description"] = (
            f"{summary} This satellite is currently surfaced in your active sky context."
        ).strip()
    elif detail.get("type") in ("planet", "moon"):
        related.extend(_build_solar_system_related(found))
        best_view = None
        visibility = detail.get("visibility") if isinstance(detail.get("visibility"), dict) else {}
        if isinstance(visibility, dict):
            best_view = visibility.get("visibility_window_start")
        if best_view:
            detail["summary"] = f"{detail.get('name') or 'Object'} visible with best viewing around {best_view}."
        else:
            detail["summary"] = f"{detail.get('name') or 'Object'} visible in current observing context."
        detail["description"] = (
            "Solar-system context resolved from live JPL ephemeris with local sky position and visibility window."
        )
    elif detail.get("type") == "deep_sky":
        catalog = _format_detail_value(found.get("catalog"), fallback="Classified")
        object_class = _format_detail_value(found.get("object_class"), fallback="Classified")
        constellation = _format_detail_value(found.get("constellation"), fallback="Classified")
        magnitude = _format_detail_value(found.get("magnitude"), fallback="Classified")
        related.extend(
            [
                {
                    "id": _slugify(f"{found.get('id')}-catalog"),
                    "type": "object",
                    "title": "Catalog",
                    "summary": catalog,
                    "relevance": "high",
                },
                {
                    "id": _slugify(f"{found.get('id')}-object-class"),
                    "type": "object",
                    "title": "Object class",
                    "summary": object_class,
                    "relevance": "high",
                },
                {
                    "id": _slugify(f"{found.get('id')}-constellation"),
                    "type": "object",
                    "title": "Constellation",
                    "summary": constellation,
                    "relevance": "high",
                },
                {
                    "id": _slugify(f"{found.get('id')}-magnitude"),
                    "type": "object",
                    "title": "Magnitude",
                    "summary": magnitude,
                    "relevance": "medium",
                },
            ]
        )
        detail["summary"] = f"{detail.get('name') or 'Object'} in {constellation} ({catalog})."
        detail["description"] = (
            "Deep-sky target ranked from Messier catalog coordinates with local visibility context."
        )

    detail_type = str(detail.get("type") or "").strip().lower()
    detail_engine = str(detail.get("engine") or "").strip().lower()
    for candidate in scene_objects:
        if not isinstance(candidate, dict):
            continue
        candidate_id = candidate.get("id")
        if candidate_id == found.get("id"):
            continue
        candidate_type = str(candidate.get("type") or "").strip().lower()
        candidate_engine = str(candidate.get("engine") or "").strip().lower()
        if detail_type in ("planet", "moon"):
            if candidate_type not in ("planet", "moon"):
                continue
            if candidate_engine not in ("solar_system", "planets", "moon"):
                continue
        if detail_type == "satellite":
            if candidate_type != "satellite":
                continue
        if detail_engine in ("solar_system", "planets", "moon") and candidate_engine not in (
            "solar_system",
            "planets",
            "moon",
        ):
            continue
        related.append(
            {
                "id": _slugify(candidate_id or candidate.get("name") or "related"),
                "type": "object",
                "title": candidate.get("name") or "Related Object",
                "summary": candidate.get("summary") or "",
                "relevance": "medium",
            }
        )
        if len(related) >= 3:
            break
    detail["related_objects"] = related

    satellite_image_url = str(found.get("satellite_image_url") or "").strip()
    if (
        satellite_image_url
        and not _is_blocked_image_url(satellite_image_url)
        and not _is_mismatched_satellite_image(found, satellite_image_url)
    ):
        detail["media"] = [
            {
                "type": "image",
                "url": satellite_image_url,
                "source": found.get("provider_source") or "satnogs",
            }
        ]

    try:
        from backend.services.imageResolver import get_object_image

        image = None if detail.get("media") else get_object_image(found.get("name") or "")
        if (
            image
            and isinstance(image, dict)
            and image.get("image_url")
            and not _is_blocked_image_url(image.get("image_url"))
        ):
            detail["media"] = [
                {"type": "image", "url": image.get("image_url"), "source": image.get("source")}
            ]
        else:
            name = (found.get("name") or "").strip()
            if name and (len(name) <= 4 and name[0].lower() == "m" and name[1:].strip().isdigit()):
                alternate = f"Messier {name[1:].strip()}"
                alt_image = get_object_image(alternate)
                if (
                    alt_image
                    and isinstance(alt_image, dict)
                    and alt_image.get("image_url")
                    and not _is_blocked_image_url(alt_image.get("image_url"))
                ):
                    detail["media"] = [
                        {
                            "type": "image",
                            "url": alt_image.get("image_url"),
                            "source": alt_image.get("source"),
                        }
                    ]
    except Exception:
        pass

    if not detail.get("media"):
        fallback = _fallback_media_for_object(found)
        if fallback:
            detail["media"] = [fallback]
        else:
            detail["media"] = []

    return detail
