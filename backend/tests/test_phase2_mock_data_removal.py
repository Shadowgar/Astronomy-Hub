from backend.app.services import conditions_service


def test_conditions_response_is_provider_backed_not_static_mock(monkeypatch):
    monkeypatch.delenv("SIMULATE_NORMALIZER_FAIL", raising=False)
    monkeypatch.setattr(conditions_service, "cache_get", lambda key: None)
    monkeypatch.setattr(conditions_service, "cache_set", lambda key, value, ttl_seconds=None: True)

    monkeypatch.setattr(
        conditions_service,
        "fetch_normalized_live_inputs",
        lambda location, time_context: {
            "conditions": {
                "observing_score": "good",
                "summary": "Live weather available",
                "source": "open_meteo",
                "last_updated": "2026-03-31T12:00:00Z",
                "cloud_cover_pct": 20,
                "visibility_m": 10000,
                "temperature_c": 7.0,
                "weather_code": 1,
            },
            "provider_trace": {"degraded": False, "missing_sources": [], "timestamp_utc": "2026-03-31T12:00:00Z"},
        },
    )

    status_code, payload = conditions_service.build_conditions_response()

    assert status_code == 200
    assert payload.get("status") == "ok"
    data = payload.get("data") or {}
    assert data.get("source") == "open_meteo"
    assert data.get("summary") == "Live weather available"
    assert data.get("degraded") is False
    assert str(data.get("radar_source") or "") == "noaa_nws_eventdriven"
    assert "mapservices.weather.noaa.gov" in str(data.get("radar_image_url") or "")
    assert isinstance(data.get("radar_frame_urls"), list)
    assert len(data.get("radar_frame_urls") or []) >= 1


def test_conditions_response_exposes_degraded_mode_when_provider_missing(monkeypatch):
    monkeypatch.delenv("SIMULATE_NORMALIZER_FAIL", raising=False)
    monkeypatch.setattr(conditions_service, "cache_get", lambda key: None)
    monkeypatch.setattr(conditions_service, "cache_set", lambda key, value, ttl_seconds=None: True)

    monkeypatch.setattr(
        conditions_service,
        "fetch_normalized_live_inputs",
        lambda location, time_context: {
            "conditions": None,
            "provider_trace": {
                "degraded": True,
                "missing_sources": ["open_meteo"],
                "timestamp_utc": "2026-03-31T12:00:00Z",
            },
        },
    )

    status_code, payload = conditions_service.build_conditions_response()

    assert status_code == 200
    data = payload.get("data") or {}
    assert data.get("degraded") is True
    assert data.get("missing_sources") == ["open_meteo"]
    assert "degraded mode is active" in str(data.get("summary") or "").lower()
    assert str(data.get("radar_source") or "") == "noaa_nws_eventdriven"
    assert "mapservices.weather.noaa.gov" in str(data.get("radar_image_url") or "")
    assert isinstance(data.get("radar_frame_urls"), list)
    assert len(data.get("radar_frame_urls") or []) >= 1
