from __future__ import annotations

import json
from pathlib import Path

from scripts.skydata import mirror_public_runtime_data as mirror


def _write_hips_fixture(root: Path) -> str:
    survey = root / "survey"
    (survey / "Norder0/Dir0").mkdir(parents=True, exist_ok=True)
    (survey / "Norder1/Dir0").mkdir(parents=True, exist_ok=True)
    (survey / "properties").write_text("hips_tile_format = webp\n", encoding="utf-8")
    for npix in range(12):
        (survey / f"Norder0/Dir0/Npix{npix}.webp").write_bytes(b"tile0")
    for npix in range(4):
        (survey / f"Norder1/Dir0/Npix{npix}.webp").write_bytes(b"tile1")
    return survey.as_uri()


def _write_manifest(path: Path, base_url: str) -> None:
    payload = {
        "manifest_version": 1,
        "name": "test",
        "classes": {
            "dss_survey": {
                "source_type": "hips-survey",
                "public_base_url": base_url,
                "raw_mirror_path": "data/raw/test-dss",
                "processed_path": "data/processed/test-dss/runtime-ready/surveys/dss/v1",
                "oras_runtime_target_path": "/oras-sky-engine/skydata/surveys/dss/v1",
            }
        },
    }
    path.write_text(json.dumps(payload), encoding="utf-8")


def test_manifest_contains_required_classes() -> None:
    payload = json.loads((Path("data/manifests/public_stellarium_runtime_parity_manifest.json")).read_text(encoding="utf-8"))
    required = {
        "search_name_resolution",
        "object_summaries",
        "ui_assets",
        "star_pack_minimal",
        "star_pack_base",
        "star_pack_extended",
        "dso_pack_base",
        "dso_pack_extended",
        "milkyway_survey",
        "landscape_guereins",
        "moon_survey",
        "dss_survey",
    }
    assert required.issubset(set(payload["classes"].keys()))


def test_dry_run_hips_mirror(tmp_path: Path, monkeypatch) -> None:
    base_url = _write_hips_fixture(tmp_path)
    manifest_path = tmp_path / "manifest.json"
    _write_manifest(manifest_path, base_url)
    monkeypatch.setattr(mirror, "MANIFEST_PATH", manifest_path)
    monkeypatch.setattr(mirror, "RUNTIME_PACKS_ROOT", tmp_path / "runtime-packs")

    payload = mirror.process_hips_class(
        "dss_survey",
        mirror.load_manifest()["classes"]["dss_survey"],
        dry_run=True,
        confirm_download=False,
        resume=False,
        checksum_manifest=False,
        max_files=0,
        max_bytes=0,
        order_min=0,
        order_max=1,
    )
    assert payload["status"] == "ok"
    assert payload["planned_files"] >= 12


def test_http_download_requires_confirm(tmp_path: Path, monkeypatch) -> None:
    manifest_path = tmp_path / "manifest.json"
    _write_manifest(manifest_path, "https://example.invalid/surveys/dss/v1")
    monkeypatch.setattr(mirror, "MANIFEST_PATH", manifest_path)

    payload = mirror.process_hips_class(
        "dss_survey",
        mirror.load_manifest()["classes"]["dss_survey"],
        dry_run=False,
        confirm_download=False,
        resume=False,
        checksum_manifest=False,
        max_files=0,
        max_bytes=0,
        order_min=0,
        order_max=0,
    )
    assert payload["status"] == "blocked"
    assert "confirm-download" in payload["reason"]


def _write_eph_fixture(root: Path) -> str:
    pack = root / "pack"
    (pack / "Norder0/Dir0").mkdir(parents=True, exist_ok=True)
    (pack / "Norder1/Dir0").mkdir(parents=True, exist_ok=True)
    (pack / "properties").write_text("hips_tile_format = eph\nhips_order = 1\n", encoding="utf-8")
    for npix in range(12):
        (pack / f"Norder0/Dir0/Npix{npix}.eph").write_bytes(b"eph0" + bytes([npix]))
    for npix in range(4):
        (pack / f"Norder1/Dir0/Npix{npix}.eph").write_bytes(b"eph1" + bytes([npix]))
    return pack.as_uri()


def _eph_cfg(base_url: str, oras_target: str = "/oras-sky-engine/skydata/packs/minimal/stars") -> dict:
    return {
        "source_type": "eph-pack",
        "public_base_url": base_url,
        "raw_mirror_path": "data/raw/packs/minimal/stars",
        "processed_path": "data/processed/packs/minimal/stars",
        "oras_runtime_target_path": oras_target,
    }


def test_eph_pack_source_type_is_recognized(tmp_path: Path) -> None:
    cfg = _eph_cfg(_write_eph_fixture(tmp_path))
    payload = mirror.process_eph_pack_class(
        "star_pack_minimal",
        cfg,
        dry_run=True,
        confirm_download=False,
        resume=False,
        checksum_manifest=False,
        max_files=20,
        max_bytes=0,
        order_min=0,
        order_max=1,
    )
    assert payload["status"] == "ok"
    assert payload["expected_format"] == "eph"


def test_eph_pack_dry_run_downloads_nothing(tmp_path: Path, monkeypatch) -> None:
    cfg = _eph_cfg(_write_eph_fixture(tmp_path))
    monkeypatch.setattr(mirror, "RUNTIME_PACKS_ROOT", tmp_path / "runtime-packs")
    payload = mirror.process_eph_pack_class(
        "star_pack_minimal",
        cfg,
        dry_run=True,
        confirm_download=False,
        resume=False,
        checksum_manifest=False,
        max_files=20,
        max_bytes=0,
        order_min=0,
        order_max=1,
    )
    assert payload["downloaded_files"] == 0
    assert not (tmp_path / "runtime-packs").exists()


def test_eph_pack_refuses_without_confirm(tmp_path: Path) -> None:
    cfg = _eph_cfg("https://example.invalid/pack/stars")
    payload = mirror.process_eph_pack_class(
        "star_pack_minimal",
        cfg,
        dry_run=False,
        confirm_download=False,
        resume=False,
        checksum_manifest=False,
        max_files=10,
        max_bytes=0,
        order_min=0,
        order_max=0,
    )
    assert payload["status"] == "blocked"
    assert "confirm-download" in payload["reason"]


def test_eph_pack_promotion_forbids_legacy_stars_target(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(mirror, "RUNTIME_PACKS_ROOT", tmp_path / "runtime-packs")
    cfg = _eph_cfg(_write_eph_fixture(tmp_path), oras_target="/oras-sky-engine/skydata/stars")
    result = mirror.promote_runtime_class("legacy_stars", cfg)
    assert result["promoted"] is False
    assert "forbidden" in result["reason"]


def test_eph_pack_manifest_records_url_path_sha_order_class(tmp_path: Path, monkeypatch) -> None:
    cfg = _eph_cfg(_write_eph_fixture(tmp_path))
    monkeypatch.setattr(mirror, "RUNTIME_PACKS_ROOT", tmp_path / "runtime-packs")
    payload = mirror.process_eph_pack_class(
        "star_pack_minimal",
        cfg,
        dry_run=False,
        confirm_download=True,
        resume=False,
        checksum_manifest=True,
        max_files=3,
        max_bytes=0,
        order_min=0,
        order_max=0,
    )
    assert payload["downloaded_files"] > 0
    log_path = Path(payload["log_path"])
    row = json.loads(log_path.read_text(encoding="utf-8").splitlines()[0])
    assert row["class"] == "star_pack_minimal"
    assert row["order"] == 0
    assert row["relative_path"].endswith(".eph")
    assert row["url"].startswith("file://")
    assert len(row["sha256"]) == 64


def test_eph_pack_path_traversal_rejected(tmp_path: Path) -> None:
    cfg = _eph_cfg(_write_eph_fixture(tmp_path), oras_target="/oras-sky-engine/skydata/packs/../stars")
    try:
        mirror.class_roots(cfg)
    except ValueError as exc:
        assert "traversal" in str(exc)
    else:
        raise AssertionError("Expected traversal rejection")


def test_full_flag_exists(monkeypatch) -> None:
    monkeypatch.setattr("sys.argv", ["mirror_public_runtime_data.py", "--class", "dss_survey", "--full"])
    args = mirror.parse_args()
    assert args.full is True


def test_hips_max_files_counts_new_downloads_only(tmp_path: Path, monkeypatch) -> None:
    base_url = _write_hips_fixture(tmp_path)
    cfg = {
        "source_type": "hips-survey",
        "public_base_url": base_url,
        "raw_mirror_path": "data/raw/test-dss",
        "processed_path": "data/processed/test-dss",
        "oras_runtime_target_path": "/oras-sky-engine/skydata/surveys/dss/v1",
    }
    monkeypatch.setattr(mirror, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(mirror, "RUNTIME_PACKS_ROOT", tmp_path / "data/runtime-packs")

    raw_root, _, _, _, _ = mirror.class_roots(cfg)
    (raw_root / "properties").parent.mkdir(parents=True, exist_ok=True)
    (raw_root / "properties").write_text("hips_tile_format = webp\n", encoding="utf-8")
    for npix in range(11):
        p = raw_root / f"Norder0/Dir0/Npix{npix}.webp"
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(b"tile0")

    payload = mirror.process_hips_class(
        "dss_survey",
        cfg,
        dry_run=False,
        confirm_download=True,
        resume=True,
        checksum_manifest=False,
        max_files=1,
        max_bytes=0,
        order_min=0,
        order_max=0,
        full=True,
    )
    assert payload["downloaded_files"] == 1
    assert payload["resumed_files"] >= 11


def test_hips_failed_files_recorded(tmp_path: Path, monkeypatch) -> None:
    base_url = _write_hips_fixture(tmp_path)
    cfg = {
        "source_type": "hips-survey",
        "public_base_url": base_url,
        "raw_mirror_path": "data/raw/test-dss",
        "processed_path": "data/processed/test-dss",
        "oras_runtime_target_path": "/oras-sky-engine/skydata/surveys/dss/v1",
    }
    monkeypatch.setattr(mirror, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(mirror, "RUNTIME_PACKS_ROOT", tmp_path / "data/runtime-packs")

    # Force one expected tile to be missing from source fixture.
    (tmp_path / "survey/Norder0/Dir0/Npix11.webp").unlink()

    payload = mirror.process_hips_class(
        "dss_survey",
        cfg,
        dry_run=False,
        confirm_download=True,
        resume=False,
        checksum_manifest=False,
        max_files=0,
        max_bytes=0,
        order_min=0,
        order_max=0,
        full=True,
    )
    failed_path = Path(payload["failed_path"])
    data = json.loads(failed_path.read_text(encoding="utf-8"))
    assert payload["failed_files"] >= 1
    assert len(data["failed_files"]) >= 1


def test_full_status_report_fields_present(tmp_path: Path, monkeypatch) -> None:
    base_url = _write_hips_fixture(tmp_path)
    cfg = {
        "source_type": "hips-survey",
        "public_base_url": base_url,
        "raw_mirror_path": "data/raw/test-dss",
        "processed_path": "data/processed/test-dss",
        "oras_runtime_target_path": "/oras-sky-engine/skydata/surveys/dss/v1",
    }
    monkeypatch.setattr(mirror, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(mirror, "RUNTIME_PACKS_ROOT", tmp_path / "data/runtime-packs")
    payload = mirror.process_hips_class(
        "dss_survey",
        cfg,
        dry_run=False,
        confirm_download=True,
        resume=False,
        checksum_manifest=False,
        max_files=0,
        max_bytes=0,
        order_min=0,
        order_max=0,
        full=True,
    )
    for key in (
        "expected_files",
        "existing_files",
        "missing_files_before",
        "downloaded_files",
        "failed_files",
        "missing_files_after",
        "complete",
    ):
        assert key in payload
