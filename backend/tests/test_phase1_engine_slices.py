import os
import sys

root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
backend_dir = os.path.join(root, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import server


def test_phase1_engine_slices_are_limited_and_normalized():
    satellites = server._build_satellite_engine_slice()
    planets = server._build_solar_system_engine_slice()
    deep_sky = server._build_deep_sky_engine_slice()
    conditions = server._build_earth_engine_slice()

    assert isinstance(satellites, list)
    assert isinstance(planets, list)
    assert isinstance(deep_sky, list)
    assert isinstance(conditions, dict)

    assert all(obj.get("type") == "satellite" for obj in satellites)
    assert all(obj.get("type") == "planet" for obj in planets)
    assert all(obj.get("type") == "deep_sky" for obj in deep_sky)
    assert all(obj.get("type") != "flight" for obj in satellites + planets + deep_sky)

    assert all("id" in obj and "name" in obj and "engine" in obj and "summary" in obj for obj in satellites + planets + deep_sky)
    assert "location_label" in conditions
    assert "observing_score" in conditions
