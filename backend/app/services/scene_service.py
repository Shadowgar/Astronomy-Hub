from backend.app.services._legacy_scene_logic import build_phase1_scene_state


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
