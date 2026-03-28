import os
from copy import deepcopy

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.conditions_data import MOCK_CONDITIONS
from backend.app.schemas.conditions import ConditionsResponse

router = APIRouter()


@router.get("/conditions", response_model=ConditionsResponse)
async def get_conditions():
    """Return conditions payload, with degraded-mode simulation support.

    Success path returns the normal mock payload.
    Failure simulation path returns a 500 module_error contract when
    SIMULATE_NORMALIZER_FAIL=conditions.
    """
    simulate = os.environ.get("SIMULATE_NORMALIZER_FAIL", "").strip().lower()

    if simulate == "conditions":
        return JSONResponse(
            status_code=500,
            content={
                "module": "conditions",
                "error": {
                    "code": "module_error",
                    "message": "failed to assemble conditions payload",
                    "details": [{"module": "conditions"}],
                },
            },
        )

    resp = deepcopy(MOCK_CONDITIONS)
    return {"status": "ok", "data": resp}