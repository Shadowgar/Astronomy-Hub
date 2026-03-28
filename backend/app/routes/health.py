from fastapi import APIRouter

from backend.app.schemas.response_envelope import ResponseEnvelope
from backend.app.services.health_service import build_health_payload

router = APIRouter()


@router.get("/health", response_model=ResponseEnvelope)
async def health():
    """Return a minimal health payload for runtime sanity checks."""
    return build_health_payload()
