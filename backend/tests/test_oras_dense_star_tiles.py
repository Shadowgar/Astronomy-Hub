from __future__ import annotations

import importlib.util
import json
import math
import os
import stat
from pathlib import Path

import pytest


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
    extra_chunk_dir = root / "packs/stars-extra"
    extra_chunk_dir.mkdir(parents=True)
    records = [
        {
            "catalog": "Gaia DR3",
            "source_id": "1000786929690996352",
            "model": "star",
            "category": "stars",
            "display_name": "Gaia DR3 1000786929690996352",
            "ra": 104.3047389065407,
            "dec": 57.5632863118362,
            "magnitude": 4.761836,
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
    extra_record = {
        "catalog": "Future Stars",
        "source_id": "future-should-not-load",
        "model": "star",
        "category": "stars",
        "display_name": "Future unrelated star",
        "ra": 12.0,
        "dec": 12.0,
        "magnitude": 4.0,
    }
    extra_text = json.dumps(extra_record, separators=(",", ":")) + "\n"
    (extra_chunk_dir / "chunk-00000.jsonl").write_text(extra_text, encoding="utf-8")
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
        "extra_packs": [
            {
                "pack_id": "stars-extra",
                "category": "stars",
                "object_count": 1,
                "chunks": [
                    {
                        "path": "packs/stars-extra/chunk-00000.jsonl",
                        "object_count": 1,
                        "byte_size": len(extra_text.encode("utf-8")),
                        "sha256": "test-not-used-by-builder",
                    }
                ],
            }
        ],
    }
    manifest["packs"].extend(manifest.pop("extra_packs"))
    (root / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")


def test_dense_star_builder_reconciles_authoritative_cross_ids_without_position_merging() -> None:
    builder = _load_module(BUILDER_PATH, "build_oras_dense_star_tiles_canonical")
    records = [
        {
            "catalog": "Hipparcos Tier 2 (local)",
            "source_id": "hip-65378",
            "hip_id": "65378",
            "model": "star",
            "display_name": "Mizar A",
            "ra": 200.981429,
            "dec": 54.925362,
            "johnson_v_mag": 2.23,
            "johnson_bv": 0.057,
            "coordinate_epoch": 2000.0,
            "aliases": ["HIP 65378", "Mizar A"],
        },
        {
            "catalog": "Tycho-2",
            "source_id": "3850-257-1",
            "tycho2_id": "3850-257-1",
            "hip_id": "65378",
            "model": "star",
            "display_name": "TYC 3850-257-1",
            "ra": 200.98151,
            "dec": 54.92541,
            "tycho_bt_mag": 2.30,
            "tycho_vt_mag": 2.24,
            "coordinate_epoch": 2000.0,
            "aliases": ["HIP 65378", "TYC 3850-257-1"],
        },
        {
            "catalog": "Gaia DR3",
            "source_id": "1561616035378447232",
            "hip_id": "65378",
            "tycho2_id": "3850-257-1",
            "model": "star",
            "display_name": "Gaia DR3 1561616035378447232",
            "ra": 200.981425,
            "dec": 54.925358,
            "gaia_g_mag": 2.282647,
            "gaia_bp_rp": 0.534339,
            "coordinate_epoch": 2000.0,
            "aliases": ["HIP 65378", "TYC 3850-257-1"],
        },
        {
            "catalog": "Gaia DR3",
            "source_id": "1561616035378447360",
            "model": "star",
            "display_name": "Mizar B",
            "ra": 200.983741,
            "dec": 54.921829,
            "gaia_g_mag": 3.88,
            "gaia_bp_rp": 0.42,
            "coordinate_epoch": 2000.0,
        },
        {
            "catalog": "Gliese CNS3",
            "source_id": "NN 3783",
            "model": "star",
            "display_name": "NN 3783",
            "ra": 200.9822,
            "dec": 54.9258,
            "johnson_v_mag": 2.25,
            "johnson_bv": 0.02,
            "coordinate_epoch": 2000.0,
        },
    ]

    canonical, stats = builder.reconcile_star_records(records)

    assert len(canonical) == 2
    assert stats["source_records"] == 5
    assert stats["canonical_records"] == 2
    assert stats["merged_records"] == 2
    assert stats["skipped_unmatched_supplemental"] == 1
    mizar_a = next(record for record in canonical if record["hip_id"] == "65378")
    mizar_b = next(record for record in canonical if record["source_id"] == "1561616035378447360")
    assert mizar_a["gaia_id"] == "1561616035378447232"
    assert mizar_a["tycho2_id"] == "3850-257-1"
    assert mizar_a["render_vmag"] == 2.23
    assert mizar_a["render_bv"] == 0.057
    assert mizar_a["photometry_source"] == "johnson"
    assert {"HIP 65378", "TYC 3850-257-1", "Gaia DR3 1561616035378447232"} <= set(mizar_a["aliases"])
    assert mizar_b["source_id"] == "1561616035378447360"


def test_dense_star_builder_uses_source_backed_photometric_transformations() -> None:
    builder = _load_module(BUILDER_PATH, "build_oras_dense_star_tiles_photometry")
    gaia_record = {
        "catalog": "Gaia DR3",
        "source_id": "5853498713190525696",
        "model": "star",
        "display_name": "Gaia DR3 5853498713190525696",
        "ra": 217.392,
        "dec": -62.676,
        "gaia_g_mag": 7.10,
        "gaia_bp_rp": 0.82,
        "coordinate_epoch": 2000.0,
    }
    tycho_record = {
        "catalog": "Tycho-2",
        "source_id": "9012-1234-1",
        "tycho2_id": "9012-1234-1",
        "model": "star",
        "display_name": "TYC 9012-1234-1",
        "ra": 120.0,
        "dec": 12.0,
        "tycho_bt_mag": 7.75,
        "tycho_vt_mag": 7.20,
        "coordinate_epoch": 2000.0,
    }
    invalid_gaia_color = {
        **gaia_record,
        "source_id": "5853498713190525700",
        "ra": 218.0,
        "gaia_bp_rp": 9.0,
    }

    canonical, _ = builder.reconcile_star_records([gaia_record, tycho_record, invalid_gaia_color])
    by_id = {record["source_id"]: record for record in canonical}

    gaia = by_id["5853498713190525696"]
    assert gaia["render_gmag"] == 7.1
    assert gaia["render_vmag"] != gaia["render_gmag"]
    assert gaia["render_bv"] != gaia_record["gaia_bp_rp"]
    assert gaia["photometry_source"] == "gaia_edr3_transformed"
    assert math.isfinite(gaia["render_bv"])

    tycho = by_id["9012-1234-1"]
    assert tycho["render_vmag"] == 7.20 - 0.09 * (7.75 - 7.20)
    assert tycho["render_bv"] == 0.85 * (7.75 - 7.20)
    assert tycho["photometry_source"] == "tycho_transformed"

    invalid = by_id["5853498713190525700"]
    assert invalid["render_vmag"] == invalid["render_gmag"]
    assert math.isnan(invalid["render_bv"])
    assert invalid["photometry_source"] == "gaia_g_only"


def test_dense_star_builder_parses_bare_numeric_hip_identifier() -> None:
    builder = _load_module(BUILDER_PATH, "build_oras_dense_star_tiles_hip_identifier")

    assert builder.parse_hip_number({"hip_id": "32349", "source_id": "catalog-row-1"}) == 32349


def test_dense_star_builder_preserves_zero_gaia_magnitude() -> None:
    builder = _load_module(BUILDER_PATH, "build_oras_dense_star_tiles_edge_photometry")
    records = [
        {
            "catalog": "Hipparcos",
            "source_id": "hip-32349",
            "hip_id": "32349",
            "johnson_v_mag": -1.44,
            "johnson_bv": 0.01,
        },
        {
            "catalog": "Gaia DR3",
            "source_id": "2947050466531873024",
            "gaia_g_mag": 0.0,
        },
    ]

    photometry = builder._resolve_photometry(records)
    assert photometry is not None
    assert photometry["render_gmag"] == 0.0


def test_dense_star_builder_preserves_blue_gaia_color_solution() -> None:
    builder = _load_module(BUILDER_PATH, "build_oras_dense_star_tiles_blue_photometry")

    blue_bv = builder._gaia_bp_rp_to_johnson_bv(-0.3)

    assert blue_bv is not None
    assert -0.4 <= blue_bv < 0.0


def test_normalized_canonical_star_keeps_native_identity_when_labels_are_suppressed() -> None:
    builder = _load_module(BUILDER_PATH, "build_oras_dense_star_tiles_identity")
    record = {
        "catalog": "Gaia DR3",
        "source_id": "1561616035378447232",
        "gaia_id": "1561616035378447232",
        "hip_id": "65378",
        "tycho2_id": "3850-257-1",
        "model": "star",
        "display_name": "Mizar A",
        "aliases": ["HIP 65378", "TYC 3850-257-1"],
        "ra": 200.981425,
        "dec": 54.925358,
        "coordinate_epoch": 2000.0,
        "render_vmag": 2.23,
        "render_gmag": 2.282647,
        "render_bv": 0.057,
        "photometry_source": "johnson",
    }

    star, reason = builder.normalize_star_record(
        record,
        magnitude_limit=4.8,
        minimum_magnitude=None,
        include_labels=False,
    )

    assert reason is None
    assert star
    assert star["gaia"] == 1561616035378447232
    assert star["hip"] == 65378
    assert "HIP 65378" in star["ids"]
    assert "TYC 3850-257-1" in star["ids"]


def test_dense_star_tile_builder_writes_native_eph_release(tmp_path: Path) -> None:
    builder = _load_module(BUILDER_PATH, "build_oras_dense_star_tiles")
    validator = _load_module(VALIDATOR_PATH, "validate_oras_dense_star_tiles")
    source_root = tmp_path / "catalog-packs"
    output_root = tmp_path / "dense-star-tiles"
    _write_catalog_pack_release(source_root)

    report = builder.build_dense_star_tiles(
        source_root=source_root,
        output_root=output_root,
        tile_order=1,
        release_version="test.1",
    )

    assert report["source_count"] == 4
    assert report["star_count"] == 2
    assert report["profiles"]["deep-catalog"]["skipped_count"] == 2
    assert report["tile_count"] >= 1
    assert (output_root / "manifest.json").is_file()
    assert (output_root / "profiles/deep-catalog/properties").is_file()
    deep_tiles = list((output_root / "profiles/deep-catalog").glob("Norder1/Dir0/Npix*.eph"))
    assert deep_tiles
    tile_bytes = deep_tiles[0].read_bytes()
    assert b"gaiaQ" in tile_bytes
    assert b"vmagf" in tile_bytes
    assert b"gmagf" in tile_bytes
    assert b"\0mag" not in tile_bytes

    manifest = json.loads((output_root / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["schema_version"] == 1
    assert manifest["rendering_path"] == "native_swe_star_tiles"
    assert manifest["star_count"] == 2
    assert manifest["magnitude_limit"] == 13.0
    assert manifest["source_catalogs"]["Gaia DR3"] == 1
    assert manifest["source_catalogs"]["Tycho-2"] == 1
    assert "source_root" not in manifest
    assert manifest["source_id_type"] == "string"
    assert manifest["catalog_mode"] == "canonical_replacement"
    assert manifest["native_continuation"] == {
        "key": "gaia",
        "source": "bundled-gaia",
    }
    assert manifest["default_profile"] == "visual-default"
    assert manifest["profiles"]["visual-default"]["star_count"] == 1
    assert manifest["profiles"]["deep-catalog"]["star_count"] == 2
    assert manifest["profiles"]["deep-catalog"]["catalog_mode"] == "canonical_replacement"
    assert manifest["profiles"]["deep-catalog"]["identity_reconciliation"] == {
        "canonical_records": 4,
        "merged_records": 0,
        "skipped_missing_photometry": 0,
        "skipped_unmatched_supplemental": 0,
        "source_records": 4,
    }
    assert manifest["profiles"]["deep-catalog"]["photometry_sources"] == {
        "catalog_magnitude_only": 4,
    }

    validation = validator.validate_dense_star_tiles(output_root)
    assert validation["star_count"] == 2
    assert validation["tile_count"] == report["tile_count"]
    assert validation["catalog_mode"] == "canonical_replacement"
    assert validation["native_continuation"]["key"] == "gaia"


def test_dense_star_builder_restores_source_backed_bright_hipparcos_tail(tmp_path: Path) -> None:
    builder = _load_module(BUILDER_PATH, "build_oras_dense_star_tiles_bright_tail")
    source_root = tmp_path / "catalog-packs"
    output_root = tmp_path / "dense-star-tiles"
    bright_source = tmp_path / "hipparcos_bright.tsv"
    _write_catalog_pack_release(source_root)
    bright_source.write_text(
        "# VizieR fixture\n"
        "_RAJ2000\t_DEJ2000\tHIP\tVmag\tB-V\tPlx\tpmRA\tpmDE\tSpType\n"
        "deg\tdeg\t\tmag\tmag\tmas\tmas/yr\tmas/yr\t\n"
        "----------\t----------\t---\t----\t---\t---\t----\t----\t------\n"
        "101.287155\t-16.716116\t32349\t-1.46\t0.001\t379.21\t-546.01\t-1223.07\tA1V\n",
        encoding="utf-8",
    )

    report = builder.build_dense_star_tiles(
        source_root=source_root,
        output_root=output_root,
        tile_order=1,
        release_version="test.bright",
        bright_star_source=bright_source,
    )

    visual = report["profiles"]["visual-default"]
    assert report["source_count"] == 5
    assert visual["min_magnitude"] == -1.46
    assert visual["identity_reconciliation"]["source_records"] == 5
    assert visual["source_catalogs"]["Hipparcos (CDS)"] == 1


def test_dense_star_builder_rejects_missing_configured_bright_source(tmp_path: Path) -> None:
    builder = _load_module(BUILDER_PATH, "build_oras_dense_star_tiles_missing_bright")
    source_root = tmp_path / "catalog-packs"
    output_root = tmp_path / "dense-star-tiles"
    missing_source = tmp_path / "missing-hipparcos-bright.tsv"
    _write_catalog_pack_release(source_root)

    with pytest.raises(FileNotFoundError, match="bright star source not found"):
        builder.build_dense_star_tiles(
            source_root=source_root,
            output_root=output_root,
            tile_order=1,
            release_version="test.missing-bright",
            bright_star_source=missing_source,
        )

    assert not output_root.exists()


def test_dense_star_builder_writes_visibility_profiles(tmp_path: Path) -> None:
    builder = _load_module(BUILDER_PATH, "build_oras_dense_star_tiles")
    validator = _load_module(VALIDATOR_PATH, "validate_oras_dense_star_tiles")
    source_root = tmp_path / "catalog-packs"
    output_root = tmp_path / "dense-star-tiles"
    _write_catalog_pack_release(source_root)

    report = builder.build_dense_star_tiles(
        source_root=source_root,
        output_root=output_root,
        tile_order=1,
        release_version="test.profiles",
    )

    assert report["default_profile"] == "visual-default"
    assert set(report["profiles"]) == {"visual-default", "binocular", "deep-catalog"}
    assert report["profiles"]["visual-default"]["magnitude_limit"] <= 4.8
    assert report["profiles"]["binocular"]["magnitude_limit"] == 8.5
    assert report["profiles"]["deep-catalog"]["magnitude_limit"] == 13.0
    assert report["profiles"]["visual-default"]["star_count"] < report["profiles"]["deep-catalog"]["star_count"]

    manifest = json.loads((output_root / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["default_profile"] == "visual-default"
    assert manifest["profiles"]["visual-default"]["path"] == "profiles/visual-default"
    assert manifest["profiles"]["visual-default"]["label_mode"] == "suppressed"
    assert manifest["profiles"]["visual-default"]["profile_intent"] == "default"
    assert manifest["profiles"]["deep-catalog"]["profile_intent"] == "opt-in"
    assert (output_root / "profiles/visual-default/properties").is_file()
    assert (output_root / "profiles/binocular/properties").is_file()
    assert (output_root / "profiles/deep-catalog/properties").is_file()
    assert stat.S_IMODE(output_root.stat().st_mode) & 0o005 == 0o005
    assert stat.S_IMODE((output_root / "profiles/visual-default").stat().st_mode) & 0o005 == 0o005
    assert stat.S_IMODE((output_root / "manifest.json").stat().st_mode) & 0o004 == 0o004
    assert "source_root" not in manifest

    validation = validator.validate_dense_star_tiles(output_root)
    assert validation["default_profile"] == "visual-default"
    assert validation["profiles"]["visual-default"]["star_count"] == 1
    assert validation["profiles"]["deep-catalog"]["star_count"] == 2


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


def test_dense_star_builder_rejects_empty_releases(tmp_path: Path) -> None:
    builder = _load_module(BUILDER_PATH, "build_oras_dense_star_tiles")
    source_root = tmp_path / "catalog-packs"
    output_root = tmp_path / "dense-star-tiles"
    _write_catalog_pack_release(source_root)
    original_profiles = builder.DENSE_STAR_PROFILES
    builder.DENSE_STAR_PROFILES = [
        {
            "profile_id": "empty",
            "label": "Empty",
            "magnitude_limit": -10.0,
            "profile_intent": "test",
            "label_mode": "suppressed",
        }
    ]

    try:
        builder.build_dense_star_tiles(
            source_root=source_root,
            output_root=output_root,
            tile_order=1,
            release_version="test.empty",
        )
    except ValueError as exc:
        assert "produced no stars" in str(exc)
    else:
        raise AssertionError("empty dense star release was not rejected")
    finally:
        builder.DENSE_STAR_PROFILES = original_profiles

    assert not output_root.exists()


def test_dense_star_installer_uses_manifest_driven_copy_and_rollback() -> None:
    installer = (REPO_ROOT / "scripts/skydata/install_oras_dense_star_tiles.sh").read_text(encoding="utf-8")

    assert "profile_manifest.get(\"tile_entries\", [])" in installer
    assert "shutil.copy2(source / \"manifest.json\", staging / \"manifest.json\")" in installer
    assert "trap rollback ERR" in installer
    assert "mv \"$previous_dir\" \"$target_dir\"" in installer
    assert "find . -type f" not in installer
