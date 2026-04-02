from backend.app.services import scene_service


def test_planets_scope_falls_back_to_planet_lookup_when_phase1_scene_is_starved(monkeypatch):
    monkeypatch.setattr(
        scene_service,
        "build_phase1_scene_state",
        lambda parsed_location=None, as_of=None: {
            "scene": {
                "objects": [
                    {
                        "id": "iss",
                        "name": "ISS",
                        "type": "satellite",
                        "engine": "satellite",
                        "relevance_score": 0.95,
                    }
                ]
            },
            "provider_trace": {"degraded": False, "missing_sources": []},
        },
    )
    monkeypatch.setattr(
        scene_service,
        "get_phase2_object_lookup",
        lambda parsed_location=None: {
            "jupiter": {
                "id": "jupiter",
                "name": "Jupiter",
                "type": "planet",
                "engine": "planets",
                "relevance_score": 0.8,
                "visibility": {"is_visible": True},
            }
        },
    )

    payload = scene_service.build_phase2_scope_scene_payload_with_context(
        "solar_system",
        "planets",
        "visible_now",
        lat="40.0",
        lon="-75.0",
        as_of="2026-03-31T12:00:00Z",
    )

    objects = payload.get("objects") or []
    assert len(objects) == 1
    assert objects[0].get("id") == "jupiter"
    assert objects[0].get("type") == "planet"

