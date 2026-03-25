from fastapi import APIRouter
from backend.conditions_data import MOCK_CONDITIONS
from copy import deepcopy

router = APIRouter()


@router.get("/api/conditions")
async def get_conditions():
    """Return a safe, lightweight conditions payload.

    This handler intentionally avoids embedding business logic. It returns
    a shallow deepcopy of the existing mock payload so the FastAPI
    runtime can serve a representative response without migrating logic.
    """
    resp = deepcopy(MOCK_CONDITIONS)
    # signal minimal metadata to show parity with existing runtime
    return {"status": "ok", "data": resp}
