from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.app.services.scopes_service import build_scopes_response

router = APIRouter()


@router.get("/scopes")
async def get_scopes(scope: str | None = None, engine: str | None = None, filter: str | None = None):
    """Return scope/engine/filter metadata using legacy scopes decision logic."""
    status_code, payload = build_scopes_response(scope, engine, filter)
    if status_code != 200:
        return JSONResponse(status_code=status_code, content=payload)
    return payload

