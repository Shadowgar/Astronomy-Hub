import os
import sys

import pytest


root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
backend_dir = os.path.join(root, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import server


def _count_scene_objects(scene):
    total = 0
    for group in scene.get("groups", []):
        total += len(group.get("objects") or [])
    return total


def _assert_structured_scene(scene, expected_scope, expected_engine, expected_filter):
    assert isinstance(scene, dict)
    assert not isinstance(scene, list)
    assert scene.get("scope") == expected_scope
    assert scene.get("engine") == expected_engine
    assert scene.get("filter") == expected_filter
    assert isinstance(scene.get("timestamp"), str) and scene.get("timestamp")
    assert "observing_context" in scene
    assert isinstance(scene.get("observing_context"), dict)
    assert isinstance(scene.get("groups"), list) and scene.get("groups")
    assert "objects" not in scene

    for group in scene.get("groups", []):
        assert isinstance(group.get("title"), str) and group.get("title")
        assert isinstance(group.get("reason"), str) and group.get("reason")
        assert isinstance(group.get("objects"), list)
        for obj in group.get("objects", []):
            assert isinstance(obj.get("reason"), str) and obj.get("reason")


@pytest.mark.parametrize(
    "scope_slug,engine_slug,filter_slug",
    [
        ("sky", "above_me", "visible_now"),
        ("sky", "deep_sky", "visible_now"),
        ("solar_system", "planets", "visible_now"),
        ("solar_system", "moon", "high_altitude"),
        ("earth", "satellites", "short_window"),
    ],
)
def test_required_engine_scene_generation_returns_structured_scene(
    scope_slug, engine_slug, filter_slug
):
    scene = server._build_phase2_scene(scope_slug, engine_slug, filter_slug)

    _assert_structured_scene(scene, scope_slug, engine_slug, filter_slug)
    assert _count_scene_objects(scene) >= 1
