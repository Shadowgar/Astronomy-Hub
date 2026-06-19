from __future__ import annotations

import json
from pathlib import Path


MANIFEST_PATH = Path("backend/app/data/sky/gaia_dr3_pilot_manifest.json")


def test_gaia_dr3_pilot_manifest_defines_safe_source_backed_slice() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    assert manifest["catalog"] == "Gaia DR3"
    assert manifest["storage_strategy"]["commit_raw_catalog"] is False
    assert manifest["storage_strategy"]["frontend_json_dump"] is False
    assert manifest["identity"]["source_id_type"] == "string"
    assert "source_id" in manifest["allowed_columns"]
    assert {"ra", "dec", "phot_g_mean_mag"}.issubset(set(manifest["allowed_columns"]))
    assert manifest["pilot_fields"]
    assert all("name" in field and "ra_center_deg" in field and "dec_center_deg" in field for field in manifest["pilot_fields"])
    assert manifest["docker_strategy"] == "mounted_or_cached_data_only"
    assert manifest["source_attribution"][0]["name"] == "Gaia Archive"
