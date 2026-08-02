from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from scripts.skydata.build_oras_planetary_ephemeris import (
    DEFAULT_SOURCE_URL,
    KERNEL_FILENAME,
    MANIFEST_FILENAME,
    build_release_from_file,
)
from scripts.skydata.validate_oras_planetary_ephemeris import validate_release


def test_release_is_manifest_backed_and_deterministic(tmp_path: Path) -> None:
    source = tmp_path / KERNEL_FILENAME
    source.write_bytes(b"source-backed-test-kernel")
    output = tmp_path / "release"

    manifest = build_release_from_file(
        source_path=source,
        output_dir=output,
        release_version="de442s-test",
        expected_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
        expected_byte_size=source.stat().st_size,
        coverage_start="1849-12-26T00:00:00Z",
        coverage_end="2150-01-22T00:00:00Z",
        validate_kernel=False,
    )
    first_manifest = (output / MANIFEST_FILENAME).read_bytes()
    second = build_release_from_file(
        source_path=source,
        output_dir=output,
        release_version="de442s-test",
        expected_sha256=manifest["sha256"],
        expected_byte_size=source.stat().st_size,
        coverage_start=manifest["coverage_start"],
        coverage_end=manifest["coverage_end"],
        validate_kernel=False,
    )

    assert second == manifest
    assert (output / MANIFEST_FILENAME).read_bytes() == first_manifest
    assert manifest["schema_version"] == 1
    assert manifest["source_key"] == "jpl_de442s_local"
    assert manifest["source_url"] == DEFAULT_SOURCE_URL
    assert manifest["kernel_filename"] == KERNEL_FILENAME
    assert manifest["byte_size"] == source.stat().st_size
    assert manifest["sha256"] == hashlib.sha256(source.read_bytes()).hexdigest()
    assert (output / KERNEL_FILENAME).stat().st_mode & 0o044 == 0o044
    assert (output / MANIFEST_FILENAME).stat().st_mode & 0o044 == 0o044
    assert validate_release(
        output,
        validate_kernel=False,
        enforce_official_release=False,
    ) == manifest
    with pytest.raises(ValueError, match="pinned official"):
        validate_release(output, validate_kernel=False)


def test_release_validation_rejects_corruption_and_invalid_coverage(tmp_path: Path) -> None:
    release = tmp_path / "release"
    release.mkdir()
    kernel = release / KERNEL_FILENAME
    kernel.write_bytes(b"kernel")
    manifest = {
        "schema_version": 1,
        "release_version": "de442s-test",
        "source_key": "jpl_de442s_local",
        "source_url": DEFAULT_SOURCE_URL,
        "kernel_filename": KERNEL_FILENAME,
        "byte_size": kernel.stat().st_size,
        "sha256": hashlib.sha256(kernel.read_bytes()).hexdigest(),
        "coverage_start": "1849-12-26T00:00:00Z",
        "coverage_end": "2150-01-22T00:00:00Z",
    }
    (release / MANIFEST_FILENAME).write_text(json.dumps(manifest), encoding="utf-8")

    kernel.write_bytes(b"kermel")
    with pytest.raises(ValueError, match="checksum"):
        validate_release(
            release,
            validate_kernel=False,
            enforce_official_release=False,
        )

    kernel.write_bytes(b"kernel")
    manifest["coverage_start"] = "2150-01-22T00:00:00Z"
    manifest["coverage_end"] = "1849-12-26T00:00:00Z"
    (release / MANIFEST_FILENAME).write_text(json.dumps(manifest), encoding="utf-8")
    with pytest.raises(ValueError, match="coverage"):
        validate_release(
            release,
            validate_kernel=False,
            enforce_official_release=False,
        )


def test_planetary_ephemeris_runtime_data_is_excluded_and_scripted() -> None:
    root = Path(__file__).resolve().parents[2]
    package = json.loads((root / "package.json").read_text(encoding="utf-8"))
    gitignore = (root / ".gitignore").read_text(encoding="utf-8")
    dockerignore = (root / ".dockerignore").read_text(encoding="utf-8")

    assert "ephemeris:build" in package["scripts"]
    assert "ephemeris:validate" in package["scripts"]
    assert "/data/runtime-packs/planetary-ephemeris/" in gitignore
    assert "data/runtime-packs/planetary-ephemeris" in dockerignore
