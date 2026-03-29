from io import BytesIO

from fastapi.responses import StreamingResponse


def build_asset_stream_response(asset_key: str) -> StreamingResponse:
    """Return a minimal placeholder asset stream response."""
    content = f"placeholder asset: {asset_key}\n".encode("utf-8")
    stream = BytesIO(content)
    headers = {"Content-Disposition": f'inline; filename="{asset_key}.txt"'}
    return StreamingResponse(stream, media_type="text/plain; charset=utf-8", headers=headers)
