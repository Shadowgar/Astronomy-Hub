from datetime import datetime, timedelta, timezone
import pytest
from backend.app.services import tonight_forecast as forecast

START = datetime(2026, 10, 2, 0, tzinfo=timezone.utc)
END = START + timedelta(hours=6)


def raw(hours=7):
    return dict(
        hourly=dict(
            time=[int((START + timedelta(hours=i)).timestamp()) for i in range(hours)],
            cloud_cover=[0] * hours,
            temperature_2m=[0] * hours,
        )
    )


def test_forecast_coverage_zero_unknown_fields_and_generation_time():
    result = forecast.normalize_forecast(raw(), START, END, fetched_at=START)
    assert result["status"] == "available"
    assert result["hours"][0]["cloud_cover_pct"] == 0
    assert result["hours"][0]["temperature_c"] == 0
    assert "visibility_m" not in result["hours"][0]
    assert result["generated_at"] is None
    assert result["coverage_end"] == "2026-10-02T06:00:00Z"


def test_partial_missing_hour_and_unavailable():
    assert (
        forecast.normalize_forecast(raw(3), START, END, fetched_at=START)["status"]
        == "partial"
    )
    data = raw()
    data["hourly"]["time"][3] = data["hourly"]["time"][2]
    assert (
        forecast.normalize_forecast(data, START, END, fetched_at=START)["status"]
        == "partial"
    )
    assert (
        forecast.normalize_forecast(
            raw(), END + timedelta(days=4), END + timedelta(days=5), fetched_at=START
        )["status"]
        == "unavailable"
    )
    assert (
        forecast.normalize_forecast({}, START, END, fetched_at=START)["status"]
        == "unavailable"
    )


def test_stale_forecast_not_presented_as_fresh():
    r = forecast.normalize_forecast(
        raw(), START, END, fetched_at=START - timedelta(hours=2), now=START
    )
    assert r["status"] == "stale"
    assert r["hours"] == []


def test_weather_provider_failure_and_single_request(monkeypatch):
    calls = []
    monkeypatch.setattr(forecast, "cache_get", lambda k: None)
    monkeypatch.setattr(forecast, "cache_set", lambda *a, **kw: True)

    def fetch(url, **kw):
        calls.append(kw)
        return raw()

    monkeypatch.setattr(forecast, "_http_get_json", fetch)
    assert forecast.fetch_forecast(start=START, end=END)["status"] == "available"
    assert len(calls) == 1
    assert calls[0]["params"]["timeformat"] == "unixtime"
    assert "current" not in calls[0]["params"]
    monkeypatch.setattr(
        forecast,
        "_http_get_json",
        lambda *a, **kw: (_ for _ in ()).throw(RuntimeError()),
    )
    assert forecast.fetch_forecast(start=START, end=END)["status"] == "unavailable"
