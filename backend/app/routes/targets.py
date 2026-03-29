from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.app.services.targets_service import get_targets_payload

router = APIRouter()


@router.get("/targets")
async def get_targets(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
):
    """Return targets via a thin adapter over legacy helpers."""
    try:
        payload = get_targets_payload(lat=lat, lon=lon, elevation_ft=elevation_ft)
        return payload
    except ValueError:
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "invalid_parameters", "message": "invalid parameters"}},
        )
    except Exception:
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "module_error", "message": "failed to assemble targets"}},
        )
