from backend.app.services import _legacy_scene_logic as logic


def _live_inputs():
    return {
        "conditions": {
            "cloud_cover_pct": 12,
            "visibility_m": 12000,
            "temperature_c": 8.0,
            "weather_code": 1,
            "observing_score": "good",
            "summary": "Clear sky",
            "last_updated": "2026-03-31T12:00:00Z",
            "source": "open_meteo",
        },
        "satellites": [
            {"id": "25544", "name": "ISS", "source": "celestrak"},
        ],
        "flights": [
            {
                "id": "abc123",
                "name": "TEST123",
                "distance_km": 20.0,
                "elevation": 30.0,
                "longitude": -75.0,
                "latitude": 40.0,
                "source": "opensky",
            }
        ],
        "ephemeris": [
            {"id": "moon", "name": "Moon", "azimuth": 180.0, "elevation": 35.0, "source": "jpl_ephemeris"},
            {"id": "mars", "name": "Mars", "azimuth": 210.0, "elevation": 20.0, "source": "jpl_ephemeris"},
        ],
        "alerts": [
            {
                "priority": "notice",
                "category": "space_weather",
                "title": "Kp update",
                "summary": "Calm geomagnetic conditions",
                "relevance": "low",
                "source": "noaa_swpc",
            }
        ],
        "provider_trace": {
            "timestamp_utc": "2026-03-31T12:00:00Z",
            "providers": {
                "open_meteo": {"ok": True, "stages": {"cache": "miss"}},
                "celestrak": {"ok": True, "stages": {"cache": "miss"}},
                "opensky": {"ok": True, "stages": {"cache": "miss"}},
                "jpl_ephemeris": {"ok": True, "stages": {"cache": "miss"}},
                "noaa_swpc": {"ok": True, "stages": {"cache": "miss"}},
            },
            "degraded": False,
            "missing_sources": [],
            "pipeline": "Provider->Adapter->Normalizer->Validator->Cache->EngineInput",
        },
    }


def test_phase1_scene_uses_provider_backed_engine_inputs(monkeypatch):
    monkeypatch.setattr(logic, "_fetch_live_inputs", lambda location, time_context: _live_inputs())

    state = logic.build_phase1_scene_state(
        parsed_location={"latitude": 40.0, "longitude": -75.0, "elevation_ft": 100.0},
        as_of="2026-03-31T12:00:00Z",
    )
    objects = ((state.get("scene") or {}).get("objects")) or []

    assert objects
    assert all((obj.get("engine") or "").lower() != "mock" for obj in objects)
    assert all((obj.get("name") or "") not in {"M31 Andromeda Galaxy", "M13 Hercules Cluster"} for obj in objects)
    assert any(obj.get("type") == "deep_sky" for obj in objects)
    assert any(obj.get("name") == "Kp update" for obj in objects)


def test_object_detail_related_objects_come_from_scene_not_mock_alerts():
    found = {
        "id": "moon",
        "name": "Moon",
        "type": "planet",
        "engine": "moon",
        "summary": "Live ephemeris position",
        "position": {"azimuth": 180.0, "elevation": 35.0},
        "visibility": {"is_visible": True},
    }
    scene_objects = [
        found,
        {
            "id": "mars",
            "name": "Mars",
            "type": "planet",
            "engine": "planets",
            "summary": "Live ephemeris position",
        },
        {
            "id": "deep-sky-kp-update",
            "name": "Kp update",
            "type": "deep_sky",
            "engine": "deep_sky",
            "summary": "Calm geomagnetic conditions",
        },
    ]

    detail = logic.build_phase1_object_detail(found, scene_objects=scene_objects)
    related = detail.get("related_objects") or []
    titles = [item.get("title") for item in related if isinstance(item, dict)]

    assert "Mars" in titles
    assert "Kp update" in titles
    assert all(item.get("type") == "object" for item in related if isinstance(item, dict))
