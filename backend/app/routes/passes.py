from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.app.services.passes_service import build_passes_response

router = APIRouter()


@router.get("/passes")
async def get_passes(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
):
    """Return passes via a thin adapter over legacy helpers."""
    status_code, payload = build_passes_response(lat=lat, lon=lon, elevation_ft=elevation_ft)
    if status_code != 200:
        return JSONResponse(status_code=status_code, content=payload)
    return payload

