from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path

import pytest

from fastapi.testclient import TestClient

from backend.app.main import app
from scripts.skydata.build_oras_satellite_tle_release import build_release


client = TestClient(app)


def test_satellite_feed_error_does_not_expose_service_exception(monkeypatch) -> None:
    from backend.app.routes import satellite_feed as route

    def invalid_service_state(**kwargs):
        raise ValueError("private catalog diagnostic: /srv/private/catalog.json")

    monkeypatch.setattr(route, "build_satellite_feed_status", invalid_service_state)
    response = client.get("/api/sky/satellite-feed")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_request"
    assert response.json()["error"]["message"] == (
        "Invalid satellite feed request. Use an ISO-8601 time with timezone "
        "and a positive canonical NORAD number."
    )
    assert "private" not in response.text


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


@pytest.mark.parametrize("failure_type", [OSError, TypeError, ValueError])
def test_degraded_release_does_not_disclose_validation_diagnostics(tmp_path, monkeypatch, failure_type):
    from backend.app.services import satellite_feed_status_service as service

    release = tmp_path / "current"
    _build_fixture_release(release)
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))
    monkeypatch.setenv("ORAS_SATELLITE_MINIMUM_COUNT", "2")

    def private_failure(*args, **kwargs):
        raise failure_type("private diagnostic: /srv/private/catalog\nTraceback: secret_configuration")

    monkeypatch.setattr(service, "read_validated_release", private_failure)
    response = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:04Z")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "degraded"
    assert data["release_validated"] is False
    assert data["record_count"] == 2
    assert data["reason"] == "Satellite release validation failed. Check release integrity and configuration."
    assert "private" not in response.text
    assert "Traceback" not in response.text
    assert "secret_configuration" not in response.text


def test_satellite_feed_status_reports_mounted_release_without_bulk_records(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))
    monkeypatch.setenv("ORAS_SATELLITE_MINIMUM_COUNT", "2")

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
    monkeypatch.setenv("ORAS_SATELLITE_MINIMUM_COUNT", "2")
    manifest_path = release / "manifest.json"
    manifest_path.write_text("not-json", encoding="utf-8")

    bad_manifest = client.get("/api/sky/satellite-feed")

    assert bad_manifest.status_code == 200
    assert bad_manifest.json()["data"]["status"] == "degraded"
    assert bad_manifest.json()["data"]["reason"] == "Satellite release validation failed. Check release integrity and configuration."

    _build_fixture_release(release)
    feed_path = release / "tle_satellite.jsonl.gz"
    feed_path.write_bytes(feed_path.read_bytes() + b"corrupt")

    bad_feed = client.get("/api/sky/satellite-feed")

    assert bad_feed.status_code == 200
    assert bad_feed.json()["data"]["status"] == "degraded"
    assert bad_feed.json()["data"]["reason"] == "Native satellite feed could not be parsed."


def test_satellite_feed_status_rejects_naive_time(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))
    monkeypatch.setenv("ORAS_SATELLITE_MINIMUM_COUNT", "2")

    response = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:04")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "invalid_request"


def test_satellite_feed_status_rejects_fixture_sized_release_by_default(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))
    monkeypatch.delenv("ORAS_SATELLITE_MINIMUM_COUNT", raising=False)

    response = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:04Z")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "degraded"
    assert data["reason"] == "Satellite release validation failed. Check release integrity and configuration."


def test_satellite_feed_status_rejects_split_release_paths(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    other = tmp_path / "other"
    other.mkdir()
    (other / "manifest.json").write_bytes((release / "manifest.json").read_bytes())
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(other / "manifest.json"))
    monkeypatch.setenv("ORAS_SATELLITE_MINIMUM_COUNT", "2")

    response = client.get("/api/sky/satellite-feed")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "degraded"
    assert data["reason"] == "Satellite release validation failed. Check release integrity and configuration."


def test_satellite_feed_status_manifest_cannot_override_contract_fields(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    manifest_path = release / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest.update({"mounted": False, "status": "forged", "reason": "forged"})
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(manifest_path))
    monkeypatch.setenv("ORAS_SATELLITE_MINIMUM_COUNT", "2")

    response = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:04Z")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["mounted"] is True
    assert data["status"] == "ready"
    assert data["reason"].startswith("Mounted CelesTrak")


def test_native_feed_without_manifest_reports_actual_stale_catalog(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    (release / "manifest.json").unlink()
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))

    data = client.get("/api/sky/satellite-feed?time=2026-10-24T07:55:00Z").json()["data"]

    assert data["mounted"] is True
    assert data["status"] == "degraded"
    assert data["release_manifest_available"] is False
    assert data["release_validated"] is False
    assert data["provenance_status"] == "unavailable"
    assert data["record_count"] == 2
    assert data["freshness_status"] == "stale"
    assert data["fresh_record_count"] == 0
    assert data["stale_record_count"] == 2
    assert data["unknown_epoch_count"] == 0
    assert data["nearest_tle_age_days"] > 140
    for unknown in ("source_key", "source_url", "release_version", "acquired_at"):
        assert unknown not in data


def test_single_fresh_epoch_does_not_qualify_mixed_catalog(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))
    monkeypatch.setenv("ORAS_SATELLITE_MINIMUM_COUNT", "2")

    # HST is over 14 days old at this time; ISS is under 14 days old.
    data = client.get("/api/sky/satellite-feed?time=2026-06-17T00:00:00Z").json()["data"]

    assert data["status"] == "degraded"
    assert data["release_validated"] is True
    assert data["freshness_status"] == "mixed"
    assert data["fresh_record_count"] == 1
    assert data["stale_record_count"] == 1
    assert data["unknown_epoch_count"] == 0
    assert data["tle_age_days_min"] < 14 < data["tle_age_days_max"]


def test_native_feed_unknown_epoch_does_not_qualify_as_fresh(tmp_path: Path, monkeypatch) -> None:
    import gzip
    release = tmp_path / "current"
    _build_fixture_release(release)
    feed = release / "tle_satellite.jsonl.gz"
    records = [json.loads(line) for line in gzip.decompress(gzip.decompress(feed.read_bytes())).splitlines()]
    records[0]["model_data"]["tle"][0] = records[0]["model_data"]["tle"][0][:18] + "invalid epoch " + records[0]["model_data"]["tle"][0][32:]
    feed.write_bytes(gzip.compress(gzip.compress(b"\n".join(json.dumps(r).encode() for r in records))))
    (release / "manifest.json").unlink()
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(feed))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))

    data = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:04Z").json()["data"]

    assert data["mounted"] is True
    assert data["record_count"] == 2
    assert data["unknown_epoch_count"] == 1
    assert data["fresh_record_count"] == 1
    assert data["freshness_status"] == "mixed"
    assert data["release_validated"] is False


def test_selected_satellite_reports_current_tle_age_separately_from_scene_time(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    (release / "manifest.json").unlink()
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))

    data = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:04Z&norad=25544").json()["data"]

    assert data["freshness_status"] == "fresh"
    selected = data["selected"]
    assert selected["norad_id"] == "25544"
    assert selected["tle_epoch"] == "2026-06-03T17:01:40Z"
    assert selected["freshness_reference"] == "current_utc"
    age = abs((datetime.fromisoformat(selected["as_of_utc"].replace("Z", "+00:00")) - datetime.fromisoformat(selected["tle_epoch"].replace("Z", "+00:00"))).total_seconds()) / 86400
    assert abs(selected["tle_age_days"] - age) < 0.001


def test_selected_satellite_missing_and_invalid_identity_are_explicit(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))
    selected = client.get("/api/sky/satellite-feed?norad=99999").json()["data"]["selected"]
    assert selected["norad_id"] == "99999"
    assert selected["freshness_status"] == "unavailable"
    assert selected["tle_epoch"] is None
    for identity in ("not-a-satellite", "1234567890", "-1", "0", "025544"):
        response = client.get("/api/sky/satellite-feed", params={"norad": identity})
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "invalid_request"


def test_status_poll_reuses_catalog_but_reloads_changed_file(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))
    monkeypatch.setenv("ORAS_SATELLITE_MINIMUM_COUNT", "2")
    first = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:04Z").json()["data"]
    assert first["status"] == "ready"
    original_read = Path.read_bytes

    def no_second_bulk_read(path):
        raise OSError("catalog must not be reread during an unchanged status poll")

    monkeypatch.setattr(Path, "read_bytes", no_second_bulk_read)
    second = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:05Z").json()["data"]
    assert second["status"] == "ready"
    assert second["record_count"] == 2
    assert second["as_of_utc"] == "2026-06-04T02:16:05Z"
    monkeypatch.setattr(Path, "read_bytes", original_read)
    (release / "tle_satellite.jsonl.gz").write_bytes(b"unusable replacement")
    changed = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:05Z").json()["data"]
    assert changed["status"] == "degraded"
    assert changed["record_count"] == 0
    assert changed["release_validated"] is False
    assert changed["freshness_status"] == "unavailable"


@pytest.mark.parametrize("minimum", ["0", "private_config_/srv/private"])
def test_invalid_release_minimum_is_degraded_configuration_not_invalid_request(tmp_path: Path, monkeypatch, minimum) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))
    monkeypatch.setenv("ORAS_SATELLITE_MINIMUM_COUNT", minimum)
    response = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:04Z")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "degraded"
    assert data["release_validated"] is False
    assert data["reason"] == "Satellite release validation failed. Check release integrity and configuration."
    assert "private_config" not in response.text


def test_release_validation_is_bound_to_configured_feed_bytes(tmp_path: Path, monkeypatch) -> None:
    import gzip
    release = tmp_path / "current"
    _build_fixture_release(release)
    canonical = release / "tle_satellite.jsonl.gz"
    record = json.loads(gzip.decompress(gzip.decompress(canonical.read_bytes())).splitlines()[0])
    record["model_data"].update(norad_number=99999, source_id="99999")
    lines = []
    for line in record["model_data"]["tle"]:
        body = (line[:2] + "99999" + line[7:])[:68]
        checksum = (sum(int(char) for char in body if char.isdigit()) + body.count("-")) % 10
        lines.append(body + str(checksum))
    record["model_data"]["tle"] = lines
    alternate = release / "different.jsonl.gz"
    alternate.write_bytes(gzip.compress(gzip.compress(json.dumps(record).encode())))
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(alternate))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))
    monkeypatch.setenv("ORAS_SATELLITE_MINIMUM_COUNT", "2")

    data = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:04Z").json()["data"]

    assert data["mounted"] is True
    assert data["status"] == "degraded"
    assert data["release_validated"] is False
    assert data["provenance_status"] == "unavailable"
    assert data["record_count"] == 1
    assert "required_norad" not in data
    assert "source_key" not in data


def test_release_validation_does_not_ignore_configured_manifest_filename(tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    alternate_manifest = release / "different-manifest.json"
    alternate_manifest.write_text("{}", encoding="utf-8")
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(alternate_manifest))
    monkeypatch.setenv("ORAS_SATELLITE_MINIMUM_COUNT", "2")

    data = client.get("/api/sky/satellite-feed?time=2026-06-04T02:16:04Z").json()["data"]

    assert data["mounted"] is True
    assert data["release_manifest_available"] is True
    assert data["status"] == "degraded"
    assert data["release_validated"] is False
    assert data["record_count"] == 2
    assert "release_version" not in data


@pytest.mark.parametrize("time", ["0001-01-01T00:00:00Z", "9999-12-31T23:59:59Z"])
def test_satellite_feed_status_handles_datetime_bounds(time: str, tmp_path: Path, monkeypatch) -> None:
    release = tmp_path / "current"
    _build_fixture_release(release)
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(release / "tle_satellite.jsonl.gz"))
    monkeypatch.setenv("ORAS_SATELLITE_TLE_MANIFEST_PATH", str(release / "manifest.json"))
    monkeypatch.setenv("ORAS_SATELLITE_MINIMUM_COUNT", "2")

    response = client.get("/api/sky/satellite-feed", params={"time": time})

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status"] == "degraded"
    assert data["freshness_status"] == "stale"
    assert data["fresh_record_count"] == 0
    assert data["stale_record_count"] == 2
