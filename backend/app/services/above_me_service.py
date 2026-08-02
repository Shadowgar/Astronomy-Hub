from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import hashlib
import json
import logging
import math
from typing import Any

from backend.app.cache.redis_cache import cache_get, cache_set
from backend.app.services import live_providers
from backend.app.services.planetary_ephemeris_service import get_planetary_ephemeris_status
from backend.app.services.openngc_dso_catalog_service import build_openngc_above_me_seed_records
from backend.app.services.openngc_dso_catalog_service import find_openngc_record_by_messier_id
from backend.app.services.solar_system_catalog_service import SOLAR_SYSTEM_BODIES, SOLAR_SYSTEM_CATALOG
from backend.app.services.satellite_propagation_service import (
    DEFAULT_SATELLITE_RESULT_LIMIT,
    SatelliteObserver,
    build_visible_satellite_candidates,
    satellite_feed_freshness,
)
from backend.app.services.sky_catalog_service import LOCAL_MESSIER_SEARCH_OBJECTS
from backend.app.services.sky_engine_links import build_sky_engine_object_url
from backend.app.services.sky_star_catalog import (
    BRIGHT_STAR_SCENE_OBJECTS,
    build_tier2_mid_star_scene_objects,
)
from backend.app.services.sky_object_enrichment import (
    enrich_messier_payload,
    enrich_openngc_payload,
    object_type_label,
)

DEFAULT_LIMIT = 25
MAX_LIMIT = 100
ABOVE_ME_CONTRACT_VERSION = "above-me.v1"
ABOVE_ME_CACHE_KEY_VERSION = "v1"
ABOVE_ME_CACHE_TTL_SECONDS = 30
ABOVE_ME_CURATION_POLICY = "balanced-v1"
BRIGHT_STAR_CATALOG = "Bright Star Catalog (local)"
CURATED_PRIMARY_CATEGORIES = ("solar_system", "dso", "bright_star", "satellite")
logger = logging.getLogger(__name__)


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
    cache_key = _build_above_me_cache_key(
        observer=observer,
        as_of=as_of,
        limit=max_items,
        explicit_time=isinstance(time, str) and bool(time.strip()),
    )
    cached_payload = _load_cached_above_me_payload(cache_key)
    if cached_payload is not None:
        return cached_payload

    tier2_limit = max(1, max_items // 2)
    satellite_limit = max(1, min(DEFAULT_SATELLITE_RESULT_LIMIT, max_items // 3 or 1))
    openngc_limit = max(1, min(12, max_items // 4 or 1))
    candidates = _build_catalog_candidates(
        observer=observer,
        as_of=as_of,
        tier2_limit=tier2_limit,
        satellite_limit=satellite_limit,
        openngc_limit=openngc_limit,
    )
    visible = [candidate for candidate in candidates if candidate["is_visible"]]
    selected = _select_curated_visible_objects(visible, limit=max_items)

    payload = {
        "status": "ok",
        "data": {
            "objects": selected,
        },
        "meta": {
            "contract_version": ABOVE_ME_CONTRACT_VERSION,
            "observer": {
                "lat": observer.lat,
                "lng": observer.lng,
                "elev": observer.elev,
            },
            "time": as_of.isoformat().replace("+00:00", "Z"),
            "limit": max_items,
            "total_candidates": len(candidates),
            "visible_candidates": len(visible),
            "object_sources": _object_source_inventory(as_of=as_of),
            "curation": _build_curation_metadata(visible=visible, selected=selected),
        },
    }
    cache_status = "miss" if _store_above_me_cache(cache_key, payload) else "degraded"
    payload["meta"]["cache"] = _cache_metadata(cache_status)
    return payload


def _build_above_me_cache_key(
    *,
    observer: Observer,
    as_of: datetime,
    limit: int,
    explicit_time: bool,
) -> str:
    normalized_time = (
        as_of.astimezone(timezone.utc).isoformat()
        if explicit_time
        else f"bucket:{int(as_of.timestamp()) // ABOVE_ME_CACHE_TTL_SECONDS}"
    )
    key_payload = {
        "contract_version": ABOVE_ME_CONTRACT_VERSION,
        "lat": _canonical_cache_float(observer.lat),
        "lng": _canonical_cache_float(observer.lng),
        "elev": _canonical_cache_float(observer.elev),
        "time": normalized_time,
        "limit": limit,
    }
    encoded = json.dumps(key_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    digest = hashlib.sha256(encoded).hexdigest()
    return f"above-me:{ABOVE_ME_CACHE_KEY_VERSION}:{digest}"


def _canonical_cache_float(value: float) -> str:
    normalized = 0.0 if value == 0.0 else value
    return repr(normalized)


def _load_cached_above_me_payload(cache_key: str) -> dict[str, Any] | None:
    cached = cache_get(cache_key)
    if cached is None:
        return None
    try:
        payload = json.loads(cached)
    except (TypeError, ValueError):
        return None
    if not _is_valid_cached_above_me_payload(payload):
        return None

    payload["meta"]["cache"] = _cache_metadata("hit")
    return payload


def _is_valid_cached_above_me_payload(payload: Any) -> bool:
    return (
        isinstance(payload, dict)
        and payload.get("status") == "ok"
        and isinstance(payload.get("data"), dict)
        and isinstance(payload["data"].get("objects"), list)
        and isinstance(payload.get("meta"), dict)
        and payload["meta"].get("contract_version") == ABOVE_ME_CONTRACT_VERSION
    )


def _store_above_me_cache(cache_key: str, payload: dict[str, Any]) -> bool:
    try:
        serialized = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    except (TypeError, ValueError):
        logger.exception("Unable to serialize above-me response for cache")
        return False
    return cache_set(cache_key, serialized, ttl_seconds=ABOVE_ME_CACHE_TTL_SECONDS)


def _cache_metadata(status: str) -> dict[str, Any]:
    return {
        "status": status,
        "ttl_seconds": ABOVE_ME_CACHE_TTL_SECONDS,
        "key_version": ABOVE_ME_CACHE_KEY_VERSION,
    }


def _build_curation_metadata(
    *,
    visible: list[dict[str, Any]],
    selected: list[dict[str, Any]],
) -> dict[str, Any]:
    available = {
        category
        for candidate in visible
        if (category := _curated_primary_category(candidate)) is not None
    }
    selected_counts = {category: 0 for category in CURATED_PRIMARY_CATEGORIES}
    for candidate in selected:
        category = _curated_primary_category(candidate)
        if category is not None:
            selected_counts[category] += 1

    available_categories = [
        category for category in CURATED_PRIMARY_CATEGORIES if category in available
    ]
    return {
        "policy": ABOVE_ME_CURATION_POLICY,
        "available_categories": available_categories,
        "selected_category_counts": selected_counts,
        "missing_categories": [
            category for category in CURATED_PRIMARY_CATEGORIES if category not in available
        ],
        "reservation_satisfied": all(selected_counts[category] > 0 for category in available),
    }


def _build_catalog_candidates(
    *,
    observer: Observer,
    as_of: datetime,
    tier2_limit: int,
    satellite_limit: int,
    openngc_limit: int,
) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    candidates.extend(_build_solar_system_candidates(observer=observer, as_of=as_of))
    candidates.extend(_build_bright_star_candidates(observer=observer, as_of=as_of))
    candidates.extend(_build_tier2_star_candidates(observer=observer, as_of=as_of, limit=tier2_limit))
    candidates.extend(_build_messier_candidates(observer=observer, as_of=as_of))
    candidates.extend(_build_openngc_dso_candidates(observer=observer, as_of=as_of, limit=openngc_limit))
    candidates.extend(_build_satellite_candidates(observer=observer, as_of=as_of, limit=satellite_limit))
    return candidates


def _select_curated_visible_objects(objects: list[dict[str, Any]], *, limit: int) -> list[dict[str, Any]]:
    if limit <= 0:
        return []

    sorted_objects = sorted(objects, key=_candidate_sort_key)
    tier2_cap = max(1, limit // 2)
    tier2_count = 0
    selected: list[dict[str, Any]] = []
    selected_identities: set[tuple[str, str, str]] = set()
    selected_dso_tokens: set[str] = set()

    def select(candidate: dict[str, Any]) -> bool:
        nonlocal tier2_count

        identity = _candidate_identity(candidate)
        if identity in selected_identities:
            return False
        dso_tokens = _dso_identity_tokens(candidate)
        if dso_tokens and selected_dso_tokens.intersection(dso_tokens):
            return False
        if candidate["catalog"] == "Hipparcos Tier 2 (local)":
            if tier2_count >= tier2_cap:
                return False
            tier2_count += 1
        selected.append(candidate)
        selected_identities.add(identity)
        selected_dso_tokens.update(dso_tokens)
        return True

    representatives: dict[str, dict[str, Any]] = {}
    for candidate in sorted_objects:
        category = _curated_primary_category(candidate)
        if category is not None and category not in representatives:
            representatives[category] = candidate

    ranked_representatives = sorted(
        (
            representatives[category]
            for category in CURATED_PRIMARY_CATEGORIES
            if category in representatives
        ),
        key=_candidate_sort_key,
    )
    for candidate in ranked_representatives[:limit]:
        select(candidate)

    for candidate in sorted_objects:
        if len(selected) >= limit:
            break
        select(candidate)

    return sorted(selected, key=_candidate_sort_key)


def _curated_primary_category(candidate: dict[str, Any]) -> str | None:
    model = candidate.get("model")
    if model in {"planet", "moon", "sun"}:
        return "solar_system"
    if model == "dso":
        return "dso"
    if model == "star" and candidate.get("catalog") == BRIGHT_STAR_CATALOG:
        return "bright_star"
    if model == "tle_satellite":
        return "satellite"
    return None


def _candidate_identity(candidate: dict[str, Any]) -> tuple[str, str, str]:
    return (
        str(candidate.get("catalog") or ""),
        str(candidate.get("source_id") or ""),
        str(candidate.get("model") or ""),
    )


def _dso_identity_tokens(candidate: dict[str, Any]) -> set[str]:
    if candidate.get("model") != "dso":
        return set()

    values = [candidate.get("source_id"), *(candidate.get("aliases") or [])]
    tokens: set[str] = set()
    for value in values:
        normalized = "".join(character for character in str(value or "").upper() if character.isalnum())
        for prefix in ("MESSIER", "NGC", "IC"):
            if normalized.startswith(prefix) and normalized[len(prefix):].isdigit():
                number = int(normalized[len(prefix):])
                canonical_prefix = "M" if prefix == "MESSIER" else prefix
                tokens.add(f"{canonical_prefix}{number}")
        if normalized.startswith("M") and normalized[1:].isdigit():
            tokens.add(f"M{int(normalized[1:])}")
    return tokens


def _candidate_sort_key(item: dict[str, Any]) -> tuple[float, float, str]:
    return (-float(item["priority"]), float(item["magnitude"] or 99.0), str(item["name"]))


def _build_bright_star_candidates(*, observer: Observer, as_of: datetime) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for star in BRIGHT_STAR_SCENE_OBJECTS:
        try:
            ra_hours = float(star["right_ascension"])
            dec_deg = float(star["declination"])
            magnitude = float(star["magnitude"])
        except (KeyError, TypeError, ValueError):
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
        except (KeyError, TypeError, ValueError):
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
        except (KeyError, TypeError, ValueError):
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
        seed_payload = {
            "source_id": catalog_id,
            "object_type": object_type,
            "names": [name, catalog_id],
        }
        enriched = enrich_messier_payload(seed_payload, find_openngc_record_by_messier_id(catalog_id))
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
                source_boost=0.2,
                extra_fields=_above_me_enrichment_fields(enriched),
            )
        )
    return candidates


def _build_openngc_dso_candidates(*, observer: Observer, as_of: datetime, limit: int) -> list[dict[str, Any]]:
    ranked: list[tuple[tuple[float, float, str], dict[str, Any]]] = []
    for obj in build_openngc_above_me_seed_records(limit=700):
        try:
            ra_deg = float(obj["ra"])
            dec_deg = float(obj["dec"])
            magnitude = float(obj["magnitude"])
        except (KeyError, TypeError, ValueError):
            continue

        alt, az = _ra_dec_to_alt_az(
            ra_hours=ra_deg / 15.0,
            dec_deg=dec_deg,
            observer_lat_deg=observer.lat,
            observer_lon_deg=observer.lng,
            dt=as_of,
        )
        if alt <= 0.0:
            continue

        common_names = obj.get("common_names") if isinstance(obj.get("common_names"), list) else []
        name = str((common_names[0] if common_names else None) or obj.get("display_name") or obj["source_id"]).strip()
        priority = _priority(alt=alt, magnitude=magnitude, source_boost=0.06)
        ranked.append(
            (
                (-priority, magnitude, name),
                _build_candidate(
                    catalog=str(obj["catalog"]),
                    source_id=str(obj["source_id"]),
                    model="dso",
                    name=name,
                    object_type=str(obj.get("object_type") or "dso"),
                    ra=ra_deg,
                    dec=dec_deg,
                    alt=alt,
                    az=az,
                    magnitude=magnitude,
                    observer=observer,
                    as_of=as_of,
                    reason=f"OpenNGC {obj.get('object_type', 'dso')} at {alt:.1f} deg altitude.",
                    source_boost=0.06,
                    extra_fields=_above_me_enrichment_fields(enrich_openngc_payload(obj, obj)),
                ),
            )
        )

    ranked.sort(key=lambda item: item[0])
    return [candidate for _, candidate in ranked[: max(1, limit)]]


def _build_solar_system_candidates(*, observer: Observer, as_of: datetime) -> list[dict[str, Any]]:
    try:
        ephemeris = live_providers.fetch_jpl_ephemeris(
            observer.lat,
            observer.lng,
            elevation_ft=observer.elev * 3.280839895,
            as_of=as_of,
        )
    except Exception:
        logger.exception("JPL ephemeris lookup failed while building above-me candidates")
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
        except (KeyError, TypeError, ValueError):
            continue

        model = body_config["model"]
        name = body_config["name"]
        object_type = model
        ephemeris_source = str(body.get("ephemeris_source") or "jpl_horizons")
        source_label = "JPL DE442s" if ephemeris_source == "jpl_de442s_local" else "JPL Horizons"
        reason = f"{source_label} {name} position at {alt:.1f} deg altitude."
        if source_id == "sun":
            reason += " Daylight/safety object; observe only with a proper solar filter."

        extra_fields: dict[str, Any] = {"ephemeris_source": ephemeris_source}
        if target_reference := body.get("target_reference"):
            extra_fields["target_reference"] = str(target_reference)
        distance_au = _optional_magnitude(body.get("distance_au"))
        if distance_au is not None:
            extra_fields["distance_au"] = distance_au

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
                extra_fields=extra_fields,
            )
        )
    return candidates


def _build_satellite_candidates(*, observer: Observer, as_of: datetime, limit: int) -> list[dict[str, Any]]:
    try:
        satellite_observer = SatelliteObserver(lat=observer.lat, lng=observer.lng, elev=observer.elev)
        return build_visible_satellite_candidates(
            observer=satellite_observer,
            as_of=as_of,
            limit=limit,
        )
    except Exception:
        logger.exception("Satellite propagation failed while building above-me candidates")
        return []


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
    extra_fields: dict[str, Any] | None = None,
) -> dict[str, Any]:
    is_visible = alt > 0.0
    priority = _priority(alt=alt, magnitude=magnitude, source_boost=source_boost)
    payload = {
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
    if extra_fields:
        payload.update(extra_fields)
    return payload


def _above_me_enrichment_fields(payload: dict[str, Any]) -> dict[str, Any]:
    fields: dict[str, Any] = {
        "object_type_label": payload.get("object_type_label") or object_type_label(str(payload.get("object_type") or "dso")),
    }
    for key in (
        "aliases",
        "common_names",
        "constellation",
        "angular_size",
        "source_attribution",
        "data_sources",
        "enrichment_status",
    ):
        value = payload.get(key)
        if value:
            fields[key] = value
    return fields


def _object_source_inventory(*, as_of: datetime) -> dict[str, dict[str, Any]]:
    satellite_freshness = satellite_feed_freshness(as_of)
    satellite_is_fresh = satellite_freshness["freshness_status"] == "fresh"
    planetary_status = get_planetary_ephemeris_status()
    planetary_source = (
        "Local JPL DE442s is loaded; Horizons remains the controlled fallback."
        if planetary_status["loaded"]
        else "Local JPL DE442s is degraded; JPL Horizons is the controlled fallback."
    )
    return {
        "messier_local": {
            "status": "included",
            "reason": "Local Messier seed objects have stable identity and RA/Dec.",
        },
        "openngc_local": {
            "status": "included",
            "reason": "Normalized OpenNGC local catalog provides bounded visible DSO discovery and exact NGC/IC identity links.",
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
            "reason": planetary_source,
            "ephemeris": planetary_status,
        },
        "moon_sun": {
            "status": "included",
            "reason": planetary_source,
            "ephemeris": planetary_status,
        },
        "satellites": {
            "status": "included" if satellite_is_fresh else "degraded",
            "reason": (
                "Local TLE feed is propagated with Skyfield for bounded visible satellite discovery."
                if satellite_is_fresh
                else "Local TLE feed is stale; visible satellite discovery is disabled until the feed is refreshed."
            ),
            **satellite_freshness,
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
    except (TypeError, ValueError) as exc:
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
    return datetime.now(timezone.utc)


def _parse_limit(value: int | str | None) -> int:
    if value in (None, ""):
        return DEFAULT_LIMIT
    try:
        parsed = int(value)
    except (TypeError, ValueError) as exc:
        raise ValueError("limit must be an integer") from exc
    return max(1, min(MAX_LIMIT, parsed))


def _optional_magnitude(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
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
