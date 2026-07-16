from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.main import app
from scripts.skydata.build_oras_satellite_tle_release import build_release


client = TestClient(app)
ISS_LINE_1 = "1 25544U 98067A   26154.70949191  .00008646  00000-0  16154-3 0  9992"
ISS_LINE_2 = "2 25544  51.6330   6.8180 0007089 128.9940 231.1681 15.49585865569660"
HST_LINE_1 = "1 20580U 90037B   26153.34296606  .00005773  00000-0  18209-3 0  9992"
HST_LINE_2 = "2 20580  28.4711 182.0162 0001701 354.7953   5.2625 15.30586461786296"


def _build_fixture_release(path: Path) -> None:
    source = path.parent / "active.tle"
    source.write_text(
        f"ISS (ZARYA)\n{ISS_LINE_1}\n{ISS_LINE_2}\nHST\n{HST_LINE_1}\n{HST_LINE_2}\n",
        encoding="utf-8",
    )
    build_release(
        input_path=source,
        output_dir=path,
        release_version="2026.06.04.1",
        acquired_at=datetime(2026, 6, 4, 3, 0, tzinfo=timezone.utc),
        minimum_count=2,
        required_norad=("25544", "20580"),
    )


def test_satellite_feed_status_reports_mounted_release_without_bulk_records(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))

    response = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:04Z")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    data = body["data"]
    assert data["mounted"] is True
    assert data["status"] == "ready"
    assert data["release_version"] == "2026.06.04.1"
    assert data["source_key"] == "celestrak_active_gp"
    assert data["record_count"] == 2
    assert data["required_norad"] == {"20580": True, "25544": True}
    assert data["freshness_status"] == "fresh"
    assert data["nearest_tle_age_days"] < 2
    assert data["six_digit_catalog_support"] is False
    assert "records" not in data


def test_satellite_feed_status_is_explicit_when_release_is_missing(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(tmp_path / "missing" / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(tmp_path / "missing" / "manifest.json"))

    response = client.get("/api/sky/satellite-feed")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["mounted"] is False
    assert data["status"] == "degraded"
    assert data["record_count"] == 0
    assert "missing" in data["reason"].lower()


def test_satellite_feed_status_reports_corrupt_manifest_or_feed(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))
    manifest_path = release / "manifest.json"
    manifest_path.write_text("not-json", encoding="utf-8")

    bad_manifest = client.get("/api/sky/satellite-feed")

    assert bad_manifest.status_code == 200
    assert bad_manifest.json()["data"]["status"] == "degraded"
    assert "manifest" in bad_manifest.json()["data"]["reason"].lower()

    _build_fixture_release(release)
    feed_path = release / "tle_satellite.jsonl.gz"
    feed_path.write_bytes(feed_path.read_bytes() + b"corrupt")

    bad_feed = client.get("/api/sky/satellite-feed")

    assert bad_feed.status_code == 200
    assert bad_feed.json()["data"]["status"] == "degraded"
    assert "checksum" in bad_feed.json()["data"]["reason"].lower()


def test_satellite_feed_status_rejects_naive_time(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))

    response = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:04")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_request"
