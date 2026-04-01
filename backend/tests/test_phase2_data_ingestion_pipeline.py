from datetime import datetime, timezone

from backend.app.services import live_ingestion


def _loc():
    return {"latitude": 40.0, "longitude": -75.0, "elevation_ft": 100.0}


def _now():
    return datetime(2026, 3, 31, 12, 0, tzinfo=timezone.utc)


def test_pipeline_normalizes_and_whitelists_provider_data(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()

    monkeypatch.setattr(
        live_ingestion,
        "fetch_open_meteo_conditions",
        lambda lat, lon: {
            "cloud_cover_pct": 22,
            "visibility_m": 11000,
            "temperature_c": 7.0,
            "weather_code": 1,
            "observing_score": "good",
            "summary": "clear",
            "last_updated": "2026-03-31T11:30:00Z",
            "raw_field": "drop_me",
        },
    )
    monkeypatch.setattr(
        live_ingestion,
        "fetch_celestrak_active",
        lambda limit=400, **kwargs: [
            {
                "id": "25544",
                "name": "ISS",
                "OBJECT_TYPE": "PAYLOAD",
                "pass_start": "2026-03-31T15:42:02.578Z",
                "max_elevation_deg": 24.0,
                "tle_line1": "1 25544U 98067A   26091.50000000  .00001234  00000-0  10270-4 0  9991",
                "tle_line2": "2 25544  51.6433 123.4567 0003642 278.1234 123.9876 15.49812345678901",
            }
        ],
    )
    monkeypatch.setattr(
        live_ingestion,
        "fetch_opensky_nearby",
        lambda lat, lon, radius_km=450.0, limit=6: [
            {
                "id": "abc123",
                "name": "TEST123",
                "distance_km": 10.0,
                "elevation": 23.0,
                "longitude": -75.2,
                "latitude": 40.1,
                "provider_extra": "drop_me",
            }
        ],
    )
    monkeypatch.setattr(
        live_ingestion,
        "fetch_jpl_ephemeris",
        lambda lat, lon, elevation_ft=None, as_of=None: [{"id": "mars", "name": "Mars", "azimuth": 200.0, "elevation": 45.0}],
    )
    monkeypatch.setattr(
        live_ingestion,
        "fetch_swpc_alerts",
        lambda limit=3: [{"priority": "notice", "category": "space_weather", "title": "Kp", "summary": "Calm", "relevance": "low"}],
    )

    payload = live_ingestion.fetch_normalized_live_inputs(_loc(), _now())

    assert payload["provider_trace"]["degraded"] is False
    assert payload["provider_trace"]["pipeline"] == "Provider->Adapter->Normalizer->Validator->Cache->EngineInput"
    assert payload["conditions"]["source"] == "open_meteo"
    assert "raw_field" not in payload["conditions"]
    assert payload["satellites"][0]["id"] == "25544"
    assert payload["satellites"][0]["name"] == "ISS"
    assert payload["satellites"][0]["source"] == "celestrak"
    assert payload["satellites"][0]["pass_start"] == "2026-03-31T15:42:02.578Z"
    assert payload["satellites"][0]["max_elevation_deg"] == 24.0
    assert payload["satellites"][0]["tle_line1"]
    assert payload["satellites"][0]["tle_line2"]
    assert payload["flights"][0]["source"] == "opensky"
    assert "provider_extra" not in payload["flights"][0]
    assert payload["ephemeris"][0]["source"] == "jpl_ephemeris"
    assert payload["alerts"][0]["source"] == "noaa_swpc"


def test_stale_conditions_are_rejected_and_degraded(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()

    monkeypatch.setattr(
        live_ingestion,
        "fetch_open_meteo_conditions",
        lambda lat, lon: {
            "cloud_cover_pct": 22,
            "visibility_m": 11000,
            "temperature_c": 7.0,
            "weather_code": 1,
            "observing_score": "good",
            "summary": "clear",
            "last_updated": "2026-03-30T00:00:00Z",
        },
    )
    monkeypatch.setattr(live_ingestion, "fetch_celestrak_active", lambda limit=400, **kwargs: [])
    monkeypatch.setattr(live_ingestion, "fetch_opensky_nearby", lambda lat, lon, radius_km=450.0, limit=6: [])
    monkeypatch.setattr(live_ingestion, "fetch_jpl_ephemeris", lambda lat, lon, elevation_ft=None, as_of=None: [])
    monkeypatch.setattr(live_ingestion, "fetch_swpc_alerts", lambda limit=3: [])

    payload = live_ingestion.fetch_normalized_live_inputs(_loc(), _now())

    assert payload["conditions"] is None
    assert payload["provider_trace"]["providers"]["open_meteo"]["ok"] is False
    assert payload["provider_trace"]["providers"]["open_meteo"]["reason"] == "stale"
    assert payload["provider_trace"]["degraded"] is True
    assert "open_meteo" in payload["provider_trace"]["missing_sources"]


def test_pipeline_cache_prevents_refetch_for_same_context(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()
    calls = {"open_meteo": 0}

    def _conditions(lat, lon):
        calls["open_meteo"] += 1
        return {
            "cloud_cover_pct": 10,
            "visibility_m": 12000,
            "temperature_c": 5.0,
            "weather_code": 1,
            "observing_score": "excellent",
            "summary": "great",
            "last_updated": "2026-03-31T11:50:00Z",
        }

    monkeypatch.setattr(live_ingestion, "fetch_open_meteo_conditions", _conditions)
    monkeypatch.setattr(live_ingestion, "fetch_celestrak_active", lambda limit=400, **kwargs: [])
    monkeypatch.setattr(live_ingestion, "fetch_opensky_nearby", lambda lat, lon, radius_km=450.0, limit=6: [])
    monkeypatch.setattr(live_ingestion, "fetch_jpl_ephemeris", lambda lat, lon, elevation_ft=None, as_of=None: [])
    monkeypatch.setattr(live_ingestion, "fetch_swpc_alerts", lambda limit=3: [])

    first = live_ingestion.fetch_normalized_live_inputs(_loc(), _now())
    second = live_ingestion.fetch_normalized_live_inputs(_loc(), _now())

    assert calls["open_meteo"] == 1
    assert first["conditions"] == second["conditions"]
    assert second["provider_trace"]["providers"]["open_meteo"]["stages"]["cache"] == "hit"
    assert second["provider_trace"]["freshness"]["ingestion_cache"]["state"] == "hit"
    assert second["provider_trace"]["freshness"]["provider_cache_ttl_seconds"]["open_meteo"] == 300


def test_pipeline_cache_refreshes_after_ttl_expiry(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()
    calls = {"open_meteo": 0}
    clock = {"now": 1000.0}

    monkeypatch.setattr(live_ingestion.time, "time", lambda: clock["now"])

    def _conditions(lat, lon):
        calls["open_meteo"] += 1
        return {
            "cloud_cover_pct": 10,
            "visibility_m": 12000,
            "temperature_c": 5.0,
            "weather_code": 1,
            "observing_score": "excellent",
            "summary": "great",
            "last_updated": "2026-03-31T11:50:00Z",
        }

    monkeypatch.setattr(live_ingestion, "fetch_open_meteo_conditions", _conditions)
    monkeypatch.setattr(live_ingestion, "fetch_celestrak_active", lambda limit=400, **kwargs: [])
    monkeypatch.setattr(live_ingestion, "fetch_opensky_nearby", lambda lat, lon, radius_km=450.0, limit=6: [])
    monkeypatch.setattr(live_ingestion, "fetch_jpl_ephemeris", lambda lat, lon, elevation_ft=None, as_of=None: [])
    monkeypatch.setattr(live_ingestion, "fetch_swpc_alerts", lambda limit=3: [])

    first = live_ingestion.fetch_normalized_live_inputs(_loc(), _now())
    clock["now"] += 91.0
    second = live_ingestion.fetch_normalized_live_inputs(_loc(), _now())

    assert calls["open_meteo"] == 2
    assert first["conditions"] == second["conditions"]
    assert first["provider_trace"]["freshness"]["ingestion_cache"]["state"] == "miss"
    assert second["provider_trace"]["freshness"]["ingestion_cache"]["state"] == "miss"


def test_pipeline_ephemeris_changes_with_scene_time_context(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()

    monkeypatch.setattr(
        live_ingestion,
        "fetch_open_meteo_conditions",
        lambda lat, lon: {
            "cloud_cover_pct": 10,
            "visibility_m": 12000,
            "temperature_c": 5.0,
            "weather_code": 1,
            "observing_score": "excellent",
            "summary": "great",
            "last_updated": "2026-03-31T11:50:00Z",
        },
    )
    monkeypatch.setattr(live_ingestion, "fetch_celestrak_active", lambda limit=400, **kwargs: [])
    monkeypatch.setattr(live_ingestion, "fetch_opensky_nearby", lambda lat, lon, radius_km=450.0, limit=6: [])
    monkeypatch.setattr(live_ingestion, "fetch_swpc_alerts", lambda limit=3: [])

    def _ephemeris(lat, lon, elevation_ft=None, as_of=None):
        hour = int(as_of.hour) if as_of is not None else 0
        return [{"id": "mars", "name": "Mars", "azimuth": float(hour), "elevation": 40.0}]

    monkeypatch.setattr(live_ingestion, "fetch_jpl_ephemeris", _ephemeris)

    t1 = datetime(2026, 3, 31, 12, 0, tzinfo=timezone.utc)
    t2 = datetime(2026, 3, 31, 13, 0, tzinfo=timezone.utc)
    payload1 = live_ingestion.fetch_normalized_live_inputs(_loc(), t1)
    payload2 = live_ingestion.fetch_normalized_live_inputs(_loc(), t2)

    assert payload1["ephemeris"] != payload2["ephemeris"]
    assert payload1["ephemeris"][0]["azimuth"] == 12.0
    assert payload2["ephemeris"][0]["azimuth"] == 13.0
