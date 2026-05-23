import os
import sys

root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
backend_dir = os.path.join(root, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import server


def test_phase1_scene_state_is_unified_ranked_and_limited():
    state = server._build_phase1_scene_state()

    assert isinstance(state, dict)
    assert "scene" in state
    assert "briefing" in state
    assert "events" in state
    assert "supporting" in state

    scene = state["scene"]
    assert scene.get("scope") == "above_me"
    assert scene.get("filter") == "visible"
    objects = scene.get("objects") or []

    assert len(objects) <= 10
    assert all(obj.get("type") in ("satellite", "planet", "deep_sky") for obj in objects)
    assert all(obj.get("type") != "flight" for obj in objects)

    scores = [float(obj.get("relevance_score") or 0.0) for obj in objects]
    assert scores == sorted(scores, reverse=True)

    supporting = state["supporting"]
    assert "targets" in supporting
    assert "passes" in supporting
    assert "alerts" in supporting
