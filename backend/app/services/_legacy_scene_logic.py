import logging
import time
from copy import deepcopy
from datetime import datetime, timezone
import hashlib

from backend.alerts_data import MOCK_ALERTS
from backend.normalizers import registry
from backend.app.services.live_ingestion import fetch_normalized_live_inputs
from backend.targets_data import get_targets


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


def _get_normalized_targets():
    """Return Phase 1 target summaries normalized to SceneObjectSummary shape."""
    try:
        raw_targets = get_targets(with_images=False)
    except Exception:
        raw_targets = []

    normalized = None
    try:
        try:
            norm_callable = registry.get("targets")
        except KeyError:
            norm_callable = None

        if norm_callable is not None:
            normalized = norm_callable(raw_targets)
    except Exception:
        normalized = None

    if isinstance(normalized, list):
        return normalized

    out = []
    for target in raw_targets:
        if not isinstance(target, dict):
            continue
        category = target.get("category")
        if category not in ("planet", "deep_sky", "satellite"):
            continue
        out.append(
            {
                "id": _slugify(target.get("name") or "unknown"),
                "name": target.get("name") or "unknown",
                "type": category,
                "engine": "mock",
                "summary": target.get("reason") or target.get("summary") or "",
                "position": None,
                "visibility": None,
                "relevance_score": None,
            }
        )
    return out


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
        elevation = round(_stable_float(seed, -8.0, 84.0), 1)
        if elevation <= 0.0:
            continue
        window_minute = int(_stable_float(seed + ":minute", 0.0, 59.0))
        start_time = time_context.replace(
            minute=window_minute, second=0, microsecond=0
        ).isoformat()
        out.append(
            {
                "id": _slugify(sat_id),
                "name": name,
                "type": "satellite",
                "engine": "satellite",
                "summary": f"Live pass candidate around {start_time}",
                "position": {
                    "elevation": elevation,
                    "azimuth": round(_stable_float(seed + ":az", 0.0, 359.0), 1),
                },
                "visibility": {
                    "is_visible": True,
                    "visibility_window_start": start_time,
                    "visibility_window_end": None,
                },
                "relevance_score": max(0.0, min(1.0, elevation / 90.0)),
            }
        )

    out = _rank_scene_objects(out)[:6]
    if out:
        return out

    # Live-provider degraded fallback: derive sky-track candidates from nearby flights.
    provider_flights = []
    if isinstance(live_inputs, dict):
        provider_flights = live_inputs.get("flights") or []
    fallback = []
    for flight in provider_flights:
        if not isinstance(flight, dict):
            continue
        name = str(flight.get("name") or "").strip()
        if not name:
            continue
        try:
            elevation = float(flight.get("elevation") or 0.0)
        except Exception:
            elevation = 0.0
        if elevation <= 0.0:
            continue
        distance_km = float(flight.get("distance_km") or 0.0)
        fallback.append(
            {
                "id": _slugify(f"flight-{flight.get('id') or name}"),
                "name": name,
                "type": "satellite",
                "engine": "satellite",
                "summary": f"Nearby live air-track candidate ({distance_km:.0f} km)",
                "position": {"elevation": elevation},
                "visibility": {"is_visible": True},
                "relevance_score": max(0.0, min(1.0, elevation / 90.0)),
            }
        )

    if fallback:
        return _rank_scene_objects(fallback)[:4]

    # Explicit degraded path when live sky-track sources are unavailable.
    return []


def _build_solar_system_engine_slice(parsed_location=None, time_context=None, live_inputs=None):
    """Provider-backed solar-system slice from JPL ephemeris."""
    out = []
    ephemeris = []
    if isinstance(live_inputs, dict):
        ephemeris = live_inputs.get("ephemeris") or []

    for entry in ephemeris:
        if not isinstance(entry, dict):
            continue
        name = str(entry.get("name") or "").strip()
        if not name:
            continue
        try:
            elevation = float(entry.get("elevation") or 0.0)
        except Exception:
            elevation = 0.0
        if elevation <= 0.0:
            continue
        try:
            azimuth = float(entry.get("azimuth") or 0.0)
        except Exception:
            azimuth = 0.0
        out.append(
            {
                "id": _slugify(entry.get("id") or name),
                "name": name,
                "type": "planet",
                "engine": "solar_system",
                "summary": f"Live ephemeris position az {azimuth:.1f} el {elevation:.1f}",
                "position": {"azimuth": azimuth, "elevation": elevation},
                "visibility": {"is_visible": True},
                "relevance_score": max(0.0, min(1.0, elevation / 90.0)),
            }
        )

    if out:
        return _rank_scene_objects(out)[:4]

    # Degraded fallback to normalized local targets if ephemeris is unavailable.
    fallback = []
    for target in _get_normalized_targets():
        if target.get("type") != "planet":
            continue
        candidate = dict(target)
        candidate["engine"] = "solar_system"
        candidate["summary"] = candidate.get("summary") or "Degraded fallback planet context."
        if candidate.get("relevance_score") is None:
            candidate["relevance_score"] = 0.7
        fallback.append(candidate)
    return fallback[:3]


def _build_deep_sky_engine_slice():
    """Phase 1 Deep Sky slice: visible tonight only."""
    out = []
    for target in _get_normalized_targets():
        if target.get("type") != "deep_sky":
            continue
        candidate = dict(target)
        candidate["engine"] = "deep_sky"
        if candidate.get("relevance_score") is None:
            candidate["relevance_score"] = 0.6
        out.append(candidate)
    return out


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
                "degraded": bool(missing_sources),
                "missing_sources": missing_sources,
                "last_updated": conditions.get("last_updated"),
                "cloud_cover_pct": conditions.get("cloud_cover_pct"),
                "visibility_m": conditions.get("visibility_m"),
                "temperature_c": conditions.get("temperature_c"),
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


def _derive_time_relevance(obj):
    visibility = obj.get("visibility") if isinstance(obj, dict) else None
    if isinstance(visibility, dict):
        window_start = visibility.get("visibility_window_start")
        if window_start:
            return f"window_start:{window_start}"
    return "currently_visible"


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
    }


def _to_phase2_scene_objects(raw_objects, engine_slug):
    scene_objects = []
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
                "summary": obj.get("summary") or "",
                "reason": reason,
                "position": obj.get("position"),
                "visibility": obj.get("visibility"),
            }
        )
    return scene_objects


def _build_phase2_scene_group(title, reason, objects):
    return {
        "title": title,
        "reason": reason,
        "objects": objects,
    }


def _build_phase2_deep_sky_scene(filter_slug, parsed_location=None):
    objects = _to_phase2_scene_objects(_build_deep_sky_engine_slice(), "deep_sky")
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
    objects = _to_phase2_scene_objects(
        _build_solar_system_engine_slice(parsed_location=parsed_location),
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
    conditions = _build_earth_engine_slice(parsed_location)
    moon_phase = conditions.get("moon_phase") or "Unknown"
    moon_summary = f"Moon phase tonight: {moon_phase}"
    moon_object = {
        "id": "moon",
        "name": "Moon",
        "type": "planet",
        "engine": "moon",
        "summary": moon_summary,
        "reason": "Moon is always relevant for observing quality and lunar viewing.",
        "position": None,
        "visibility": {"is_visible": True},
    }
    groups = [
        _build_phase2_scene_group(
            "Moon Conditions",
            "Moon phase and observing impact grouped for quick planning.",
            [moon_object],
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
    objects = _to_phase2_scene_objects(
        _build_satellite_engine_slice(parsed_location=parsed_location),
        "satellites",
    )
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


def _build_phase2_above_me_scene(filter_slug, parsed_location=None):
    phase1_state = build_phase1_scene_state(parsed_location)
    phase1_scene = phase1_state.get("scene") or {}
    phase1_objects = phase1_scene.get("objects") or []
    objects = _to_phase2_scene_objects(phase1_objects, "above_me")

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
    required_engines = ("above_me", "deep_sky", "planets", "moon", "satellites")
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
    deep_sky_objects = _build_deep_sky_engine_slice()

    objects = [
        obj
        for obj in (satellite_objects + planet_objects + deep_sky_objects)
        if obj.get("type") in ("satellite", "planet", "deep_sky")
    ]
    objects = [obj for obj in objects if _is_above_horizon(obj)]
    objects = _rank_scene_objects(objects)
    objects = objects[:10]
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

        SceneContract.parse_obj(scene)
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
            "alerts": supporting_alerts,
            "conditions": conditions,
            "provider_trace": provider_trace,
        },
        "degraded": bool(provider_trace.get("degraded")),
    }


def _fallback_media_for_type(obj_type):
    """Deterministic fallback media to keep detail payloads usable."""
    if obj_type == "satellite":
        return {
            "type": "image",
            "url": "https://images-assets.nasa.gov/image/iss071e099123/iss071e099123~small.jpg",
            "source": "NASA",
        }
    if obj_type == "planet":
        return {
            "type": "image",
            "url": "https://images-assets.nasa.gov/image/PIA03149/PIA03149~small.jpg",
            "source": "NASA",
        }
    return {
        "type": "image",
        "url": "https://images-assets.nasa.gov/image/heic0710a/heic0710a~small.jpg",
        "source": "NASA",
    }


def build_phase1_object_detail(found, scene_objects=None):
    """Build canonical Phase 1 object detail payload."""
    scene_objects = scene_objects or []
    summary = found.get("summary") or ""
    detail = {
        "id": found.get("id"),
        "name": found.get("name"),
        "type": found.get("type"),
        "engine": found.get("engine"),
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

    related_news = []
    for alert in MOCK_ALERTS:
        if not isinstance(alert, dict):
            continue
        related_news.append(
            {
                "id": _slugify(alert.get("title") or "alert"),
                "type": "news",
                "title": alert.get("title"),
                "summary": alert.get("summary"),
                "relevance": alert.get("relevance"),
            }
        )
    detail["related_objects"] = related_news

    try:
        from backend.services.imageResolver import get_object_image

        image = get_object_image(found.get("name") or "")
        if image and isinstance(image, dict) and image.get("image_url"):
            detail["media"] = [
                {"type": "image", "url": image.get("image_url"), "source": image.get("source")}
            ]
        else:
            name = (found.get("name") or "").strip()
            if name and (len(name) <= 4 and name[0].lower() == "m" and name[1:].strip().isdigit()):
                alternate = f"Messier {name[1:].strip()}"
                alt_image = get_object_image(alternate)
                if alt_image and isinstance(alt_image, dict) and alt_image.get("image_url"):
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
        detail["media"] = [_fallback_media_for_type(found.get("type"))]

    return detail
