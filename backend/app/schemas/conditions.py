from typing import Any, Dict, Optional

from pydantic import BaseModel

from .response_envelope import ResponseEnvelope


class ConditionsResponse(ResponseEnvelope):
    """Minimal Conditions response model.

    Inherits the canonical ResponseEnvelope while rejecting unknown envelope
    fields. The route-specific `data` payload remains intentionally flexible.
    """

    data: Optional[Any] = None
    meta: Optional[Dict[str, Any]] = None

    class Config:
        extra = "forbid"
