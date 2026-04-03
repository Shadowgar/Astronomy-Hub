from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services import live_ingestion

client = TestClient(app)


def _request_json(path: str):
    resp = client.get(path, headers={"User-Agent": "pytest"})
    return resp.status_code, resp.json()


def _install_events_stubs(monkeypatch):
    live_ingestion._clear_ingestion_cache_for_tests()

    monkeypatch.setattr(
        live_ingestion,
        "fetch_open_meteo_conditions",
        lambda lat, lon: {
            "cloud_cover_pct": 20,
            "visibility_m": 12000,
            "temperature_c": 8.0,
            "weather_code": 1,
            "observing_score": "good",
            "summary": "clear",
            "last_updated": "2026-03-31T11:50:00Z",
        },
    )
    monkeypatch.setattr(live_ingestion, "fetch_celestrak_active", lambda limit=400, **kwargs: [])
    monkeypatch.setattr(live_ingestion, "fetch_opensky_nearby", lambda lat, lon, radius_km=450.0, limit=6: [])
    monkeypatch.setattr(live_ingestion, "fetch_jpl_ephemeris", lambda lat, lon, elevation_ft=None, as_of=None: [])
    monkeypatch.setattr(live_ingestion, "fetch_noaa_radar_eventdriven", lambda lat, lon, as_of=None: None)

    now = datetime.now(timezone.utc).replace(microsecond=0)
    monkeypatch.setattr(
        live_ingestion,
        "fetch_swpc_alerts",
        lambda limit=3: [
            {
                "priority": "notice",
                "category": "space_weather",
                "title": "NOAA Kp update recent-low",
                "summary": "Calm geomagnetic conditions (Kp 3.00)",
                "relevance": "low",
                "event_time": (now - timedelta(hours=1)).isoformat(),
            },
            {
                "priority": "critical",
                "category": "space_weather",
                "title": "NOAA Kp update urgent",
                "summary": "Geomagnetic storm-level activity (Kp 7.00)",
                "relevance": "high",
                "event_time": (now - timedelta(hours=2)).isoformat(),
            },
            {
                "priority": "high",
                "category": "space_weather",
                "title": "NOAA Kp update elevated",
                "summary": "Elevated geomagnetic activity (Kp 5.00)",
                "relevance": "medium",
                "event_time": (now - timedelta(hours=3)).isoformat(),
            },
            {
                "priority": "major",
                "category": "space_weather",
                "title": "NOAA Kp update stale-window",
                "summary": "Older event outside active window",
                "relevance": "high",
                "event_time": (now - timedelta(hours=72)).isoformat(),
            },
        ],
    )


def test_alerts_endpoint_returns_ranked_time_windowed_events(monkeypatch):
    _install_events_stubs(monkeypatch)
    status, payload = _request_json("/api/v1/alerts?lat=40.0&lon=-75.0")

    assert status == 200
    assert isinstance(payload, list)
    assert payload
    assert len(payload) <= 3
    assert all(isinstance(item.get("event_time"), str) and item.get("event_time") for item in payload)
    assert all(item.get("source") == "noaa_swpc" for item in payload)
    titles = [str(item.get("title") or "") for item in payload]
    assert "NOAA Kp update stale-window" not in titles
    assert payload[0].get("priority") == "critical"


def test_alerts_endpoint_is_deterministic_for_identical_inputs(monkeypatch):
    _install_events_stubs(monkeypatch)
    path = "/api/v1/alerts?lat=40.0&lon=-75.0"
    status_1, payload_1 = _request_json(path)
    status_2, payload_2 = _request_json(path)

    assert status_1 == 200
    assert status_2 == 200
    assert payload_1 == payload_2
