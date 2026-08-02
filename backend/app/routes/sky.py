from fastapi import APIRouter

from backend.app.routes._contract import error_response
from backend.app.schemas.response_envelope import ResponseEnvelope
from backend.app.services.sky_catalog_service import (
    build_catalog_status_payload,
    build_exact_object_lookup_payload,
    build_gaia_lookup_payload,
    build_sky_search_payload,
)
from backend.app.services.catalog_pack_service import build_catalog_pack_status_payload
from backend.app.services.planetary_ephemeris_service import get_planetary_ephemeris_status

router = APIRouter()


@router.get("/sky/catalog/status", response_model=ResponseEnvelope)
async def get_catalog_status():
    return build_catalog_status_payload()


@router.get("/sky/catalog-packs", response_model=ResponseEnvelope)
async def get_catalog_packs():
    return build_catalog_pack_status_payload()


@router.get("/sky/planetary-ephemeris", response_model=ResponseEnvelope)
async def get_planetary_ephemeris():
    return {
        "status": "ok",
        "data": get_planetary_ephemeris_status(),
        "meta": {},
    }


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


@router.get("/sky/object", response_model=ResponseEnvelope)
async def get_exact_object(
    catalog: str,
    source_id: str,
    model: str,
    lat: str | None = None,
    lng: str | None = None,
    time: str | None = None,
    elev: str | None = None,
):
    try:
        return build_exact_object_lookup_payload(catalog, source_id, model, lat=lat, lng=lng, time=time, elev=elev)
    except ValueError as error:
        message = str(error)
        status_code = 400 if "required" in message or "invalid" in message else 404
        code = "invalid_request" if status_code == 400 else "not_found"
        return error_response(
            status_code=status_code,
            code=code,
            message=message,
        )


@router.get("/sky/search", response_model=ResponseEnvelope)
async def search_sky(q: str):
    return build_sky_search_payload(q)
