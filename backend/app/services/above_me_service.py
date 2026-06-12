from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import math
from typing import Any

from backend.app.services import live_providers
from backend.app.services.solar_system_catalog_service import SOLAR_SYSTEM_BODIES, SOLAR_SYSTEM_CATALOG
from backend.app.services.sky_catalog_service import LOCAL_MESSIER_SEARCH_OBJECTS
from backend.app.services.sky_engine_links import build_sky_engine_object_url
from backend.app.services.sky_star_catalog import (
    BRIGHT_STAR_SCENE_OBJECTS,
    build_tier2_mid_star_scene_objects,
)

DEFAULT_LIMIT = 25
MAX_LIMIT = 100


@dataclass(frozen=True)
class Observer:
    lat: float
    lng: float
    elev: float


def build_above_me_payload(
    *,
    lat: str | float,
    lng: str | float,
    time: str | None = None,
    limit: int | str | None = None,
    elev: str | float | None = None,
) -> dict[str, Any]:
    observer = _parse_observer(lat=lat, lng=lng, elev=elev)
    as_of = _parse_time(time)
    max_items = _parse_limit(limit)

    tier2_limit = max(1, max_items // 2)
    candidates = _build_catalog_candidates(observer=observer, as_of=as_of, tier2_limit=tier2_limit)
    visible = [candidate for candidate in candidates if candidate["is_visible"]]
    selected = _select_curated_visible_objects(visible, limit=max_items)

    return {
        "status": "ok",
        "data": {
            "objects": selected,
        },
        "meta": {
            "observer": {
                "lat": observer.lat,
                "lng": observer.lng,
                "elev": observer.elev,
            },
            "time": as_of.isoformat().replace("+00:00", "Z"),
            "limit": max_items,
            "total_candidates": len(candidates),
            "visible_candidates": len(visible),
            "object_sources": _object_source_inventory(),
        },
    }


def _build_catalog_candidates(*, observer: Observer, as_of: datetime, tier2_limit: int) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    candidates.extend(_build_solar_system_candidates(observer=observer, as_of=as_of))
    candidates.extend(_build_bright_star_candidates(observer=observer, as_of=as_of))
    candidates.extend(_build_tier2_star_candidates(observer=observer, as_of=as_of, limit=tier2_limit))
    candidates.extend(_build_messier_candidates(observer=observer, as_of=as_of))
    return candidates


def _select_curated_visible_objects(objects: list[dict[str, Any]], *, limit: int) -> list[dict[str, Any]]:
    sorted_objects = sorted(objects, key=_candidate_sort_key)
    tier2_cap = max(1, limit // 2)
    tier2_count = 0
    selected: list[dict[str, Any]] = []

    for candidate in sorted_objects:
        if candidate["catalog"] == "Hipparcos Tier 2 (local)":
            if tier2_count >= tier2_cap:
                continue
            tier2_count += 1
        selected.append(candidate)
        if len(selected) >= limit:
            break

    return selected


def _candidate_sort_key(item: dict[str, Any]) -> tuple[float, float, str]:
    return (-float(item["priority"]), float(item["magnitude"] or 99.0), str(item["name"]))


def _build_bright_star_candidates(*, observer: Observer, as_of: datetime) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for star in BRIGHT_STAR_SCENE_OBJECTS:
        try:
            ra_hours = float(star["right_ascension"])
            dec_deg = float(star["declination"])
            magnitude = float(star["magnitude"])
        except Exception:
            continue

        ra_deg = ra_hours * 15.0
        alt, az = _ra_dec_to_alt_az(
            ra_hours=ra_hours,
            dec_deg=dec_deg,
            observer_lat_deg=observer.lat,
            observer_lon_deg=observer.lng,
            dt=as_of,
        )
        name = str(star.get("name") or star.get("id") or "Star").strip()
        source_id = str(star.get("id") or name).strip()
        candidates.append(
            _build_candidate(
                catalog="Bright Star Catalog (local)",
                source_id=source_id,
                model="star",
                name=name,
                object_type="star",
                ra=ra_deg,
                dec=dec_deg,
                alt=alt,
                az=az,
                magnitude=magnitude,
                observer=observer,
                as_of=as_of,
                reason=f"Bright local star at {alt:.1f} deg altitude.",
                source_boost=0.15,
            )
        )
    return candidates


def _build_tier2_star_candidates(*, observer: Observer, as_of: datetime, limit: int) -> list[dict[str, Any]]:
    ranked: list[tuple[tuple[float, float, str], dict[str, Any]]] = []
    for star in build_tier2_mid_star_scene_objects():
        try:
            ra_hours = float(star["right_ascension"])
            dec_deg = float(star["declination"])
            magnitude = float(star["magnitude"])
        except Exception:
            continue

        ra_deg = ra_hours * 15.0
        alt, az = _ra_dec_to_alt_az(
            ra_hours=ra_hours,
            dec_deg=dec_deg,
            observer_lat_deg=observer.lat,
            observer_lon_deg=observer.lng,
            dt=as_of,
        )
        if alt <= 0.0:
            continue

        name = str(star.get("name") or star.get("id") or "Hipparcos star").strip()
        source_id = str(star.get("id") or name).strip()
        priority = _priority(alt=alt, magnitude=magnitude, source_boost=0.0)
        ranked.append(
            (
                (-priority, magnitude, name),
                {
                    "source_id": source_id,
                    "name": name,
                    "ra": ra_deg,
                    "dec": dec_deg,
                    "alt": alt,
                    "az": az,
                    "magnitude": magnitude,
                },
            )
        )

    ranked.sort(key=lambda item: item[0])
    candidates: list[dict[str, Any]] = []
    for _, star in ranked[: max(1, limit)]:
        candidates.append(
            _build_candidate(
                catalog="Hipparcos Tier 2 (local)",
                source_id=star["source_id"],
                model="star",
                name=star["name"],
                object_type="star",
                ra=star["ra"],
                dec=star["dec"],
                alt=star["alt"],
                az=star["az"],
                magnitude=star["magnitude"],
                observer=observer,
                as_of=as_of,
                reason=f"Hipparcos Tier 2 star at {star['alt']:.1f} deg altitude.",
                source_boost=0.0,
            )
        )
    return candidates


def _build_messier_candidates(*, observer: Observer, as_of: datetime) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for obj in LOCAL_MESSIER_SEARCH_OBJECTS:
        try:
            ra_hours = float(obj["ra_hours"])
            dec_deg = float(obj["dec_deg"])
            magnitude = float(obj["magnitude"])
        except Exception:
            continue

        ra_deg = ra_hours * 15.0
        alt, az = _ra_dec_to_alt_az(
            ra_hours=ra_hours,
            dec_deg=dec_deg,
            observer_lat_deg=observer.lat,
            observer_lon_deg=observer.lng,
            dt=as_of,
        )
        name = str(obj.get("name") or obj.get("catalog") or "Messier object").strip()
        catalog_id = str(obj.get("catalog") or name).strip()
        object_type = str(obj.get("object_type") or "dso").strip()
        candidates.append(
            _build_candidate(
                catalog="Messier (local)",
                source_id=catalog_id,
                model="dso",
                name=name,
                object_type=object_type,
                ra=ra_deg,
                dec=dec_deg,
                alt=alt,
                az=az,
                magnitude=magnitude,
                observer=observer,
                as_of=as_of,
                reason=f"Local Messier {object_type.replace('_', ' ')} at {alt:.1f} deg altitude.",
                source_boost=0.1,
            )
        )
    return candidates


def _build_solar_system_candidates(*, observer: Observer, as_of: datetime) -> list[dict[str, Any]]:
    try:
        ephemeris = live_providers.fetch_jpl_ephemeris(
            observer.lat,
            observer.lng,
            elevation_ft=observer.elev * 3.280839895,
            as_of=as_of,
        )
    except Exception:
        return []

    candidates: list[dict[str, Any]] = []
    for body in ephemeris:
        source_id = str(body.get("id") or "").strip().lower()
        body_config = SOLAR_SYSTEM_BODIES.get(source_id)
        if not body_config:
            continue
        try:
            ra = float(body["ra"])
            dec = float(body["dec"])
            alt = float(body["elevation"])
            az = float(body["azimuth"])
        except Exception:
            continue

        model = body_config["model"]
        name = body_config["name"]
        object_type = model
        reason = f"JPL Horizons {name} position at {alt:.1f} deg altitude."
        if source_id == "sun":
            reason += " Daylight/safety object; observe only with a proper solar filter."

        candidates.append(
            _build_candidate(
                catalog=SOLAR_SYSTEM_CATALOG,
                source_id=source_id,
                model=model,
                name=name,
                object_type=object_type,
                ra=ra,
                dec=dec,
                alt=alt,
                az=az,
                magnitude=_optional_magnitude(body.get("magnitude")),
                observer=observer,
                as_of=as_of,
                reason=reason,
                source_boost=0.12 if source_id != "sun" else 0.03,
            )
        )
    return candidates


def _build_candidate(
    *,
    catalog: str,
    source_id: str,
    model: str,
    name: str,
    object_type: str,
    ra: float,
    dec: float,
    alt: float,
    az: float,
    magnitude: float | None,
    observer: Observer,
    as_of: datetime,
    reason: str,
    source_boost: float,
) -> dict[str, Any]:
    is_visible = alt > 0.0
    priority = _priority(alt=alt, magnitude=magnitude, source_boost=source_boost)
    return {
        "id": f"{catalog}:{source_id}",
        "catalog": catalog,
        "source_id": str(source_id),
        "model": model,
        "name": name,
        "type": object_type,
        "ra": round(float(ra), 8),
        "dec": round(float(dec), 8),
        "alt": round(float(alt), 3),
        "az": round(float(az), 3),
        "magnitude": round(float(magnitude), 3) if magnitude is not None else None,
        "is_visible": is_visible,
        "priority": priority,
        "reason": reason,
        "sky_engine_url": build_sky_engine_object_url(
            catalog=catalog,
            source_id=str(source_id),
            model=model,
            ra=ra,
            dec=dec,
            name=name,
            time=as_of.isoformat().replace("+00:00", "Z"),
            fov=_default_fov(model=model, object_type=object_type),
            lat=observer.lat,
            lng=observer.lng,
            elev=observer.elev,
        ),
    }


def _object_source_inventory() -> dict[str, dict[str, str]]:
    return {
        "messier_local": {
            "status": "included",
            "reason": "Local Messier seed objects have stable identity and RA/Dec.",
        },
        "bright_star_local": {
            "status": "included",
            "reason": "Local bright-star seed objects have stable identity and RA/Dec.",
        },
        "hipparcos_tier2_local": {
            "status": "included",
            "reason": "Existing Hipparcos Tier 2 dataset provides stable string IDs, RA/Dec, and magnitude.",
        },
        "gaia_dr2": {
            "status": "lookup_only",
            "reason": "Exact lookup exists, but broad indexed discovery/ranking is not implemented in this pass.",
        },
        "planets": {
            "status": "included",
            "reason": "JPL Horizons observer ephemeris provides planet RA/Dec and alt/az when provider data is reachable.",
        },
        "moon_sun": {
            "status": "included",
            "reason": "JPL Horizons observer ephemeris provides Moon/Sun RA/Dec and alt/az when provider data is reachable.",
        },
        "satellites": {
            "status": "gap",
            "reason": "TLE ingestion exists, but exact satellite identity, topocentric RA/Dec, and Sky Engine selection contract are not implemented yet.",
        },
    }


def _parse_observer(*, lat: str | float, lng: str | float, elev: str | float | None) -> Observer:
    lat_value = _parse_float(lat, "lat")
    lng_value = _parse_float(lng, "lng")
    elev_value = _parse_float(elev, "elev") if elev not in (None, "") else 0.0

    if not -90.0 <= lat_value <= 90.0:
        raise ValueError("lat must be between -90 and 90")
    if not -180.0 <= lng_value <= 180.0:
        raise ValueError("lng must be between -180 and 180")
    return Observer(lat=lat_value, lng=lng_value, elev=elev_value)


def _parse_float(value: str | float | int | None, field_name: str) -> float:
    try:
        return float(value)
    except Exception as exc:
        raise ValueError(f"{field_name} must be numeric") from exc


def _parse_time(value: str | None) -> datetime:
    if isinstance(value, str) and value.strip():
        try:
            parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
            if parsed.tzinfo is None:
                raise ValueError("time must include timezone")
            return parsed.astimezone(timezone.utc)
        except ValueError as exc:
            if "timezone" in str(exc):
                raise ValueError("time must include timezone (Z or offset)") from exc
            raise ValueError("time must be ISO-8601") from exc
        except Exception as exc:
            raise ValueError("time must be ISO-8601") from exc
    return datetime.now(timezone.utc)


def _parse_limit(value: int | str | None) -> int:
    if value in (None, ""):
        return DEFAULT_LIMIT
    try:
        parsed = int(value)
    except Exception as exc:
        raise ValueError("limit must be an integer") from exc
    return max(1, min(MAX_LIMIT, parsed))


def _optional_magnitude(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except Exception:
        return None


def _priority(*, alt: float, magnitude: float | None, source_boost: float) -> float:
    altitude_score = max(0.0, min(1.0, alt / 90.0))
    magnitude_score = 0.45 if magnitude is None else max(0.0, min(1.0, (9.0 - magnitude) / 11.0))
    return round(max(0.0, min(1.0, (0.65 * altitude_score) + (0.25 * magnitude_score) + source_boost)), 5)


def _default_fov(*, model: str, object_type: str) -> float:
    if model in {"planet", "moon", "sun"}:
        return 1.5 if model in {"moon", "sun"} else 1.0
    if model == "star":
        return 2.0
    if object_type == "galaxy":
        return 3.25
    if object_type in {"nebula", "planetary_nebula"}:
        return 2.5
    if object_type in {"open_cluster", "globular_cluster"}:
        return 3.0
    return 2.5


def _julian_date(dt: datetime) -> float:
    return (dt.astimezone(timezone.utc).timestamp() / 86400.0) + 2440587.5


def _local_sidereal_time_hours(dt: datetime, longitude_deg: float) -> float:
    jd = _julian_date(dt)
    d = jd - 2451545.0
    gmst_hours = (18.697374558 + 24.06570982441908 * d) % 24.0
    return (gmst_hours + (longitude_deg / 15.0)) % 24.0


def _ra_dec_to_alt_az(
    *,
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
