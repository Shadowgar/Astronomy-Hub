import os
from copy import deepcopy

from backend.conditions_data import MOCK_CONDITIONS


def build_conditions_response() -> tuple[int, dict]:
    """Build the conditions response while preserving degraded-mode behavior."""
    simulate = os.environ.get("SIMULATE_NORMALIZER_FAIL", "").strip().lower()

    if simulate == "conditions":
        return (
            500,
            {
                "module": "conditions",
                "error": {
                    "code": "module_error",
                    "message": "failed to assemble conditions payload",
                    "details": [{"module": "conditions"}],
                },
            },
        )

    return (200, {"status": "ok", "data": deepcopy(MOCK_CONDITIONS)})

