from typing import Any, Dict, Optional

from pydantic import BaseModel


class ResponseEnvelope(BaseModel):
    status: str
    data: Optional[Dict[str, Any]] = None
    meta: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None

    class Config:
        extra = "forbid"
