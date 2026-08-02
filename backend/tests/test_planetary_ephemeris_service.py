from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path

import pytest

from backend.app.services.planetary_ephemeris_service import (
    EphemerisOutOfRangeError,
    compute_local_planetary_ephemeris,
    get_planetary_ephemeris_status,
)


ROOT = Path(__file__).resolve().parents[2]
LOCAL_RELEASE = ROOT / "data/runtime-packs/planetary-ephemeris/release"
HAS_LOCAL_RELEASE = (LOCAL_RELEASE / "manifest.json").is_file()


def test_missing_local_release_reports_explicit_degraded_status(tmp_path: Path) -> None:
    status = get_planetary_ephemeris_status(tmp_path / "missing")

    assert status["loaded"] is False
    assert status["status"] == "degraded"
    assert status["source_key"] == "jpl_de442s_local"
    assert status["fallback_source"] == "jpl_horizons"
    assert status["object_count"] == 0


def test_corrupt_local_release_is_rejected_without_coordinates(tmp_path: Path) -> None:
    release = tmp_path / "release"
    release.mkdir()
    (release / "de442s.bsp").write_bytes(b"not-a-kernel")
    (release / "manifest.json").write_text(
        json.dumps(
            {
                "schema_version": 1,
                "release_version": "corrupt",
                "source_key": "jpl_de442s_local",
                "source_url": "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de442s.bsp",
                "kernel_filename": "de442s.bsp",
                "byte_size": 12,
                "sha256": "0" * 64,
                "coverage_start": "1849-12-26T00:00:00Z",
                "coverage_end": "2150-01-22T00:00:00Z",
            }
        ),
        encoding="utf-8",
    )

    status = get_planetary_ephemeris_status(release)

    assert status["loaded"] is False
    assert status["status"] == "degraded"
    assert status["object_count"] == 0
    assert "checksum" in status["message"]


@pytest.mark.skipif(not HAS_LOCAL_RELEASE, reason="ignored DE442s runtime pack is not built")
def test_local_de442s_propagates_all_supported_bodies_deterministically() -> None:
    as_of = datetime(2026, 6, 4, 2, 16, 4, tzinfo=timezone.utc)

    first = compute_local_planetary_ephemeris(
        41.44,
        -79.69,
        elevation_ft=0.0,
        as_of=as_of,
        release_dir=LOCAL_RELEASE,
    )
    second = compute_local_planetary_ephemeris(
        41.44,
        -79.69,
        elevation_ft=0.0,
        as_of=as_of,
        release_dir=LOCAL_RELEASE,
    )

    assert first == second
    assert [body["id"] for body in first] == [
        "sun",
        "moon",
        "mercury",
        "venus",
        "mars",
        "jupiter",
        "saturn",
        "uranus",
        "neptune",
    ]
    assert all(isinstance(body["id"], str) for body in first)
    assert all(0.0 <= body["ra"] < 360.0 for body in first)
    assert all(-90.0 <= body["dec"] <= 90.0 for body in first)
    assert all(-90.0 <= body["elevation"] <= 90.0 for body in first)
    assert all(0.0 <= body["azimuth"] < 360.0 for body in first)
    assert all(body["distance_au"] > 0.0 for body in first)
    assert all(body["source"] == "jpl_de442s_local" for body in first)
    assert all(body["time_basis"] == "2026-06-04T02:16:04Z" for body in first)
    assert next(body for body in first if body["id"] == "mars")["target_reference"] == "Mars barycenter"
    assert next(body for body in first if body["id"] == "moon")["target_reference"] == "Moon"


@pytest.mark.skipif(not HAS_LOCAL_RELEASE, reason="ignored DE442s runtime pack is not built")
def test_local_de442s_rejects_out_of_coverage_time() -> None:
    with pytest.raises(EphemerisOutOfRangeError, match="coverage"):
        compute_local_planetary_ephemeris(
            41.44,
            -79.69,
            elevation_ft=0.0,
            as_of=datetime(2200, 1, 1, tzinfo=timezone.utc),
            release_dir=LOCAL_RELEASE,
        )
