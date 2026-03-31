from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def _request_json(path: str):
    resp = client.get(path, headers={"User-Agent": "pytest"})
    return resp.status_code, resp.json()


def test_scope_switch_returns_deterministic_scene_payloads():
    scopes = (
        "above_me",
        "earth",
        "sun",
        "satellites",
        "flights",
        "solar_system",
        "deep_sky",
    )

    for scope in scopes:
        status, payload = _request_json(f"/api/v1/scene?scope={scope}")
        assert status == 200
        assert payload.get("scope") == scope
        assert isinstance(payload.get("engine"), str) and payload.get("engine")
        assert isinstance(payload.get("filter"), str) and payload.get("filter")
        assert isinstance(payload.get("timestamp"), str) and payload.get("timestamp")
        assert isinstance(payload.get("objects"), list)


def test_invalid_scope_returns_stable_json_400():
    status, payload = _request_json("/api/v1/scene?scope=invalid_scope")
    assert status == 400
    error = payload.get("error") or {}
    assert error.get("code") == "invalid_scope"
    details = error.get("details") or []
    assert isinstance(details, list) and details
    assert details[0].get("allowed_scopes") == [
        "above_me",
        "earth",
        "sun",
        "satellites",
        "flights",
        "solar_system",
        "deep_sky",
    ]
