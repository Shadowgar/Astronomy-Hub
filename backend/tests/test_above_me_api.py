from __future__ import annotations

from urllib.parse import parse_qs, urlparse

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.sky_engine_links import build_sky_engine_object_url


client = TestClient(app)


def test_sky_engine_url_builder_preserves_large_gaia_source_id_as_string() -> None:
    source_id = "2252802052894084352"

    url = build_sky_engine_object_url(
        catalog="Gaia DR2",
        source_id=source_id,
        model="star",
        ra=79.17232794,
        dec=45.99799147,
        name=f"Gaia DR2 {source_id}",
        time="2026-06-04T02:16:04Z",
        fov=1.5,
        lat=41.44,
        lng=-79.69,
        elev=0,
    )

    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    assert parsed.path == f"/oras-sky-engine/skysource/GaiaDR2{source_id}"
    assert query["catalog"] == ["Gaia DR2"]
    assert query["source_id"] == [source_id]
    assert query["model"] == ["star"]
    assert query["ra"] == ["79.17232794"]
    assert query["dec"] == ["45.99799147"]
    assert query["date"] == ["2026-06-04T02:16:04Z"]


def test_above_me_returns_linkable_catalog_backed_objects() -> None:
    response = client.get(
        "/api/above-me?lat=41.44&lng=-79.69&time=2026-06-04T02:16:04Z&limit=20",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["meta"]["object_sources"]["messier_local"]["status"] == "included"
    assert body["meta"]["object_sources"]["bright_star_local"]["status"] == "included"
    assert body["meta"]["object_sources"]["planets"]["status"] == "gap"
    assert body["meta"]["object_sources"]["satellites"]["status"] == "gap"

    objects = body["data"]["objects"]
    assert objects
    assert len(objects) <= 20
    assert all(item["is_visible"] is True for item in objects)
    assert all(item["sky_engine_url"].startswith("/oras-sky-engine/skysource/") for item in objects)
    assert all(item["source_id"] == str(item["source_id"]) for item in objects)
    assert all(item["ra"] is not None and item["dec"] is not None for item in objects)

    models = {item["model"] for item in objects}
    assert {"star", "dso"}.issubset(models)


def test_above_me_known_dso_link_generation() -> None:
    response = client.get(
        "/api/above-me?lat=41.44&lng=-79.69&time=2026-06-04T02:16:04Z&limit=50",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    objects = response.json()["data"]["objects"]
    m81 = next(item for item in objects if item["source_id"] == "M81")

    assert m81["catalog"] == "Messier (local)"
    assert m81["model"] == "dso"
    assert m81["type"] == "galaxy"
    assert m81["name"] == "Bode's Galaxy"
    assert "catalog=Messier+%28local%29" in m81["sky_engine_url"]
    assert "source_id=M81" in m81["sky_engine_url"]
    assert "model=dso" in m81["sky_engine_url"]


def test_above_me_known_star_link_generation() -> None:
    response = client.get(
        "/api/above-me?lat=41.44&lng=-79.69&time=2026-06-04T02:16:04Z&limit=50",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    objects = response.json()["data"]["objects"]
    vega = next(item for item in objects if item["source_id"] == "star-vega")

    assert vega["catalog"] == "Bright Star Catalog (local)"
    assert vega["model"] == "star"
    assert vega["type"] == "star"
    assert vega["name"] == "Vega"
    assert "catalog=Bright+Star+Catalog+%28local%29" in vega["sky_engine_url"]
    assert "source_id=star-vega" in vega["sky_engine_url"]
    assert "model=star" in vega["sky_engine_url"]


def test_above_me_rejects_invalid_location_without_partial_payload() -> None:
    response = client.get(
        "/api/above-me?lat=not-a-number&lng=-79.69",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_request"


def test_above_me_clamps_limit_to_maximum() -> None:
    response = client.get(
        "/api/above-me?lat=41.44&lng=-79.69&time=2026-06-04T02:16:04Z&limit=500",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]["objects"]) <= body["meta"]["limit"]
    assert body["meta"]["limit"] == 100
