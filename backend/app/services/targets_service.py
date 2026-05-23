from backend.app.services._legacy_scene_logic import (
    build_phase1_scene_state,
    parse_location_override,
)


def build_targets_response(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
) -> tuple[int, dict | list]:
    """Thin adapter for legacy targets behavior."""
    try:
        parsed_location = parse_location_override(lat, lon, elevation_ft)
    except ValueError as exc:
        return (400, {"error": {"code": "invalid_parameters", "message": str(exc)}})

    try:
        scene_state = build_phase1_scene_state(parsed_location)
        targets_payload = scene_state.get("supporting", {}).get("targets", [])
        return (200, targets_payload)
    except Exception:
        return (500, {"error": {"code": "module_error", "message": "failed to assemble targets"}})


def get_targets_payload(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
) -> list:
    """Return targets payload only; raise on invalid params or assembly failure."""
    parsed_location = parse_location_override(lat, lon, elevation_ft)
    scene_state = build_phase1_scene_state(parsed_location)
    targets_payload = scene_state.get("supporting", {}).get("targets", [])
    if not isinstance(targets_payload, list):
        raise RuntimeError("invalid targets payload")
    return targets_payload
