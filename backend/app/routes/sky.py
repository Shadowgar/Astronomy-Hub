from fastapi import APIRouter

from backend.app.routes._contract import error_response
from backend.app.schemas.response_envelope import ResponseEnvelope
from backend.app.services.sky_catalog_service import (
    build_catalog_status_payload,
    build_gaia_lookup_payload,
    build_sky_search_payload,
)

router = APIRouter()


@router.get("/sky/catalog/status", response_model=ResponseEnvelope)
async def get_catalog_status():
    return build_catalog_status_payload()


@router.get("/sky/object/gaia-dr2/{source_id}", response_model=ResponseEnvelope)
async def get_gaia_dr2_source(source_id: str):
    try:
        return build_gaia_lookup_payload(source_id)
    except ValueError:
        return error_response(
            status_code=400,
            code="invalid_request",
            message="invalid Gaia DR2 source_id",
        )


@router.get("/sky/search", response_model=ResponseEnvelope)
async def search_sky(q: str):
    return build_sky_search_payload(q)