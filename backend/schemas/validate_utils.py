from typing import Any, Tuple, Optional, Type

from pydantic import BaseModel, ValidationError


def parse_with_error(model: Type[BaseModel], payload: Any) -> Tuple[Optional[BaseModel], Optional[ValidationError]]:
    """Attempt to parse payload into Pydantic model.

    Returns (instance, None) on success or (None, ValidationError) on failure.
    """
    try:
        inst = model.parse_obj(payload)
        return inst, None
    except ValidationError as ve:
        return None, ve
