from __future__ import annotations

from datetime import datetime, timezone
import math

from backend.app.services.satellite_propagation_service import (
    SatelliteObserver,
    build_visible_satellite_candidates,
    propagate_satellite_record,
)
from backend.app.services.satellite_tle_catalog_service import load_satellite_tle_catalog


ORAS_OBSERVER = SatelliteObserver(lat=41.44, lng=-79.69, elev=0.0)
PROPAGATION_TEST_TIME = datetime(2026, 6, 4, 2, 16, 4, tzinfo=timezone.utc)
VISIBLE_TEST_TIME = datetime(2026, 6, 4, 0, 0, 0, tzinfo=timezone.utc)


def test_skyfield_dependency_is_available() -> None:
    import skyfield

    assert skyfield.__version__


def test_iss_propagates_finite_topocentric_coordinates() -> None:
    catalog = load_satellite_tle_catalog()
    iss = catalog.records_by_norad["25544"]

    propagated = propagate_satellite_record(iss, observer=ORAS_OBSERVER, as_of=PROPAGATION_TEST_TIME)

    assert propagated is not None
    assert propagated["source_id"] == "25544"
    assert propagated["norad_id"] == "25544"
    assert propagated["model"] == "tle_satellite"
    assert propagated["propagated_at"] == "2026-06-04T02:16:04Z"
    assert propagated["tle_epoch"]
    for key in ("ra", "dec", "alt", "az", "range_km"):
        assert math.isfinite(propagated[key])
    assert 0.0 <= propagated["ra"] < 360.0
    assert -90.0 <= propagated["dec"] <= 90.0
    assert -90.0 <= propagated["alt"] <= 90.0
    assert 0.0 <= propagated["az"] < 360.0
    assert propagated["range_km"] > 0.0
    assert propagated["is_visible"] == (propagated["alt"] > 0.0)


def test_malformed_tle_is_skipped_without_partial_coordinates() -> None:
    catalog = load_satellite_tle_catalog()
    bad_record = dict(catalog.records_by_norad["25544"])
    bad_record["model_data"] = {
        **bad_record["model_data"],
        "tle": ["not a tle line 1", "not a tle line 2"],
    }

    assert propagate_satellite_record(bad_record, observer=ORAS_OBSERVER, as_of=PROPAGATION_TEST_TIME) is None


def test_visible_satellite_candidates_are_real_propagated_and_bounded() -> None:
    candidates = build_visible_satellite_candidates(
        observer=ORAS_OBSERVER,
        as_of=VISIBLE_TEST_TIME,
        limit=5,
    )

    assert candidates
    assert len(candidates) <= 5
    assert all(candidate["model"] == "tle_satellite" for candidate in candidates)
    assert all(candidate["catalog"] == "Satellite TLE (local)" for candidate in candidates)
    assert all(isinstance(candidate["source_id"], str) for candidate in candidates)
    assert all(candidate["is_visible"] is True for candidate in candidates)
    assert all(candidate["alt"] > 0.0 for candidate in candidates)
    assert all(math.isfinite(candidate["ra"]) and math.isfinite(candidate["dec"]) for candidate in candidates)
    assert all(math.isfinite(candidate["az"]) and math.isfinite(candidate["range_km"]) for candidate in candidates)
    assert all(candidate["sky_engine_url"].startswith("/oras-sky-engine/skysource/") for candidate in candidates)


def test_below_horizon_satellites_are_excluded_by_default() -> None:
    catalog = load_satellite_tle_catalog()
    below_horizon = []

    for record in catalog.records_by_norad.values():
        propagated = propagate_satellite_record(record, observer=ORAS_OBSERVER, as_of=VISIBLE_TEST_TIME)
        if propagated and propagated["alt"] <= 0.0:
            below_horizon.append(propagated["source_id"])
            break

    assert below_horizon

    candidates = build_visible_satellite_candidates(
        observer=ORAS_OBSERVER,
        as_of=VISIBLE_TEST_TIME,
        limit=20,
    )
    returned_ids = {candidate["source_id"] for candidate in candidates}
    assert below_horizon[0] not in returned_ids
