from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.openngc_dso_catalog_service import (
    OPENNGC_LICENSE_NOTE,
    load_openngc_catalog,
    lookup_openngc_dso,
)


client = TestClient(app)


def test_openngc_catalog_loads_normalized_dso_records() -> None:
    catalog = load_openngc_catalog()

    assert catalog.count > 10000
    assert catalog.license_note == OPENNGC_LICENSE_NOTE
    assert "NGC6543" in catalog.records_by_source_id
    assert "IC0342" in catalog.records_by_source_id
    assert catalog.type_counts["galaxy"] > 1000


def test_openngc_exact_lookup_resolves_ngc_and_ic_objects() -> None:
    cats_eye = lookup_openngc_dso("NGC6543", catalog="NGC (OpenNGC)")
    ic342 = lookup_openngc_dso("IC0342", catalog="IC (OpenNGC)")

    assert cats_eye["catalog"] == "NGC (OpenNGC)"
    assert cats_eye["source_id"] == "NGC6543"
    assert cats_eye["model"] == "dso"
    assert cats_eye["display_name"] == "NGC 6543 Cat's Eye Nebula"
    assert cats_eye["types"] == ["PN"]
    assert cats_eye["object_type"] == "planetary_nebula"
    assert cats_eye["constellation"] == "Dra"
    assert cats_eye["magnitude"] == 9.01
    assert cats_eye["angular_size"]["major_arcmin"] == 0.9
    assert "Cat's Eye Nebula" in cats_eye["names"]
    assert "source_id=NGC6543" in cats_eye["sky_engine_url"]
    assert "model=dso" in cats_eye["sky_engine_url"]

    assert ic342["catalog"] == "IC (OpenNGC)"
    assert ic342["source_id"] == "IC0342"
    assert ic342["types"] == ["G"]
    assert ic342["object_type"] == "galaxy"
    assert ic342["magnitude"] == 9.68


def test_openngc_exact_lookup_preserves_messier_cross_ids_without_replacing_identity() -> None:
    m31_ngc = lookup_openngc_dso("NGC0224", catalog="NGC (OpenNGC)")

    assert m31_ngc["source_id"] == "NGC0224"
    assert m31_ngc["messier_id"] == "M31"
    assert "M31" in m31_ngc["names"]
    assert "Messier 31" in m31_ngc["names"]
    assert m31_ngc["catalog"] == "NGC (OpenNGC)"


def test_openngc_exact_object_endpoint_resolves_ngc_and_ic_identities() -> None:
    ngc_response = client.get(
        "/api/sky/object?catalog=NGC%20(OpenNGC)&source_id=NGC6543&model=dso",
        headers={"User-Agent": "pytest"},
    )
    ic_response = client.get(
        "/api/sky/object?catalog=IC%20(OpenNGC)&source_id=IC0342&model=dso",
        headers={"User-Agent": "pytest"},
    )

    assert ngc_response.status_code == 200
    assert ic_response.status_code == 200
    ngc = ngc_response.json()["data"]
    ic = ic_response.json()["data"]
    assert ngc["source_id"] == "NGC6543"
    assert ngc["types"] == ["PN"]
    assert "Unknown Type" not in ngc["object_type"]
    assert ic["source_id"] == "IC0342"
    assert ic["types"] == ["G"]


def test_openngc_search_resolves_common_name_and_ngc_alias() -> None:
    response = client.get("/api/sky/search?q=Cat%27s%20Eye%20Nebula", headers={"User-Agent": "pytest"})

    assert response.status_code == 200
    results = response.json()["data"]["results"]
    assert results
    first = results[0]
    assert first["catalog"] == "NGC (OpenNGC)"
    assert first["source_id"] == "NGC6543"
    assert first["status"] == "indexed"
