from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    """Return a minimal health payload for runtime sanity checks."""
    return {"status": "healthy"}
