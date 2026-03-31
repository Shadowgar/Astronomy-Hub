from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.app.contracts.phase1 import (
    SceneContract,
)
from backend.app.services.scene_service import (
    PHASE2_SCOPES,
    build_above_me_scene_payload,
    build_phase2_scope_scene_payload,
)

router = APIRouter()


@router.get("/scene/above-me", response_model=SceneContract)
async def above_me_scene():
    """Return a minimal, contract-valid stub for the Above Me scene.

    This handler is intentionally static and minimal: it returns a small,
    Phase 1–compliant scene payload using only allowed types.
    """
    return build_above_me_scene_payload()


@router.get("/scene")
async def scene_by_scope(scope: str = "above_me"):
    """Return deterministic scope-bound scene payload for Phase 2 scope switching."""
    scope_slug = str(scope or "").strip()
    if scope_slug not in PHASE2_SCOPES:
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "invalid_scope",
                    "message": f"invalid scope: {scope_slug}",
                    "details": [{"scope": scope_slug, "allowed_scopes": list(PHASE2_SCOPES)}],
                }
            },
        )
    return build_phase2_scope_scene_payload(scope_slug)
