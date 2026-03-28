from fastapi import APIRouter

from backend.app.contracts.phase1 import (
    SceneContract,
)
from backend.app.services.scene_service import build_above_me_scene_payload

router = APIRouter()


@router.get("/scene/above-me", response_model=SceneContract)
async def above_me_scene():
    """Return a minimal, contract-valid stub for the Above Me scene.

    This handler is intentionally static and minimal: it returns a small,
    Phase 1–compliant scene payload using only allowed types.
    """
    return build_above_me_scene_payload()
