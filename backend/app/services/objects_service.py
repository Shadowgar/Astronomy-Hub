from backend.app.schemas.response_envelope import ResponseEnvelope
from backend.app.services._legacy_scene_logic import (
    build_phase1_object_detail,
    get_phase2_object_lookup,
    parse_location_override,
)


def build_object_detail_response(
    object_id: str,
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
    as_of: str | None = None,
) -> tuple[int, dict]:
    """Thin adapter for legacy object detail behavior."""
    try:
        parsed_location = parse_location_override(lat, lon, elevation_ft)
    except ValueError as exc:
        return (400, {"error": {"code": "invalid_parameters", "message": str(exc)}})

    obj_id = (object_id or "").strip()
    if not obj_id:
        return (400, {"error": {"code": "invalid_request", "message": "missing object id"}})

    try:
        object_lookup = get_phase2_object_lookup(parsed_location=parsed_location, as_of=as_of)
        found = object_lookup.get(obj_id)
        if not found:
            object_lookup = get_phase2_object_lookup(
                parsed_location=parsed_location,
                force_refresh=True,
                as_of=as_of,
            )
            found = object_lookup.get(obj_id)
        if not found:
            return (404, {"error": {"code": "not_found", "message": "object not found"}})

        detail = build_phase1_object_detail(found, scene_objects=list(object_lookup.values()))
        envelope = ResponseEnvelope(
            status="ok",
            data=detail,
            meta={},
            error=None,
        )
        return (200, envelope.dict())
    except Exception:
        return (
            500,
            {"error": {"code": "module_error", "message": "failed to assemble object detail"}},
        )


def get_object_detail_payload(
    object_id: str,
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
    as_of: str | None = None,
) -> dict:
    """Return object-detail payload only; raise on invalid input or lookup/assembly failures."""
    parsed_location = parse_location_override(lat, lon, elevation_ft)
    obj_id = (object_id or "").strip()
    if not obj_id:
        raise ValueError("missing object id")

    object_lookup = get_phase2_object_lookup(parsed_location=parsed_location, as_of=as_of)
    found = object_lookup.get(obj_id)
    if not found:
        object_lookup = get_phase2_object_lookup(
            parsed_location=parsed_location,
            force_refresh=True,
            as_of=as_of,
        )
        found = object_lookup.get(obj_id)
    if not found:
        raise LookupError("object not found")

    detail = build_phase1_object_detail(found, scene_objects=list(object_lookup.values()))
    envelope = ResponseEnvelope(
        status="ok",
        data=detail,
        meta={},
        error=None,
    )
    payload = envelope.dict()
    if not (
        isinstance(payload, dict)
        and payload.get("status") == "ok"
        and isinstance(payload.get("data"), dict)
    ):
        raise RuntimeError("invalid object payload")
    return payload
