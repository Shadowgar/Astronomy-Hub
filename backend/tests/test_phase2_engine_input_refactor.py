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
    assert any(obj.get("type") == "deep_sky" for obj in objects)
    assert any(obj.get("provider_source") == "messier_catalog" for obj in objects if obj.get("type") == "deep_sky")


def test_object_detail_related_objects_for_solar_objects_stay_in_solar_family():
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
        {"id": "25544", "name": "ISS", "type": "satellite", "engine": "satellites", "summary": "Pass now"},
    ]

    detail = logic.build_phase1_object_detail(found, scene_objects=scene_objects)
    related = detail.get("related_objects") or []
    titles = [item.get("title") for item in related if isinstance(item, dict)]

    assert "Mars" in titles
    assert "ISS" not in titles
    assert all(item.get("type") == "object" for item in related if isinstance(item, dict))


def test_phase1_scene_state_keeps_cross_engine_coverage_under_object_cap(monkeypatch):
    satellites = [
        {
            "id": f"sat-{idx}",
            "name": f"SAT-{idx}",
            "type": "satellite",
            "engine": "satellites",
            "summary": "Synthetic satellite",
            "relevance_score": 0.99 - (idx * 0.001),
            "position": {"azimuth": 180.0, "elevation": 45.0},
            "visibility": {"is_visible": True},
        }
        for idx in range(20)
    ]
    planets = [
        {
            "id": "jupiter",
            "name": "Jupiter",
            "type": "planet",
            "engine": "solar_system",
            "summary": "Synthetic planet",
            "relevance_score": 0.2,
            "position": {"azimuth": 120.0, "elevation": 35.0},
            "visibility": {"is_visible": True},
        }
    ]
    deep_sky = [
        {
            "id": "m13",
            "name": "M13",
            "type": "deep_sky",
            "engine": "deep_sky",
            "summary": "Synthetic deep sky target",
            "relevance_score": 0.1,
            "position": {"azimuth": 200.0, "elevation": 25.0},
            "visibility": {"is_visible": True},
        }
    ]

    monkeypatch.setattr(logic, "_fetch_live_inputs", lambda location, time_context: {})
    monkeypatch.setattr(logic, "_build_satellite_engine_slice", lambda **kwargs: satellites)
    monkeypatch.setattr(logic, "_build_solar_system_engine_slice", lambda **kwargs: planets)
    monkeypatch.setattr(logic, "_build_deep_sky_engine_slice", lambda **kwargs: deep_sky)

    state = logic.build_phase1_scene_state()
    objects = ((state.get("scene") or {}).get("objects")) or []
    object_types = {str(obj.get("type") or "") for obj in objects}

    assert len(objects) <= 10
    assert "satellite" in object_types
    assert "planet" in object_types
    assert "deep_sky" in object_types


def test_deep_sky_object_detail_surfaces_catalog_metadata():
    found = {
        "id": "m42",
        "name": "M42 Orion Nebula",
        "type": "deep_sky",
        "engine": "deep_sky",
        "provider_source": "messier_catalog",
        "summary": "M42 nebula at 36.0° altitude.",
        "position": {"azimuth": 142.4, "elevation": 36.0},
        "catalog": "M42",
        "constellation": "Orion",
        "magnitude": 4.0,
        "object_class": "nebula",
        "visibility": {
            "is_visible": True,
            "visibility_window_start": "2026-03-31T12:00:00Z",
            "visibility_window_end": "2026-03-31T14:00:00Z",
        },
    }

    detail = logic.build_phase1_object_detail(found, scene_objects=[found])
    related = detail.get("related_objects") or []
    by_title = {str(item.get("title")): str(item.get("summary")) for item in related if isinstance(item, dict)}

    assert detail.get("summary") == "M42 Orion Nebula in Orion (M42)."
    assert by_title.get("Catalog") == "M42"
    assert by_title.get("Catalog reference") == "https://messier.seds.org/m/m042.html"
    assert by_title.get("Object class") == "nebula"
    assert by_title.get("Constellation") == "Orion"
    assert by_title.get("Magnitude") == "4.0"
    assert by_title.get("Azimuth") == "142.4 deg"
    assert by_title.get("Elevation") == "36.0 deg"
    assert by_title.get("Visibility") == "Visible now"
    assert by_title.get("Visibility window start") == "2026-03-31T12:00:00Z"
    assert by_title.get("Visibility window end") == "2026-03-31T14:00:00Z"
    assert by_title.get("Best viewing time") == "2026-03-31T12:00:00Z"


def test_deep_sky_object_detail_uses_object_specific_fallback_media_when_resolver_misses(monkeypatch):
    from backend.services import imageResolver

    monkeypatch.setattr(imageResolver, "get_object_image", lambda target_name: None)

    found = {
        "id": "m42",
        "name": "M42 Orion Nebula",
        "type": "deep_sky",
        "engine": "deep_sky",
        "provider_source": "messier_catalog",
        "summary": "M42 nebula at 36.0° altitude.",
        "catalog": "M42",
        "constellation": "Orion",
        "magnitude": 4.0,
        "object_class": "nebula",
        "visibility": {"is_visible": True},
    }

    detail = logic.build_phase1_object_detail(found, scene_objects=[found])
    media = detail.get("media") or []
    assert media
    assert "Orion_Nebula" in str(media[0].get("url") or "")
