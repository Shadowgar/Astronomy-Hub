from typing import Any, Dict, Optional

from pydantic import BaseModel

from .response_envelope import ResponseEnvelope


class ConditionsResponse(ResponseEnvelope):
    """Minimal Conditions response model.

    Inherits the canonical ResponseEnvelope and keeps `data` permissive
    to avoid breaking the existing route during incremental migration.
    """

    data: Optional[Any] = None
    meta: Optional[Dict[str, Any]] = None

    class Config:
        extra = "allow"
