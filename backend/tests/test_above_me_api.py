from __future__ import annotations

import asyncio
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.routes import above_me as above_me_route
from backend.app.services import above_me_service
from backend.app.services.satellite_propagation_service import MAX_TLE_AGE_DAYS
from backend.app.services.sky_engine_links import build_sky_engine_object_url
from backend.app.services.sky_star_catalog import BRIGHT_STAR_SCENE_OBJECTS


client = TestClient(app)


@pytest.fixture(autouse=True)
def _disable_live_solar_ephemeris(monkeypatch) -> None:
    monkeypatch.setattr(
        above_me_service.live_providers,
        "fetch_jpl_ephemeris",
        lambda lat, lon, elevation_ft=None, as_of=None: [],
    )


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


def test_sky_engine_url_builder_rejects_missing_source_id() -> None:
    with pytest.raises(ValueError, match="source_id is required"):
        build_sky_engine_object_url(
            catalog="Gaia DR2",
            source_id=None,
            model="star",
            ra=79.17232794,
            dec=45.99799147,
        )


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
    assert body["meta"]["object_sources"]["hipparcos_tier2_local"]["status"] == "included"
    assert body["meta"]["object_sources"]["planets"]["status"] == "included"
    assert body["meta"]["object_sources"]["moon_sun"]["status"] == "included"
    assert body["meta"]["object_sources"]["satellites"]["status"] == "included"
    assert body["meta"]["object_sources"]["openngc_local"]["status"] == "included"

    objects = body["data"]["objects"]
    assert objects
    assert len(objects) <= 20
    assert all(item["is_visible"] is True for item in objects)
    assert all(item["sky_engine_url"].startswith("/oras-sky-engine/skysource/") for item in objects)
    assert all(isinstance(item["source_id"], str) for item in objects)
    assert all(item["ra"] is not None and item["dec"] is not None for item in objects)

    models = {item["model"] for item in objects}
    assert {"star", "dso"}.issubset(models)


def test_above_me_route_runs_sync_catalog_assembly_off_event_loop(monkeypatch) -> None:
    calls = []

    async def _run_in_threadpool(function, **kwargs):
        calls.append((function, kwargs))
        return {"status": "ok", "data": {"objects": []}, "meta": {}}

    monkeypatch.setattr(above_me_route, "run_in_threadpool", _run_in_threadpool)

    payload = asyncio.run(above_me_route.above_me(lat="41.44", lng="-79.69"))

    assert payload["status"] == "ok"
    assert calls == [
        (
            above_me_service.build_above_me_payload,
            {"lat": "41.44", "lng": "-79.69", "time": None, "limit": None, "elev": None},
        )
    ]


def test_above_me_deduplicates_cross_catalog_dso_aliases() -> None:
    response = client.get(
        "/api/above-me?lat=41.44&lng=-79.69&time=2026-06-04T02:16:04Z&limit=100",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    objects = response.json()["data"]["objects"]
    m13_representations = [
        item
        for item in objects
        if item["model"] == "dso"
        and (
            {"m13", "ngc6205"}
            & {
                str(value).lower().replace(" ", "")
                for value in [item["source_id"], *item.get("aliases", [])]
            }
        )
    ]

    assert len(m13_representations) == 1


def test_above_me_reports_stale_satellite_feed_as_degraded() -> None:
    response = client.get(
        "/api/above-me?lat=41.44&lng=-79.69&time=2026-07-16T12:00:00Z&limit=100",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    assert not any(item["model"] == "tle_satellite" for item in body["data"]["objects"])
    satellite_source = body["meta"]["object_sources"]["satellites"]
    assert satellite_source["status"] == "degraded"
    assert satellite_source["freshness_status"] == "stale"
    assert satellite_source["newest_tle_age_days"] > MAX_TLE_AGE_DAYS


def test_above_me_includes_bounded_visible_satellites_with_real_propagation() -> None:
    response = client.get(
        "/api/above-me?lat=41.44&lng=-79.69&time=2026-06-04T00:00:00Z&limit=20",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    satellites = [item for item in body["data"]["objects"] if item["model"] == "tle_satellite"]

    assert satellites
    assert len(satellites) <= 8
    assert len(body["data"]["objects"]) <= body["meta"]["limit"]
    assert body["meta"]["object_sources"]["satellites"]["status"] == "included"

    first = satellites[0]
    assert first["id"] == f"Satellite TLE (local):{first['source_id']}"
    assert first["catalog"] == "Satellite TLE (local)"
    assert isinstance(first["source_id"], str)
    assert first["source_id"] == first["norad_id"]
    assert first["type"] == "satellite"
    assert isinstance(first["groups"], list)
    assert first["is_visible"] is True
    assert first["alt"] > 0.0
    assert 0.0 <= first["ra"] < 360.0
    assert -90.0 <= first["dec"] <= 90.0
    assert 0.0 <= first["az"] < 360.0
    assert first["range_km"] > 0.0
    assert first["propagated_at"] == "2026-06-04T00:00:00Z"
    assert first["tle_epoch"]
    assert "catalog=Satellite+TLE+%28local%29" in first["sky_engine_url"]
    assert f"source_id={first['source_id']}" in first["sky_engine_url"]
    assert "model=tle_satellite" in first["sky_engine_url"]
    assert "ra=" in first["sky_engine_url"]
    assert "dec=" in first["sky_engine_url"]


def test_above_me_includes_visible_solar_system_objects_from_jpl(monkeypatch) -> None:
    monkeypatch.setattr(
        above_me_service.live_providers,
        "fetch_jpl_ephemeris",
        lambda lat, lon, elevation_ft=None, as_of=None: [
            {
                "id": "moon",
                "name": "Moon",
                "ra": 164.125,
                "dec": 6.25,
                "azimuth": 180.0,
                "elevation": 42.0,
                "source": "jpl_ephemeris",
                "time_basis": "2026-06-04T02:00:00Z",
            },
            {
                "id": "mars",
                "name": "Mars",
                "ra": 39.78916667,
                "dec": 14.88,
                "azimuth": 220.0,
                "elevation": 31.0,
                "source": "jpl_ephemeris",
                "time_basis": "2026-06-04T02:00:00Z",
            },
            {
                "id": "sun",
                "name": "Sun",
                "ra": 72.0,
                "dec": 22.0,
                "azimuth": 90.0,
                "elevation": 12.0,
                "source": "jpl_ephemeris",
                "time_basis": "2026-06-04T02:00:00Z",
            },
        ],
    )

    response = client.get(
        "/api/above-me?lat=41.44&lng=-79.69&time=2026-06-04T02:16:04Z&limit=100",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    objects = response.json()["data"]["objects"]
    solar = {item["source_id"]: item for item in objects if item["catalog"] == "Solar System (JPL)"}

    assert {"moon", "mars", "sun"}.issubset(solar)
    assert solar["moon"]["model"] == "moon"
    assert solar["mars"]["model"] == "planet"
    assert solar["sun"]["model"] == "sun"
    assert solar["mars"]["source_id"] == "mars"
    assert 0.0 <= solar["mars"]["ra"] < 360.0
    assert -90.0 <= solar["mars"]["dec"] <= 90.0
    assert "catalog=Solar+System+%28JPL%29" in solar["mars"]["sky_engine_url"]
    assert "source_id=mars" in solar["mars"]["sky_engine_url"]
    assert "model=planet" in solar["mars"]["sky_engine_url"]
    assert "solar filter" in solar["sun"]["reason"].lower()


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


def test_above_me_includes_openngc_dso_candidates_without_replacing_messier() -> None:
    response = client.get(
        "/api/above-me?lat=41.44&lng=-79.69&time=2026-06-04T02:16:04Z&limit=100",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    objects = body["data"]["objects"]
    openngc = [item for item in objects if item["catalog"] in {"NGC (OpenNGC)", "IC (OpenNGC)"}]

    assert openngc
    assert len(objects) <= body["meta"]["limit"]
    assert any(item["catalog"] == "Messier (local)" and item["source_id"] == "M81" for item in objects)

    first = openngc[0]
    assert first["model"] == "dso"
    assert first["source_id"].startswith(("NGC", "IC"))
    assert first["is_visible"] is True
    assert first["type"] in {"galaxy", "nebula", "planetary_nebula", "open_cluster", "globular_cluster", "group_of_galaxies", "multiple_objects"}
    assert 0.0 <= first["ra"] < 360.0
    assert -90.0 <= first["dec"] <= 90.0
    assert "catalog=" in first["sky_engine_url"]
    assert f"source_id={first['source_id']}" in first["sky_engine_url"]
    assert "model=dso" in first["sky_engine_url"]


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


def test_above_me_tier2_stars_are_ranked_and_linkable_when_visible() -> None:
    response = client.get(
        "/api/above-me?lat=41.44&lng=-79.69&time=2026-06-04T02:16:04Z&limit=100",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    tier2 = [
        item
        for item in body["data"]["objects"]
        if item["catalog"] == "Hipparcos Tier 2 (local)"
    ]

    assert tier2
    first = tier2[0]
    assert first["source_id"] == str(first["source_id"])
    assert first["source_id"].startswith("hip-")
    assert first["model"] == "star"
    assert first["type"] == "star"
    assert 0.0 <= first["ra"] < 360.0
    assert -90.0 <= first["dec"] <= 90.0
    assert first["is_visible"] is True
    assert "catalog=Hipparcos+Tier+2+%28local%29" in first["sky_engine_url"]
    assert f"source_id={first['source_id']}" in first["sky_engine_url"]
    assert "model=star" in first["sky_engine_url"]


def test_above_me_tier2_uses_existing_catalog_without_expanding_bright_star_seeds() -> None:
    assert len(BRIGHT_STAR_SCENE_OBJECTS) == 24

    response = client.get(
        "/api/above-me?lat=41.44&lng=-79.69&time=2026-06-04T02:16:04Z&limit=100",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    objects = response.json()["data"]["objects"]
    assert any(
        item["catalog"] == "Hipparcos Tier 2 (local)"
        and item["source_id"] == "hip-67194"
        for item in objects
    )


def test_above_me_rejects_invalid_location_without_partial_payload() -> None:
    response = client.get(
        "/api/above-me?lat=not-a-number&lng=-79.69",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_request"


def test_above_me_rejects_timezone_naive_time_without_partial_payload() -> None:
    response = client.get(
        "/api/above-me?lat=41.44&lng=-79.69&time=2026-06-04T02:16:04",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_request"
    assert "timezone" in response.json()["error"]["message"].lower()


def test_above_me_clamps_limit_to_maximum() -> None:
    response = client.get(
        "/api/above-me?lat=41.44&lng=-79.69&time=2026-06-04T02:16:04Z&limit=500",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]["objects"]) <= body["meta"]["limit"]
    assert body["meta"]["limit"] == 100
