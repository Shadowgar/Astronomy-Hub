from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine

from backend.app.db.models import Base, CatalogSource, DataHealthCheck, GaiaDr2Source, ImportJob
from backend.app.db.session import session_scope
from backend.app.main import app
from backend.app.services.sky_catalog_service import parse_gaia_dr2_query
from scripts.skydata.import_gaia_dr2_sample import import_gaia_dr2_sample


client = TestClient(app)
PROOF_SOURCE_ID = 2252802052894084352
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
    {
        "source_id": 211785975537756800,
        "ra": 79.13256768314334,
        "dec": 46.14071649899965,
        "phot_g_mean_mag": 7.9662633,
        "bp_rp": 0.4654603,
        "parallax": 9.466858509695495,
        "pmra": 7.273185084330786,
        "pmdec": -55.337341318715424,
    },
]


def test_gaia_dr2_query_parser_recognizes_supported_formats() -> None:
    assert parse_gaia_dr2_query(f"Gaia DR2 {PROOF_SOURCE_ID}") == PROOF_SOURCE_ID
    assert parse_gaia_dr2_query(f"GaiaDR2 {PROOF_SOURCE_ID}") == PROOF_SOURCE_ID
    assert parse_gaia_dr2_query(f"gaia dr2 {PROOF_SOURCE_ID}") == PROOF_SOURCE_ID
    assert parse_gaia_dr2_query("Capella") is None


def test_catalog_status_returns_missing_when_gaia_rows_absent(tmp_path: Path, monkeypatch) -> None:
    database_url = _setup_database(tmp_path, monkeypatch)

    response = client.get("/api/sky/catalog/status", headers={"User-Agent": "pytest"})

    assert database_url
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["data"]["gaia_dr2"]["status"] == "missing"
    assert body["data"]["gaia_dr2"]["row_count"] == 0


def test_gaia_object_endpoint_returns_not_indexed_when_absent(tmp_path: Path, monkeypatch) -> None:
    _setup_database(tmp_path, monkeypatch)

    response = client.get(f"/api/sky/object/gaia-dr2/{PROOF_SOURCE_ID}", headers={"User-Agent": "pytest"})

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["source_id"] == PROOF_SOURCE_ID
    assert body["data"]["indexed"] is False
    assert body["data"]["status"] == "not_indexed"


def test_seeded_sample_row_returns_normalized_gaia_object_json(tmp_path: Path, monkeypatch) -> None:
    database_url = _setup_database(tmp_path, monkeypatch)
    sample_path = tmp_path / "gaia_sample.csv"
    sample_path.write_text(
        "source_id,ra,dec,phot_g_mean_mag,bp_rp,parallax,pmra,pmdec\n"
        f"{PROOF_SOURCE_ID},79.17232794,45.99799147,0.08,0.8,76.2,75.1,-427.2\n",
        encoding="utf-8",
    )

    import_gaia_dr2_sample(
        sample_path,
        database_url=database_url,
        source_key="gaia-proof-sample",
        display_name="Gaia proof sample",
        source_url="file://gaia-sample.csv",
        license_note="test fixture",
    )

    response = client.get(f"/api/sky/object/gaia-dr2/{PROOF_SOURCE_ID}", headers={"User-Agent": "pytest"})

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["catalog"] == "Gaia DR2"
    assert body["data"]["display_name"] == f"Gaia DR2 {PROOF_SOURCE_ID}"
    assert body["data"]["indexed"] is True
    assert body["data"]["provenance"]["source_key"] == "gaia-proof-sample"
    assert body["data"]["ra"] == 79.17232794
    assert body["data"]["dec"] == 45.99799147


def test_catalog_status_returns_partial_when_gaia_rows_exist(tmp_path: Path, monkeypatch) -> None:
    database_url = _setup_database(tmp_path, monkeypatch)
    sample_path = tmp_path / "gaia_sample.csv"
    sample_path.write_text(
        "source_id,ra,dec,phot_g_mean_mag\n"
        f"{PROOF_SOURCE_ID},79.17232794,45.99799147,0.08\n",
        encoding="utf-8",
    )

    import_gaia_dr2_sample(
        sample_path,
        database_url=database_url,
        source_key="gaia-proof-sample",
        display_name="Gaia proof sample",
        license_note="test fixture",
    )

    response = client.get("/api/sky/catalog/status", headers={"User-Agent": "pytest"})

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["gaia_dr2"]["status"] == "partial"
    assert body["data"]["gaia_dr2"]["row_count"] == 1
    assert body["data"]["gaia_dr2"]["source_summary"]["source_key"] == "gaia-proof-sample"


def test_search_endpoint_routes_gaia_query_to_lookup(tmp_path: Path, monkeypatch) -> None:
    _setup_database(tmp_path, monkeypatch)

    response = client.get(
        f"/api/sky/search?q=Gaia%20DR2%20{PROOF_SOURCE_ID}",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["recognized_query"] is True
    assert len(body["data"]["results"]) == 1
    assert body["data"]["results"][0]["status"] == "not_indexed"


def test_importer_dry_run_validates_temporary_sample_csv(tmp_path: Path) -> None:
    sample_path = tmp_path / "gaia_sample.csv"
    sample_path.write_text(
        "source_id,ra,dec,phot_g_mean_mag\n"
        f"{PROOF_SOURCE_ID},79.17232794,45.99799147,0.08\n",
        encoding="utf-8",
    )

    result = import_gaia_dr2_sample(sample_path, dry_run=True)

    assert result["dry_run"] is True
    assert result["rows_seen"] == 1
    assert result["rows_imported"] == 0


def test_importer_refuses_missing_ra_dec(tmp_path: Path) -> None:
    sample_path = tmp_path / "bad_gaia_sample.csv"
    sample_path.write_text(
        "source_id,ra,dec\n"
        f"{PROOF_SOURCE_ID},,45.99799147\n",
        encoding="utf-8",
    )

    try:
        import_gaia_dr2_sample(sample_path, dry_run=True)
    except ValueError as exc:
        assert "missing ra" in str(exc)
    else:
        raise AssertionError("Expected missing ra validation error")


def test_importer_can_import_multiple_capella_style_rows(tmp_path: Path, monkeypatch) -> None:
    database_url = _setup_database(tmp_path, monkeypatch)
    sample_path = tmp_path / "capella_region_sample.csv"
    _write_gaia_sample_csv(sample_path, CAPELLA_SAMPLE_ROWS)

    result = import_gaia_dr2_sample(
        sample_path,
        database_url=database_url,
        source_key="gaia-dr2-capella-region-proof",
        display_name="Gaia DR2 Capella region proof",
        license_note="test fixture",
    )

    assert result["rows_seen"] == 3
    assert result["rows_imported"] == 3
    with session_scope(database_url) as session:
        imported_count = session.query(GaiaDr2Source).count()
    assert imported_count == 3


def test_catalog_status_row_count_reflects_multiple_gaia_rows(tmp_path: Path, monkeypatch) -> None:
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

    response = client.get("/api/sky/catalog/status", headers={"User-Agent": "pytest"})

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["gaia_dr2"]["status"] == "partial"
    assert body["data"]["gaia_dr2"]["row_count"] == 3
    assert body["data"]["gaia_dr2"]["source_summary"]["source_key"] == "gaia-dr2-capella-region-proof"


def test_gaia_exact_lookup_works_for_multiple_source_ids(tmp_path: Path, monkeypatch) -> None:
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

    for row in CAPELLA_SAMPLE_ROWS:
        response = client.get(
            f"/api/sky/object/gaia-dr2/{row['source_id']}",
            headers={"User-Agent": "pytest"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["data"]["indexed"] is True
        assert body["data"]["source_id"] == row["source_id"]
        assert body["data"]["provenance"]["source_key"] == "gaia-dr2-capella-region-proof"


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