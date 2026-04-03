from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services import live_ingestion

client = TestClient(app)


def _request_json(path: str):
    resp = client.get(path, headers={"User-Agent": "pytest"})
    return resp.status_code, resp.json()


def _install_solar_system_time_context_stubs(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()

    monkeypatch.setattr(
        live_ingestion,
        "fetch_open_meteo_conditions",
        lambda lat, lon: {
            "cloud_cover_pct": 12,
            "visibility_m": 14000,
            "temperature_c": 6.0,
            "weather_code": 1,
            "observing_score": "excellent",
            "summary": "clear",
            "last_updated": "2026-03-31T11:50:00Z",
        },
    )
    monkeypatch.setattr(live_ingestion, "fetch_celestrak_active", lambda limit=400, **kwargs: [])
    monkeypatch.setattr(live_ingestion, "fetch_opensky_nearby", lambda lat, lon, radius_km=450.0, limit=6: [])
    monkeypatch.setattr(live_ingestion, "fetch_swpc_alerts", lambda limit=3: [])

    def _ephemeris(lat, lon, elevation_ft=None, as_of=None):
        hour = float(as_of.hour if as_of is not None else 0.0)
        return [
            {"id": "mars", "name": "Mars", "azimuth": hour * 10.0, "elevation": 45.0},
            {"id": "jupiter", "name": "Jupiter", "azimuth": hour * 10.0 + 5.0, "elevation": 35.0},
        ]

    monkeypatch.setattr(live_ingestion, "fetch_jpl_ephemeris", _ephemeris)


def _install_satellite_time_context_stubs(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()

    monkeypatch.setattr(
        live_ingestion,
        "fetch_open_meteo_conditions",
        lambda lat, lon: {
            "cloud_cover_pct": 12,
            "visibility_m": 14000,
            "temperature_c": 6.0,
            "weather_code": 1,
            "observing_score": "excellent",
            "summary": "clear",
            "last_updated": "2026-03-31T11:50:00Z",
        },
    )
    monkeypatch.setattr(
        live_ingestion,
        "fetch_celestrak_active",
        lambda limit=400, **kwargs: [
            {"id": "25544", "name": "ISS", "source": "celestrak"},
            {"id": "20580", "name": "HST", "source": "celestrak"},
        ],
    )
    monkeypatch.setattr(live_ingestion, "fetch_opensky_nearby", lambda lat, lon, radius_km=450.0, limit=6: [])
    monkeypatch.setattr(live_ingestion, "fetch_jpl_ephemeris", lambda lat, lon, elevation_ft=None, as_of=None: [])
    monkeypatch.setattr(live_ingestion, "fetch_swpc_alerts", lambda limit=3: [])


def _install_satellite_tle_time_context_stubs(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()

    monkeypatch.setattr(
        live_ingestion,
        "fetch_open_meteo_conditions",
        lambda lat, lon: {
            "cloud_cover_pct": 12,
            "visibility_m": 14000,
            "temperature_c": 6.0,
            "weather_code": 1,
            "observing_score": "excellent",
            "summary": "clear",
            "last_updated": "2026-03-31T11:50:00Z",
        },
    )
    monkeypatch.setattr(
        live_ingestion,
        "fetch_celestrak_active",
        lambda limit=400, **kwargs: [
            {
                "id": "25544",
                "name": "ISS",
                "source": "space_track",
                "tle_line1": "1 25544U 98067A   26091.50000000  .00001234  00000-0  10270-4 0  9991",
                "tle_line2": "2 25544  51.6433 123.4567 0003642 278.1234 123.9876 15.49812345678901",
            }
        ],
    )
    monkeypatch.setattr(live_ingestion, "fetch_opensky_nearby", lambda lat, lon, radius_km=450.0, limit=6: [])
    monkeypatch.setattr(live_ingestion, "fetch_jpl_ephemeris", lambda lat, lon, elevation_ft=None, as_of=None: [])
    monkeypatch.setattr(live_ingestion, "fetch_swpc_alerts", lambda limit=3: [])


def _install_solar_system_below_horizon_stubs(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()

    monkeypatch.setattr(
        live_ingestion,
        "fetch_open_meteo_conditions",
        lambda lat, lon: {
            "cloud_cover_pct": 30,
            "visibility_m": 12000,
            "temperature_c": 4.0,
            "weather_code": 2,
            "observing_score": "fair",
            "summary": "mixed",
            "last_updated": "2026-03-31T11:50:00Z",
        },
    )
    monkeypatch.setattr(live_ingestion, "fetch_celestrak_active", lambda limit=400, **kwargs: [])
    monkeypatch.setattr(live_ingestion, "fetch_opensky_nearby", lambda lat, lon, radius_km=450.0, limit=6: [])
    monkeypatch.setattr(live_ingestion, "fetch_swpc_alerts", lambda limit=3: [])
    monkeypatch.setattr(
        live_ingestion,
        "fetch_jpl_ephemeris",
        lambda lat, lon, elevation_ft=None, as_of=None: [
            {"id": "mercury", "name": "Mercury", "azimuth": 70.0, "elevation": -8.0},
            {"id": "venus", "name": "Venus", "azimuth": 90.0, "elevation": -12.0},
            {"id": "mars", "name": "Mars", "azimuth": 110.0, "elevation": -5.5},
            {"id": "jupiter", "name": "Jupiter", "azimuth": 130.0, "elevation": -3.0},
            {"id": "saturn", "name": "Saturn", "azimuth": 150.0, "elevation": -7.0},
        ],
    )


def _install_deep_sky_time_context_stubs(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()

    monkeypatch.setattr(
        live_ingestion,
        "fetch_open_meteo_conditions",
        lambda lat, lon: {
            "cloud_cover_pct": 12,
            "visibility_m": 14000,
            "temperature_c": 6.0,
            "weather_code": 1,
            "observing_score": "excellent",
            "summary": "clear",
            "last_updated": "2026-03-31T11:50:00Z",
        },
    )
    monkeypatch.setattr(live_ingestion, "fetch_celestrak_active", lambda limit=400, **kwargs: [])
    monkeypatch.setattr(live_ingestion, "fetch_opensky_nearby", lambda lat, lon, radius_km=450.0, limit=6: [])
    monkeypatch.setattr(live_ingestion, "fetch_swpc_alerts", lambda limit=3: [])
    monkeypatch.setattr(live_ingestion, "fetch_jpl_ephemeris", lambda lat, lon, elevation_ft=None, as_of=None: [])


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


def test_above_me_scene_exposes_traceability_metadata():
    status, payload = _request_json(
        "/api/v1/scene?scope=above_me&engine=above_me&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )

    assert status == 200
    assert isinstance(payload.get("timestamp"), str) and payload.get("timestamp")
    assert isinstance(payload.get("degraded"), bool)
    assert isinstance(payload.get("missing_sources"), list)
    provider_trace = payload.get("provider_trace") or {}
    assert isinstance(provider_trace, dict)
    assert isinstance(provider_trace.get("timestamp_utc"), str) and provider_trace.get("timestamp_utc")


def test_scene_objects_include_provider_source():
    status, payload = _request_json(
        "/api/v1/scene?scope=above_me&engine=above_me&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )

    assert status == 200
    objects = payload.get("objects") or []
    assert objects
    for obj in objects:
        assert isinstance(obj.get("provider_source"), str)
        assert obj.get("provider_source")


def test_planets_scene_changes_when_at_changes(monkeypatch):
    _install_solar_system_time_context_stubs(monkeypatch)
    path_1 = (
        "/api/v1/scene?scope=solar_system&engine=planets&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )
    path_2 = (
        "/api/v1/scene?scope=solar_system&engine=planets&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T13:00:00Z"
    )
    status_1, payload_1 = _request_json(path_1)
    status_2, payload_2 = _request_json(path_2)

    assert status_1 == 200
    assert status_2 == 200
    assert payload_1 != payload_2

    az_1 = ((payload_1.get("objects") or [{}])[0].get("position") or {}).get("azimuth")
    az_2 = ((payload_2.get("objects") or [{}])[0].get("position") or {}).get("azimuth")
    assert az_1 != az_2


def test_planets_scene_identical_for_identical_inputs(monkeypatch):
    _install_solar_system_time_context_stubs(monkeypatch)
    path = (
        "/api/v1/scene?scope=solar_system&engine=planets&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )

    # Warm once so repeated assertions compare identical cache-state responses.
    _request_json(path)
    status_1, payload_1 = _request_json(path)
    status_2, payload_2 = _request_json(path)

    assert status_1 == 200
    assert status_2 == 200
    assert payload_1 == payload_2


def test_planets_scene_falls_back_to_below_horizon_context_when_none_visible(monkeypatch):
    _install_solar_system_below_horizon_stubs(monkeypatch)
    status, payload = _request_json(
        "/api/v1/scene?scope=solar_system&engine=planets&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T04:00:00Z"
    )

    assert status == 200
    objects = payload.get("objects") or []
    assert objects
    assert all(obj.get("type") == "planet" for obj in objects)
    assert all(((obj.get("visibility") or {}).get("is_visible")) is False for obj in objects)
    assert any("below horizon" in str(obj.get("summary") or "").lower() for obj in objects)


def test_satellites_scene_changes_when_at_changes(monkeypatch):
    _install_satellite_time_context_stubs(monkeypatch)
    path_1 = (
        "/api/v1/scene?scope=earth&engine=satellites&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )
    path_2 = (
        "/api/v1/scene?scope=earth&engine=satellites&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T13:00:00Z"
    )
    status_1, payload_1 = _request_json(path_1)
    status_2, payload_2 = _request_json(path_2)

    assert status_1 == 200
    assert status_2 == 200
    assert payload_1 != payload_2

    window_1 = ((payload_1.get("objects") or [{}])[0].get("visibility") or {}).get("visibility_window_start")
    window_2 = ((payload_2.get("objects") or [{}])[0].get("visibility") or {}).get("visibility_window_start")
    assert isinstance(window_1, str) and window_1
    assert isinstance(window_2, str) and window_2
    assert window_1 != window_2


def test_satellites_scene_identical_for_identical_inputs(monkeypatch):
    _install_satellite_time_context_stubs(monkeypatch)
    path = (
        "/api/v1/scene?scope=earth&engine=satellites&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )

    # Warm once so repeated assertions compare identical cache-state responses.
    _request_json(path)
    status_1, payload_1 = _request_json(path)
    status_2, payload_2 = _request_json(path)

    assert status_1 == 200
    assert status_2 == 200
    assert payload_1 == payload_2


def test_satellites_scene_tle_path_changes_when_at_changes(monkeypatch):
    _install_satellite_tle_time_context_stubs(monkeypatch)
    path_1 = (
        "/api/v1/scene?scope=earth&engine=satellites&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )
    path_2 = (
        "/api/v1/scene?scope=earth&engine=satellites&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T13:00:00Z"
    )
    status_1, payload_1 = _request_json(path_1)
    status_2, payload_2 = _request_json(path_2)

    assert status_1 == 200
    assert status_2 == 200
    assert payload_1 != payload_2

    window_1 = ((payload_1.get("objects") or [{}])[0].get("visibility") or {}).get("visibility_window_start")
    window_2 = ((payload_2.get("objects") or [{}])[0].get("visibility") or {}).get("visibility_window_start")
    assert isinstance(window_1, str) and window_1
    assert isinstance(window_2, str) and window_2
    assert window_1 != window_2


def test_satellites_scene_tle_path_identical_for_identical_inputs(monkeypatch):
    _install_satellite_tle_time_context_stubs(monkeypatch)
    path = (
        "/api/v1/scene?scope=earth&engine=satellites&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )

    _request_json(path)
    status_1, payload_1 = _request_json(path)
    status_2, payload_2 = _request_json(path)

    assert status_1 == 200
    assert status_2 == 200
    assert payload_1 == payload_2


def test_moon_engine_returns_only_moon_object(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()

    monkeypatch.setattr(
        live_ingestion,
        "fetch_open_meteo_conditions",
        lambda lat, lon: {
            "cloud_cover_pct": 12,
            "visibility_m": 14000,
            "temperature_c": 6.0,
            "weather_code": 1,
            "observing_score": "excellent",
            "summary": "clear",
            "last_updated": "2026-03-31T11:50:00Z",
        },
    )
    monkeypatch.setattr(live_ingestion, "fetch_celestrak_active", lambda limit=400, **kwargs: [])
    monkeypatch.setattr(live_ingestion, "fetch_opensky_nearby", lambda lat, lon, radius_km=450.0, limit=6: [])
    monkeypatch.setattr(live_ingestion, "fetch_swpc_alerts", lambda limit=3: [])
    monkeypatch.setattr(
        live_ingestion,
        "fetch_jpl_ephemeris",
        lambda lat, lon, elevation_ft=None, as_of=None: [
            {"id": "moon", "name": "Moon", "azimuth": 180.0, "elevation": 45.0},
            {"id": "mars", "name": "Mars", "azimuth": 200.0, "elevation": 35.0},
        ],
    )

    status, payload = _request_json(
        "/api/v1/scene?scope=sun&engine=moon&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )
    assert status == 200
    assert payload.get("engine") == "moon"
    objects = payload.get("objects") or []
    assert len(objects) == 1
    assert objects[0].get("id") == "moon"
    assert objects[0].get("type") == "moon"


def test_moon_engine_identical_for_identical_inputs(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()
    monkeypatch.setattr(
        live_ingestion,
        "fetch_open_meteo_conditions",
        lambda lat, lon: {
            "cloud_cover_pct": 12,
            "visibility_m": 14000,
            "temperature_c": 6.0,
            "weather_code": 1,
            "observing_score": "excellent",
            "summary": "clear",
            "last_updated": "2026-03-31T11:50:00Z",
        },
    )
    monkeypatch.setattr(live_ingestion, "fetch_celestrak_active", lambda limit=400, **kwargs: [])
    monkeypatch.setattr(live_ingestion, "fetch_opensky_nearby", lambda lat, lon, radius_km=450.0, limit=6: [])
    monkeypatch.setattr(live_ingestion, "fetch_swpc_alerts", lambda limit=3: [])
    monkeypatch.setattr(
        live_ingestion,
        "fetch_jpl_ephemeris",
        lambda lat, lon, elevation_ft=None, as_of=None: [
            {"id": "moon", "name": "Moon", "azimuth": 180.0, "elevation": 45.0},
            {"id": "mars", "name": "Mars", "azimuth": 200.0, "elevation": 35.0},
        ],
    )

    path = (
        "/api/v1/scene?scope=sun&engine=moon&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )
    _request_json(path)
    status_1, payload_1 = _request_json(path)
    status_2, payload_2 = _request_json(path)
    assert status_1 == 200
    assert status_2 == 200
    assert payload_1 == payload_2


def test_moon_engine_includes_solar_activity_classification_from_alerts(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()
    monkeypatch.setattr(
        live_ingestion,
        "fetch_open_meteo_conditions",
        lambda lat, lon: {
            "cloud_cover_pct": 12,
            "visibility_m": 14000,
            "temperature_c": 6.0,
            "weather_code": 1,
            "observing_score": "excellent",
            "summary": "clear",
            "last_updated": "2026-03-31T11:50:00Z",
        },
    )
    monkeypatch.setattr(live_ingestion, "fetch_celestrak_active", lambda limit=400, **kwargs: [])
    monkeypatch.setattr(live_ingestion, "fetch_opensky_nearby", lambda lat, lon, radius_km=450.0, limit=6: [])
    monkeypatch.setattr(
        live_ingestion,
        "fetch_swpc_alerts",
        lambda limit=3: [
            {
                "priority": "high",
                "category": "space_weather",
                "title": "Geomagnetic Storm Watch",
                "summary": "Elevated geomagnetic activity expected (Kp 6).",
                "relevance": "high",
                "source": "noaa_swpc",
            }
        ],
    )
    monkeypatch.setattr(
        live_ingestion,
        "fetch_jpl_ephemeris",
        lambda lat, lon, elevation_ft=None, as_of=None: [
            {"id": "moon", "name": "Moon", "azimuth": 180.0, "elevation": 45.0},
        ],
    )

    status, payload = _request_json(
        "/api/v1/scene?scope=sun&engine=moon&filter=visible_now"
        "&lat=40.0&lon=-75.0&at=2026-03-31T12:00:00Z"
    )
    assert status == 200
    objects = payload.get("objects") or []
    assert len(objects) == 1
    moon = objects[0]
    assert moon.get("id") == "moon"
    assert moon.get("type") == "moon"
    assert moon.get("engine") == "moon"
    assert moon.get("solar_activity_status") == "active"
    assert "Solar activity: active." in str(moon.get("summary") or "")


def test_deep_sky_scene_changes_when_at_changes(monkeypatch):
    _install_deep_sky_time_context_stubs(monkeypatch)
    path_1 = (
        "/api/v1/scene?scope=deep_sky&engine=deep_sky&filter=visible_now"
        "&lat=41.3219&lon=-79.5854&at=2026-04-02T02:00:00Z"
    )
    path_2 = (
        "/api/v1/scene?scope=deep_sky&engine=deep_sky&filter=visible_now"
        "&lat=41.3219&lon=-79.5854&at=2026-04-02T06:00:00Z"
    )
    status_1, payload_1 = _request_json(path_1)
    status_2, payload_2 = _request_json(path_2)

    assert status_1 == 200
    assert status_2 == 200
    objects_1 = payload_1.get("objects") or []
    objects_2 = payload_2.get("objects") or []
    assert objects_1 and objects_2

    by_id_1 = {str(obj.get("id") or ""): obj for obj in objects_1 if isinstance(obj, dict)}
    by_id_2 = {str(obj.get("id") or ""): obj for obj in objects_2 if isinstance(obj, dict)}
    shared_ids = set(by_id_1).intersection(by_id_2)
    assert shared_ids

    moved = []
    for object_id in shared_ids:
        az_1 = ((by_id_1[object_id].get("position") or {}).get("azimuth"))
        az_2 = ((by_id_2[object_id].get("position") or {}).get("azimuth"))
        if az_1 is None or az_2 is None:
            continue
        moved.append(abs(float(az_1) - float(az_2)))

    assert moved
    assert max(moved) > 0.5


def test_deep_sky_scene_identical_for_identical_inputs(monkeypatch):
    _install_deep_sky_time_context_stubs(monkeypatch)
    path = (
        "/api/v1/scene?scope=deep_sky&engine=deep_sky&filter=visible_now"
        "&lat=41.3219&lon=-79.5854&at=2026-04-02T02:00:00Z"
    )

    _request_json(path)
    status_1, payload_1 = _request_json(path)
    status_2, payload_2 = _request_json(path)

    assert status_1 == 200
    assert status_2 == 200
    assert payload_1 == payload_2


def test_deep_sky_scene_is_catalog_backed_and_ranked(monkeypatch):
    _install_deep_sky_time_context_stubs(monkeypatch)
    status, payload = _request_json(
        "/api/v1/scene?scope=deep_sky&engine=deep_sky&filter=visible_now"
        "&lat=41.3219&lon=-79.5854&at=2026-04-02T02:00:00Z"
    )

    assert status == 200
    objects = payload.get("objects") or []
    assert objects
    assert all(obj.get("type") == "deep_sky" for obj in objects)
    assert all(obj.get("provider_source") == "messier_catalog" for obj in objects)

    scores = [float(obj.get("relevance_score") or 0.0) for obj in objects]
    assert scores == sorted(scores, reverse=True)
