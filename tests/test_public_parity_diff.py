from __future__ import annotations

import json
from pathlib import Path

from scripts.skydata.compare_public_vs_oras_skydata import build_parity_diff, classify_family


def _write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def test_classify_family_basic() -> None:
    assert classify_family("packs/extended/stars/Norder0/Dir0/Npix0.eph") == "stars"
    assert classify_family("packs/base/dso/Norder0/Dir0/Npix0.eph") == "dso"
    assert classify_family("surveys/dss/v1/Norder0/Dir0/Npix0.jpg") == "surveys/dss|hips"
    assert classify_family("surveys/sso/moon/Norder0/Allsky.webp") == "sso/planet_textures"
    assert classify_family("landscapes/guereins/properties") == "landscapes"


def test_build_parity_diff_statuses(tmp_path: Path) -> None:
    mirror_root = tmp_path / "runtime-packs"
    oras_root = tmp_path / "oras"

    # present_both
    _write(mirror_root / "a/runtime-ready/oras-sky-engine/skydata/stars/properties", b"same")
    _write(oras_root / "stars/properties", b"same")

    # checksum_mismatch
    _write(mirror_root / "b/runtime-ready/oras-sky-engine/skydata/dso/properties", b"left")
    _write(oras_root / "dso/properties", b"right")

    # missing_local
    _write(mirror_root / "c/runtime-ready/oras-sky-engine/skydata/surveys/dss/v1/Norder0/Dir0/Npix0.jpg", b"img")
    # format_equivalent
    _write(mirror_root / "c/runtime-ready/oras-sky-engine/skydata/surveys/dss/v1/Norder0/Dir0/Npix1.jpg", b"img-jpg")
    _write(oras_root / "surveys/dss/v1/Norder0/Dir0/Npix1.webp", b"img-webp")

    # extra_local
    _write(oras_root / "skycultures/western/index.json", b"{}")

    diff = build_parity_diff(mirror_root, oras_root)

    assert diff["status_counts"]["present_both"] == 1
    assert diff["status_counts"]["checksum_mismatch"] == 1
    assert diff["status_counts"]["missing_local"] == 1
    assert diff["status_counts"]["extra_local"] == 1
    assert diff["status_counts"]["format_equivalent"] == 1

    statuses = {row["relative_path"]: row["status"] for row in diff["rows"]}
    assert statuses["stars/properties"] == "present_both"
    assert statuses["dso/properties"] == "checksum_mismatch"
    assert statuses["surveys/dss/v1/Norder0/Dir0/Npix0.jpg"] == "missing_local"
    assert statuses["surveys/dss/v1/Norder0/Dir0/Npix1.jpg"] == "format_equivalent"
    assert statuses["skycultures/western/index.json"] == "extra_local"

    # Ensure serializable for pipeline output.
    json.dumps(diff)
