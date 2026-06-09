from __future__ import annotations

from fastapi import APIRouter

from backend.app.routes._contract import error_response
from backend.app.schemas.response_envelope import ResponseEnvelope
from backend.app.services.above_me_service import build_above_me_payload

router = APIRouter()


@router.get("/above-me", response_model=ResponseEnvelope)
async def above_me(
    lat: str,
    lng: str,
    time: str | None = None,
    limit: str | None = None,
    elev: str | None = None,
):
    try:
        return build_above_me_payload(
            lat=lat,
            lng=lng,
            time=time,
            limit=limit,
            elev=elev,
        )
    except ValueError as exc:
        return error_response(
            status_code=400,
            code="invalid_request",
            message=str(exc),
        )
