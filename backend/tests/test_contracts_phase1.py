import pytest
from pydantic import ValidationError

from backend.app.contracts.phase1 import (
    SceneContract,
    SceneObjectSummary,
    ObjectDetail,
)


def sample_satellite():
    return {
        "id": "sat-123",
        "name": "TestSat 1",
        "type": "satellite",
        "engine": "satellite",
        "summary": "A test satellite visible now.",
        "time_relevance": "window_start:2026-03-26T20:00:00Z",
        "reason_for_inclusion": "Visible now above horizon.",
        "detail_route": "/object/sat-123",
        "position": {"azimuth": 120.5, "elevation": 45.0},
        "visibility": {"is_visible": True, "visibility_window_start": "2026-03-26T20:00:00Z"},
    }


def sample_planet():
    return {
        "id": "mars",
        "name": "Mars",
        "type": "planet",
        "engine": "solar_system",
        "summary": "Bright planet visible in the west.",
        "time_relevance": "currently_visible",
        "reason_for_inclusion": "Primary visible planet for tonight.",
        "detail_route": "/object/mars",
        "position": {"azimuth": 270.0, "elevation": 15.0},
        "visibility": {"is_visible": True},
    }


def sample_deep_sky():
    return {
        "id": "m13",
        "name": "M13",
        "type": "deep_sky",
        "engine": "deep_sky",
        "summary": "Globular cluster in Hercules.",
        "time_relevance": "currently_visible",
        "reason_for_inclusion": "High-altitude deep sky target.",
        "detail_route": "/object/m13",
    }


def test_valid_scene_and_objects():
    sat = sample_satellite()
    planet = sample_planet()
    ds = sample_deep_sky()

    # individual model validation
    s_obj = SceneObjectSummary(**sat)
    p_obj = SceneObjectSummary(**planet)
    d_obj = SceneObjectSummary(**ds)

    assert s_obj.type == "satellite"
    assert p_obj.type == "planet"
    assert d_obj.type == "deep_sky"

    # scene with mixed allowed Phase 1 types
    scene_payload = {
        "scope": "above_me",
        "engine": "main",
        "filter": "visible",
        "timestamp": "2026-03-26T20:00:00Z",
        "objects": [sat, planet, ds],
    }

    scene = SceneContract(**scene_payload)
    assert len(scene.objects) == 3


def test_object_detail_model():
    source = sample_planet()
    detail = ObjectDetail(
        **{
            "id": source["id"],
            "name": source["name"],
            "type": source["type"],
            "engine": source["engine"],
            "summary": source["summary"],
            "position": source["position"],
            "visibility": source["visibility"],
        }
    )
    assert detail.id == "mars"
    assert detail.engine == "solar_system"


def test_missing_required_fields_fail():
    invalid = {"id": "no-name", "type": "satellite", "engine": "satellite", "summary": "x"}
    with pytest.raises(ValidationError):
        SceneObjectSummary(**invalid)


def test_forbidden_flight_type_fails():
    flight = {
        "id": "flt-1",
        "name": "Plane",
        "type": "flight",
        "engine": "flight",
        "summary": "An airplane - not allowed in Phase 1",
    }

    with pytest.raises(ValidationError):
        SceneObjectSummary(**flight)
