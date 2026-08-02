from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from backend.app.services import live_providers
from backend.app.services.sky_engine_links import build_sky_engine_object_url

SOLAR_SYSTEM_CATALOG = "Solar System (JPL)"
DEFAULT_OBSERVER_LAT = 41.44
DEFAULT_OBSERVER_LNG = -79.69

SOLAR_SYSTEM_BODIES: dict[str, dict[str, str]] = {
    "sun": {"name": "Sun", "model": "sun"},
    "moon": {"name": "Moon", "model": "moon"},
    "mercury": {"name": "Mercury", "model": "planet"},
    "venus": {"name": "Venus", "model": "planet"},
    "mars": {"name": "Mars", "model": "planet"},
    "jupiter": {"name": "Jupiter", "model": "planet"},
    "saturn": {"name": "Saturn", "model": "planet"},
    "uranus": {"name": "Uranus", "model": "planet"},
    "neptune": {"name": "Neptune", "model": "planet"},
}


def is_solar_system_identity(catalog: str) -> bool:
    return str(catalog or "").strip().lower() == SOLAR_SYSTEM_CATALOG.lower()


def normalize_solar_source_id(source_id: str) -> str:
    normalized = str(source_id or "").strip().lower()
    if normalized not in SOLAR_SYSTEM_BODIES:
        raise ValueError("solar-system object not found")
    return normalized


def solar_model_for_source_id(source_id: str) -> str:
    return SOLAR_SYSTEM_BODIES[normalize_solar_source_id(source_id)]["model"]


def build_solar_system_object_payload(
    *,
    source_id: str,
    model: str,
    lat: str | float | None = None,
    lng: str | float | None = None,
    time: str | None = None,
    elev: str | float | None = None,
) -> dict[str, Any]:
    normalized_source_id = normalize_solar_source_id(source_id)
    expected_model = solar_model_for_source_id(normalized_source_id)
    requested_model = str(model or "").strip().lower()
    if requested_model != expected_model:
        raise ValueError("solar-system model does not match source_id")

    observer_lat = _parse_float(lat, "lat", DEFAULT_OBSERVER_LAT)
    observer_lng = _parse_float(lng, "lng", DEFAULT_OBSERVER_LNG)
    observer_elev_m = _parse_float(elev, "elev", 0.0)
    as_of = _parse_time(time)
    ephemeris = live_providers.fetch_jpl_ephemeris(
        observer_lat,
        observer_lng,
        elevation_ft=observer_elev_m * 3.280839895,
        as_of=as_of,
    )
    body = next((item for item in ephemeris if str(item.get("id") or "").lower() == normalized_source_id), None)
    if body is None:
        raise ValueError("solar-system object not found")

    ra = _required_float(body.get("ra"), "RA/Dec unavailable for solar-system object")
    dec = _required_float(body.get("dec"), "RA/Dec unavailable for solar-system object")
    alt = _optional_float(body.get("elevation"))
    az = _optional_float(body.get("azimuth"))
    name = SOLAR_SYSTEM_BODIES[normalized_source_id]["name"]
    time_basis = str(body.get("time_basis") or as_of.isoformat().replace("+00:00", "Z"))
    ephemeris_source = str(body.get("ephemeris_source") or "jpl_horizons")
    target_reference = str(body.get("target_reference") or name)
    distance_au = _optional_float(body.get("distance_au"))
    source_label = (
        "local JPL DE442s ephemeris"
        if ephemeris_source == "jpl_de442s_local"
        else "JPL Horizons observer ephemeris"
    )

    return {
        "catalog": SOLAR_SYSTEM_CATALOG,
        "source_id": normalized_source_id,
        "display_name": name,
        "model": expected_model,
        "names": [f"NAME {name}", name],
        "types": ["SSO"],
        "ra": ra,
        "dec": dec,
        "alt": alt,
        "az": az,
        "magnitude": _optional_float(body.get("magnitude")),
        "indexed": True,
        "status": "indexed",
        "time_basis": time_basis,
        "ephemeris_source": ephemeris_source,
        "target_reference": target_reference,
        "distance_au": distance_au,
        "message": f"Resolved from {source_label}.",
        "provenance": {
            "source_key": ephemeris_source,
            "target_reference": target_reference,
        },
        "sky_engine_url": build_sky_engine_object_url(
            catalog=SOLAR_SYSTEM_CATALOG,
            source_id=normalized_source_id,
            model=expected_model,
            ra=ra,
            dec=dec,
            name=name,
            time=time_basis,
            fov=_default_fov(expected_model),
            lat=observer_lat,
            lng=observer_lng,
            elev=observer_elev_m,
        ),
    }


def _parse_float(value: str | float | int | None, field_name: str, default: float) -> float:
    if value in (None, ""):
        return default
    try:
        return float(value)
    except Exception as exc:
        raise ValueError(f"{field_name} must be numeric") from exc


def _required_float(value: Any, message: str) -> float:
    try:
        parsed = float(value)
    except Exception as exc:
        raise ValueError(message) from exc
    if not parsed == parsed:
        raise ValueError(message)
    return parsed


def _optional_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        parsed = float(value)
    except Exception:
        return None
    if not parsed == parsed:
        return None
    return parsed


def _parse_time(value: str | None) -> datetime:
    if isinstance(value, str) and value.strip():
        try:
            return datetime.fromisoformat(value.strip().replace("Z", "+00:00")).astimezone(timezone.utc)
        except Exception as exc:
            raise ValueError("time must be ISO-8601") from exc
    return datetime.now(timezone.utc)


def _default_fov(model: str) -> float:
    if model == "moon":
        return 1.2
    if model == "sun":
        return 1.5
    return 1.0
