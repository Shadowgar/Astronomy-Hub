"""Factual observer context and conservative observability.v1 labels."""

from __future__ import annotations

from datetime import datetime, timezone
import logging
import math
from typing import Any

from backend.app.services import live_providers
from backend.app.services.planetary_ephemeris_service import compute_local_planetary_ephemeris


SCHEMA_VERSION = "observability.v1"
WEATHER_MAX_AGE_SECONDS = 1800
WEATHER_FIELDS = (
    "cloud_cover_pct", "visibility_m", "temperature_c", "humidity_pct",
    "wind_mph", "dew_point_c", "weather_code",
)
logger = logging.getLogger(__name__)


def _finite(value: Any) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def darkness_state(sun_altitude_deg: float | None) -> str:
    altitude = _finite(sun_altitude_deg)
    if altitude is None:
        return "unknown"
    if altitude > 0:
        return "daylight"
    if altitude >= -6:
        return "civil_twilight"
    if altitude >= -12:
        return "nautical_twilight"
    if altitude > -18:
        return "astronomical_twilight"
    return "astronomical_night"


def angular_separation_deg(
    ra_a: Any, dec_a: Any, ra_b: Any, dec_b: Any,
) -> float | None:
    coordinates = [_finite(value) for value in (ra_a, dec_a, ra_b, dec_b)]
    if any(value is None for value in coordinates):
        return None
    a_ra, a_dec, b_ra, b_dec = (math.radians(value) for value in coordinates)
    cosine = math.sin(a_dec) * math.sin(b_dec) + math.cos(a_dec) * math.cos(b_dec) * math.cos(a_ra - b_ra)
    return math.degrees(math.acos(max(-1.0, min(1.0, cosine))))


def _weather_context(*, lat: float, lng: float, explicit_time: bool) -> dict[str, Any]:
    if explicit_time:
        return {"status": "not_evaluated_for_selected_time", "source": "open_meteo_current", "last_updated": None}
    try:
        provider = live_providers.fetch_open_meteo_conditions(lat, lng)
    except Exception:
        logger.warning("Current weather provider unavailable for observability", exc_info=True)
        return {"status": "degraded", "source": "open_meteo_current", "last_updated": None}
    if not isinstance(provider, dict):
        return {"status": "unavailable", "source": "open_meteo_current", "last_updated": None}
    updated = provider.get("last_updated")
    try:
        timestamp = datetime.fromisoformat(str(updated).replace("Z", "+00:00"))
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        age = (datetime.now(timezone.utc) - timestamp.astimezone(timezone.utc)).total_seconds()
    except (TypeError, ValueError):
        age = float("inf")
    result = {"status": "current_fresh" if 0 <= age <= WEATHER_MAX_AGE_SECONDS else "stale",
              "source": "open_meteo_current", "last_updated": updated}
    if result["status"] == "current_fresh":
        available = provider.get("factual_fields_available", WEATHER_FIELDS)
        result.update({key: provider[key] for key in WEATHER_FIELDS if key in available and provider.get(key) is not None})
    return result


def build_observability_context(
    *, lat: float, lng: float, elev: float, as_of: datetime, explicit_time: bool,
) -> dict[str, Any]:
    try:
        bodies = compute_local_planetary_ephemeris(
            lat, lng, elevation_ft=elev * 3.280839895, as_of=as_of,
        )
    except Exception:
        logger.warning("Local DE442s unavailable for observability", exc_info=True)
        bodies = []
    by_id = {str(body.get("id") or "").lower(): body for body in bodies}
    sun = by_id.get("sun", {})
    moon_body = by_id.get("moon", {})
    sun_alt = _finite(sun.get("elevation"))
    moon_alt = _finite(moon_body.get("elevation"))
    state = darkness_state(sun_alt)
    source = "jpl_de442s_local" if bodies else None
    return {
        "schema_version": SCHEMA_VERSION,
        "observer": {"lat": lat, "lng": lng, "elev": elev},
        "horizon_model": "geometric",
        "site_horizon_status": "not_modeled",
        "sky_darkness": {
            "state": state, "sun_altitude_deg": sun_alt,
            "in_astronomical_darkness": state == "astronomical_night" if state != "unknown" else None,
            "source": source if sun_alt is not None else None,
        },
        "moon": {
            "altitude_deg": moon_alt,
            "azimuth_deg": _finite(moon_body.get("azimuth")),
            "above_geometric_horizon": moon_alt > 0 if moon_alt is not None else None,
            "ra_deg": _finite(moon_body.get("ra")),
            "dec_deg": _finite(moon_body.get("dec")),
            "source": source if moon_alt is not None else None,
        },
        "weather": _weather_context(lat=lat, lng=lng, explicit_time=explicit_time),
        "limitations": ["Actual site terrain, trees, and buildings are not modeled.",
                        "Equipment-specific detectability is not evaluated."],
    }


def qualify_target(target: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    altitude = _finite(target.get("alt"))
    azimuth = _finite(target.get("az"))
    above = target.get("is_visible") if isinstance(target.get("is_visible"), bool) else (altitude > 0 if altitude is not None else None)
    state = context["sky_darkness"]["state"]
    assessment = (
        "below_geometric_horizon" if above is False else
        f"above_horizon_{state}" if above is True and state != "unknown" else "unknown"
    )
    moon = context["moon"]
    return {
        "above_geometric_horizon": above,
        "altitude_deg": altitude,
        "azimuth_deg": azimuth,
        "sky_state": state,
        "in_astronomical_darkness": context["sky_darkness"]["in_astronomical_darkness"],
        "moon_angular_separation_deg": angular_separation_deg(
            target.get("ra"), target.get("dec"), moon["ra_deg"], moon["dec_deg"],
        ),
        "assessment": assessment,
        "limitations": ["geometric_horizon_only", "detectability_not_evaluated"],
    }
