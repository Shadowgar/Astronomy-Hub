from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def _request_json(path: str):
    resp = client.get(path, headers={"User-Agent": "pytest"})
    return resp.status_code, resp.json()


def _object_ids(payload: dict) -> list[str]:
    objects = payload.get("objects")
    if not isinstance(objects, list):
        return []
    out = []
    for obj in objects:
        object_id = obj.get("id") if isinstance(obj, dict) else None
        if isinstance(object_id, str) and object_id:
            out.append(object_id)
    return out


def test_filter_changes_scene_output_for_same_scope_engine():
    status_visible, visible = _request_json("/api/v1/scene?scope=above_me&engine=above_me&filter=visible_now")
    status_short, short_window = _request_json(
        "/api/v1/scene?scope=above_me&engine=above_me&filter=short_window"
    )

    assert status_visible == 200
    assert status_short == 200
    assert visible.get("filter") == "visible_now"
    assert short_window.get("filter") == "short_window"
    assert _object_ids(visible) != _object_ids(short_window)


def test_filter_is_deterministic_for_same_inputs():
    status1, payload1 = _request_json("/api/v1/scene?scope=above_me&engine=above_me&filter=high_altitude")
    status2, payload2 = _request_json("/api/v1/scene?scope=above_me&engine=above_me&filter=high_altitude")

    assert status1 == 200
    assert status2 == 200
    assert payload1.get("engine") == payload2.get("engine") == "above_me"
    assert payload1.get("filter") == payload2.get("filter") == "high_altitude"
    assert _object_ids(payload1) == _object_ids(payload2)


def test_invalid_filter_returns_stable_json_400():
    status, payload = _request_json("/api/v1/scene?scope=above_me&engine=above_me&filter=not_real")

    assert status == 400
    error = payload.get("error") or {}
    assert error.get("code") == "invalid_filter"
