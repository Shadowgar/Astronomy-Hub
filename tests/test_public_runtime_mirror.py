from __future__ import annotations

import json
import time
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
        "gaia_survey",
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


def test_eph_pack_404_is_classified_sparse_missing(tmp_path: Path, monkeypatch) -> None:
    cfg = _eph_cfg("https://example.invalid/pack/stars")
    monkeypatch.setattr(mirror, "RUNTIME_PACKS_ROOT", tmp_path / "runtime-packs")
    def _fetch(url: str, **kwargs):
        if url.endswith("/properties"):
            return b"hips_tile_format = eph\n"
        if "/Norder0/" in url:
            return b"eph0"
        if "/Norder1/" in url:
            return b"eph1"
        if "/Norder2/" in url:
            raise mirror.HTTPError(url, 404, "not found", hdrs=None, fp=None)
        raise mirror.HTTPError(url, 404, "not found", hdrs=None, fp=None)

    monkeypatch.setattr(mirror, "fetch_bytes", _fetch)
    payload = mirror.process_eph_pack_class(
        "star_pack_minimal",
        cfg,
        dry_run=False,
        confirm_download=True,
        resume=False,
        checksum_manifest=False,
        max_files=0,
        max_bytes=0,
        order_min=0,
        order_max=2,
        retry_count=1,
    )
    failed = json.loads(Path(payload["failed_path"]).read_text(encoding="utf-8"))
    assert payload["status"] == "partial_sparse"
    assert payload["failed_files"] == 0
    assert payload["sparse_missing_files"] > 0
    assert len(failed["failed_files"]) == 0
    assert len(failed["sparse_missing_files"]) > 0


def test_eph_pack_resource_list_mode_downloads_only_listed_tiles(tmp_path: Path, monkeypatch) -> None:
    base = _write_eph_fixture(tmp_path)
    cfg = _eph_cfg(base)
    monkeypatch.setattr(mirror, "RUNTIME_PACKS_ROOT", tmp_path / "runtime-packs")
    resource_list = tmp_path / "resources.txt"
    resource_list.write_text(
        "\n".join(
            [
                f"{base}/properties",
                f"{base}/Norder0/Dir0/Npix0.eph",
                f"{base}/Norder1/Dir0/Npix0.eph",
                "https://example.invalid/not-this-pack/Norder0/Dir0/Npix0.eph",
            ]
        ),
        encoding="utf-8",
    )
    payload = mirror.process_eph_pack_class(
        "star_pack_minimal",
        cfg,
        dry_run=False,
        confirm_download=True,
        resume=False,
        checksum_manifest=False,
        max_files=0,
        max_bytes=0,
        order_min=0,
        order_max=4,
        resource_list=str(resource_list),
    )
    assert payload["observed_known"] == 3
    assert payload["planned_required"] == 3
    assert payload["downloaded_files"] == 2
    assert payload["failed_files"] == 0
    assert payload["sparse_missing_files"] == 0


def test_local_pack_roots_remain_configured() -> None:
    source = Path("vendor/stellarium-web-engine/apps/web-frontend/src/assets/oras_data_config.js").read_text(encoding="utf-8")
    assert "ORAS_PACKS_ROOT + '/minimal'" in source
    assert "ORAS_PACKS_ROOT + '/base'" in source
    assert "ORAS_PACKS_ROOT + '/extended'" in source


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


def test_workers_option_parses(monkeypatch) -> None:
    monkeypatch.setattr("sys.argv", ["mirror_public_runtime_data.py", "--class", "dss_survey", "--workers", "16"])
    args = mirror.parse_args()
    assert args.workers == 16


def test_workers_default_is_one(monkeypatch) -> None:
    monkeypatch.setattr("sys.argv", ["mirror_public_runtime_data.py", "--class", "dss_survey"])
    args = mirror.parse_args()
    assert args.workers == 1


def test_progress_options_parse(monkeypatch) -> None:
    monkeypatch.setattr(
        "sys.argv",
        [
            "mirror_public_runtime_data.py",
            "--class",
            "dss_survey",
            "--progress",
            "--progress-interval",
            "2",
            "--quiet",
            "--jsonl-progress",
        ],
    )
    args = mirror.parse_args()
    assert args.progress is True
    assert args.progress_interval == 2
    assert args.quiet is True
    assert args.jsonl_progress is True


def test_default_progress_enabled_for_full_unless_quiet(tmp_path: Path, monkeypatch, capsys) -> None:
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
    mirror.process_hips_class(
        "dss_survey",
        cfg,
        dry_run=False,
        confirm_download=True,
        resume=False,
        checksum_manifest=False,
        max_files=2,
        max_bytes=0,
        order_min=0,
        order_max=0,
        full=True,
        progress_interval=1,
        workers=1,
    )
    out = capsys.readouterr().out
    assert "elapsed=" in out
    assert "eta=" in out

    mirror.process_hips_class(
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
        quiet=True,
        progress_interval=1,
        workers=1,
    )
    out2 = capsys.readouterr().out
    assert out2.strip() == ""


def test_parallel_schedules_missing_only(tmp_path: Path, monkeypatch) -> None:
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
    pre = raw_root / "Norder0/Dir0/Npix0.webp"
    pre.parent.mkdir(parents=True, exist_ok=True)
    pre.write_bytes(b"existing")

    calls: list[str] = []
    real_fetch = mirror.fetch_bytes

    def _fetch(url: str, **kwargs):
        calls.append(url)
        return real_fetch(url, **kwargs)

    monkeypatch.setattr(mirror, "fetch_bytes", _fetch)
    payload = mirror.process_hips_class(
        "dss_survey",
        cfg,
        dry_run=False,
        confirm_download=True,
        resume=True,
        checksum_manifest=False,
        max_files=2,
        max_bytes=0,
        order_min=0,
        order_max=0,
        workers=4,
    )
    assert payload["downloaded_files"] == 2
    assert all(not u.endswith("/Norder0/Dir0/Npix0.webp") for u in calls)


def test_part_files_are_renamed_atomically_on_success(tmp_path: Path, monkeypatch) -> None:
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
        max_files=1,
        max_bytes=0,
        order_min=0,
        order_max=0,
        workers=2,
    )
    assert payload["downloaded_files"] == 1
    assert not list(tmp_path.rglob("*.part"))


def test_dry_run_does_not_start_workers(tmp_path: Path, monkeypatch) -> None:
    base_url = _write_hips_fixture(tmp_path)
    cfg = {
        "source_type": "hips-survey",
        "public_base_url": base_url,
        "raw_mirror_path": "data/raw/test-dss",
        "processed_path": "data/processed/test-dss",
        "oras_runtime_target_path": "/oras-sky-engine/skydata/surveys/dss/v1",
    }

    class _BombPool:
        def __init__(self, *args, **kwargs):
            raise AssertionError("workers should not start in dry-run")

    monkeypatch.setattr(mirror.concurrent.futures, "ThreadPoolExecutor", _BombPool)
    payload = mirror.process_hips_class(
        "dss_survey",
        cfg,
        dry_run=True,
        confirm_download=False,
        resume=False,
        checksum_manifest=False,
        max_files=0,
        max_bytes=0,
        order_min=0,
        order_max=0,
        workers=24,
    )
    assert payload["status"] == "ok"
    status_path = tmp_path / "data/runtime-packs/surveys/dss/v1/mirror-status.json"
    assert not status_path.exists()


def test_progress_line_has_percent_and_eta(tmp_path: Path, monkeypatch, capsys) -> None:
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
    mirror.process_hips_class(
        "dss_survey",
        cfg,
        dry_run=False,
        confirm_download=True,
        resume=False,
        checksum_manifest=False,
        max_files=2,
        max_bytes=0,
        order_min=0,
        order_max=0,
        progress=True,
        progress_interval=1,
        workers=1,
    )
    out = capsys.readouterr().out
    assert "%" in out
    assert "eta=" in out


def test_mirror_status_json_is_written(tmp_path: Path, monkeypatch) -> None:
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
        max_files=1,
        max_bytes=0,
        order_min=0,
        order_max=0,
        workers=1,
    )
    status_path = Path(payload["status_path"])
    assert status_path.exists()
    data = json.loads(status_path.read_text(encoding="utf-8"))
    assert data["class"] == "dss_survey"
    assert "percent_complete" in data


def test_status_command_reads_status_file(tmp_path: Path, monkeypatch, capsys) -> None:
    manifest_path = tmp_path / "manifest.json"
    _write_manifest(manifest_path, _write_hips_fixture(tmp_path))
    monkeypatch.setattr(mirror, "MANIFEST_PATH", manifest_path)
    monkeypatch.setattr(mirror, "REPO_ROOT", tmp_path)
    monkeypatch.setattr(mirror, "RUNTIME_PACKS_ROOT", tmp_path / "data/runtime-packs")
    cfg = mirror.load_manifest()["classes"]["dss_survey"]
    status_path = mirror.status_path_for_class(cfg)
    status_path.parent.mkdir(parents=True, exist_ok=True)
    status_path.write_text(json.dumps({"class": "dss_survey", "percent_complete": 12.3}), encoding="utf-8")
    monkeypatch.setattr("sys.argv", ["mirror_public_runtime_data.py", "--class", "dss_survey", "--status"])
    rc = mirror.main()
    assert rc == 0
    out = capsys.readouterr().out
    assert "percent_complete" in out


def test_jsonl_progress_emits_parseable_json(tmp_path: Path, monkeypatch, capsys) -> None:
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
    mirror.process_hips_class(
        "dss_survey",
        cfg,
        dry_run=False,
        confirm_download=True,
        resume=False,
        checksum_manifest=False,
        max_files=2,
        max_bytes=0,
        order_min=0,
        order_max=0,
        jsonl_progress=True,
        progress=True,
        progress_interval=1,
        workers=1,
    )
    lines = [line for line in capsys.readouterr().out.splitlines() if line.strip().startswith("{")]
    assert lines
    payload = json.loads(lines[-1])
    assert payload["event"] == "progress"


def test_interrupt_marks_status_interrupted(tmp_path: Path, monkeypatch) -> None:
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
    real_fetch = mirror.fetch_bytes

    def _interrupting_fetch(url: str, **kwargs):
        if "Norder" in url:
            raise KeyboardInterrupt()
        return real_fetch(url, **kwargs)

    monkeypatch.setattr(mirror, "fetch_bytes", _interrupting_fetch)
    payload = mirror.process_hips_class(
        "dss_survey",
        cfg,
        dry_run=False,
        confirm_download=True,
        resume=False,
        checksum_manifest=False,
        max_files=2,
        max_bytes=0,
        order_min=0,
        order_max=0,
        workers=1,
    )
    assert payload["interrupted"] is True
    data = json.loads(Path(payload["status_path"]).read_text(encoding="utf-8"))
    assert data["interrupted"] is True


def test_promotion_happens_after_downloads_finish(monkeypatch) -> None:
    calls: list[str] = []

    def _load_manifest():
        return {
            "classes": {
                "dss_survey": {
                    "source_type": "hips-survey",
                    "public_base_url": "file:///tmp/irrelevant",
                    "raw_mirror_path": "data/raw/test",
                    "processed_path": "data/processed/test",
                    "oras_runtime_target_path": "/oras-sky-engine/skydata/surveys/dss/v1",
                }
            }
        }

    def _process(*args, **kwargs):
        calls.append("process_start")
        time.sleep(0.01)
        calls.append("process_done")
        return {"status": "ok", "class": "dss_survey"}

    def _promote(*args, **kwargs):
        calls.append("promote")
        return {"promoted": True}

    monkeypatch.setattr(mirror, "load_manifest", _load_manifest)
    monkeypatch.setattr(mirror, "process_hips_class", _process)
    monkeypatch.setattr(mirror, "promote_runtime_class", _promote)
    monkeypatch.setattr(mirror, "write_json", lambda *a, **k: None)
    monkeypatch.setattr(
        "sys.argv",
        ["mirror_public_runtime_data.py", "--class", "dss_survey", "--confirm-download", "--promote-runtime-pack"],
    )
    rc = mirror.main()
    assert rc == 0
    assert calls == ["process_start", "process_done", "promote"]


def test_promotion_happens_for_partial_results_with_runtime_files(monkeypatch) -> None:
    calls: list[str] = []

    def _load_manifest():
        return {
            "classes": {
                "star_pack_base": {
                    "source_type": "eph-pack",
                    "public_base_url": "file:///tmp/irrelevant",
                    "raw_mirror_path": "data/raw/test",
                    "processed_path": "data/processed/test",
                    "oras_runtime_target_path": "/oras-sky-engine/skydata/packs/base/stars",
                }
            }
        }

    def _process(*args, **kwargs):
        calls.append("process_done")
        return {"status": "incomplete_with_failures", "class": "star_pack_base", "runtime_file_count": 61, "downloaded_files": 0, "resumed_files": 60}

    def _promote(*args, **kwargs):
        calls.append("promote")
        return {"promoted": True}

    monkeypatch.setattr(mirror, "load_manifest", _load_manifest)
    monkeypatch.setattr(mirror, "process_eph_pack_class", _process)
    monkeypatch.setattr(mirror, "promote_runtime_class", _promote)
    monkeypatch.setattr(mirror, "write_json", lambda *a, **k: None)
    monkeypatch.setattr(
        "sys.argv",
        ["mirror_public_runtime_data.py", "--class", "star_pack_base", "--confirm-download", "--promote-runtime-pack"],
    )
    rc = mirror.main()
    assert rc == 0
    assert calls == ["process_done", "promote"]
