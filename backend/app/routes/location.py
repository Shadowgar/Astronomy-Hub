from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.app.routes._contract import attach_request_id_to_error_payload
from backend.app.services.location_service import build_location_search_response

router = APIRouter()


@router.get("/location/search")
async def search_location(q: str | None = None):
    """Return location suggestions via a thin adapter over legacy behavior."""
    status_code, payload, headers = build_location_search_response(q=q)
    if status_code >= 400 and isinstance(payload, dict):
        payload = attach_request_id_to_error_payload(payload)
    return JSONResponse(status_code=status_code, content=payload, headers=headers)
