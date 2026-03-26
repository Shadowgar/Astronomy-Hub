from fastapi import APIRouter

from backend.app.contracts.phase1 import (
    SceneContract,
    SceneObjectSummary,
)

router = APIRouter()


@router.get("/api/scene/above-me", response_model=SceneContract)
async def above_me_scene():
    """Return a minimal, contract-valid stub for the Above Me scene.

    This handler is intentionally static and minimal: it returns a small,
    Phase 1–compliant scene payload using only allowed types.
    """
    objects = [
        {
            "id": "sat-123",
            "name": "TestSat 1",
            "type": "satellite",
            "engine": "satellite",
            "summary": "A test satellite visible now.",
            "position": {"azimuth": 120.5, "elevation": 45.0},
            "visibility": {"is_visible": True},
        },
        {
            "id": "mars",
            "name": "Mars",
            "type": "planet",
            "engine": "solar_system",
            "summary": "Bright planet visible in the west.",
            "position": {"azimuth": 270.0, "elevation": 15.0},
            "visibility": {"is_visible": True},
        },
        {
            "id": "m13",
            "name": "M13",
            "type": "deep_sky",
            "engine": "deep_sky",
            "summary": "Globular cluster in Hercules.",
        },
    ]

    payload = {
        "scope": "above_me",
        "engine": "main",
        "filter": "visible",
        "timestamp": "2026-03-26T20:00:00Z",
        "objects": objects,
    }

    # Pydantic validation occurs via response_model
    return payload
