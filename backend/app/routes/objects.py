from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.app.services.objects_service import build_object_detail_response

router = APIRouter()


@router.get("/object/{object_id}")
async def get_object_detail(
    object_id: str,
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
):
    """Return object detail via a thin adapter over legacy helpers."""
    status_code, payload = build_object_detail_response(
        object_id, lat=lat, lon=lon, elevation_ft=elevation_ft
    )
    if status_code != 200:
        if status_code == 404:
            return JSONResponse(
                status_code=status_code,
                content={"error": {"code": "not_found", "message": "object not found"}},
            )
        if status_code >= 500:
            return JSONResponse(
                status_code=status_code,
                content={"error": {"code": "module_error", "message": "failed to assemble object detail"}},
            )
        return JSONResponse(
            status_code=status_code,
            content={"error": {"code": "invalid_request", "message": "invalid request"}},
        )
    if (
        isinstance(payload, dict)
        and payload.get("status") == "ok"
        and isinstance(payload.get("data"), dict)
    ):
        return payload
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "module_error", "message": "failed to assemble object detail"}},
    )
