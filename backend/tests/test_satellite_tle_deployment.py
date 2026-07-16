from __future__ import annotations

from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import subprocess

import pytest

from scripts.skydata.build_oras_satellite_tle_release import build_release, validate_release


REPO_ROOT = Path(__file__).resolve().parents[2]
INSTALL_SCRIPT = REPO_ROOT / "scripts/skydata/install_oras_satellite_tle_release.sh"
ISS_LINE_1 = "1 25544U 98067A   26154.70949191  .00008646  00000-0  16154-3 0  9992"
ISS_LINE_2 = "2 25544  51.6330   6.8180 0007089 128.9940 231.1681 15.49585865569660"
HST_LINE_1 = "1 20580U 90037B   26153.34296606  .00005773  00000-0  18209-3 0  9992"
HST_LINE_2 = "2 20580  28.4711 182.0162 0001701 354.7953   5.2625 15.30586461786296"


def _fixture_release(path: Path, version: str = "test-1") -> None:
    source = path.parent / f"{path.name}.tle"
    source.write_text(
        f"ISS (ZARYA)\n{ISS_LINE_1}\n{ISS_LINE_2}\nHST\n{HST_LINE_1}\n{HST_LINE_2}\n",
        encoding="utf-8",
    )
    build_release(
        input_path=source,
        output_dir=path,
        release_version=version,
        acquired_at=datetime(2026, 6, 4, 3, 0, tzinfo=timezone.utc),
        minimum_count=2,
        required_norad=("25544", "20580"),
    )


def _run_install(source: Path, target: Path) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    env["PYTHON_BIN"] = str(REPO_ROOT / ".venv/bin/python")
    return subprocess.run(
        ["bash", str(INSTALL_SCRIPT), str(source), str(target)],
        cwd=REPO_ROOT,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )


def test_validator_rejects_checksum_and_manifest_count_corruption(tmp_path: Path) -> None:
    release = tmp_path / "release"
    _fixture_release(release)
    feed = release / "tle_satellite.jsonl.gz"
    feed.write_bytes(feed.read_bytes() + b"corrupt")

    with pytest.raises(ValueError, match="checksum mismatch"):
        validate_release(release, minimum_count=2)

    _fixture_release(release)
    manifest_path = release / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["record_count"] = 3
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

    with pytest.raises(ValueError, match="record count"):
        validate_release(release, minimum_count=2)


def test_validator_rejects_malformed_nested_gzip_even_with_matching_checksum(tmp_path: Path) -> None:
    release = tmp_path / "release"
    _fixture_release(release)
    feed = release / "tle_satellite.jsonl.gz"
    feed.write_bytes(b"not-gzip")
    manifest_path = release / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    manifest["sha256"] = hashlib.sha256(feed.read_bytes()).hexdigest()
    manifest["byte_size"] = len(feed.read_bytes())
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")

    with pytest.raises((OSError, ValueError)):
        validate_release(release, minimum_count=2)


def test_install_validates_stages_manifest_last_and_keeps_previous_release(tmp_path: Path) -> None:
    source = tmp_path / "source"
    target = tmp_path / "current"
    _fixture_release(source, "test-1")

    first = _run_install(source, target)

    assert first.returncode == 0, first.stdout
    assert validate_release(target, minimum_count=2)["release_version"] == "test-1"
    script = INSTALL_SCRIPT.read_text(encoding="utf-8")
    assert script.index('tle_satellite.jsonl.gz') < script.index('manifest.json" "$STAGING/manifest.json')

    replacement = tmp_path / "replacement"
    _fixture_release(replacement, "test-2")
    second = _run_install(replacement, target)

    assert second.returncode == 0, second.stdout
    assert validate_release(target, minimum_count=2)["release_version"] == "test-2"
    backups = list(tmp_path.glob("current.previous-*"))
    assert len(backups) == 1
    assert validate_release(backups[0], minimum_count=2)["release_version"] == "test-1"


def test_install_rejects_symlinked_source_content_and_target(tmp_path: Path) -> None:
    source = tmp_path / "source"
    target = tmp_path / "current"
    _fixture_release(source)
    feed = source / "tle_satellite.jsonl.gz"
    real_feed = source / "real-feed.gz"
    feed.rename(real_feed)
    feed.symlink_to(real_feed)

    source_result = _run_install(source, target)

    assert source_result.returncode != 0
    assert "symlink" in source_result.stdout.lower()

    feed.unlink()
    real_feed.rename(feed)
    target.symlink_to(tmp_path / "somewhere")
    target_result = _run_install(source, target)

    assert target_result.returncode != 0
    assert "symlink target" in target_result.stdout.lower()


def test_satellite_pipeline_commands_mounts_and_generated_data_exclusions_are_declared() -> None:
    package = json.loads((REPO_ROOT / "package.json").read_text(encoding="utf-8"))
    scripts = package["scripts"]
    assert "build_oras_satellite_tle_release.py" in scripts["satellites:build"]
    assert "--validate-only" in scripts["satellites:validate"]
    assert "install_oras_satellite_tle_release.sh" in scripts["satellites:install"]

    for compose_name in ("docker-compose.yml", "docker-compose.prod.yml"):
        compose = (REPO_ROOT / compose_name).read_text(encoding="utf-8")
        assert "ORAS_SATELLITE_TLE_HOST_DIR" in compose
        assert "/runtime/oras-satellite-tle:ro" in compose
        assert "ORAS_SATELLITE_TLE_MANIFEST_PATH" in compose
        assert "tle_satellite.jsonl.gz:ro" in compose

    assert "/data/runtime-packs/satellite-tle/" in (REPO_ROOT / ".gitignore").read_text(encoding="utf-8")
    assert "data/runtime-packs/satellite-tle" in (REPO_ROOT / ".dockerignore").read_text(encoding="utf-8")
    assert "public/oras-sky-engine/skydata/tle_satellite.jsonl.gz" in (
        REPO_ROOT / "frontend/.dockerignore"
    ).read_text(encoding="utf-8")
