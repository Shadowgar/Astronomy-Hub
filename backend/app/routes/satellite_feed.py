from __future__ import annotations

from fastapi import APIRouter

from backend.app.routes._contract import error_response
from backend.app.schemas.response_envelope import ResponseEnvelope
from backend.app.services.satellite_feed_status_service import build_satellite_feed_status


router = APIRouter()


@router.get("/sky/satellite-feed", response_model=ResponseEnvelope)
async def satellite_feed(time: str | None = None):
    try:
        return build_satellite_feed_status(time=time)
    except ValueError as exc:
        return error_response(status_code=400, code="invalid_request", message=str(exc))
