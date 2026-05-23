from __future__ import annotations

import json
from pathlib import Path

import pytest

from scripts.skydata.common import (
    ManifestError,
    RuntimeProtectionError,
    SizeLimitError,
    load_manifest,
    sha256_file,
)
from scripts.skydata.download_with_manifest import download_with_manifest


def test_template_manifest_loads() -> None:
    manifest = load_manifest("data/manifests/oras_skydata_sources.template.json")
    source_classes = {source["source_class"] for source in manifest["sources"]}
    assert manifest["manifest_version"] == 1
    assert "gaia_source_catalog" in source_classes
    assert "satellite_gp" in source_classes
    assert "minor_planets" in source_classes


def test_dry_run_does_not_download(tmp_path: Path) -> None:
    source_file = tmp_path / "source.txt"
    source_file.write_text("capella-proof", encoding="utf-8")
    manifest_path = _write_manifest(
        tmp_path,
        source_url=source_file.as_uri(),
        relative_path="raw/test/source.txt",
        dry_run_name="dry-run-proof",
    )

    report = download_with_manifest(manifest_path, output_root=tmp_path / "mirror", dry_run=True)
    destination = tmp_path / "mirror" / "raw/test/source.txt"
    assert not destination.exists()
    assert report["records"][0]["status"] == "planned"


def test_size_limit_blocks_oversized_source(tmp_path: Path) -> None:
    source_file = tmp_path / "big.txt"
    source_file.write_text("12345678901", encoding="utf-8")
    manifest_path = _write_manifest(
        tmp_path,
        source_url=source_file.as_uri(),
        relative_path="raw/test/big.txt",
        max_bytes=10,
    )

    with pytest.raises(SizeLimitError):
        download_with_manifest(manifest_path, output_root=tmp_path / "mirror")

    assert not (tmp_path / "mirror" / "raw/test/big.txt").exists()


def test_download_report_records_url_path_and_sha256(tmp_path: Path) -> None:
    source_file = tmp_path / "tiny.txt"
    source_file.write_text("oras", encoding="utf-8")
    manifest_path = _write_manifest(
        tmp_path,
        source_url=source_file.as_uri(),
        relative_path="raw/test/tiny.txt",
        expected_size_bytes=4,
    )

    report = download_with_manifest(manifest_path, output_root=tmp_path / "mirror")
    destination = tmp_path / "mirror" / "raw/test/tiny.txt"
    assert destination.read_text(encoding="utf-8") == "oras"
    assert report["records"][0]["source_url"] == source_file.as_uri()
    assert report["records"][0]["local_path"] == str(destination)
    assert report["records"][0]["license_note"] == "test-only"
    assert report["records"][0]["sha256"] == sha256_file(destination)

    report_path = Path(report["report_path"])
    report_payload = json.loads(report_path.read_text(encoding="utf-8"))
    assert report_payload["records"][0]["source_url"] == source_file.as_uri()
    assert report_payload["records"][0]["license_note"] == "test-only"


def test_runtime_tree_is_protected_by_default(tmp_path: Path) -> None:
    source_file = tmp_path / "source.txt"
    source_file.write_text("blocked", encoding="utf-8")
    manifest_path = _write_manifest(
        tmp_path,
        source_url=source_file.as_uri(),
        relative_path="stars/properties",
    )

    with pytest.raises(RuntimeProtectionError):
        download_with_manifest(
            manifest_path,
            output_root=Path("frontend/public/oras-sky-engine/skydata"),
        )


def _write_manifest(
    tmp_path: Path,
    source_url: str,
    relative_path: str,
    dry_run_name: str = "test-manifest",
    max_bytes: int = 1024,
    expected_size_bytes: int | None = None,
) -> Path:
    manifest = {
        "manifest_version": 1,
        "name": dry_run_name,
        "defaults": {
            "output_root": str(tmp_path / "mirror"),
            "large_download_threshold_bytes": 1024 * 1024,
            "max_source_bytes": 1024,
        },
        "sources": [
            {
                "id": "test-source",
                "source_class": "gaia_source_catalog",
                "url": source_url,
                "relative_path": relative_path,
                "enabled": True,
                "expected_size_bytes": expected_size_bytes,
                "expected_sha256": None,
                "max_bytes": max_bytes,
                "license_note": "test-only",
                "mirrorability": "test-only",
                "notes": "fixture",
            }
        ],
    }
    manifest_path = tmp_path / f"{dry_run_name}.json"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    return manifest_path