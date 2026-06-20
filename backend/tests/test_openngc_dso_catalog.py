from __future__ import annotations

from backend.app.services.openngc_dso_catalog_service import (
    OPENNGC_LICENSE_NOTE,
    find_openngc_record_by_messier_id,
    load_openngc_catalog,
    lookup_openngc_dso,
)
from backend.app.services.sky_catalog_service import (
    _is_compact_caldwell_query,
    build_exact_object_lookup_payload,
    build_sky_search_payload,
)
from backend.app.services.sky_object_enrichment import caldwell_aliases


def test_openngc_catalog_loads_normalized_dso_records() -> None:
    catalog = load_openngc_catalog()

    assert catalog.count > 10000
    assert catalog.license_note == OPENNGC_LICENSE_NOTE
    assert "NGC6543" in catalog.records_by_source_id
    assert "IC0342" in catalog.records_by_source_id
    assert catalog.type_counts["galaxy"] > 1000


def test_openngc_catalog_indexes_messier_cross_ids() -> None:
    catalog = load_openngc_catalog()

    assert catalog.records_by_messier_id["M31"]["source_id"] == "NGC0224"
    assert find_openngc_record_by_messier_id("M 31")["source_id"] == "NGC0224"


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


def test_openngc_exact_lookup_normalizes_compact_catalog_ids() -> None:
    assert lookup_openngc_dso("NGC224", catalog="NGC (OpenNGC)")["source_id"] == "NGC0224"
    assert lookup_openngc_dso("IC342", catalog="IC (OpenNGC)")["source_id"] == "IC0342"


def test_openngc_exact_lookup_preserves_messier_cross_ids_without_replacing_identity() -> None:
    m31_ngc = lookup_openngc_dso("NGC0224", catalog="NGC (OpenNGC)")

    assert m31_ngc["source_id"] == "NGC0224"
    assert m31_ngc["messier_id"] == "M31"
    assert "M31" in m31_ngc["names"]
    assert "Messier 31" in m31_ngc["names"]
    assert m31_ngc["catalog"] == "NGC (OpenNGC)"


def test_openngc_exact_object_payload_resolves_ngc_and_ic_identities() -> None:
    ngc = build_exact_object_lookup_payload("NGC (OpenNGC)", "NGC6543", "dso")["data"]
    ic = build_exact_object_lookup_payload("IC (OpenNGC)", "IC0342", "dso")["data"]

    assert ngc["source_id"] == "NGC6543"
    assert ngc["types"] == ["PN"]
    assert "Unknown Type" not in ngc["object_type"]
    assert ic["source_id"] == "IC0342"
    assert ic["types"] == ["G"]


def test_openngc_search_resolves_common_name_and_ngc_alias() -> None:
    results = build_sky_search_payload("Cat's Eye Nebula")["data"]["results"]

    assert results
    first = results[0]
    assert first["catalog"] == "NGC (OpenNGC)"
    assert first["source_id"] == "NGC6543"
    assert first["status"] == "indexed"


def test_openngc_search_resolves_compact_caldwell_aliases() -> None:
    results = build_sky_search_payload("C6")["data"]["results"]

    assert results
    first = results[0]
    assert first["catalog"] == "NGC (OpenNGC)"
    assert first["source_id"] == "NGC6543"
    assert "C6" in first["aliases"]
    assert "Caldwell 6" in first["aliases"]


def test_compact_caldwell_query_rejects_unbounded_whitespace() -> None:
    assert _is_compact_caldwell_query(" C 006 ") is True
    assert _is_compact_caldwell_query("C109") is True
    assert _is_compact_caldwell_query("C110") is False
    assert _is_compact_caldwell_query(f"C{' ' * 10_000}6") is False


def test_caldwell_aliases_exclude_ids_outside_catalog_range() -> None:
    aliases = caldwell_aliases({"identifiers": ["C109", "C110", "C9999"]})

    assert "C109" in aliases
    assert "C110" not in aliases
    assert "C9999" not in aliases


def test_openngc_exact_lookup_returns_source_backed_enrichment_fields() -> None:
    cats_eye = lookup_openngc_dso("NGC6543", catalog="NGC (OpenNGC)")

    assert cats_eye["canonical_id"] == "NGC6543"
    assert cats_eye["object_type_label"] == "Planetary Nebula"
    assert cats_eye["aliases"]
    assert "Cat's Eye Nebula" in cats_eye["common_names"]
    assert "C6" in cats_eye["aliases"]
    assert "Caldwell 6" in cats_eye["aliases"]
    assert cats_eye["description"] is None
    assert cats_eye["enrichment_status"]["description"] == "not_available"
    assert cats_eye["source_attribution"][0]["name"] == "OpenNGC"
    assert cats_eye["data_sources"]["identity"] == ["OpenNGC"]
    assert "HyperLEDA" in cats_eye["data_sources"]["upstream"]
    assert "SIMBAD" in cats_eye["data_sources"]["upstream"]


def test_messier_exact_lookup_inherits_openngc_enrichment_without_replacing_identity() -> None:
    data = build_exact_object_lookup_payload("Messier (local)", "M31", "dso")["data"]

    assert data["catalog"] == "Messier (local)"
    assert data["source_id"] == "M31"
    assert data["canonical_id"] == "M31"
    assert data["cross_ids"]["openngc"] == "NGC0224"
    assert "Andromeda Galaxy" in data["common_names"]
    assert "NGC 224" in data["aliases"]
    assert data["object_type_label"] == "Galaxy"
    assert data["source_attribution"][0]["name"] == "Messier local seed"
    assert any(item["name"] == "OpenNGC" for item in data["source_attribution"])
