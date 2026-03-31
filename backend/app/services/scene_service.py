from datetime import datetime

from backend.app.services._legacy_scene_logic import build_phase1_scene_state

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
    """Return deterministic scope-bound scene payloads for Phase 2 scope switching."""
    if scope == "above_me":
        return build_above_me_scene_payload()

    return {
        "scope": scope,
        "engine": _PHASE2_DEFAULT_ENGINE[scope],
        "filter": "visible_now",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "objects": [],
    }
