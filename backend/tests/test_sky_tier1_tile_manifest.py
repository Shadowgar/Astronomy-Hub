from fastapi.testclient import TestClient
from pydantic import ValidationError
from pytest import approx

from backend.app.contracts.sky_scene import SkyStarTileManifestContract
from backend.app.main import app
from backend.app.services.scene_service import build_sky_star_tile_manifest_payload
from backend.app.services.sky_star_catalog import (
    BRIGHT_STAR_SCENE_OBJECTS,
    TIER1_BRIGHT_STAR_LOOKUP_KEY,
    TIER1_BRIGHT_STAR_SOURCE,
    TIER1_BRIGHT_STAR_TILE_ID,
)


client = TestClient(app)


def test_tier1_tile_manifest_contract_forbids_unknown_fields():
    with_validation_error = {
        "scope": "sky",
        "engine": "sky_engine",
        "manifest_version": "tier1",
        "generated_at": "2026-04-07T00:00:00Z",
        "tiles": [
            {
                "tier": 1,
                "tile_id": TIER1_BRIGHT_STAR_TILE_ID,
                "lookup_key": TIER1_BRIGHT_STAR_LOOKUP_KEY,
                "source": TIER1_BRIGHT_STAR_SOURCE,
                "object_count": len(BRIGHT_STAR_SCENE_OBJECTS),
                "magnitude_min": -1.46,
                "magnitude_max": 1.62,
                "unexpected": True,
            }
        ],
    }

    try:
        SkyStarTileManifestContract(**with_validation_error)
    except ValidationError:
        pass
    else:
        raise AssertionError("tile manifest contract accepted an unknown field")


def test_build_sky_star_tile_manifest_payload_returns_tier1_bright_star_descriptor():
    payload = build_sky_star_tile_manifest_payload(as_of="2026-04-07T05:00:00Z")

    assert payload["scope"] == "sky"
    assert payload["engine"] == "sky_engine"
    assert payload["manifest_version"] == "tier1"
    assert payload["generated_at"] == "2026-04-07T05:00:00Z"
    assert payload["degraded"] is False
    assert payload["missing_sources"] == []

    tiles = payload["tiles"]
    assert len(tiles) == 1
    descriptor = tiles[0]
    assert descriptor["tier"] == 1
    assert descriptor["tile_id"] == TIER1_BRIGHT_STAR_TILE_ID
    assert descriptor["lookup_key"] == TIER1_BRIGHT_STAR_LOOKUP_KEY
    assert descriptor["source"] == TIER1_BRIGHT_STAR_SOURCE
    assert descriptor["object_count"] == len(BRIGHT_STAR_SCENE_OBJECTS)
    assert descriptor["magnitude_min"] == approx(-1.46)
    assert descriptor["magnitude_max"] == approx(1.62)


def test_sky_star_tile_manifest_route_returns_backend_owned_tier1_descriptor():
    response = client.get(
        "/api/v1/scene/sky/star-tiles/manifest?at=2026-04-07T05:00:00Z",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["scope"] == "sky"
    assert payload["engine"] == "sky_engine"
    assert payload["manifest_version"] == "tier1"

    tiles = payload.get("tiles") or []
    assert len(tiles) == 1
    descriptor = tiles[0]
    assert descriptor["tier"] == 1
    assert descriptor["tile_id"] == TIER1_BRIGHT_STAR_TILE_ID
    assert descriptor["lookup_key"] == TIER1_BRIGHT_STAR_LOOKUP_KEY
    assert descriptor["source"] == TIER1_BRIGHT_STAR_SOURCE
    assert descriptor["object_count"] == len(BRIGHT_STAR_SCENE_OBJECTS)