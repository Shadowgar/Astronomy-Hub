from __future__ import annotations

import json

from backend.app.services.catalog_registry_service import (
    DEFAULT_CATALOG_REGISTRY_PATH,
    expand_source_backed_aliases,
    load_catalog_registry,
)


def test_catalog_registry_loads_source_manifests_without_object_records() -> None:
    registry = load_catalog_registry()
    raw = json.loads(DEFAULT_CATALOG_REGISTRY_PATH.read_text(encoding="utf-8"))

    assert registry.schema_version == 1
    assert "openngc_local" in registry.sources_by_key
    assert "lbn_vii_9" in registry.sources_by_key
    assert all("records" not in source for source in raw["sources"])


def test_lbn_manifest_preserves_source_authority_and_attribution() -> None:
    source = load_catalog_registry().sources_by_key["lbn_vii_9"]

    assert source.catalog_family == "bright_nebula"
    assert source.source_authority == "CDS VizieR VII/9; Lynds (1965)"
    assert source.source_url == "https://cdsarc.cds.unistra.fr/viz-bin/cat/VII/9"
    assert source.enrichment_status == "crossmatch_only"
    assert source.supports_common_names is False
    assert source.compact_id_normalization is True
    assert "angular_size" in source.optional_metadata_fields
    assert source.importer_route == "planned:lbn_vii_9"


def test_lbn_alias_rule_expands_only_catalog_bounded_source_ids() -> None:
    expansion = expand_source_backed_aliases(["LBN 350"])
    out_of_range = expand_source_backed_aliases(["LBN 99999"])

    assert expansion.aliases == (
        "LBN 350",
        "LBN350",
        "Lynds Bright Nebula 350",
    )
    assert expansion.source_keys == ("lbn_vii_9",)
    assert out_of_range.aliases == ()
    assert out_of_range.source_keys == ()
