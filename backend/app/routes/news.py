from fastapi import APIRouter

from backend.app.routes._contract import error_response
from backend.app.services.news_service import get_news_payload

router = APIRouter()


@router.get("/news")
async def get_news(
    lat: str | None = None,
    lon: str | None = None,
    elevation_ft: str | None = None,
    scope: str | None = None,
    engine: str | None = None,
    limit: int | None = None,
):
    """Return normalized space-news feed for News Digest and detail links."""
    try:
        return get_news_payload(
            lat=lat,
            lon=lon,
            elevation_ft=elevation_ft,
            scope=scope,
            engine=engine,
            limit=limit,
        )
    except ValueError:
        return error_response(
            status_code=400,
            code="invalid_parameters",
            message="invalid parameters",
        )
    except Exception:
        return error_response(
            status_code=500,
            code="module_error",
            message="failed to assemble news feed",
        )
