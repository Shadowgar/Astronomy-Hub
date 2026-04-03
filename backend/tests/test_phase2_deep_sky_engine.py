from datetime import datetime, timezone

from backend.app.services import _legacy_scene_logic as logic


def _conditions(score="good", moon_interference="low"):
    return {
        "conditions": {
            "observing_score": score,
            "moon_interference": moon_interference,
        }
    }


def test_deep_sky_slice_is_catalog_backed_with_structured_position():
    objects = logic._build_deep_sky_engine_slice(
        parsed_location={"latitude": 41.3219, "longitude": -79.5854, "elevation_ft": 1270},
        time_context=datetime(2026, 4, 2, 2, 0, tzinfo=timezone.utc),
        live_inputs=_conditions(),
    )

    assert objects
    assert all(obj.get("provider_source") == "messier_catalog" for obj in objects)

    for obj in objects:
        pos = obj.get("position") or {}
        assert isinstance(pos.get("azimuth"), float)
        assert isinstance(pos.get("elevation"), float)
        assert pos["elevation"] >= 10.0


def test_deep_sky_slice_changes_with_explicit_time_context():
    location = {"latitude": 41.3219, "longitude": -79.5854, "elevation_ft": 1270}
    t1 = datetime(2026, 4, 2, 2, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 4, 2, 6, 0, tzinfo=timezone.utc)

    first = logic._build_deep_sky_engine_slice(
        parsed_location=location,
        time_context=t1,
        live_inputs=_conditions(),
    )
    second = logic._build_deep_sky_engine_slice(
        parsed_location=location,
        time_context=t2,
        live_inputs=_conditions(),
    )

    by_id_first = {obj.get("id"): obj for obj in first}
    by_id_second = {obj.get("id"): obj for obj in second}
    shared_ids = set(by_id_first).intersection(by_id_second)
    assert shared_ids

    moved = []
    for object_id in shared_ids:
        p1 = (by_id_first[object_id].get("position") or {}).get("azimuth")
        p2 = (by_id_second[object_id].get("position") or {}).get("azimuth")
        if p1 is None or p2 is None:
            continue
        moved.append(abs(float(p1) - float(p2)))

    assert moved
    assert max(moved) > 0.5


def test_deep_sky_visibility_flags_align_with_elevation_band():
    objects = logic._build_deep_sky_engine_slice(
        parsed_location={"latitude": 41.3219, "longitude": -79.5854, "elevation_ft": 1270},
        time_context=datetime(2026, 4, 2, 2, 0, tzinfo=timezone.utc),
        live_inputs=_conditions(),
    )

    assert objects
    for obj in objects:
        elev = float((obj.get("position") or {}).get("elevation") or 0.0)
        visible = bool((obj.get("visibility") or {}).get("is_visible"))
        assert elev >= 10.0
        # Visibility is computed before rounding; keep a small tolerance at threshold.
        if elev >= 20.5:
            assert visible is True
        elif elev <= 19.5:
            assert visible is False
