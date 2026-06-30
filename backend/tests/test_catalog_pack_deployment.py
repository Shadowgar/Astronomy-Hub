from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

from backend.app.services.catalog_pack_service import build_catalog_pack_status_payload
from scripts.skydata.catalog_pack import CatalogPackSpec, build_catalog_release


REPO_ROOT = Path(__file__).resolve().parents[2]


def _source() -> dict:
    return {
        "name": "Deployment Test Catalog",
        "source_key": "deployment_test",
        "source_url": "https://example.test/deployment",
        "license_note": "Test fixture terms",
        "version": "2026.06",
    }


def _record(source_id: str) -> dict:
    return {
        "catalog": "Deployment Test",
        "source_id": source_id,
        "model": "star",
        "display_name": f"Deployment Test {source_id}",
        "category": "stars",
        "ra": 15.0,
        "dec": -5.0,
        "aliases": [f"Deploy {source_id}"],
        "source_attribution": [_source()],
    }


def _build_fixture_release(root: Path) -> None:
    build_catalog_release(
        root,
        release_version="2026.06.deploy-test",
        generated_at="2026-06-30T12:00:00Z",
        chunk_size=1,
        packs=[
            (
                CatalogPackSpec(
                    pack_id="stars-core",
                    label="Deployment Stars Core",
                    category="stars",
                    version="2026.06",
                    sources=(_source(),),
                    overlay_limit=0,
                ),
                [_record("deploy-1"), _record("deploy-2")],
            )
        ],
    )


def test_dev_and_production_compose_mount_catalog_packs_read_only() -> None:
    dev_compose = (REPO_ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    prod_compose = (REPO_ROOT / "docker-compose.prod.yml").read_text(encoding="utf-8")

    for compose in (dev_compose, prod_compose):
        assert "ORAS_CATALOG_PACKS_DIR: /runtime/oras-catalog-packs" in compose
        assert "${ORAS_CATALOG_PACKS_HOST_DIR:-./data/runtime-packs/catalog-packs}" in compose
        assert ":/runtime/oras-catalog-packs:ro" in compose
        assert "/oras-sky-engine/skydata/catalog-packs:ro" in compose


def test_docker_context_and_gitignore_keep_generated_packs_out_of_git_and_images() -> None:
    gitignore = (REPO_ROOT / ".gitignore").read_text(encoding="utf-8")
    dockerignore = (REPO_ROOT / ".dockerignore").read_text(encoding="utf-8")
    frontend_dockerignore = (REPO_ROOT / "frontend/.dockerignore").read_text(encoding="utf-8")

    assert "/data/runtime-packs/catalog-packs/" in gitignore
    assert "data/runtime-packs/catalog-packs" in dockerignore
    assert "public/oras-sky-engine/skydata/catalog-packs" in frontend_dockerignore


def test_catalog_pack_deployment_scripts_exist_and_expose_safe_commands() -> None:
    build_script = (REPO_ROOT / "scripts/skydata/build_oras_catalog_release.sh").read_text(encoding="utf-8")
    install_script = (REPO_ROOT / "scripts/skydata/install_oras_catalog_release.sh").read_text(encoding="utf-8")
    validate_script = (REPO_ROOT / "scripts/skydata/validate_oras_catalog_release.sh").read_text(encoding="utf-8")
    package = json.loads((REPO_ROOT / "package.json").read_text(encoding="utf-8"))

    assert "acquire_oras_catalog_sources" in build_script
    assert "build_oras_catalog_release" in build_script
    assert "validate_oras_catalog_release.sh" in build_script
    assert "manifest.json" in install_script
    assert "catalog-pack-install" in install_script
    assert "--validate-only" in install_script
    assert "find" in install_script and "cp -a" in install_script
    assert "chmod -R a+rX" in install_script
    assert "build_oras_catalog_release" in validate_script
    assert package["scripts"]["catalog:build"] == "bash scripts/skydata/build_oras_catalog_release.sh"
    assert package["scripts"]["catalog:install"] == "bash scripts/skydata/install_oras_catalog_release.sh"
    assert package["scripts"]["catalog:validate"] == "bash scripts/skydata/validate_oras_catalog_release.sh"


def test_install_script_validates_and_installs_manifest_last(tmp_path: Path) -> None:
    source = tmp_path / "source"
    target = tmp_path / "mounted"
    _build_fixture_release(source)

    result = subprocess.run(
        [
            "bash",
            str(REPO_ROOT / "scripts/skydata/install_oras_catalog_release.sh"),
            str(source),
            str(target),
        ],
        cwd=REPO_ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )

    assert result.returncode == 0, result.stdout
    assert "Installed ORAS catalog release" in result.stdout
    assert (target / "manifest.json").is_file()
    installed = json.loads((target / "manifest.json").read_text(encoding="utf-8"))
    assert installed["object_count"] == 2
    assert build_catalog_pack_status_payload(target)["data"]["object_count"] == 2


def test_validate_script_reports_missing_release_without_creating_data(tmp_path: Path) -> None:
    missing = tmp_path / "missing"
    env = os.environ.copy()
    env["ORAS_CATALOG_PACKS_DIR"] = str(missing)
    result = subprocess.run(
        ["bash", str(REPO_ROOT / "scripts/skydata/validate_oras_catalog_release.sh"), str(missing)],
        cwd=REPO_ROOT,
        env=env,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        check=False,
    )

    assert result.returncode != 0
    assert "manifest.json is missing" in result.stdout
    assert not missing.exists()


def test_release_artifact_manifest_template_documents_required_fields() -> None:
    template = json.loads(
        (REPO_ROOT / "docs/runtime/oras-catalog-release-manifest.example.json").read_text(
            encoding="utf-8"
        )
    )

    for field in (
        "release_version",
        "generated_at",
        "object_count",
        "packs",
        "source_catalogs",
        "source_acquisition_profiles",
        "attribution",
        "build",
        "runtime_compatibility",
    ):
        assert field in template
    assert template["packs"][0]["files"][0]["sha256"].startswith("sha256:")
