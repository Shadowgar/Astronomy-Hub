from fastapi import APIRouter

from backend.app.routes._contract import error_response
from backend.app.schemas.response_envelope import ResponseEnvelope
from backend.app.services.objects_service import get_object_detail_payload

router = APIRouter()


@router.get("/object/{object_id}", response_model=ResponseEnvelope)
async def get_object_detail(
    object_id: str,
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
):
    """Return object detail via a thin adapter over legacy helpers."""
    try:
        payload = get_object_detail_payload(
            object_id, lat=lat, lon=lon, elevation_ft=elevation_ft
        )
        return payload
    except LookupError:
        return error_response(
            status_code=404,
            code="not_found",
            message="object not found",
        )
    except ValueError:
        return error_response(
            status_code=400,
            code="invalid_request",
            message="invalid request",
        )
    except Exception:
        return error_response(
            status_code=500,
            code="module_error",
            message="failed to assemble object detail",
        )
