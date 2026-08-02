from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.routes import sky


ROOT = Path(__file__).resolve().parents[2]
client = TestClient(app)


def test_ephemeris_status_endpoint_reports_bounded_loaded_metadata(monkeypatch) -> None:
    monkeypatch.setattr(
        sky,
        "get_planetary_ephemeris_status",
        lambda: {
            "loaded": True,
            "status": "loaded",
            "source_key": "jpl_de442s_local",
            "fallback_source": "jpl_horizons",
            "object_count": 9,
            "release_version": "de442s-2025-02-06",
            "coverage_start": "1849-12-26T00:00:00Z",
            "coverage_end": "2150-01-22T00:00:00Z",
            "kernel_filename": "de442s.bsp",
            "sha256": "54d97562" + ("0" * 56),
            "message": "Local JPL DE442s ephemeris is loaded.",
        },
        raising=False,
    )

    response = client.get("/api/sky/planetary-ephemeris", headers={"User-Agent": "pytest"})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["data"]["loaded"] is True
    assert body["data"]["object_count"] == 9
    assert "kernel" not in body["data"]
    assert "release_dir" not in body["data"]


def test_compose_mounts_ephemeris_read_only_and_images_exclude_runtime_data() -> None:
    for compose_name in ("docker-compose.yml", "docker-compose.prod.yml"):
        compose = (ROOT / compose_name).read_text(encoding="utf-8")
        assert "ORAS_PLANETARY_EPHEMERIS_DIR: /runtime/oras-planetary-ephemeris" in compose
        assert "${ORAS_PLANETARY_EPHEMERIS_HOST_DIR:-./data/runtime-packs/planetary-ephemeris/release}" in compose
        assert ":/runtime/oras-planetary-ephemeris:ro" in compose

    assert "/data/runtime-packs/planetary-ephemeris/" in (ROOT / ".gitignore").read_text(
        encoding="utf-8"
    )
    assert "data/runtime-packs/planetary-ephemeris" in (ROOT / ".dockerignore").read_text(
        encoding="utf-8"
    )
