from backend.app.services._legacy_scene_logic import (
    build_phase1_scene_state,
    parse_location_override,
)


def build_passes_response(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
) -> tuple[int, dict | list]:
    """Thin adapter for legacy passes behavior."""
    try:
        parsed_location = parse_location_override(lat, lon, elevation_ft)
    except ValueError as exc:
        return (400, {"error": {"code": "invalid_parameters", "message": str(exc)}})

    try:
        scene_state = build_phase1_scene_state(parsed_location)
        passes_payload = scene_state.get("supporting", {}).get("passes", [])
        return (200, passes_payload)
    except Exception:
        return (500, {"error": {"code": "module_error", "message": "failed to assemble passes"}})


def get_passes_payload(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
) -> list:
    """Return passes payload only; raise on invalid params or assembly failure."""
    parsed_location = parse_location_override(lat, lon, elevation_ft)
    scene_state = build_phase1_scene_state(parsed_location)
    passes_payload = scene_state.get("supporting", {}).get("passes", [])
    if not isinstance(passes_payload, list):
        raise RuntimeError("invalid passes payload")
    return passes_payload
