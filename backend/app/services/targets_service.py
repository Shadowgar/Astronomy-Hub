import os
import sys


def _legacy_server_module():
    """Import legacy backend.server with script-compatible path handling."""
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    import backend.server as legacy_server

    return legacy_server


def _parse_location_override(lat: str | None, lon: str | None, elevation_ft: str | None):
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


def build_targets_response(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
) -> tuple[int, dict | list]:
    """Thin adapter for legacy targets behavior."""
    try:
        parsed_location = _parse_location_override(lat, lon, elevation_ft)
    except ValueError as exc:
        return (400, {"error": {"code": "invalid_parameters", "message": str(exc)}})

    try:
        legacy_server = _legacy_server_module()
        scene_state = legacy_server._build_phase1_scene_state(parsed_location)
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
    parsed_location = _parse_location_override(lat, lon, elevation_ft)
    legacy_server = _legacy_server_module()
    scene_state = legacy_server._build_phase1_scene_state(parsed_location)
    targets_payload = scene_state.get("supporting", {}).get("targets", [])
    if not isinstance(targets_payload, list):
        raise RuntimeError("invalid targets payload")
    return targets_payload
