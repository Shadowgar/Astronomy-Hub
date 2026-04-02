from datetime import datetime, timezone

from backend.app.services._legacy_scene_logic import _build_satellite_engine_slice


def test_satellite_slice_prefers_provider_pass_metadata():
    payload = {
        "satellites": [
            {
                "id": "25544",
                "name": "ISS",
                "source": "g7vrd",
                "pass_start": "2026-03-31T15:42:02.578Z",
                "max_elevation_deg": 24.0,
            }
        ]
    }
    objects = _build_satellite_engine_slice(
        parsed_location={"latitude": 40.0, "longitude": -75.0, "elevation_ft": 100.0},
        time_context=datetime(2026, 3, 31, 12, 0, tzinfo=timezone.utc),
        live_inputs=payload,
    )

    assert objects
    obj = objects[0]
    assert obj["visibility"]["visibility_window_start"] == "2026-03-31T15:42:02.578Z"
    assert obj["position"]["elevation"] == 24.0
    assert "predicted pass" in obj["summary"].lower()
    assert obj["provider_source"] == "g7vrd"


def test_satellite_slice_preserves_tle_track_signal_when_pass_missing():
    payload = {
        "satellites": [
            {
                "id": "25544",
                "name": "ISS",
                "source": "space_track",
                "tle_line1": "1 25544U 98067A   26091.50000000  .00001234  00000-0  10270-4 0  9991",
                "tle_line2": "2 25544  51.6433 123.4567 0003642 278.1234 123.9876 15.49812345678901",
            }
        ]
    }
    objects = _build_satellite_engine_slice(
        parsed_location={"latitude": 40.0, "longitude": -75.0, "elevation_ft": 100.0},
        time_context=datetime(2026, 3, 31, 12, 0, tzinfo=timezone.utc),
        live_inputs=payload,
    )

    assert objects
    obj = objects[0]
    assert "tle" in obj["summary"].lower()
    assert obj["provider_source"] == "space_track"
    visibility = obj.get("visibility") or {}
    assert isinstance(visibility.get("visibility_window_start"), str)
    assert isinstance(visibility.get("visibility_window_end"), str)


def test_tle_propagation_estimate_changes_with_time_context():
    payload = {
        "satellites": [
            {
                "id": "25544",
                "name": "ISS",
                "source": "space_track",
                "tle_line1": "1 25544U 98067A   26091.50000000  .00001234  00000-0  10270-4 0  9991",
                "tle_line2": "2 25544  51.6433 123.4567 0003642 278.1234 123.9876 15.49812345678901",
            }
        ]
    }

    objects_1 = _build_satellite_engine_slice(
        parsed_location={"latitude": 40.0, "longitude": -75.0, "elevation_ft": 100.0},
        time_context=datetime(2026, 3, 31, 12, 0, tzinfo=timezone.utc),
        live_inputs=payload,
    )
    objects_2 = _build_satellite_engine_slice(
        parsed_location={"latitude": 40.0, "longitude": -75.0, "elevation_ft": 100.0},
        time_context=datetime(2026, 3, 31, 13, 0, tzinfo=timezone.utc),
        live_inputs=payload,
    )

    assert objects_1 and objects_2
    vis_1 = (objects_1[0].get("visibility") or {}).get("visibility_window_start")
    vis_2 = (objects_2[0].get("visibility") or {}).get("visibility_window_start")
    assert isinstance(vis_1, str) and vis_1
    assert isinstance(vis_2, str) and vis_2
    assert vis_1 != vis_2


def test_tle_propagation_estimate_is_deterministic_for_identical_inputs():
    payload = {
        "satellites": [
            {
                "id": "25544",
                "name": "ISS",
                "source": "space_track",
                "tle_line1": "1 25544U 98067A   26091.50000000  .00001234  00000-0  10270-4 0  9991",
                "tle_line2": "2 25544  51.6433 123.4567 0003642 278.1234 123.9876 15.49812345678901",
            }
        ]
    }

    objects_1 = _build_satellite_engine_slice(
        parsed_location={"latitude": 40.0, "longitude": -75.0, "elevation_ft": 100.0},
        time_context=datetime(2026, 3, 31, 12, 0, tzinfo=timezone.utc),
        live_inputs=payload,
    )
    objects_2 = _build_satellite_engine_slice(
        parsed_location={"latitude": 40.0, "longitude": -75.0, "elevation_ft": 100.0},
        time_context=datetime(2026, 3, 31, 12, 0, tzinfo=timezone.utc),
        live_inputs=payload,
    )

    assert objects_1 == objects_2


def test_satellite_slice_marks_active_pass_window_and_sets_window_end():
    payload = {
        "satellites": [
            {
                "id": "25544",
                "name": "ISS",
                "source": "g7vrd",
                "pass_start": "2026-03-31T15:42:00Z",
                "duration_sec": 600,
                "max_elevation_deg": 32.0,
            }
        ]
    }
    objects = _build_satellite_engine_slice(
        parsed_location={"latitude": 40.0, "longitude": -75.0, "elevation_ft": 100.0},
        time_context=datetime(2026, 3, 31, 15, 45, tzinfo=timezone.utc),
        live_inputs=payload,
    )

    assert objects
    obj = objects[0]
    visibility = obj.get("visibility") or {}
    assert visibility.get("is_visible") is True
    assert visibility.get("visibility_window_start") == "2026-03-31T15:42:00Z"
    assert visibility.get("visibility_window_end") == "2026-03-31T15:52:00+00:00"


def test_satellite_slice_excludes_sub_horizon_provider_passes():
    payload = {
        "satellites": [
            {
                "id": "99999",
                "name": "LOWPASS",
                "source": "g7vrd",
                "pass_start": "2026-03-31T15:42:00Z",
                "max_elevation_deg": 8.0,
            }
        ]
    }
    objects = _build_satellite_engine_slice(
        parsed_location={"latitude": 40.0, "longitude": -75.0, "elevation_ft": 100.0},
        time_context=datetime(2026, 3, 31, 15, 45, tzinfo=timezone.utc),
        live_inputs=payload,
    )

    assert objects == []
