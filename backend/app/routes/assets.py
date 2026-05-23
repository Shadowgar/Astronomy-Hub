from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from backend.app.services.assets_service import build_asset_stream_response

router = APIRouter()


@router.get("/assets/{asset_key}")
async def get_asset(asset_key: str) -> StreamingResponse:
    """Return asset as streamed/file-like response without JSON wrapping."""
    return build_asset_stream_response(asset_key=asset_key)
