from copy import deepcopy

from backend.app.contracts.sky_scene import SkySceneContract
from backend.app.services._legacy_scene_logic import (
    _resolve_location,
    _resolve_time_context,
    build_phase1_scene_state,
    get_phase2_object_lookup,
    parse_location_override,
)
from backend.app.services.scopes_service import (
    PHASE2_ENGINE_REGISTRY,
    PHASE2_SCOPES,
    PHASE2_SCOPE_TO_ENGINES,
)

PHASE2_SCOPES = (
    "above_me",
    "sky",
    "earth",
    "sun",
    "satellites",
    "flights",
    "solar_system",
    "deep_sky",
)

_PHASE2_DEFAULT_ENGINE = {
    "above_me": "above_me",
    "sky": "sky_engine",
    "earth": "satellites",
    "sun": "moon",
    "satellites": "satellites",
    "flights": "flights",
    "solar_system": "planets",
    "deep_sky": "deep_sky",
}

_SKY_ENGINE_DEFAULT_SCENE_STATE = {
    "projection": "stereographic",
    "center_alt_deg": 28.0,
    "center_az_deg": 96.0,
    "fov_deg": 120.0,
    "stars_ready": False,
}


def _classify_solar_activity(alerts: list[dict] | None) -> tuple[str, str]:
    if not isinstance(alerts, list) or not alerts:
        return ("quiet", "No active SWPC alerts.")

    severity_by_priority = {
        "critical": 4,
        "high": 3,
        "medium": 2,
        "notice": 1,
        "low": 0,
    }
    best_alert = None
    best_score = -1
    for alert in alerts:
        if not isinstance(alert, dict):
            continue
        priority = str(alert.get("priority") or "").strip().lower()
        score = severity_by_priority.get(priority, 0)
        title = str(alert.get("title") or "").strip()
        summary = str(alert.get("summary") or "").strip()
        text = f"{title} {summary}".lower()
        if any(token in text for token in ("severe", "x-class", "storm", "cme", "flare")):
            score = max(score, 3)
        elif any(token in text for token in ("elevated", "watch", "kp")):
            score = max(score, 1)
        if score > best_score:
            best_score = score
            best_alert = alert

    if best_score >= 3:
        status = "active"
    elif best_score >= 1:
        status = "elevated"
    else:
        status = "quiet"

    if isinstance(best_alert, dict):
        title = str(best_alert.get("title") or "").strip()
        summary = str(best_alert.get("summary") or "").strip()
        detail = summary or title or "SWPC solar activity update."
    else:
        detail = "SWPC solar activity update unavailable."
    return (status, detail)


def _apply_solar_activity_context(objects: list[dict], phase1_state: dict | None) -> list[dict]:
    if not isinstance(objects, list):
        return []
    supporting = phase1_state.get("supporting") if isinstance(phase1_state, dict) else {}
    alerts = supporting.get("alerts") if isinstance(supporting, dict) else None
    status, detail = _classify_solar_activity(alerts if isinstance(alerts, list) else [])
    headline = f"Solar activity: {status}."

    enriched: list[dict] = []
    for obj in objects:
        if not isinstance(obj, dict):
            continue
        normalized = deepcopy(obj)
        base_summary = str(normalized.get("summary") or "").strip()
        normalized["summary"] = f"{base_summary} {headline}".strip() if base_summary else headline
        normalized["solar_activity_status"] = status
        normalized["solar_activity_summary"] = detail
        reason = str(normalized.get("reason_for_inclusion") or "").strip()
        normalized["reason_for_inclusion"] = (
            f"{reason} {detail}".strip() if reason else detail
        )
        enriched.append(normalized)
    return enriched


def build_above_me_scene_payload(
    parsed_location: dict | None = None,
    as_of: str | None = None,
) -> dict:
    """Return backend-authored Phase 1 scene payload for the Above Me surface."""
    state = build_phase1_scene_state(parsed_location=parsed_location, as_of=as_of)
    scene = state.get("scene") if isinstance(state, dict) else None
    if isinstance(scene, dict):
        return scene

    # Defensive fallback: preserve contract shape if upstream assembly fails unexpectedly.
    return {
        "scope": "above_me",
        "engine": "main",
        "filter": "visible",
        "timestamp": "1970-01-01T00:00:00Z",
        "objects": [],
    }


def build_sky_scene_payload(
    parsed_location: dict | None = None,
    as_of: str | None = None,
) -> dict:
    """Return backend-authored Sky Engine scene ownership context.

    This payload intentionally excludes star catalogs for this slice. It provides
    only observer, timestamp, engine identity, and minimal scene metadata so the
    frontend stops owning scene context.
    """
    resolved_location = _resolve_location(parsed_location)
    resolved_time = _resolve_time_context(as_of)
    timestamp = resolved_time.replace(microsecond=0).isoformat().replace("+00:00", "Z")
    elevation_ft = float(resolved_location.get("elevation_ft") or 0.0)

    payload = SkySceneContract(
        scope="sky",
        engine="sky_engine",
        filter="visible_now",
        timestamp=timestamp,
        observer={
            "label": str(resolved_location.get("label") or "Observer"),
            "latitude": float(resolved_location.get("latitude")),
            "longitude": float(resolved_location.get("longitude")),
            "elevation_ft": elevation_ft,
            "elevation_m": round(elevation_ft * 0.3048, 3),
        },
        scene_state=_SKY_ENGINE_DEFAULT_SCENE_STATE,
        objects=[],
        degraded=False,
        missing_sources=[],
        input_context={
            "lat": parsed_location.get("latitude") if isinstance(parsed_location, dict) else None,
            "lon": parsed_location.get("longitude") if isinstance(parsed_location, dict) else None,
            "elevation_ft": (
                parsed_location.get("elevation_ft") if isinstance(parsed_location, dict) else None
            ),
            "as_of": as_of,
        },
    )
    return payload.dict()


def build_phase2_scope_scene_payload(scope: str) -> dict:
    return build_phase2_scope_scene_payload_with_context(
        scope,
        engine=None,
        filter_slug=None,
        lat=None,
        lon=None,
        elevation_ft=None,
        as_of=None,
    )


def _extract_scene_objects(scene: dict) -> list[dict]:
    objects = scene.get("objects")
    if isinstance(objects, list):
        return [deepcopy(obj) for obj in objects if isinstance(obj, dict)]
    return []


def _resolve_engine(scope: str, requested_engine: str | None) -> str:
    allowed_engines = list(PHASE2_SCOPE_TO_ENGINES.get(scope, []))
    fallback_engine = _PHASE2_DEFAULT_ENGINE.get(scope)
    resolved_engine = requested_engine or fallback_engine
    if not resolved_engine:
        raise ValueError("invalid_engine")
    if resolved_engine not in allowed_engines:
        raise ValueError("engine_out_of_scope")
    return resolved_engine


def _resolve_filter(engine: str, requested_filter: str | None) -> str:
    engine_meta = PHASE2_ENGINE_REGISTRY.get(engine) or {}
    allowed_filters = list(engine_meta.get("allowed_filters") or [])
    default_filter = engine_meta.get("default_filter")
    resolved_filter = requested_filter or default_filter
    if not resolved_filter or resolved_filter not in allowed_filters:
        raise ValueError("invalid_filter")
    return resolved_filter


def _objects_for_engine(
    objects: list[dict],
    engine: str,
    phase1_state: dict | None = None,
    parsed_location: dict | None = None,
    as_of: str | None = None,
) -> list[dict]:
    if engine == "above_me":
        return list(objects)
    if engine == "deep_sky":
        deep_sky = [obj for obj in objects if obj.get("type") == "deep_sky"]
        if deep_sky:
            return deep_sky
        fallback_lookup = get_phase2_object_lookup(parsed_location=parsed_location, as_of=as_of)
        fallback_deep_sky = [
            deepcopy(obj)
            for obj in (fallback_lookup or {}).values()
            if isinstance(obj, dict)
            and obj.get("engine") == "deep_sky"
            and obj.get("type") == "deep_sky"
            and isinstance(obj.get("visibility"), dict)
            and obj.get("visibility", {}).get("is_visible") is True
        ]
        if fallback_deep_sky:
            return fallback_deep_sky
        return [
            deepcopy(obj)
            for obj in (fallback_lookup or {}).values()
            if isinstance(obj, dict)
            and obj.get("engine") == "deep_sky"
            and obj.get("type") == "deep_sky"
        ]
    if engine == "planets":
        planets = [obj for obj in objects if obj.get("type") == "planet"]
        if planets:
            return planets
        fallback_lookup = get_phase2_object_lookup(parsed_location=parsed_location, as_of=as_of)
        fallback_planets = [
            deepcopy(obj)
            for obj in (fallback_lookup or {}).values()
            if isinstance(obj, dict)
            and obj.get("engine") == "planets"
            and obj.get("type") == "planet"
            and isinstance(obj.get("visibility"), dict)
            and obj.get("visibility", {}).get("is_visible") is True
        ]
        if fallback_planets:
            return fallback_planets
        return [
            deepcopy(obj)
            for obj in (fallback_lookup or {}).values()
            if isinstance(obj, dict)
            and obj.get("engine") == "planets"
            and obj.get("type") == "planet"
        ]
    if engine == "moon":
        moon_objects = []
        for obj in objects:
            is_moon = (
                obj.get("type") == "moon"
                or (
                    obj.get("type") == "planet"
                    and str(obj.get("id") or "").strip().lower() == "moon"
                )
            )
            if not is_moon:
                continue
            normalized = deepcopy(obj)
            normalized["type"] = "moon"
            normalized["engine"] = "moon"
            moon_objects.append(normalized)
        if moon_objects:
            return _apply_solar_activity_context(moon_objects, phase1_state)
        fallback_lookup = get_phase2_object_lookup(parsed_location=parsed_location, as_of=as_of)
        fallback_moon = next(
            (
                deepcopy(obj)
                for obj in (fallback_lookup or {}).values()
                if isinstance(obj, dict)
                and str(obj.get("id") or "").strip().lower() == "moon"
            ),
            None,
        )
        if isinstance(fallback_moon, dict):
            fallback_moon["type"] = "moon"
            fallback_moon["engine"] = "moon"
            return _apply_solar_activity_context([fallback_moon], phase1_state)
        return []
    if engine == "satellites":
        return [obj for obj in objects if obj.get("type") == "satellite"]
    if engine == "flights":
        supporting = phase1_state.get("supporting") if isinstance(phase1_state, dict) else {}
        flights = supporting.get("flights") if isinstance(supporting, dict) else None
        if isinstance(flights, list):
            return [deepcopy(obj) for obj in flights if isinstance(obj, dict)]
        return []
    return []


def _sorted_objects(objects: list[dict]) -> list[dict]:
    return sorted(
        objects,
        key=lambda obj: (
            -float(obj.get("relevance_score") or 0.0),
            str(obj.get("id") or obj.get("name") or ""),
        ),
    )


def _apply_filter(objects: list[dict], filter_slug: str, engine: str) -> list[dict]:
    if not objects:
        return []
    if filter_slug == "visible_now":
        return list(objects)
    if filter_slug == "bright_only":
        if engine == "deep_sky":
            filtered = []
            for obj in objects:
                try:
                    magnitude = float(obj.get("magnitude"))
                except Exception:
                    continue
                if magnitude <= 6.5:
                    filtered.append(obj)
            if filtered:
                return sorted(
                    filtered,
                    key=lambda obj: (
                        float(obj.get("magnitude") if obj.get("magnitude") is not None else 99.0),
                        -float(obj.get("relevance_score") or 0.0),
                        str(obj.get("id") or obj.get("name") or ""),
                    ),
                )
        filtered = [obj for obj in objects if float(obj.get("relevance_score") or 0.0) >= 0.8]
        return filtered or objects[: max(1, len(objects) // 2)]
    if filter_slug == "high_altitude":
        filtered = [
            obj
            for obj in objects
            if float((obj.get("position") or {}).get("elevation") or 0.0) >= 20.0
        ]
        return filtered or objects[:1]
    if filter_slug == "short_window":
        candidate = objects
        if engine in ("satellites", "flights", "above_me"):
            satellite_subset = [obj for obj in objects if obj.get("type") == "satellite"]
            if satellite_subset:
                candidate = satellite_subset
        return candidate[:2]
    if filter_slug == "naked_eye":
        if engine == "deep_sky":
            naked_eye = []
            for obj in objects:
                try:
                    magnitude = float(obj.get("magnitude"))
                except Exception:
                    continue
                if magnitude <= 6.0:
                    naked_eye.append(obj)
            if naked_eye:
                ranked_naked_eye = sorted(
                    naked_eye,
                    key=lambda obj: (
                        float(obj.get("magnitude") if obj.get("magnitude") is not None else 99.0),
                        -float(obj.get("relevance_score") or 0.0),
                        str(obj.get("id") or obj.get("name") or ""),
                    ),
                )
                return ranked_naked_eye[:2]
        candidate = [obj for obj in objects if obj.get("type") in ("planet", "deep_sky")]
        return candidate[:2] if candidate else objects[:1]
    return list(objects)


def build_phase2_scope_scene_payload_with_context(
    scope: str,
    engine: str | None,
    filter_slug: str | None,
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
    as_of: str | None = None,
) -> dict:
    """Return deterministic scope/engine/filter scene payload with backend-executed filtering."""
    if scope not in PHASE2_SCOPES:
        raise ValueError("invalid_scope")

    parsed_location = parse_location_override(lat, lon, elevation_ft)
    resolved_engine = _resolve_engine(scope, engine)
    resolved_filter = _resolve_filter(resolved_engine, filter_slug)

    if scope == "sky" or resolved_engine == "sky_engine":
        return build_sky_scene_payload(parsed_location=parsed_location, as_of=as_of)

    phase1_state = build_phase1_scene_state(parsed_location=parsed_location, as_of=as_of)
    phase1_scene = phase1_state.get("scene") if isinstance(phase1_state, dict) else None
    if not isinstance(phase1_scene, dict):
        phase1_scene = build_above_me_scene_payload(parsed_location=parsed_location, as_of=as_of)

    scene_objects = _extract_scene_objects(phase1_scene)
    engine_objects = _objects_for_engine(
        scene_objects,
        resolved_engine,
        phase1_state=phase1_state,
        parsed_location=parsed_location,
        as_of=as_of,
    )
    ordered_objects = _sorted_objects(engine_objects)
    filtered_objects = _apply_filter(ordered_objects, resolved_filter, resolved_engine)

    provider_trace = phase1_state.get("provider_trace") if isinstance(phase1_state, dict) else {}
    if not isinstance(provider_trace, dict):
        provider_trace = {}
    location_key = (
        f"{parsed_location.get('latitude')}:{parsed_location.get('longitude')}"
        if isinstance(parsed_location, dict)
        else "default"
    )
    time_key = str((as_of or "").strip() or "runtime_now")
    deterministic_timestamp = (
        f"phase2:{scope}:{resolved_engine}:{resolved_filter}:{location_key}:{time_key}"
    )

    payload = {
        "scope": scope,
        "engine": resolved_engine,
        "filter": resolved_filter,
        "timestamp": deterministic_timestamp,
        "objects": filtered_objects,
        "degraded": bool(provider_trace.get("degraded")),
        "missing_sources": list(provider_trace.get("missing_sources") or []),
        "provider_trace": provider_trace,
        "input_context": {
            "lat": parsed_location.get("latitude") if isinstance(parsed_location, dict) else None,
            "lon": parsed_location.get("longitude") if isinstance(parsed_location, dict) else None,
            "elevation_ft": (
                parsed_location.get("elevation_ft") if isinstance(parsed_location, dict) else None
            ),
            "as_of": as_of,
        },
    }

    if resolved_engine == "moon":
        moon_object = next(
            (
                obj
                for obj in filtered_objects
                if isinstance(obj, dict) and str(obj.get("id") or "").strip().lower() == "moon"
            ),
            None,
        )
        alerts = (
            (((phase1_state or {}).get("supporting") or {}).get("alerts"))
            if isinstance(phase1_state, dict)
            else []
        )
        if not isinstance(alerts, list):
            alerts = []
        payload["solar_activity_status"] = str(
            ((moon_object or {}).get("solar_activity_status")) or "quiet"
        ).strip()
        payload["solar_activity_summary"] = str(
            ((moon_object or {}).get("solar_activity_summary")) or "No active SWPC alerts."
        ).strip()
        payload["solar_alert_count"] = len([a for a in alerts if isinstance(a, dict)])

    return payload
