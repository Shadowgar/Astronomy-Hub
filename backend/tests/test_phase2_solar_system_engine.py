from backend.app.services import live_providers
from backend.app.services._legacy_scene_logic import _build_solar_system_engine_slice


def test_jpl_ephemeris_fetches_expected_body_set(monkeypatch):
    monkeypatch.setattr(live_providers, "_cache_get", lambda key: None)
    monkeypatch.setattr(live_providers, "_cache_set", lambda key, payload, ttl_seconds: None)

    seen_commands: list[str] = []

    def _http_get_json(url, *, params=None, timeout_s=5.0):
        command = str((params or {}).get("COMMAND") or "").strip("'")
        seen_commands.append(command)
        return {"result": "$$SOE\n2026-Mar-31 00:00 A 180.0 45.0\n$$EOE"}

    monkeypatch.setattr(live_providers, "_http_get_json", _http_get_json)

    payload = live_providers.fetch_jpl_ephemeris(40.0, -75.0, elevation_ft=100.0)

    expected_ids = {"moon", "mercury", "venus", "mars", "jupiter", "saturn"}
    returned_ids = {str(item.get("id") or "") for item in payload}
    assert expected_ids.issubset(returned_ids)
    assert set(seen_commands) == {body_id for body_id, _ in live_providers.JPL_EPHEMERIS_BODIES}


def test_solar_system_slice_filters_below_horizon_and_keeps_provider_source():
    objects = _build_solar_system_engine_slice(
        live_inputs={
            "ephemeris": [
                {"id": "mars", "name": "Mars", "azimuth": 220.0, "elevation": 35.0, "source": "jpl_ephemeris"},
                {"id": "venus", "name": "Venus", "azimuth": 95.0, "elevation": -3.0, "source": "jpl_ephemeris"},
            ]
        }
    )

    assert len(objects) == 1
    assert objects[0]["id"] == "mars"
    assert objects[0]["engine"] == "solar_system"
    assert objects[0]["provider_source"] == "jpl_ephemeris"
