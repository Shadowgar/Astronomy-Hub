from __future__ import annotations

from datetime import datetime, timezone
import gzip
import hashlib
import json
from pathlib import Path

import pytest

from scripts.skydata.build_oras_satellite_tle_release import (
    DEFAULT_SOURCE_URL,
    _download_source,
    _nested_gzip_jsonl,
    build_release,
    parse_celestrak_3le,
    validate_release,
)
from backend.app.services.satellite_tle_catalog_service import _normalize_satellite_record


ISS_LINE_1 = "1 25544U 98067A   26154.70949191  .00008646  00000-0  16154-3 0  9992"
ISS_LINE_2 = "2 25544  51.6330   6.8180 0007089 128.9940 231.1681 15.49585865569660"
HST_LINE_1 = "1 20580U 90037B   26153.34296606  .00005773  00000-0  18209-3 0  9992"
HST_LINE_2 = "2 20580  28.4711 182.0162 0001701 354.7953   5.2625 15.30586461786296"


def _fixture_payload(*, include_duplicate: bool = False, include_malformed: bool = False) -> str:
    blocks = [
        f"ISS (ZARYA)\n{ISS_LINE_1}\n{ISS_LINE_2}",
        f"HST\n{HST_LINE_1}\n{HST_LINE_2}",
    ]
    if include_duplicate:
        blocks.append(f"ISS DUPLICATE\n{ISS_LINE_1}\n{ISS_LINE_2}")
    if include_malformed:
        blocks.append(f"BROKEN\n{ISS_LINE_1[:-1]}0\n{ISS_LINE_2}")
    return "\n".join(blocks) + "\n"


def _read_nested_jsonl(path: Path) -> list[dict]:
    outer = gzip.decompress(path.read_bytes())
    assert outer.startswith(b"\x1f\x8b")
    return [json.loads(line) for line in gzip.decompress(outer).splitlines() if line.strip()]


def test_parser_preserves_source_backed_identity_and_rejects_bad_checksum() -> None:
    records, stats = parse_celestrak_3le(
        _fixture_payload(include_duplicate=True, include_malformed=True)
    )

    assert [record["model_data"]["norad_number"] for record in records] == [20580, 25544]
    assert stats["input_record_count"] == 4
    assert stats["output_record_count"] == 2
    assert stats["duplicate_count"] == 1
    assert stats["malformed_count"] == 1

    iss = records[1]
    assert iss["model"] == "tle_satellite"
    assert iss["short_name"] == "ISS DUPLICATE"
    assert iss["model_data"]["tle"] == [ISS_LINE_1, ISS_LINE_2]
    assert iss["model_data"]["source_id"] == "25544"
    assert "NORAD 25544" in iss["names"]
    assert "COSPAR 1998-067A" in iss["names"]
    assert iss["provenance"]["source_key"] == "celestrak_active_gp"
    assert "mag" not in iss["model_data"]
    assert "status" not in iss["model_data"]
    assert "owner" not in iss["model_data"]


def test_parser_adds_starlink_group_only_from_source_name() -> None:
    payload = f"STARLINK-TEST\n{ISS_LINE_1}\n{ISS_LINE_2}\n"

    records, _ = parse_celestrak_3le(payload)

    assert records[0]["model_data"]["group"] == ["Starlink"]
    assert records[0]["model_data"]["subtype"] == "Starlink"


def test_runtime_normalization_preserves_celestrak_provenance() -> None:
    records, _ = parse_celestrak_3le(_fixture_payload())

    normalized = _normalize_satellite_record(records[1])

    assert normalized is not None
    assert normalized["provenance"] == {
        "source_key": "celestrak_active_gp",
        "source_url": DEFAULT_SOURCE_URL,
    }
    assert "Pass 4B" not in normalized["message"]


def test_downloader_rejects_non_http_source_urls(tmp_path: Path) -> None:
    with pytest.raises(ValueError, match="HTTP or HTTPS"):
        _download_source("file:///etc/passwd", tmp_path / "active.tle")


def test_build_release_is_deterministic_double_gzip_and_manifest_backed(tmp_path: Path) -> None:
    input_path = tmp_path / "active.tle"
    output_path = tmp_path / "release"
    input_path.write_text(_fixture_payload(), encoding="utf-8")
    acquired_at = datetime(2026, 6, 4, 3, 0, tzinfo=timezone.utc)

    manifest = build_release(
        input_path=input_path,
        output_dir=output_path,
        release_version="2026.06.04.1",
        acquired_at=acquired_at,
        minimum_count=2,
        required_norad=("25544", "20580"),
    )
    first_bytes = (output_path / "tle_satellite.jsonl.gz").read_bytes()
    second_manifest = build_release(
        input_path=input_path,
        output_dir=output_path,
        release_version="2026.06.04.1",
        acquired_at=acquired_at,
        minimum_count=2,
        required_norad=("25544", "20580"),
    )

    assert first_bytes == (output_path / "tle_satellite.jsonl.gz").read_bytes()
    inner_gzip = gzip.decompress(first_bytes)
    assert inner_gzip[3] == 8
    assert inner_gzip[10:].split(b"\0", 1)[0] == b"tle_satellite.jsonl"
    assert manifest == second_manifest
    assert manifest["source_url"] == DEFAULT_SOURCE_URL
    assert manifest["record_count"] == 2
    assert manifest["required_norad"] == {"20580": True, "25544": True}
    assert manifest["catalog_number_format"] == "tle_5_digit"
    assert manifest["six_digit_catalog_support"] is False
    assert manifest["sha256"] == hashlib.sha256(first_bytes).hexdigest()
    assert manifest["epoch_min"].startswith("2026-06-02")
    assert manifest["epoch_max"].startswith("2026-06-03")

    records = _read_nested_jsonl(output_path / "tle_satellite.jsonl.gz")
    assert [record["model_data"]["source_id"] for record in records] == ["20580", "25544"]
    assert validate_release(output_path, minimum_count=2, required_norad=("25544", "20580"))["record_count"] == 2


def test_validator_rejects_source_identity_that_does_not_match_embedded_tle(tmp_path: Path) -> None:
    input_path = tmp_path / "active.tle"
    output_path = tmp_path / "release"
    input_path.write_text(_fixture_payload(), encoding="utf-8")
    build_release(
        input_path=input_path,
        output_dir=output_path,
        release_version="test-mismatch",
        acquired_at=datetime(2026, 6, 4, 3, 0, tzinfo=timezone.utc),
        minimum_count=2,
        required_norad=("25544", "20580"),
    )
    records = _read_nested_jsonl(output_path / "tle_satellite.jsonl.gz")
    records[0]["model_data"]["tle"] = records[1]["model_data"]["tle"]
    feed_payload = _nested_gzip_jsonl(records)
    feed_path = output_path / "tle_satellite.jsonl.gz"
    feed_path.write_bytes(feed_payload)
    manifest_path = output_path / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["sha256"] = hashlib.sha256(feed_payload).hexdigest()
    manifest["byte_size"] = len(feed_payload)
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

    with pytest.raises(ValueError, match="does not match embedded TLE"):
        validate_release(output_path, minimum_count=2, required_norad=("25544", "20580"))
