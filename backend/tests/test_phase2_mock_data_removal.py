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
                "confidence": "high",
                "warnings": ["light dew risk"],
                "best_for": ["deep_sky", "planetary"],
                "conditions": {
                    "cloud_cover": "20%",
                    "transparency": "above_average",
                    "seeing": "4/5",
                    "darkness": "5.3 mag",
                    "smoke": "low",
                    "wind": "5.4 mph",
                    "humidity": "62%",
                },
                "source": "open_meteo",
                "last_updated": "2026-03-31T12:00:00Z",
                "cloud_cover_pct": 20,
                "visibility_m": 10000,
                "temperature_c": 7.0,
                "humidity_pct": 62,
                "wind_mph": 5.4,
                "dew_point_c": 2.1,
                "transparency": "above_average",
                "seeing": "4/5",
                "darkness": "5.3 mag",
                "smoke": "low",
                "moon_interference": "moderate",
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
    assert data.get("confidence") == "high"
    assert data.get("warnings") == ["light dew risk"]
    assert data.get("best_for") == ["deep_sky", "planetary"]
    assert data.get("transparency") == "above_average"
    assert data.get("seeing") == "4/5"
    assert data.get("darkness") == "5.3 mag"
    assert data.get("smoke") == "low"
    assert data.get("moon_interference") == "moderate"
    assert data.get("conditions", {}).get("humidity") == "62%"
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
    assert data.get("transparency") == "unknown"
    assert data.get("seeing") == "unknown"
    assert data.get("darkness") == "unknown"
    assert data.get("conditions", {}).get("cloud_cover") == "unknown"
    assert "degraded mode is active" in str(data.get("summary") or "").lower()
    assert str(data.get("radar_source") or "") == "noaa_nws_eventdriven"
    assert "mapservices.weather.noaa.gov" in str(data.get("radar_image_url") or "")
    assert isinstance(data.get("radar_frame_urls"), list)
    assert len(data.get("radar_frame_urls") or []) >= 1


def test_conditions_response_prefers_ingested_radar_contract(monkeypatch):
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
                "confidence": "high",
                "warnings": [],
                "best_for": ["planetary"],
                "conditions": {
                    "cloud_cover": "20%",
                    "transparency": "above_average",
                    "seeing": "4/5",
                    "darkness": "5.3 mag",
                    "smoke": "low",
                    "wind": "5.4 mph",
                    "humidity": "62%",
                },
                "source": "open_meteo",
                "last_updated": "2026-03-31T12:00:00Z",
                "cloud_cover_pct": 20,
                "visibility_m": 10000,
                "temperature_c": 7.0,
                "humidity_pct": 62,
                "wind_mph": 5.4,
                "dew_point_c": 2.1,
                "transparency": "above_average",
                "seeing": "4/5",
                "darkness": "5.3 mag",
                "smoke": "low",
                "moon_interference": "moderate",
                "weather_code": 1,
            },
            "radar": {
                "source": "noaa_nws_eventdriven",
                "generated_at": "2026-03-31T12:00:00Z",
                "frame_step_minutes": 10,
                "frame_urls": ["https://example.test/radar/frame1.png", "https://example.test/radar/frame2.png"],
                "image_url": "https://example.test/radar/frame2.png",
                "coverage_note": "test",
            },
            "provider_trace": {"degraded": False, "missing_sources": [], "timestamp_utc": "2026-03-31T12:00:00Z"},
        },
    )

    status_code, payload = conditions_service.build_conditions_response()

    assert status_code == 200
    data = payload.get("data") or {}
    assert data.get("radar_source") == "noaa_nws_eventdriven"
    assert data.get("radar_image_url") == "https://example.test/radar/frame2.png"
    assert data.get("radar_frame_urls") == [
        "https://example.test/radar/frame1.png",
        "https://example.test/radar/frame2.png",
    ]
