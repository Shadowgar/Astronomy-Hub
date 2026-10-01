"""Catalog snapshot work must stop at the astronomy cache boundary."""

import json
from concurrent.futures import ThreadPoolExecutor
from datetime import date

import pytest

from backend.app.services import tonight_catalog as catalog
from backend.app.services import tonight_service as service


@pytest.fixture(autouse=True)
def reset_snapshot():
    catalog.clear_catalog_snapshot_cache()
    yield
    catalog.clear_catalog_snapshot_cache()


def test_cache_hits_construct_catalog_only_once(monkeypatch):
    calls = []
    original = catalog.fixed_targets

    def counted():
        calls.append(True)
        return original()

    monkeypatch.setattr(catalog, "fixed_targets", counted)

    def no_materialization(self):
        pytest.fail("A Redis hit must not copy even the bounded snapshot")

    monkeypatch.setattr(catalog.CatalogSnapshot, "materialize", no_materialization)
    monkeypatch.setattr(service, "cache_get", lambda key: json.dumps({"status": "ok"}))
    service.build_astronomy(date(2026, 10, 1))
    service.build_astronomy(date(2026, 10, 1))
    assert len(calls) == 1


def test_hip_subset_matches_previous_full_sort():
    original = catalog._load_tier2_mid_star_dataset()
    expected = sorted(
        original, key=lambda row: (float(row["magnitude"]), str(row["id"]))
    )[: catalog.HIP_LIMIT]
    targets, _ = catalog.get_catalog_snapshot().materialize()
    actual = [
        row["source_id"]
        for row in targets
        if row["catalog"] == "Hipparcos Tier 2 (local)"
    ]
    assert actual == [str(row["id"]) for row in expected]


def test_snapshot_isolation_between_requests_and_nights(monkeypatch):
    snapshot = catalog.get_catalog_snapshot()
    targets, sources = snapshot.materialize()
    targets[0]["ra"] = -999
    targets.append({"source_id": "jupiter"})
    sources["solar_system"] = {"unavailable_bodies": ["uranus"]}
    sources["hipparcos"]["status"] = "unavailable"
    fresh, clean = catalog.get_catalog_snapshot().materialize()
    assert fresh[0]["ra"] != -999
    assert not any(row["source_id"] == "jupiter" for row in fresh)
    assert "solar_system" not in clean
    assert clean["hipparcos"]["status"] == "included"
    assert catalog.get_catalog_snapshot() is snapshot


def test_source_generation_changes_snapshot_and_cache_key(monkeypatch):
    keys = []
    monkeypatch.setattr(
        service, "cache_get", lambda key: keys.append(key) or '{"status":"ok"}'
    )
    first = catalog.get_catalog_snapshot()
    service.build_astronomy(date(2026, 10, 1))
    service.build_astronomy(date(2026, 10, 1))
    assert keys[0] == keys[1]
    rows = catalog._load_tier2_mid_star_dataset()
    # A parsed-loader generation replacement is the existing cache_clear boundary.
    replacement = tuple(
        {**row, "right_ascension": float(row["right_ascension"]) + 0.01} for row in rows
    )
    monkeypatch.setattr(catalog, "_load_tier2_mid_star_dataset", lambda: replacement)
    changed = catalog.get_catalog_snapshot()
    assert changed.fingerprint != first.fingerprint
    service.build_astronomy(date(2026, 10, 1))
    assert keys[2] != keys[0]
    assert catalog.get_catalog_snapshot() is changed
    # An identical-content reload rebuilds once but preserves deterministic digest.
    same_content = tuple(dict(row) for row in replacement)
    monkeypatch.setattr(catalog, "_load_tier2_mid_star_dataset", lambda: same_content)
    assert catalog.get_catalog_snapshot().fingerprint == changed.fingerprint


def test_loader_cache_reset_detected():
    first = catalog.get_catalog_snapshot()
    catalog._load_tier2_mid_star_dataset.cache_clear()
    reloaded = catalog.get_catalog_snapshot()
    assert reloaded is not first
    assert reloaded.fingerprint == first.fingerprint
    catalog.load_openngc_catalog.cache_clear()
    assert catalog.get_catalog_snapshot() is not reloaded
    assert catalog.get_catalog_snapshot().fingerprint == first.fingerprint


def test_concurrent_initialization_builds_once(monkeypatch):
    calls = []
    original = catalog.fixed_targets

    def counted():
        calls.append(True)
        return original()

    monkeypatch.setattr(catalog, "fixed_targets", counted)
    with ThreadPoolExecutor(max_workers=4) as pool:
        snapshots = list(pool.map(lambda _: catalog.get_catalog_snapshot(), range(8)))
    assert len(calls) == 1
    assert all(snapshot is snapshots[0] for snapshot in snapshots)


def test_unavailable_source_retried(monkeypatch):
    calls = []
    original = catalog.fixed_targets

    def unavailable():
        calls.append(True)
        return [], {"hipparcos": {"status": "unavailable", "candidate_count": 0}}

    monkeypatch.setattr(catalog, "fixed_targets", unavailable)
    catalog.get_catalog_snapshot()
    catalog.get_catalog_snapshot()
    assert len(calls) == 2
    monkeypatch.setattr(catalog, "fixed_targets", original)
    assert catalog.get_catalog_snapshot().materialize()[0]


def test_limits_and_in_place_fixture_reset(monkeypatch):
    first = catalog.get_catalog_snapshot()
    monkeypatch.setattr(catalog, "HIP_LIMIT", 3)
    second = catalog.get_catalog_snapshot()
    assert second.fingerprint != first.fingerprint
    assert second.materialize()[1]["hipparcos"]["candidate_count"] == 3
    catalog.clear_catalog_snapshot_cache()
    assert catalog.get_catalog_snapshot() is not second
    assert catalog.get_catalog_snapshot().fingerprint == second.fingerprint
