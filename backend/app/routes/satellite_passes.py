from __future__ import annotations

from fastapi import APIRouter
from backend.app.routes._contract import error_response
from backend.app.schemas.response_envelope import ResponseEnvelope
from backend.app.services.satellite_pass_service import build_satellite_passes, PassServiceBusy

router = APIRouter()


@router.get("/sky/satellite-passes", response_model=ResponseEnvelope)
def satellite_passes(lat: str, lng: str, elev: str = "0", time: str | None = None, hours: str = "24"):
    """Sync route: bounded CPU work runs in FastAPI's worker pool, not its event loop."""
    try:
        return build_satellite_passes(lat=float(lat), lng=float(lng), elev=float(elev), time=time, hours=int(hours))
    except (ValueError, OverflowError) as exc:
        return error_response(status_code=400, code="invalid_request", message=str(exc))
    except PassServiceBusy as exc:
        return error_response(status_code=429, code="busy", message=str(exc))
