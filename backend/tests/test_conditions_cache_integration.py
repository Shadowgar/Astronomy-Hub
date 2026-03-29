import json

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services import conditions_service


client = TestClient(app)


def test_conditions_service_cache_hit_returns_cached_payload(monkeypatch):
    cached_payload = {"status": "ok", "data": {"source": "cache"}}
    set_called = {"value": False}

    monkeypatch.delenv("SIMULATE_NORMALIZER_FAIL", raising=False)
    monkeypatch.setattr(
        conditions_service, "cache_get", lambda key: json.dumps(cached_payload)
    )

    def _fake_cache_set(key, value, ttl_seconds=None):
        set_called["value"] = True
        return True

    monkeypatch.setattr(conditions_service, "cache_set", _fake_cache_set)

    status_code, payload = conditions_service.build_conditions_response(
        lat="40.7", lon="-74.0", elevation_ft="10"
    )

    assert status_code == 200
    assert payload == cached_payload
    assert set_called["value"] is False


def test_conditions_service_cache_miss_writes_payload_with_ttl(monkeypatch):
    cache_set_calls = []

    monkeypatch.delenv("SIMULATE_NORMALIZER_FAIL", raising=False)
    monkeypatch.setattr(conditions_service, "cache_get", lambda key: None)

    def _fake_cache_set(key, value, ttl_seconds=None):
        cache_set_calls.append((key, value, ttl_seconds))
        return True

    monkeypatch.setattr(conditions_service, "cache_set", _fake_cache_set)

    status_code, payload = conditions_service.build_conditions_response(
        lat="40.7", lon="-74.0", elevation_ft="10"
    )

    assert status_code == 200
    assert payload.get("status") == "ok"
    assert len(cache_set_calls) == 1
    assert cache_set_calls[0][0] == "conditions:custom:40.7:-74.0:10"
    assert cache_set_calls[0][2] == 5


def test_conditions_service_degraded_mode_skips_cache(monkeypatch):
    cache_calls = {"get": 0, "set": 0}

    monkeypatch.setenv("SIMULATE_NORMALIZER_FAIL", "conditions")

    def _fake_cache_get(key):
        cache_calls["get"] += 1
        return None

    def _fake_cache_set(key, value, ttl_seconds=None):
        cache_calls["set"] += 1
        return True

    monkeypatch.setattr(conditions_service, "cache_get", _fake_cache_get)
    monkeypatch.setattr(conditions_service, "cache_set", _fake_cache_set)

    status_code, payload = conditions_service.build_conditions_response(
        lat="40.7", lon="-74.0", elevation_ft="10"
    )

    assert status_code == 500
    assert payload["error"]["code"] == "module_error"
    assert cache_calls["get"] == 0
    assert cache_calls["set"] == 0


def test_conditions_route_forwards_location_params(monkeypatch):
    captured = {}

    def _fake_build_conditions_response(lat=None, lon=None, elevation_ft=None):
        captured["lat"] = lat
        captured["lon"] = lon
        captured["elevation_ft"] = elevation_ft
        return 200, {"status": "ok", "data": {}}

    monkeypatch.setattr(
        "backend.app.routes.conditions.build_conditions_response",
        _fake_build_conditions_response,
    )

    response = client.get("/api/v1/conditions?lat=1.1&lon=2.2&elevation_ft=3")

    assert response.status_code == 200
    assert captured == {"lat": "1.1", "lon": "2.2", "elevation_ft": "3"}
