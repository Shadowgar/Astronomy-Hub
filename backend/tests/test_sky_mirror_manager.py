from __future__ import annotations

import json
from pathlib import Path

from backend.app.services import sky_mirror_manager as smm


def _manifest_for(tmp_path: Path) -> Path:
    manifest = {
        "classes": {
            "star_pack_base": {
                "source_type": "eph-pack",
                "public_base_url": "https://example.invalid/stars",
                "raw_mirror_path": "data/raw/packs/base/stars",
                "processed_path": "data/processed/packs/base/stars",
                "oras_runtime_target_path": "/oras-sky-engine/skydata/packs/base/stars",
            },
            "star_pack_extended": {
                "source_type": "eph-pack",
                "public_base_url": "https://example.invalid/extended/stars",
                "raw_mirror_path": "data/raw/packs/extended/stars",
                "processed_path": "data/processed/packs/extended/stars",
                "oras_runtime_target_path": "/oras-sky-engine/skydata/packs/extended/stars",
            },
        }
    }
    manifest_path = tmp_path / "manifest.json"
    manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
    return manifest_path


def test_status_never_marks_complete_with_zero_runtime_size(tmp_path: Path, monkeypatch) -> None:
    manifest_path = _manifest_for(tmp_path)
    monkeypatch.setattr(smm, "MANIFEST_PATH", manifest_path)
    monkeypatch.setattr(smm, "RUNTIME_PACKS_ROOT", tmp_path / "runtime-packs")
    monkeypatch.setattr(smm, "PUBLIC_SKYDATA_ROOT", tmp_path / "frontend/public/oras-sky-engine/skydata")
    monkeypatch.setattr(smm, "VENDOR_TEST_SKYDATA_ROOT", tmp_path / "vendor/stellarium-web-engine/apps/test-skydata")
    monkeypatch.setattr(smm, "SUPPORTED_CLASSES", ["star_pack_base"])

    status_path = tmp_path / "runtime-packs/packs/base/stars/mirror-status.json"
    status_path.parent.mkdir(parents=True, exist_ok=True)
    status_path.write_text(
        json.dumps({"complete": True, "expected_files": 100, "downloaded_files": 0, "bytes_downloaded": 0}),
        encoding="utf-8",
    )

    manager = smm.SkyMirrorManager()
    payload = manager.status()
    row = payload["classes"][0]
    assert row["status"] != "complete"
    assert row["runtime_file_count"] == 0
    assert row["runtime_size"] == 0


def test_extended_probe_403_is_blocked_not_failed(tmp_path: Path, monkeypatch) -> None:
    manifest_path = _manifest_for(tmp_path)
    monkeypatch.setattr(smm, "MANIFEST_PATH", manifest_path)
    monkeypatch.setattr(smm, "SUPPORTED_CLASSES", ["star_pack_extended"])

    manager = smm.SkyMirrorManager()
    monkeypatch.setattr(
        manager,
        "_probe_blocker",
        lambda class_name: {"status": "blocked", "blocker": "https://example.invalid/extended/stars/properties HTTP 403"},
    )

    payload = manager.status()
    row = payload["classes"][0]
    assert row["status"] == "blocked"
    assert "HTTP 403" in (row["blocker"] or "")


def test_sparse_missing_status_is_partial_not_failed(tmp_path: Path, monkeypatch) -> None:
    manifest_path = _manifest_for(tmp_path)
    monkeypatch.setattr(smm, "MANIFEST_PATH", manifest_path)
    monkeypatch.setattr(smm, "RUNTIME_PACKS_ROOT", tmp_path / "runtime-packs")
    monkeypatch.setattr(smm, "PUBLIC_SKYDATA_ROOT", tmp_path / "frontend/public/oras-sky-engine/skydata")
    monkeypatch.setattr(smm, "SUPPORTED_CLASSES", ["star_pack_base"])

    status_path = tmp_path / "runtime-packs/packs/base/stars/mirror-status.json"
    status_path.parent.mkdir(parents=True, exist_ok=True)
    status_path.write_text(
        json.dumps(
            {
                "complete": False,
                "expected_files": 1021,
                "downloaded_files": 0,
                "failed_files": 0,
                "sparse_missing_files": 960,
                "bytes_downloaded": 359,
            }
        ),
        encoding="utf-8",
    )
    runtime_root = tmp_path / "frontend/public/oras-sky-engine/skydata/packs/base/stars"
    runtime_root.mkdir(parents=True, exist_ok=True)
    (runtime_root / "properties").write_text("hips_tile_format = eph\n", encoding="utf-8")

    manager = smm.SkyMirrorManager()
    row = manager.status()["classes"][0]
    assert row["status"] == "partial"
