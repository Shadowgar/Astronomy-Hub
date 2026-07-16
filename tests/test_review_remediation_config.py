from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def test_production_backend_mounts_satellite_feed() -> None:
    compose = (REPO_ROOT / "docker-compose.prod.yml").read_text(encoding="utf-8")

    assert "context: ." in compose
    assert "dockerfile: backend/Dockerfile" in compose
    assert "postgresql+psycopg://" in compose
    assert "postgresql+psycopg2://" not in compose
    assert "SATELLITE_TLE_FEED_PATH: /runtime/oras-satellite-tle/tle_satellite.jsonl.gz" in compose
    assert "ORAS_SATELLITE_TLE_MANIFEST_PATH: /runtime/oras-satellite-tle/manifest.json" in compose
    assert "ORAS_SATELLITE_TLE_HOST_DIR" in compose
    assert ":/runtime/oras-satellite-tle:ro" in compose


def test_production_frontend_healthcheck_requires_runtime_skydata() -> None:
    compose = (REPO_ROOT / "docker-compose.prod.yml").read_text(encoding="utf-8")

    assert "healthcheck:" in compose
    assert "/usr/share/nginx/html/oras-sky-engine/skydata/tle_satellite.jsonl.gz" in compose
    assert "/usr/share/nginx/html/oras-sky-engine/skydata/packs/base/dso/properties" in compose


def test_backend_container_runs_as_non_root_user() -> None:
    dockerfile = (REPO_ROOT / "backend/Dockerfile").read_text(encoding="utf-8")

    assert "USER appuser" in dockerfile


def test_runtime_sync_checks_rsync_dependency() -> None:
    script = (REPO_ROOT / "scripts/sync-stellarium-runtime.sh").read_text(encoding="utf-8")

    assert "command -v rsync" in script


def test_stellarium_prepare_does_not_write_satellite_runtime_data() -> None:
    script = (REPO_ROOT / "scripts/prepare-stellarium-reference.sh").read_text(encoding="utf-8")

    assert "satellites:build" in script
    assert "tle_satellite.jsonl.gz" not in script
    assert "gzip.open" not in script


def test_stellarium_prepare_does_not_download_satellites() -> None:
    script = (REPO_ROOT / "scripts/prepare-stellarium-reference.sh").read_text(encoding="utf-8")

    assert "curl" not in script
    assert "stellarium.sfo2.cdn.digitaloceanspaces.com" not in script


def test_stellarium_build_does_not_refresh_satellite_data() -> None:
    script = (REPO_ROOT / "scripts/build-stellarium-safe.sh").read_text(encoding="utf-8")

    assert "STELLARIUM_SKIP_TLE_REFRESH" not in script


def test_production_runbook_uses_existing_commands() -> None:
    runbook = (REPO_ROOT / "docs/restart/ORAS_PROD_RELEASE_WORKFLOW_2026-06-02.md").read_text(encoding="utf-8")

    assert "rebuild-oras-frontend-prod.sh" not in runbook
    assert "docker compose -f docker-compose.prod.yml build frontend" in runbook
