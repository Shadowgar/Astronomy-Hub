from fastapi import APIRouter
from starlette.concurrency import run_in_threadpool

from backend.app.routes._contract import error_response
from backend.app.schemas.tonight import TonightResponse
from backend.app.services.tonight_service import build_tonight_payload

router = APIRouter()


@router.get(
    "/tonight", response_model=TonightResponse, response_model_exclude_none=True
)
async def tonight(date: str | None = None):
    try:
        return await run_in_threadpool(build_tonight_payload, date=date)
    except ValueError:
        return error_response(
            status_code=400,
            code="invalid_request",
            message="Invalid observing-night request. Use a valid YYYY-MM-DD evening date that allows a following calendar day.",
        )
