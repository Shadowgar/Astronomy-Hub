from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import math
from typing import Any

from skyfield.api import EarthSatellite, load, wgs84

from backend.app.services.satellite_tle_catalog_service import (
    SATELLITE_TLE_CATALOG,
    SATELLITE_TLE_MODEL,
    load_satellite_tle_catalog,
)
from backend.app.services.sky_engine_links import build_sky_engine_object_url


DEFAULT_PROPAGATION_SCAN_LIMIT = 800
DEFAULT_SATELLITE_RESULT_LIMIT = 8
STARLINK_PROPAGATION_CAP = 40
HIGH_INTEREST_SOURCE_IDS = {"25544", "20580"}
HIGH_INTEREST_KEYWORDS = (
    "ISS",
    "INTERNATIONAL SPACE STATION",
    "HUBBLE",
    "TELESCOPE",
    "STATION",
    "PROBA",
    "LANDSAT",
    "SENTINEL",
    "NOAA",
    "TERRA",
    "AQUA",
    "IRIDIUM",
)


@dataclass(frozen=True)
class SatelliteObserver:
    lat: float
    lng: float
    elev: float = 0.0


_TIMESCALE = load.timescale()


def propagate_satellite_record(
    record: dict[str, Any],
    *,
    observer: SatelliteObserver,
    as_of: datetime,
) -> dict[str, Any] | None:
    """Propagate a normalized TLE record with Skyfield.

    Invalid TLEs and propagation failures return None so callers can skip the
    satellite without ever fabricating partial coordinates.
    """

    try:
        line1, line2 = _tle_lines(record)
        as_of_utc = _as_utc(as_of)
        satellite = EarthSatellite(line1, line2, str(record.get("display_name") or "Satellite"), _TIMESCALE)
        observer_site = wgs84.latlon(observer.lat, observer.lng, elevation_m=observer.elev)
        topocentric = (satellite - observer_site).at(_TIMESCALE.from_datetime(as_of_utc))
        alt, az, distance = topocentric.altaz()
        ra, dec, _ = topocentric.radec()
        propagated = {
            "id": f"{SATELLITE_TLE_CATALOG}:{record['source_id']}",
            "catalog": SATELLITE_TLE_CATALOG,
            "source_id": str(record["source_id"]),
            "model": SATELLITE_TLE_MODEL,
            "name": str(record.get("display_name") or record.get("name") or f"NORAD {record['source_id']}"),
            "type": "satellite",
            "norad_id": str(record.get("norad_id") or record["source_id"]),
            "category": str(record.get("category") or "satellite"),
            "groups": list(record.get("groups") or []),
            "ra": _finite_float(ra.hours * 15.0),
            "dec": _finite_float(dec.degrees),
            "alt": _finite_float(alt.degrees),
            "az": _normalize_degrees(_finite_float(az.degrees)),
            "range_km": _finite_float(distance.km),
            "magnitude": _optional_magnitude(record),
            "propagated_at": _format_utc(as_of_utc),
            "tle_epoch": satellite.epoch.utc_iso(),
        }
        propagated["is_visible"] = propagated["alt"] > 0.0
        propagated["sky_engine_url"] = build_sky_engine_object_url(
            catalog=propagated["catalog"],
            source_id=propagated["source_id"],
            model=propagated["model"],
            ra=propagated["ra"],
            dec=propagated["dec"],
            name=propagated["name"],
            time=propagated["propagated_at"],
            fov=1.0,
            lat=observer.lat,
            lng=observer.lng,
            elev=observer.elev,
        )
        return propagated
    except Exception:
        return None


def build_visible_satellite_candidates(
    *,
    observer: SatelliteObserver,
    as_of: datetime,
    limit: int = DEFAULT_SATELLITE_RESULT_LIMIT,
    scan_limit: int = DEFAULT_PROPAGATION_SCAN_LIMIT,
) -> list[dict[str, Any]]:
    max_results = max(0, min(DEFAULT_SATELLITE_RESULT_LIMIT, int(limit)))
    if max_results <= 0:
        return []

    records = _prioritized_scan_records(scan_limit=scan_limit)
    visible: list[dict[str, Any]] = []
    for record in records:
        propagated = propagate_satellite_record(record, observer=observer, as_of=as_of)
        if not propagated or not propagated["is_visible"]:
            continue
        propagated["priority"] = _satellite_priority(propagated)
        propagated["reason"] = (
            f"Propagated TLE satellite at {propagated['alt']:.1f} deg altitude "
            f"and {propagated['range_km']:.0f} km range."
        )
        visible.append(propagated)

    visible.sort(key=lambda item: (-float(item["priority"]), float(item.get("magnitude") or 99.0), item["name"]))
    return visible[:max_results]


def _prioritized_scan_records(*, scan_limit: int) -> list[dict[str, Any]]:
    catalog = load_satellite_tle_catalog()
    scored_records = sorted(
        catalog.records_by_norad.values(),
        key=lambda record: (-_prepropagation_score(record), str(record.get("display_name") or "")),
    )
    selected: list[dict[str, Any]] = []
    starlink_count = 0
    for record in scored_records:
        is_starlink = _is_starlink_record(record)
        if is_starlink:
            if starlink_count >= STARLINK_PROPAGATION_CAP:
                continue
            starlink_count += 1
        selected.append(record)
        if len(selected) >= max(1, scan_limit):
            break
    return selected


def _prepropagation_score(record: dict[str, Any]) -> float:
    source_id = str(record.get("source_id") or "")
    groups = {str(group).strip().lower() for group in record.get("groups") or []}
    name = " ".join(
        [
            str(record.get("display_name") or ""),
            str(record.get("short_name") or ""),
            " ".join(record.get("names") or []),
        ]
    ).upper()
    score = 0.0
    if source_id in HIGH_INTEREST_SOURCE_IDS:
        score += 1000.0
    if "station" in groups:
        score += 400.0
    if "science" in groups:
        score += 300.0
    if any(keyword in name for keyword in HIGH_INTEREST_KEYWORDS):
        score += 150.0
    if not _is_starlink_record(record):
        score += 75.0
    magnitude = _optional_magnitude(record)
    if magnitude is not None:
        score += max(0.0, 80.0 - (magnitude * 10.0))
    return score


def _satellite_priority(candidate: dict[str, Any]) -> float:
    source_id = str(candidate.get("source_id") or "")
    groups = {str(group).lower() for group in candidate.get("groups") or []}
    name = str(candidate.get("name") or "").upper()
    altitude_score = max(0.0, min(1.0, float(candidate["alt"]) / 90.0))
    magnitude = candidate.get("magnitude")
    magnitude_score = 0.35 if magnitude is None else max(0.0, min(1.0, (8.0 - float(magnitude)) / 10.0))
    boost = 0.0
    if source_id == "25544":
        boost += 0.35
    elif source_id == "20580":
        boost += 0.28
    if "station" in groups:
        boost += 0.18
    if "science" in groups:
        boost += 0.12
    if any(keyword in name for keyword in HIGH_INTEREST_KEYWORDS):
        boost += 0.08
    return round(max(0.0, min(1.0, (0.55 * altitude_score) + (0.25 * magnitude_score) + boost)), 5)


def _tle_lines(record: dict[str, Any]) -> tuple[str, str]:
    model_data = record.get("model_data") if isinstance(record.get("model_data"), dict) else {}
    tle = model_data.get("tle")
    if not isinstance(tle, list) or len(tle) != 2:
        raise ValueError("missing TLE")
    line1 = str(tle[0] or "").strip()
    line2 = str(tle[1] or "").strip()
    if not line1.startswith("1 ") or not line2.startswith("2 "):
        raise ValueError("invalid TLE")
    return line1, line2


def _optional_magnitude(record: dict[str, Any]) -> float | None:
    model_data = record.get("model_data") if isinstance(record.get("model_data"), dict) else {}
    for key in ("mag", "magnitude", "std_mag"):
        value = model_data.get(key)
        if value in (None, ""):
            continue
        try:
            number = float(value)
        except Exception:
            continue
        return number if math.isfinite(number) else None
    return None


def _is_starlink_record(record: dict[str, Any]) -> bool:
    haystack = " ".join(
        [
            str(record.get("display_name") or ""),
            str(record.get("short_name") or ""),
            str(record.get("category") or ""),
            " ".join(record.get("groups") or []),
            " ".join(record.get("names") or []),
        ]
    ).upper()
    return "STARLINK" in haystack


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        raise ValueError("satellite propagation time must be timezone-aware")
    return value.astimezone(timezone.utc)


def _format_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _finite_float(value: Any) -> float:
    number = float(value)
    if not math.isfinite(number):
        raise ValueError("non-finite propagated coordinate")
    return number


def _normalize_degrees(value: float) -> float:
    return value % 360.0
