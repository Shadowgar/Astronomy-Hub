from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.app.routes._contract import attach_request_id_to_error_payload
from backend.app.schemas.conditions import ConditionsResponse
from backend.app.services.conditions_service import build_conditions_response

router = APIRouter()


@router.get("/conditions", response_model=ConditionsResponse)
async def get_conditions(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
):
    """Return provider-backed conditions payload, with degraded-mode simulation support."""
    status_code, payload = build_conditions_response(
        lat=lat, lon=lon, elevation_ft=elevation_ft
    )
    if status_code != 200:
        return JSONResponse(
            status_code=status_code,
            content=attach_request_id_to_error_payload(payload),
        )
    return payload
