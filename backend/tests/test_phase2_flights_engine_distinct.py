from backend.app.services import scene_service


def test_flights_engine_uses_flight_inputs_not_satellite_subset(monkeypatch):
    fake_phase1_state = {
        "scene": {
            "objects": [
                {
                    "id": "sat-a",
                    "name": "Sat A",
                    "type": "satellite",
                    "engine": "satellite",
                    "provider_source": "celestrak",
                    "summary": "Satellite A",
                    "position": {"elevation": 45.0},
                    "visibility": {"is_visible": True},
                    "relevance_score": 0.8,
                },
                {
                    "id": "sat-b",
                    "name": "Sat B",
                    "type": "satellite",
                    "engine": "satellite",
                    "provider_source": "celestrak",
                    "summary": "Satellite B",
                    "position": {"elevation": 32.0},
                    "visibility": {"is_visible": True},
                    "relevance_score": 0.6,
                },
            ]
        },
        "supporting": {
            "flights": [
                {
                    "id": "flight-ab123",
                    "name": "AB123",
                    "type": "satellite",
                    "engine": "flight",
                    "provider_source": "opensky",
                    "summary": "Live flight track (120 km)",
                    "position": {"elevation": 35.0, "lat": 40.1, "lon": -75.2},
                    "visibility": {"is_visible": True},
                    "relevance_score": 0.7,
                }
            ]
        },
        "provider_trace": {"degraded": False, "missing_sources": []},
    }

    monkeypatch.setattr(
        scene_service,
        "build_phase1_scene_state",
        lambda parsed_location=None, as_of=None: fake_phase1_state,
    )

    satellites_payload = scene_service.build_phase2_scope_scene_payload_with_context(
        "earth",
        engine="satellites",
        filter_slug="visible_now",
    )
    flights_payload = scene_service.build_phase2_scope_scene_payload_with_context(
        "earth",
        engine="flights",
        filter_slug="visible_now",
    )

    satellite_ids = [obj.get("id") for obj in satellites_payload.get("objects") or []]
    flight_ids = [obj.get("id") for obj in flights_payload.get("objects") or []]

    assert satellite_ids == ["sat-a", "sat-b"]
    assert flight_ids == ["flight-ab123"]
    assert flight_ids != satellite_ids
    assert all(obj.get("engine") == "flight" for obj in flights_payload.get("objects") or [])
    assert all(obj.get("provider_source") == "opensky" for obj in flights_payload.get("objects") or [])
