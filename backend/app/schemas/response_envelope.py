from typing import Any, Dict, Optional

from pydantic import BaseModel


class ResponseEnvelope(BaseModel):
    """Canonical response envelope for Phase 2.5 (intentionally permissive).

    Fields:
    - status: a short string indicating overall status (e.g. "ok", "error")
    - data: payload (kept permissive for incremental migration)
    - meta: arbitrary metadata dictionary
    - error: structured error info when present
    """

    status: str
    data: Optional[Any] = None
    meta: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None

    class Config:
        # be permissive about extra fields during initial migration
        extra = "allow"
