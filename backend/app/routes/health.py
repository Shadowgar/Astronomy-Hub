from fastapi import APIRouter

from backend.app.schemas.response_envelope import ResponseEnvelope

router = APIRouter()


@router.get("/health", response_model=ResponseEnvelope)
async def health():
    """Return a minimal health payload for runtime sanity checks."""
    return {"status": "healthy"}
