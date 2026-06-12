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


def test_exact_object_endpoint_resolves_m31_from_stable_identity(tmp_path: Path, monkeypatch) -> None:
    _setup_database(tmp_path, monkeypatch)

    response = client.get(
        "/api/sky/object?catalog=Messier%20(local)&source_id=M31&model=dso",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["catalog"] == "Messier (local)"
    assert body["data"]["source_id"] == "M31"
    assert body["data"]["model"] == "dso"
    assert body["data"]["types"] == ["G"]
    assert body["data"]["display_name"].startswith("M31")
    assert body["data"]["ra"] == 10.68
    assert body["data"]["dec"] == 41.269


def test_exact_object_endpoint_resolves_known_messier_types(tmp_path: Path, monkeypatch) -> None:
    _setup_database(tmp_path, monkeypatch)

    m42_response = client.get(
        "/api/sky/object?catalog=Messier%20(local)&source_id=M42&model=dso",
        headers={"User-Agent": "pytest"},
    )
    m13_response = client.get(
        "/api/sky/object?catalog=Messier%20(local)&source_id=M13&model=dso",
        headers={"User-Agent": "pytest"},
    )

    assert m42_response.status_code == 200
    assert m13_response.status_code == 200
    assert m42_response.json()["data"]["types"] == ["BNe"]
    assert m13_response.json()["data"]["types"] == ["GlC"]


def test_exact_object_endpoint_resolves_expanded_messier_validation_targets(tmp_path: Path, monkeypatch) -> None:
    _setup_database(tmp_path, monkeypatch)

    expected = {
        "M45": ("Pleiades", ["OpC"]),
        "M57": ("Ring Nebula", ["PN"]),
        "M81": ("Bode's Galaxy", ["G"]),
        "M82": ("Cigar Galaxy", ["G"]),
    }

    for source_id, (name, types) in expected.items():
        response = client.get(
            f"/api/sky/object?catalog=Messier%20(local)&source_id={source_id}&model=dso",
            headers={"User-Agent": "pytest"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["data"]["source_id"] == source_id
        assert name in body["data"]["display_name"]
        assert body["data"]["types"] == types


def test_exact_object_endpoint_resolves_betelgeuse_from_stable_identity(tmp_path: Path, monkeypatch) -> None:
    _setup_database(tmp_path, monkeypatch)

    response = client.get(
        "/api/sky/object?catalog=Bright%20Star%20Catalog%20(local)&source_id=star-betelgeuse&model=star",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["catalog"] == "Bright Star Catalog (local)"
    assert body["data"]["source_id"] == "star-betelgeuse"
    assert body["data"]["model"] == "star"
    assert body["data"]["display_name"] == "Betelgeuse"
    assert body["data"]["ra"] == 88.7925
    assert body["data"]["dec"] == 7.4071


def test_exact_object_endpoint_resolves_expanded_bright_star_validation_targets(tmp_path: Path, monkeypatch) -> None:
    _setup_database(tmp_path, monkeypatch)

    expected = {
        "star-sirius": ("Sirius", 101.2875, -16.7161),
        "star-vega": ("Vega", 279.234, 38.7837),
        "star-antares": ("Antares", 247.3515, -26.4319),
    }

    for source_id, (name, ra, dec) in expected.items():
        response = client.get(
            f"/api/sky/object?catalog=Bright%20Star%20Catalog%20(local)&source_id={source_id}&model=star",
            headers={"User-Agent": "pytest"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["data"]["source_id"] == source_id
        assert body["data"]["display_name"] == name
        assert body["data"]["types"] == ["*"]
        assert abs(body["data"]["ra"] - ra) < 0.000001
        assert abs(body["data"]["dec"] - dec) < 0.000001


def test_exact_object_endpoint_resolves_hipparcos_tier2_identity(tmp_path: Path, monkeypatch) -> None:
    _setup_database(tmp_path, monkeypatch)

    response = client.get(
        "/api/sky/object?catalog=Hipparcos%20Tier%202%20(local)&source_id=hip-67194&model=star",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["catalog"] == "Hipparcos Tier 2 (local)"
    assert body["data"]["source_id"] == "hip-67194"
    assert body["data"]["model"] == "star"
    assert body["data"]["display_name"]
    assert body["data"]["types"] == ["*"]
    assert 0.0 <= body["data"]["ra"] < 360.0
    assert -90.0 <= body["data"]["dec"] <= 90.0
    assert body["data"]["indexed"] is True
    assert body["data"]["provenance"]["source_key"] == "hipparcos_tier2_local"


def test_exact_object_endpoint_documents_unavailable_validation_targets(tmp_path: Path, monkeypatch) -> None:
    _setup_database(tmp_path, monkeypatch)

    unavailable_requests = [
        "/api/sky/object?catalog=Bright%20Star%20Catalog%20(local)&source_id=star-polaris&model=star",
        "/api/sky/object?catalog=Caldwell%20(local)&source_id=C6&model=dso",
    ]

    for path in unavailable_requests:
        response = client.get(path, headers={"User-Agent": "pytest"})
        assert response.status_code == 404
        assert response.json()["error"]["code"] == "not_found"


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


def test_search_endpoint_resolves_m31_from_local_named_index(tmp_path: Path, monkeypatch) -> None:
    _setup_database(tmp_path, monkeypatch)

    response = client.get(
        "/api/sky/search?q=M31",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["recognized_query"] is False
    assert len(body["data"]["results"]) >= 1
    first = body["data"]["results"][0]
    assert "M31" in first["display_name"]
    assert first["indexed"] is True
    assert first["status"] == "indexed"


def test_search_endpoint_resolves_capella_from_local_bright_star_index(tmp_path: Path, monkeypatch) -> None:
    _setup_database(tmp_path, monkeypatch)

    response = client.get(
        "/api/sky/search?q=Capella",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["recognized_query"] is False
    assert len(body["data"]["results"]) >= 1
    first = body["data"]["results"][0]
    assert first["display_name"] == "Capella"
    assert first["indexed"] is True
    assert first["status"] == "indexed"


def test_search_endpoint_resolves_ngc_alias_to_m31(tmp_path: Path, monkeypatch) -> None:
    _setup_database(tmp_path, monkeypatch)

    response = client.get(
        "/api/sky/search?q=NGC%20224",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]["results"]) >= 1
    first = body["data"]["results"][0]
    assert first["display_name"].startswith("M31")
    assert first["status"] == "indexed"


def test_search_endpoint_resolves_messier_spelling_alias(tmp_path: Path, monkeypatch) -> None:
    _setup_database(tmp_path, monkeypatch)

    response = client.get(
        "/api/sky/search?q=Messier%2031",
        headers={"User-Agent": "pytest"},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]["results"]) >= 1
    first = body["data"]["results"][0]
    assert first["display_name"].startswith("M31")
    assert first["status"] == "indexed"


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
