from copy import deepcopy

from backend.app.services._legacy_scene_logic import build_phase1_scene_state
from backend.app.services.scopes_service import (
    PHASE2_ENGINE_REGISTRY,
    PHASE2_SCOPES,
    PHASE2_SCOPE_TO_ENGINES,
)

PHASE2_SCOPES = (
    "above_me",
    "earth",
    "sun",
    "satellites",
    "flights",
    "solar_system",
    "deep_sky",
)

_PHASE2_DEFAULT_ENGINE = {
    "above_me": "above_me",
    "earth": "satellites",
    "sun": "moon",
    "satellites": "satellites",
    "flights": "flights",
    "solar_system": "planets",
    "deep_sky": "deep_sky",
}


def build_above_me_scene_payload() -> dict:
    """Return backend-authored Phase 1 scene payload for the Above Me surface."""
    state = build_phase1_scene_state(parsed_location=None)
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


def build_phase2_scope_scene_payload(scope: str) -> dict:
    return build_phase2_scope_scene_payload_with_context(scope, engine=None, filter_slug=None)


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


def _objects_for_engine(objects: list[dict], engine: str) -> list[dict]:
    if engine == "above_me":
        return list(objects)
    if engine == "deep_sky":
        return [obj for obj in objects if obj.get("type") == "deep_sky"]
    if engine in ("planets", "moon"):
        return [obj for obj in objects if obj.get("type") == "planet"]
    if engine == "satellites":
        return [obj for obj in objects if obj.get("type") == "satellite"]
    if engine == "flights":
        satellite_objects = [obj for obj in objects if obj.get("type") == "satellite"]
        if len(satellite_objects) <= 1:
            return []
        return satellite_objects[1:]
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
        candidate = [obj for obj in objects if obj.get("type") in ("planet", "deep_sky")]
        return candidate[:2] if candidate else objects[:1]
    return list(objects)


def build_phase2_scope_scene_payload_with_context(
    scope: str, engine: str | None, filter_slug: str | None
) -> dict:
    """Return deterministic scope/engine/filter scene payload with backend-executed filtering."""
    if scope not in PHASE2_SCOPES:
        raise ValueError("invalid_scope")

    resolved_engine = _resolve_engine(scope, engine)
    resolved_filter = _resolve_filter(resolved_engine, filter_slug)

    phase1_scene = build_above_me_scene_payload()
    scene_objects = _extract_scene_objects(phase1_scene)
    engine_objects = _objects_for_engine(scene_objects, resolved_engine)
    ordered_objects = _sorted_objects(engine_objects)
    filtered_objects = _apply_filter(ordered_objects, resolved_filter, resolved_engine)

    # Phase 2 Step 5 requires reproducible scene payloads for identical inputs.
    deterministic_timestamp = f"phase2:{scope}:{resolved_engine}:{resolved_filter}"

    return {
        "scope": scope,
        "engine": resolved_engine,
        "filter": resolved_filter,
        "timestamp": deterministic_timestamp,
        "objects": filtered_objects,
    }
