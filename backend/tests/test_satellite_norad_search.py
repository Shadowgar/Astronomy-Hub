from __future__ import annotations

import gzip
import json

import pytest

from backend.app.services import sky_catalog_service as service
from backend.app.services.satellite_tle_catalog_service import load_satellite_tle_catalog


@pytest.fixture
def mounted_satellite(monkeypatch, tmp_path):
    # Real candidate elements; fixture only. No coordinates or visibility supplied.
    record = {
        "model": "tle_satellite", "types": ["Asa"],
        "model_data": {"norad_number": 61045, "source_id": "61045", "tle": [
            "1 61045U 24163A   26295.46387416 -.00001090  00000+0 -34705-4 0  9999",
            "2 61045  52.9704  84.3074 0006496 132.4984 227.6559 15.20290746117132"]},
        "names": ["NAME SPACEMOBILE-003", "NORAD 61045"], "short_name": "SPACEMOBILE-003",
    }
    path = tmp_path / "satellites.gz"
    path.write_bytes(gzip.compress((json.dumps(record) + "\n").encode()))
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(path))
    load_satellite_tle_catalog.cache_clear()
    for name in ["search_catalog_packs", "search_openngc_dso",
                 "_lookup_local_named_objects", "_lookup_tier2_named_objects"]:
        monkeypatch.setattr(service, name, lambda *_args: pytest.fail("Exact NORAD lookup loaded unrelated catalogs"))
    yield record
    load_satellite_tle_catalog.cache_clear()


@pytest.mark.parametrize("query", ["NORAD 61045", "  norad 061045  "])
def test_exact_norad_selection_uses_mounted_elements_without_loading_star_catalogs(mounted_satellite, query):
    result = service.build_sky_search_payload(query)
    assert result["data"]["recognized_query"] is True
    row, = result["data"]["results"]
    assert row["source_id"] == "61045"
    assert row["catalog"] == "Satellite TLE (local)"
    assert row["model"] == "tle_satellite"
    assert row["model_data"]["tle"] == mounted_satellite["model_data"]["tle"]
    assert not any(key in row for key in ["ra", "dec", "alt", "az", "is_visible"])


def test_missing_norad_returns_empty_exact_result_without_scanning_other_catalogs(mounted_satellite):
    result = service.build_sky_search_payload("NORAD 99999")
    assert result["data"]["recognized_query"] is True
    assert result["data"]["results"] == []


def test_unavailable_satellite_feed_is_reported_without_scanning_other_catalogs(mounted_satellite, monkeypatch, tmp_path):
    monkeypatch.setenv("SATELLITE_TLE_FEED_PATH", str(tmp_path / "missing"))
    result = service.build_sky_search_payload("NORAD 61045")
    assert result["data"]["results"] == []
    assert result["meta"]["source_status"] == "unavailable"
