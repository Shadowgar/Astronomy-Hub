from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.app.services.targets_service import build_targets_response

router = APIRouter()


@router.get("/targets")
async def get_targets(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
):
    """Return targets via a thin adapter over legacy helpers."""
    status_code, payload = build_targets_response(lat=lat, lon=lon, elevation_ft=elevation_ft)
    if status_code != 200:
        if status_code >= 500:
            return JSONResponse(
                status_code=status_code,
                content={"error": {"code": "module_error", "message": "failed to assemble targets"}},
            )
        return JSONResponse(
            status_code=status_code,
            content={"error": {"code": "invalid_parameters", "message": "invalid parameters"}},
        )
    return payload
