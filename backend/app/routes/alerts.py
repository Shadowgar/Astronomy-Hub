from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.app.services.alerts_service import build_alerts_response

router = APIRouter()


@router.get("/alerts")
async def get_alerts(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
):
    """Return alerts via a thin adapter over legacy helpers."""
    status_code, payload = build_alerts_response(lat=lat, lon=lon, elevation_ft=elevation_ft)
    if status_code != 200:
        if status_code >= 500:
            return JSONResponse(
                status_code=status_code,
                content={"error": {"code": "module_error", "message": "failed to assemble alerts"}},
            )
        return JSONResponse(
            status_code=status_code,
            content={"error": {"code": "invalid_parameters", "message": "invalid parameters"}},
        )
    if isinstance(payload, list):
        return payload
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "module_error", "message": "failed to assemble alerts"}},
    )
