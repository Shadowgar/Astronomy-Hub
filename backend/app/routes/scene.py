from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.app.contracts.phase1 import (
    SceneContract,
)
from backend.app.services.scene_service import (
    PHASE2_SCOPES,
    build_above_me_scene_payload,
    build_phase2_scope_scene_payload_with_context,
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
async def scene_by_scope(
    scope: str = "above_me",
    engine: str | None = None,
    filter: str | None = None,
):
    """Return deterministic scope-bound scene payload for Phase 2 scope switching."""
    scope_slug = str(scope or "").strip()
    engine_slug = str(engine).strip() if engine is not None else None
    filter_slug = str(filter).strip() if filter is not None else None

    try:
        return build_phase2_scope_scene_payload_with_context(
            scope_slug,
            engine=engine_slug,
            filter_slug=filter_slug,
        )
    except ValueError as exc:
        code = str(exc)
        details = {"scope": scope_slug}
        if engine_slug:
            details["engine"] = engine_slug
        if filter_slug:
            details["filter"] = filter_slug
        if code == "invalid_scope":
            details["allowed_scopes"] = list(PHASE2_SCOPES)
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": code,
                    "message": f"{code}: invalid scope/engine/filter combination",
                    "details": [details],
                }
            },
        )
