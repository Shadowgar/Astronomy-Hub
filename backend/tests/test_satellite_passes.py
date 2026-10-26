from datetime import datetime, timedelta, timezone
import importlib
import os
from pathlib import Path
import time

from fastapi.testclient import TestClient
import pytest
from backend.app.main import app
from backend.tests.test_satellite_visual_pilot import SOURCE_BYTES, SOURCE_MANIFEST, build, mount

client = TestClient(app)
QUERY = {"lat": 40.44, "lng": -79.99, "elev": 300, "time": "2026-10-25T00:00:00Z", "hours": 24}


def service():
    return importlib.import_module("backend.app.services.satellite_pass_service")


@pytest.fixture
def release(tmp_path, monkeypatch):
    raw, sums = tmp_path / "visual.tle", tmp_path / "SHA256SUMS"
    raw.write_bytes(SOURCE_BYTES)
    sums.write_bytes(SOURCE_MANIFEST)
    path = tmp_path / "release"
    build((raw, sums), path)
    mount(monkeypatch, path)
    return path


@pytest.fixture
def kernel(monkeypatch):
    path = Path(os.getenv("ORAS_PLANETARY_EPHEMERIS_DIR", "data/runtime-packs/planetary-ephemeris/release"))
    if not (path / "manifest.json").is_file():
        pytest.skip("real mounted DE442s required for numeric pass evidence")
    monkeypatch.setenv("ORAS_PLANETARY_EPHEMERIS_DIR", str(path.resolve()))
    return path


def test_missing_feed_returns_explicit_unavailable_not_fake_passes(tmp_path, monkeypatch):
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(tmp_path / "missing.jsonl.gz"))
    response = client.get("/api/sky/satellite-passes", params=QUERY)
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "unavailable"
    assert response.json()["data"]["passes"] == []


@pytest.mark.parametrize("field,value", [("lat", "nan"), ("lat", 91), ("lng", -181), ("elev", "inf"), ("elev", -1001), ("hours", 0), ("hours", 25), ("time", "2026-10-25T00:00:00"), ("time", "9999-12-31T23:00:00Z")])
def test_invalid_query_is_rejected_before_computation(field, value):
    response = client.get("/api/sky/satellite-passes", params={**QUERY, field: value})
    assert response.status_code == 400


def test_pilot_requires_explicit_validated_profile(release, monkeypatch):
    monkeypatch.delenv("ORAS_SATELLITE_RELEASE_PROFILE")
    data = service().build_satellite_passes(**QUERY)["data"]
    assert data["status"] == "unavailable"
    assert not data["passes"]


def test_missing_kernel_fails_closed(release, tmp_path, monkeypatch):
    monkeypatch.setenv("ORAS_PLANETARY_EPHEMERIS_DIR", str(tmp_path / "missing"))
    data = service().build_satellite_passes(**QUERY)["data"]
    assert data["status"] == "unavailable"
    assert not data["passes"]
    assert "ephemeris" in data["reason"].lower()


def test_real_pass_order_geometry_optical_and_bounds(release, kernel):
    began = time.monotonic()
    data = service().build_satellite_passes(**QUERY)["data"]
    elapsed = time.monotonic() - began
    assert data["status"] == "ready", data["reason"]
    assert 0 < len(data["passes"]) <= 40
    assert data["counts"]["records_scanned"] == 155
    assert data["counts"]["records_failed"] == 0
    assert elapsed < 60
    for item in data["passes"]:
        assert item["rise_utc"] <= item["peak_utc"] <= item["set_utc"]
        assert 0 <= item["peak_altitude_deg"] <= 90
        assert isinstance(item["norad_id"], str)
        assert item["tle_age_days"] <= 14
        epoch = datetime.fromisoformat(item["tle_epoch"])
        endpoint_age = max(abs((datetime.fromisoformat(item[key]) - epoch).total_seconds()) / 86400 for key in ("rise_utc", "set_utc"))
        assert item["tle_age_days"] == pytest.approx(endpoint_age)
        assert item["brightness_status"] in ("unavailable", "standard_magnitude_only")
        if item["optical_status"] == "potentially_observable":
            assert item["watch_utc"] is not None
            assert item["watch_altitude_deg"] >= 10
            assert item["rise_utc"] <= item["watch_utc"] <= item["set_utc"]
    assert data["counts"]["potentially_observable"] > 0
    assert data["counts"]["passes_found"] > len(data["passes"])
    assert data["truncated"] is True
    # Same exact input reuses the bounded cache.
    cached = service().build_satellite_passes(**QUERY)["data"]
    assert cached == data
    api_response = client.get("/api/sky/satellite-passes", params=QUERY)
    assert api_response.status_code == 200
    assert api_response.json()["data"] == data


def test_stale_and_distant_future_epochs_never_produce_passes(release, kernel):
    for instant in ("2026-11-25T00:00:00Z", "2026-09-25T00:00:00Z"):
        data = service().build_satellite_passes(**{**QUERY, "time": instant})["data"]
        assert not data["passes"]
        assert data["counts"]["records_skipped_stale"] == 155


def test_changed_source_invalidates_cached_prediction(release, kernel):
    first = service().build_satellite_passes(**QUERY)["data"]
    assert first["status"] == "ready"
    (release / "visual.tle").write_bytes(b"tampered")
    changed = service().build_satellite_passes(**QUERY)["data"]
    assert changed["status"] == "unavailable"
    assert not changed["passes"]


def test_busy_request_is_bounded_without_waiting(tmp_path, monkeypatch):
    svc = service()
    assert svc._COMPUTE_LOCK.acquire(blocking=False)
    try:
        response = client.get("/api/sky/satellite-passes", params=QUERY)
        assert response.status_code == 429
    finally:
        svc._COMPUTE_LOCK.release()

@pytest.fixture(autouse=True)
def isolated_request_budget():
    # Requests in separate tests are independent callers, not one abusive burst.
    svc = service()
    svc._REQUESTS.clear()
    svc._CACHE.clear()


@pytest.fixture
def iss_geometry(release, kernel):
    from skyfield.api import EarthSatellite, wgs84
    from backend.app.services.satellite_tle_catalog_service import load_satellite_tle_catalog
    svc = service()
    record = load_satellite_tle_catalog.__wrapped__(release / "tle_satellite.jsonl.gz").records_by_norad["25544"]
    satellite = EarthSatellite(*record["model_data"]["tle"], record["name"], svc._TIMESCALE)
    observer = wgs84.latlon(40.44, -79.99, elevation_m=300)
    runtime = svc.ephemeris._load_runtime(kernel)
    return record, satellite, observer, runtime


def test_real_iss_numeric_reference_and_optical_classification(iss_geometry):
    record, satellite, observer, runtime = iss_geometry
    svc = service()
    start = datetime(2026, 10, 25, tzinfo=timezone.utc)
    events, kinds = satellite.find_events(observer, svc._TIMESCALE.from_datetime(start),
        svc._TIMESCALE.from_datetime(start + timedelta(days=1)), altitude_degrees=0)
    intervals = svc._intervals(start, start + timedelta(days=1), False, events.utc_datetime(), kinds)
    assert len(intervals) == 6
    details = [svc._describe_pass(record, satellite, observer, runtime.kernel["earth"] + observer,
        runtime, rise, setting, peaks, satellite.epoch.utc_datetime(), 2.0, clipped_start, clipped_end)
        for rise, setting, peaks, clipped_start, clipped_end in intervals]
    # Independent direct Skyfield event/altaz extraction from the pinned real ISS
    # source gives 05:59:42.649 UTC, altitude22.6895°, azimuth132.9695°.
    assert details[0]["peak_altitude_deg"] == pytest.approx(22.6894676, abs=0.001)
    assert details[0]["peak_azimuth_deg"] == pytest.approx(132.9695357, abs=0.001)
    assert abs((datetime.fromisoformat(details[0]["peak_utc"]) - datetime(2026,10,25,5,59,42,649000,tzinfo=timezone.utc)).total_seconds()) < 0.01
    assert details[0]["sunlit_at_peak"] is False
    assert details[0]["solar_altitude_at_peak_deg"] < -50
    assert details[0]["optical_status"] == "geometric_only"
    assert details[0]["watch_utc"] is None
    assert details[3]["sunlit_at_peak"] is True
    assert details[3]["solar_altitude_at_peak_deg"] == pytest.approx(-10.1808819, abs=0.001)
    assert details[3]["optical_status"] == "potentially_observable"
    assert (datetime.fromisoformat(details[3]["peak_utc"]) - datetime.fromisoformat(details[3]["watch_utc"])).total_seconds() >= 15
    assert details[4]["sunlit_at_peak"] is True
    assert details[4]["solar_altitude_at_peak_deg"] > 0
    assert details[4]["optical_status"] == "geometric_only"


def test_real_no_pass_and_window_clipping(iss_geometry):
    record, satellite, observer, runtime = iss_geometry
    svc = service()
    start = datetime(2026, 10, 25, tzinfo=timezone.utc)
    end = start + timedelta(hours=1)
    events, kinds = satellite.find_events(observer, svc._TIMESCALE.from_datetime(start), svc._TIMESCALE.from_datetime(end), altitude_degrees=0)
    assert len(events) == 0
    assert svc._intervals(start, end, False, events.utc_datetime(), kinds) == []
    # A one-minute interval wholly inside the actual ISS pass has no events.
    start = datetime(2026, 10, 25, 5, 57, tzinfo=timezone.utc)
    end = start + timedelta(minutes=1)
    events, kinds = satellite.find_events(observer, svc._TIMESCALE.from_datetime(start), svc._TIMESCALE.from_datetime(end), altitude_degrees=0)
    assert len(events) == 0
    initial_alt = float((satellite - observer).at(svc._TIMESCALE.from_datetime(start)).altaz()[0].degrees)
    assert initial_alt > 0
    intervals = svc._intervals(start, end, initial_alt > 0, events.utc_datetime(), kinds)
    assert intervals == [(start, end, [], True, True)]
    result = svc._describe_pass(record, satellite, observer, runtime.kernel["earth"] + observer,
        runtime, start, end, [], satellite.epoch.utc_datetime(), 2, True, True)
    assert result["rise_utc"] == "2026-10-25T05:57:00.000000Z"
    assert result["set_utc"] == "2026-10-25T05:58:00.000000Z"
    assert result["window_clipped_start"] and result["window_clipped_end"]
    assert result["peak_utc"] == result["set_utc"]


def test_multiple_culminations_remain_one_continuous_pass():
    svc = service()
    start = datetime(2026, 10, 25, tzinfo=timezone.utc)
    times = [start + timedelta(minutes=i) for i in (1, 3, 6, 8)]
    intervals = svc._intervals(start, start + timedelta(hours=1), False, times, [0, 1, 1, 2])
    assert intervals == [(times[0], times[-1], times[1:3], False, False)]


def test_source_mutation_during_parse_discards_prediction(release, kernel, monkeypatch):
    svc = service()
    original = svc.load_satellite_tle_catalog.__wrapped__
    def replace_after_read(path):
        result = original(path)
        (release / "visual.tle").write_bytes(b"changed during parse")
        return result
    monkeypatch.setattr(svc.load_satellite_tle_catalog, "__wrapped__", replace_after_read)
    data = svc.build_satellite_passes(**QUERY)["data"]
    assert data["status"] == "unavailable"
    assert data["passes"] == []


def test_request_budget_rejects_unique_overload_but_reuses_cache(tmp_path, monkeypatch):
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(tmp_path / "missing"))
    svc = service()
    for lat in range(12):
        assert svc.build_satellite_passes(**{**QUERY, "lat": lat})["data"]["status"] == "unavailable"
    assert svc.build_satellite_passes(**{**QUERY, "lat": 11})["data"]["status"] == "unavailable"
    with pytest.raises(svc.PassServiceBusy):
        svc.build_satellite_passes(**{**QUERY, "lat": 12})


def test_feed_truncated_between_hash_and_parse_fails_closed(release, kernel, monkeypatch):
    svc = service()
    # Qualify/cache source first; the subsequent read simulates a file being
    # truncated after its admitted hash check but before catalog decompression.
    assert svc.feed.build_satellite_feed_status(time=QUERY["time"])["data"]["release_validated"]
    original = svc.load_satellite_tle_catalog.__wrapped__
    def truncate_before_read(path):
        path.write_bytes(path.read_bytes()[:10])
        return original(path)
    monkeypatch.setattr(svc.load_satellite_tle_catalog, "__wrapped__", truncate_before_read)
    data = svc.build_satellite_passes(**QUERY)["data"]
    assert data["status"] == "unavailable"
    assert data["passes"] == []
