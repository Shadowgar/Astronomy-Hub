from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.satellite_tle_catalog_service import (
    SATELLITE_TLE_CATALOG,
    load_satellite_tle_catalog,
    lookup_satellite_tle,
)


client = TestClient(app)


def test_satellite_tle_feed_parses_current_double_gzip_bundle() -> None:
    catalog = load_satellite_tle_catalog()

    assert catalog.count == 14281
    assert catalog.starlink_count == 10497
    assert catalog.non_starlink_count == 3784
    assert catalog.malformed_count >= 0
    assert "Station" in catalog.groups
    assert "Science" in catalog.groups


def test_satellite_tle_catalog_resolves_iss_and_hst_by_string_norad_id() -> None:
    iss = lookup_satellite_tle("25544")
    hst = lookup_satellite_tle("20580")

    assert iss["catalog"] == SATELLITE_TLE_CATALOG
    assert iss["source_id"] == "25544"
    assert iss["norad_id"] == "25544"
    assert iss["model"] == "tle_satellite"
    assert iss["display_name"] == "International Space Station"
    assert iss["names"][0] == "NAME International Space Station"
    assert iss["groups"] == ["Station"]
    assert iss["model_data"]["norad_number"] == 25544
    assert len(iss["model_data"]["tle"]) == 2
    assert iss["model_data"]["tle"][0].startswith("1 25544U")
    assert iss["link_status"] == "exact_link_ready"
    assert "ra" not in iss
    assert "dec" not in iss
    assert "alt" not in iss
    assert "az" not in iss

    assert hst["source_id"] == "20580"
    assert hst["norad_id"] == "20580"
    assert hst["display_name"] == "Hubble Space Telescope"
    assert hst["groups"] == ["Science"]


def test_exact_object_endpoint_resolves_satellite_tle_identity_without_fake_coordinates() -> None:
    response = client.get(
        "/api/sky/object?catalog=Satellite%20TLE%20(local)&source_id=25544&model=tle_satellite",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["catalog"] == SATELLITE_TLE_CATALOG
    assert data["source_id"] == "25544"
    assert isinstance(data["source_id"], str)
    assert data["norad_id"] == "25544"
    assert data["model"] == "tle_satellite"
    assert data["display_name"] == "International Space Station"
    assert data["types"] == ["Asa"]
    assert data["model_data"]["tle"][0].startswith("1 25544U")
    assert data["link_status"] == "exact_link_ready"
    assert data["visibility_status"] == "propagation_pending"
    assert "catalog=Satellite+TLE+%28local%29" in data["sky_engine_url"]
    assert "source_id=25544" in data["sky_engine_url"]
    assert "model=tle_satellite" in data["sky_engine_url"]
    assert "ra" not in data
    assert "dec" not in data
    assert "alt" not in data
    assert "az" not in data


def test_exact_object_endpoint_rejects_unknown_satellite_tle_identity() -> None:
    response = client.get(
        "/api/sky/object?catalog=Satellite%20TLE%20(local)&source_id=999999&model=tle_satellite",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
