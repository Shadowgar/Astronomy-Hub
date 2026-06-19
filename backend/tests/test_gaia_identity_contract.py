from __future__ import annotations

from pathlib import Path

from sqlalchemy import create_engine

from backend.app.db.models import Base, CatalogSource, DataHealthCheck, GaiaDr2Source, ImportJob
from backend.app.services.sky_catalog_service import lookup_gaia_dr2_source
from scripts.skydata.import_gaia_dr2_sample import import_gaia_dr2_sample


PROOF_SOURCE_ID = 2252802052894084352


def test_gaia_source_id_serializes_as_string_for_indexed_and_missing_payloads(tmp_path: Path) -> None:
    database_url = _setup_gaia_database(tmp_path)
    sample_path = tmp_path / "gaia_sample.csv"
    sample_path.write_text(
        "source_id,ra,dec,phot_g_mean_mag\n"
        f"{PROOF_SOURCE_ID},79.17232794,45.99799147,0.08\n",
        encoding="utf-8",
    )

    missing = lookup_gaia_dr2_source(PROOF_SOURCE_ID, database_url=database_url)
    assert missing["source_id"] == str(PROOF_SOURCE_ID)
    assert missing["indexed"] is False

    import_gaia_dr2_sample(
        sample_path,
        database_url=database_url,
        source_key="gaia-proof-sample",
        display_name="Gaia proof sample",
        source_url="file://gaia-sample.csv",
        license_note="test fixture",
    )

    indexed = lookup_gaia_dr2_source(PROOF_SOURCE_ID, database_url=database_url)
    assert indexed["source_id"] == str(PROOF_SOURCE_ID)
    assert indexed["indexed"] is True
    assert indexed["ra"] == 79.17232794
    assert indexed["dec"] == 45.99799147


def _setup_gaia_database(tmp_path: Path) -> str:
    database_url = f"sqlite:///{tmp_path / 'gaia_catalog.sqlite3'}"
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
