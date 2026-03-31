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


def test_same_scope_engine_filter_returns_identical_scene_payload():
    path = "/api/v1/scene?scope=above_me&engine=above_me&filter=visible_now"
    status1, payload1 = _request_json(path)
    status2, payload2 = _request_json(path)

    assert status1 == 200
    assert status2 == 200
    assert payload1 == payload2


def test_location_and_time_context_change_scene_payload():
    path_a = (
        "/api/v1/scene?scope=above_me&engine=above_me&filter=visible_now"
        "&lat=10&lon=20&at=2026-03-31T00:00:00Z"
    )
    path_b = (
        "/api/v1/scene?scope=above_me&engine=above_me&filter=visible_now"
        "&lat=33&lon=-70&at=2026-03-31T12:00:00Z"
    )
    status_a, payload_a = _request_json(path_a)
    status_b, payload_b = _request_json(path_b)

    assert status_a == 200
    assert status_b == 200
    assert payload_a != payload_b
    assert (payload_a.get("input_context") or {}).get("lat") == 10.0
    assert (payload_b.get("input_context") or {}).get("lat") == 33.0


def test_earth_scope_engines_produce_distinct_scene_outputs():
    status_sat, payload_sat = _request_json("/api/v1/scene?scope=earth&engine=satellites&filter=visible_now")
    status_flights, payload_flights = _request_json("/api/v1/scene?scope=earth&engine=flights&filter=visible_now")

    assert status_sat == 200
    assert status_flights == 200
    assert payload_sat.get("engine") == "satellites"
    assert payload_flights.get("engine") == "flights"
    assert payload_sat.get("objects") != payload_flights.get("objects")
