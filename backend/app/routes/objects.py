from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.app.services.objects_service import get_object_detail_payload

router = APIRouter()


@router.get("/object/{object_id}")
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
        return JSONResponse(
            status_code=404,
            content={"error": {"code": "not_found", "message": "object not found"}},
        )
    except ValueError:
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "invalid_request", "message": "invalid request"}},
        )
    except Exception:
        return JSONResponse(
            status_code=500,
            content={"error": {"code": "module_error", "message": "failed to assemble object detail"}},
        )
