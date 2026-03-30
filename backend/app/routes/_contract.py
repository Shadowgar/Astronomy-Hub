from typing import Any

from fastapi.responses import JSONResponse

from backend.app.core.logging import get_request_id


def attach_request_id_to_error_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """Ensure standard request_id presence on structured error payloads."""
    error = payload.get("error")
    if not isinstance(error, dict):
        return payload

    if error.get("request_id"):
        return payload

    merged_error = dict(error)
    merged_error["request_id"] = get_request_id()
    merged_payload = dict(payload)
    merged_payload["error"] = merged_error
    return merged_payload


def error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    details: Any | None = None,
) -> JSONResponse:
    """Build a route-level error response with a consistent error object."""
    error: dict[str, Any] = {
        "code": code,
        "message": message,
        "request_id": get_request_id(),
    }
    if details is not None:
        error["details"] = details
    return JSONResponse(status_code=status_code, content={"error": error})
