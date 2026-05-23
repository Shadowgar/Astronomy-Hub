from __future__ import annotations

import json
from pathlib import Path

import pytest
from sqlalchemy import create_engine

from backend.app.db.models import Base, CatalogSource, DataHealthCheck, GaiaDr2Source, ImportJob
from scripts.skydata.build_capella_star_tile_proof import build_capella_star_tile_proof
from scripts.skydata.common import RuntimeProtectionError
from scripts.skydata.import_gaia_dr2_sample import import_gaia_dr2_sample
from scripts.skydata.inspect_star_tiles import inspect_star_tiles


CAPELLA_SAMPLE_ROWS = [
    {
        "source_id": 211830059081750912,
        "ra": 79.453040955059,
        "dec": 46.128056184134806,
        "phot_g_mean_mag": 6.7439685,
        "bp_rp": 1.6090889,
        "parallax": 1.209696060409849,
        "pmra": 1.6115235208660101,
        "pmdec": -5.258662863605085,
    },
    {
        "source_id": 211805079552264832,
        "ra": 79.11282501139576,
        "dec": 46.416054042611535,
        "phot_g_mean_mag": 6.780578,
        "bp_rp": 0.37873316,
        "parallax": 1.388628722286814,
        "pmra": -2.955296380012802,
        "pmdec": -1.2872072849237268,
    },
]


def test_inspect_star_tiles_reads_properties_and_counts_norder_levels() -> None:
    report = inspect_star_tiles(sample_limit=1)

    assert report["properties"]["hips_tile_format"] == "eph"
    assert report["norder_count"] >= 2
    assert report["total_tile_count"] > 0
    assert report["orders"][0]["sample_tiles"][0]["magic"] == "EPHE"


def test_build_capella_star_tile_proof_refuses_live_runtime_output(tmp_path: Path) -> None:
    with pytest.raises(RuntimeProtectionError):
        build_capella_star_tile_proof(
            output_root=Path("frontend/public/oras-sky-engine/skydata/stars"),
            source_key="unused-because-path-check-runs-first",
            database_url=f"sqlite:///{tmp_path / 'unused.sqlite3'}",
        )


def test_build_capella_star_tile_proof_writes_normalized_rows_and_manifest(tmp_path: Path, monkeypatch) -> None:
    database_url = _setup_database(tmp_path, monkeypatch)
    sample_path = tmp_path / "capella_region_sample.csv"
    _write_gaia_sample_csv(sample_path, CAPELLA_SAMPLE_ROWS)
    import_gaia_dr2_sample(
        sample_path,
        database_url=database_url,
        source_key="gaia-dr2-capella-region-proof",
        display_name="Gaia DR2 Capella region proof",
        license_note="test fixture",
    )

    output_root = tmp_path / "processed" / "gaia_tiles" / "capella-proof"
    result = build_capella_star_tile_proof(
        database_url=database_url,
        source_key="gaia-dr2-capella-region-proof",
        output_root=output_root,
    )

    normalized_rows_path = Path(result["normalized_rows_path"])
    manifest_path = Path(result["manifest_path"])

    assert normalized_rows_path.exists()
    assert manifest_path.exists()
    assert result["row_count"] == 2
    assert result["runtime_compatible_eph_emitted"] is False

    normalized_rows = [json.loads(line) for line in normalized_rows_path.read_text(encoding="utf-8").splitlines()]
    assert len(normalized_rows) == 2
    assert normalized_rows[0]["source_key"] == "gaia-dr2-capella-region-proof"
    assert normalized_rows[0]["catalog"] == "Gaia DR2"

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    assert manifest["source_key"] == "gaia-dr2-capella-region-proof"
    assert manifest["row_count"] == 2
    assert manifest["runtime_compatible_eph_emitted"] is False
    assert manifest["writer_strategy"] == "C"
    assert manifest["writer_discovery"]["writer_found"] is False
    assert manifest["writer_discovery"]["strategy"] == "C"
    assert manifest["writer_discovery"]["evidence"][0]["path"] == "vendor/stellarium-web-engine/src/eph-file.c"
    assert manifest["artifacts"][0]["path"] == str(normalized_rows_path)
    assert manifest["artifacts"][1]["path"] == str(manifest_path)


def _write_gaia_sample_csv(path: Path, rows: list[dict[str, float | int]]) -> None:
    header = "source_id,ra,dec,phot_g_mean_mag,bp_rp,parallax,pmra,pmdec\n"
    lines = [header]
    for row in rows:
        lines.append(
            f"{row['source_id']},{row['ra']},{row['dec']},{row['phot_g_mean_mag']},{row['bp_rp']},{row['parallax']},{row['pmra']},{row['pmdec']}\n"
        )
    path.write_text("".join(lines), encoding="utf-8")


def _setup_database(tmp_path: Path, monkeypatch) -> str:
    database_path = tmp_path / "gaia_catalog.sqlite3"
    database_url = f"sqlite:///{database_path}"
    monkeypatch.setenv("DATABASE_URL", database_url)
    engine = create_engine(database_url, future=True)
    Base.metadata.create_all(
        engine,
        tables=[
            CatalogSource.__table__,
            GaiaDr2Source.__table__,
            ImportJob.__table__,
            DataHealthCheck.__table__,
        ],
    )
    return database_url