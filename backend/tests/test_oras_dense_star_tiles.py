from __future__ import annotations

import importlib.util
import json
import os
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
BUILDER_PATH = REPO_ROOT / "scripts/skydata/build_oras_dense_star_tiles.py"
VALIDATOR_PATH = REPO_ROOT / "scripts/skydata/validate_oras_dense_star_tiles.py"


def _load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _write_catalog_pack_release(root: Path) -> None:
    chunk_dir = root / "packs/stars-core"
    chunk_dir.mkdir(parents=True)
    records = [
        {
            "catalog": "Gaia DR3",
            "source_id": "1000786929690996352",
            "model": "star",
            "category": "stars",
            "display_name": "Gaia DR3 1000786929690996352",
            "ra": 104.3047389065407,
            "dec": 57.5632863118362,
            "magnitude": 5.461836,
            "color_index": 1.688078,
            "parallax": 3.1727,
            "proper_motion_ra": 11.681,
            "proper_motion_dec": 16.09,
            "radial_velocity_km_s": -55.2,
            "source_attribution": [{"name": "ESA Gaia DR3 via CDS I/355", "source_key": "gaia_dr3"}],
        },
        {
            "catalog": "Tycho-2",
            "source_id": "TYC 1-2-3",
            "model": "star",
            "category": "stars",
            "display_name": "TYC 1-2-3",
            "ra": 11.0,
            "dec": -2.5,
            "magnitude": 8.25,
            "color_index": 0.4,
            "source_attribution": [{"name": "Tycho-2 via CDS I/259", "source_key": "tycho2"}],
        },
        {
            "catalog": "Gaia DR3",
            "source_id": "bad-coordinates",
            "model": "star",
            "category": "stars",
            "display_name": "Bad coordinates",
            "ra": 999.0,
            "dec": 0.0,
            "magnitude": 9.0,
            "source_attribution": [{"name": "ESA Gaia DR3 via CDS I/355", "source_key": "gaia_dr3"}],
        },
        {
            "catalog": "Gaia DR3",
            "source_id": "too-faint",
            "model": "star",
            "category": "stars",
            "display_name": "Too faint",
            "ra": 12.0,
            "dec": 1.0,
            "magnitude": 15.0,
            "source_attribution": [{"name": "ESA Gaia DR3 via CDS I/355", "source_key": "gaia_dr3"}],
        },
    ]
    chunk_path = chunk_dir / "chunk-00000.jsonl"
    text = "".join(json.dumps(record, separators=(",", ":")) + "\n" for record in records)
    chunk_path.write_text(text, encoding="utf-8")
    manifest = {
        "schema_version": 1,
        "release_version": "test",
        "generated_at": "2026-06-30T00:00:00Z",
        "object_count": len(records),
        "packs": [
            {
                "pack_id": "stars-core",
                "category": "stars",
                "object_count": len(records),
                "sources": [{"name": "Test source", "source_key": "test"}],
                "chunks": [
                    {
                        "path": "packs/stars-core/chunk-00000.jsonl",
                        "object_count": len(records),
                        "byte_size": len(text.encode("utf-8")),
                        "sha256": "test-not-used-by-builder",
                    }
                ],
            }
        ],
    }
    (root / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")


def test_dense_star_tile_builder_writes_native_eph_release(tmp_path: Path) -> None:
    builder = _load_module(BUILDER_PATH, "build_oras_dense_star_tiles")
    validator = _load_module(VALIDATOR_PATH, "validate_oras_dense_star_tiles")
    source_root = tmp_path / "catalog-packs"
    output_root = tmp_path / "dense-star-tiles"
    _write_catalog_pack_release(source_root)

    report = builder.build_dense_star_tiles(
        source_root=source_root,
        output_root=output_root,
        magnitude_limit=9.0,
        tile_order=1,
        release_version="test.1",
    )

    assert report["source_count"] == 4
    assert report["star_count"] == 2
    assert report["skipped_count"] == 2
    assert report["tile_count"] >= 1
    assert (output_root / "manifest.json").is_file()
    assert (output_root / "properties").is_file()
    assert list(output_root.glob("Norder1/Dir0/Npix*.eph"))

    manifest = json.loads((output_root / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["schema_version"] == 1
    assert manifest["rendering_path"] == "native_swe_star_tiles"
    assert manifest["star_count"] == 2
    assert manifest["magnitude_limit"] == 9.0
    assert manifest["source_catalogs"]["Gaia DR3"] == 1
    assert manifest["source_catalogs"]["Tycho-2"] == 1
    assert manifest["source_id_type"] == "string"

    validation = validator.validate_dense_star_tiles(output_root)
    assert validation["star_count"] == 2
    assert validation["tile_count"] == report["tile_count"]


def test_dense_star_runtime_data_is_ignored_and_not_baked() -> None:
    gitignore = (REPO_ROOT / ".gitignore").read_text(encoding="utf-8")
    dockerignore = (REPO_ROOT / ".dockerignore").read_text(encoding="utf-8")
    frontend_dockerignore = (REPO_ROOT / "frontend/.dockerignore").read_text(encoding="utf-8")
    compose = (REPO_ROOT / "docker-compose.yml").read_text(encoding="utf-8")
    prod_compose = (REPO_ROOT / "docker-compose.prod.yml").read_text(encoding="utf-8")

    assert "/data/runtime-packs/dense-star-tiles/" in gitignore
    assert "data/runtime-packs/dense-star-tiles" in dockerignore
    assert "public/oras-sky-engine/skydata/dense-star-tiles" in frontend_dockerignore
    assert "ORAS_DENSE_STAR_TILES_HOST_DIR" in compose
    assert ":/app/public/oras-sky-engine/skydata/dense-star-tiles:ro" in compose
    assert ":/usr/share/nginx/html/oras-sky-engine/skydata/dense-star-tiles:ro" in prod_compose


def test_dense_star_package_commands_exist() -> None:
    package_json = json.loads((REPO_ROOT / "package.json").read_text(encoding="utf-8"))
    scripts = package_json["scripts"]

    assert scripts["dense-stars:build"] == ".venv/bin/python scripts/skydata/build_oras_dense_star_tiles.py"
    assert scripts["dense-stars:validate"] == ".venv/bin/python scripts/skydata/validate_oras_dense_star_tiles.py"
    assert scripts["dense-stars:install"] == "bash scripts/skydata/install_oras_dense_star_tiles.sh"
    assert scripts["validate:oras-dense-stars"] == "node scripts/skydata/validate_oras_dense_stars.js"


def test_generated_dense_star_release_is_not_staged() -> None:
    assert os.system("git check-ignore -q data/runtime-packs/dense-star-tiles/manifest.json") == 0
