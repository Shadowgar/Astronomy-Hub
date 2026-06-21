from __future__ import annotations

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def test_production_backend_mounts_satellite_feed() -> None:
    compose = (REPO_ROOT / "docker-compose.prod.yml").read_text(encoding="utf-8")

    assert "context: ." in compose
    assert "dockerfile: backend/Dockerfile" in compose
    assert "postgresql+psycopg://" in compose
    assert "postgresql+psycopg2://" not in compose
    assert "SATELLITE_TLE_FEED_PATH: /runtime/oras-sky-engine/skydata/tle_satellite.jsonl.gz" in compose
    assert "./frontend/public/oras-sky-engine/skydata:/runtime/oras-sky-engine/skydata:ro" in compose


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


def test_stellarium_prepare_creates_satellite_output_directories_before_writing() -> None:
    script = (REPO_ROOT / "scripts/prepare-stellarium-reference.sh").read_text(encoding="utf-8")

    mkdir_position = script.index("os.makedirs(os.path.dirname(dst_path), exist_ok=True)")
    inner_write_position = script.index('gzip.open(inner_payload_path, "wt"')
    assert mkdir_position < inner_write_position


def test_stellarium_prepare_bounds_satellite_download_retries() -> None:
    script = (REPO_ROOT / "scripts/prepare-stellarium-reference.sh").read_text(encoding="utf-8")

    assert "--retry 3" in script
    assert "--retry-delay 2" in script
    assert "--connect-timeout 10" in script
    assert "--max-time 120" in script


def test_stellarium_build_does_not_refresh_satellite_data() -> None:
    script = (REPO_ROOT / "scripts/build-stellarium-safe.sh").read_text(encoding="utf-8")

    assert "STELLARIUM_SKIP_TLE_REFRESH=1" in script


def test_production_runbook_uses_existing_commands() -> None:
    runbook = (REPO_ROOT / "docs/restart/ORAS_PROD_RELEASE_WORKFLOW_2026-06-02.md").read_text(encoding="utf-8")

    assert "rebuild-oras-frontend-prod.sh" not in runbook
    assert "docker compose -f docker-compose.prod.yml build frontend" in runbook
