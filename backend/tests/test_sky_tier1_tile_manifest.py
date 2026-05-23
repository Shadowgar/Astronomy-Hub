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
    TIER2_MID_STAR_LOOKUP_KEY,
    TIER2_MID_STAR_SOURCE,
    TIER2_MID_STAR_TILE_ID,
    build_tier2_mid_star_scene_objects,
)


client = TestClient(app)


def test_tier1_tile_manifest_contract_forbids_unknown_fields():
    with_validation_error = {
        "scope": "sky",
        "engine": "sky_engine",
        "manifest_version": "tier2",
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
    tier2_objects = build_tier2_mid_star_scene_objects()

    assert payload["scope"] == "sky"
    assert payload["engine"] == "sky_engine"
    assert payload["manifest_version"] == "tier2"
    assert payload["generated_at"] == "2026-04-07T05:00:00Z"
    assert payload["degraded"] is False
    assert payload["missing_sources"] == []

    tiles = payload["tiles"]
    assert len(tiles) == 2

    tier1_descriptor = tiles[0]
    assert tier1_descriptor["tier"] == 1
    assert tier1_descriptor["tile_id"] == TIER1_BRIGHT_STAR_TILE_ID
    assert tier1_descriptor["lookup_key"] == TIER1_BRIGHT_STAR_LOOKUP_KEY
    assert tier1_descriptor["source"] == TIER1_BRIGHT_STAR_SOURCE
    assert tier1_descriptor["object_count"] == len(BRIGHT_STAR_SCENE_OBJECTS)
    assert tier1_descriptor["magnitude_min"] == approx(-1.46)
    assert tier1_descriptor["magnitude_max"] == approx(1.62)

    tier2_descriptor = tiles[1]
    assert tier2_descriptor["tier"] == 2
    assert tier2_descriptor["tile_id"] == TIER2_MID_STAR_TILE_ID
    assert tier2_descriptor["lookup_key"] == TIER2_MID_STAR_LOOKUP_KEY
    assert tier2_descriptor["source"] == TIER2_MID_STAR_SOURCE
    assert tier2_descriptor["object_count"] == len(tier2_objects)
    assert tier2_descriptor["magnitude_min"] == approx(1.64)
    assert tier2_descriptor["magnitude_max"] == approx(8.5)


def test_sky_star_tile_manifest_route_returns_backend_owned_tier1_descriptor():
    response = client.get(
        "/api/v1/scene/sky/star-tiles/manifest?at=2026-04-07T05:00:00Z",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["scope"] == "sky"
    assert payload["engine"] == "sky_engine"
    assert payload["manifest_version"] == "tier2"

    tiles = payload.get("tiles") or []
    assert len(tiles) == 2

    tier1_descriptor = tiles[0]
    assert tier1_descriptor["tier"] == 1
    assert tier1_descriptor["tile_id"] == TIER1_BRIGHT_STAR_TILE_ID
    assert tier1_descriptor["lookup_key"] == TIER1_BRIGHT_STAR_LOOKUP_KEY
    assert tier1_descriptor["source"] == TIER1_BRIGHT_STAR_SOURCE
    assert tier1_descriptor["object_count"] == len(BRIGHT_STAR_SCENE_OBJECTS)

    tier2_descriptor = tiles[1]
    assert tier2_descriptor["tier"] == 2
    assert tier2_descriptor["tile_id"] == TIER2_MID_STAR_TILE_ID
    assert tier2_descriptor["lookup_key"] == TIER2_MID_STAR_LOOKUP_KEY
    assert tier2_descriptor["source"] == TIER2_MID_STAR_SOURCE
    assert tier2_descriptor["object_count"] == len(build_tier2_mid_star_scene_objects())