from datetime import datetime, timezone
import math

import pytest

from backend.app.services import observability_service as service
from backend.app.services import above_me_service, live_providers


@pytest.mark.parametrize(
    ("altitude", "state"),
    [
        (0.1, "daylight"), (0, "civil_twilight"), (-0.1, "civil_twilight"),
        (-6, "civil_twilight"), (-6.0001, "nautical_twilight"),
        (-12, "nautical_twilight"), (-12.0001, "astronomical_twilight"),
        (-18, "astronomical_night"), (-18.0001, "astronomical_night"),
    ],
)
def test_darkness_boundaries(altitude, state):
    assert service.darkness_state(altitude) == state


def test_moon_angular_separation_geometry_and_missing_values():
    assert service.angular_separation_deg(20, 30, 20, 30) == pytest.approx(0)
    assert service.angular_separation_deg(0, 0, 90, 0) == pytest.approx(90)
    assert service.angular_separation_deg(0, 0, 179.999, 0) == pytest.approx(179.999, abs=0.001)
    assert service.angular_separation_deg(None, 0, 0, 0) is None
    assert service.angular_separation_deg(math.nan, 0, 0, 0) is None


def test_geometric_horizon_preserves_unrounded_legacy_decision():
    context = {"sky_darkness": {"state": "civil_twilight", "in_astronomical_darkness": False},
               "moon": {"ra_deg": None, "dec_deg": None}}
    target = service.qualify_target({"alt": 0.0, "az": 90, "is_visible": True}, context)
    assert target["above_geometric_horizon"] is True


def test_moon_separation_uses_target_coordinate_frame():
    context = {
        "sky_darkness": {"state": "astronomical_night", "in_astronomical_darkness": True},
        "moon": {"ra_deg": 0, "dec_deg": 0, "ra_icrf_deg": 10, "dec_icrf_deg": 0},
    }
    star = service.qualify_target({"model": "star", "alt": 30, "az": 90, "ra": 10, "dec": 0}, context)
    satellite = service.qualify_target({"model": "tle_satellite", "alt": 30, "az": 90, "ra": 10, "dec": 0}, context)
    planet = service.qualify_target({"model": "planet", "alt": 30, "az": 90, "ra": 0, "dec": 0}, context)
    assert star["moon_angular_separation_deg"] == pytest.approx(0)
    assert satellite["moon_angular_separation_deg"] == pytest.approx(0)
    assert planet["moon_angular_separation_deg"] == pytest.approx(0)
    del context["moon"]["ra_icrf_deg"]
    assert service.qualify_target({"model": "star", "alt": 30, "az": 90, "ra": 10, "dec": 0}, context)["moon_angular_separation_deg"] is None


def test_context_uses_exact_local_ephemeris_and_selected_time_skips_weather(monkeypatch):
    instant = datetime(2026, 9, 27, 1, 23, 45, tzinfo=timezone.utc)
    calls = []

    def ephemeris(lat, lon, *, elevation_ft, as_of):
        calls.append(as_of)
        return [
            {"id": "sun", "elevation": -18, "ephemeris_source": "jpl_de442s_local"},
            {"id": "moon", "elevation": 31, "azimuth": 210, "ra": 20, "dec": 30,
             "ra_icrf": 20, "dec_icrf": 30,
             "ephemeris_source": "jpl_de442s_local"},
        ]

    monkeypatch.setattr(service, "compute_local_planetary_ephemeris", ephemeris)
    monkeypatch.setattr(service.live_providers, "fetch_open_meteo_conditions", lambda *_: pytest.fail("selected time fetched current weather"))
    context = service.build_observability_context(lat=41.3, lng=-79.6, elev=400, as_of=instant, explicit_time=True)
    assert calls == [instant]
    assert context["schema_version"] == "observability.v1"
    assert context["sky_darkness"]["state"] == "astronomical_night"
    assert context["moon"]["above_geometric_horizon"] is True
    assert context["weather"]["status"] == "not_evaluated_for_selected_time"
    target = service.qualify_target({"model": "star", "alt": 12, "az": 90, "ra": 110, "dec": 30}, context)
    assert target["assessment"] == "above_horizon_astronomical_night"
    assert target["moon_angular_separation_deg"] == pytest.approx(75.5224878)
    assert "potentially_observable" not in target


def test_unknown_ephemeris_and_degraded_weather_fail_closed(monkeypatch):
    def missing(*args, **kwargs):
        raise RuntimeError("release missing")

    monkeypatch.setattr(service, "compute_local_planetary_ephemeris", missing)
    monkeypatch.setattr(service.live_providers, "fetch_open_meteo_conditions", missing)
    context = service.build_observability_context(
        lat=41.3, lng=-79.6, elev=400, as_of=datetime.now(timezone.utc), explicit_time=False,
    )
    assert context["sky_darkness"]["state"] == "unknown"
    assert context["moon"]["altitude_deg"] is None
    assert context["weather"]["status"] == "degraded"
    assert service.qualify_target({"alt": 1, "az": 10, "ra": 10, "dec": 20}, context)["assessment"] == "unknown"
    assert service.qualify_target({"alt": -1, "az": 10}, context)["assessment"] == "below_geometric_horizon"


def test_current_weather_requires_fresh_provider_timestamp(monkeypatch):
    monkeypatch.setattr(service, "compute_local_planetary_ephemeris", lambda *args, **kwargs: [])
    monkeypatch.setattr(service.live_providers, "fetch_open_meteo_conditions", lambda *_: {
        "cloud_cover_pct": 0, "dew_point_c": 0, "last_updated": "2020-01-01T00:00:00Z",
        "observing_score": "excellent", "seeing": "5/5",
    })
    context = service.build_observability_context(
        lat=41.3, lng=-79.6, elev=400, as_of=datetime.now(timezone.utc), explicit_time=False,
    )
    assert context["weather"]["status"] == "stale"
    assert "cloud_cover_pct" not in context["weather"]
    monkeypatch.setattr(service.live_providers, "fetch_open_meteo_conditions", lambda *_: {
        "cloud_cover_pct": 0, "dew_point_c": 0, "last_updated": datetime.now(timezone.utc).isoformat(),
        "observing_score": "excellent", "seeing": "5/5",
    })
    fresh = service.build_observability_context(
        lat=41.3, lng=-79.6, elev=400, as_of=datetime.now(timezone.utc), explicit_time=False,
    )["weather"]
    assert fresh["status"] == "current_fresh"
    assert fresh["cloud_cover_pct"] == 0
    assert fresh["dew_point_c"] == 0
    assert "observing_score" not in fresh
    assert "seeing" not in fresh


def test_above_me_adds_context_without_changing_exact_links_or_curation(monkeypatch):
    monkeypatch.setattr(above_me_service, "cache_get", lambda *_: None)
    monkeypatch.setattr(above_me_service, "cache_set", lambda *args, **kwargs: False)
    monkeypatch.setattr(above_me_service, "_build_catalog_candidates", lambda **kwargs: [
        {"catalog": "Messier (local)", "source_id": "M31", "model": "dso", "name": "M31",
         "type": "galaxy", "ra": 10, "dec": 20, "alt": 20, "az": 100,
         "is_visible": True, "priority": 0.5, "magnitude": 3.4,
         "sky_engine_url": "/oras-sky-engine/skysource/M31?source_id=M31"},
    ])
    monkeypatch.setattr(above_me_service, "_object_source_inventory", lambda **kwargs: {})
    monkeypatch.setattr(above_me_service.observability_service, "build_observability_context", lambda **kwargs: {
        "schema_version": "observability.v1", "sky_darkness": {"state": "daylight", "in_astronomical_darkness": False},
        "moon": {"ra_deg": None, "dec_deg": None}, "weather": {"status": "not_evaluated_for_selected_time"},
    })
    result = above_me_service.build_above_me_payload(lat=41.3, lng=-79.6, time="2026-09-27T12:00:00Z")
    assert result["meta"]["observability_context"]["schema_version"] == "observability.v1"
    assert result["meta"]["cache"]["key_version"] == "v3"
    target = result["data"]["objects"][0]
    assert target["above_geometric_horizon"] is True
    assert target["is_visible"] is True
    assert target["observability"]["assessment"] == "above_horizon_daylight"
    assert target["sky_engine_url"] == "/oras-sky-engine/skysource/M31?source_id=M31"


def test_zero_weather_values_survive_provider_normalization(monkeypatch):
    monkeypatch.setattr(live_providers, "_cache_get", lambda *_: None)
    monkeypatch.setattr(live_providers, "_cache_set", lambda *args, **kwargs: None)
    monkeypatch.setattr(live_providers, "_http_get_json", lambda *args, **kwargs: {
        "current": {"time": "2026-09-27T08:00:00Z", "cloud_cover": 0, "visibility": 0,
                    "temperature_2m": 10, "dew_point_2m": 0, "relative_humidity_2m": 0,
                    "wind_speed_10m": 0, "weather_code": 0},
    })
    result = live_providers.fetch_open_meteo_conditions(41.3, -79.6)
    assert result["cloud_cover_pct"] == 0
    assert result["dew_point_c"] == 0


def test_missing_provider_field_is_not_reported_as_observed_weather(monkeypatch):
    monkeypatch.setattr(live_providers, "_cache_get", lambda *_: None)
    monkeypatch.setattr(live_providers, "_cache_set", lambda *args, **kwargs: None)
    monkeypatch.setattr(live_providers, "_http_get_json", lambda *args, **kwargs: {
        "current": {"time": datetime.now(timezone.utc).isoformat(), "temperature_2m": 10},
    })
    provider = live_providers.fetch_open_meteo_conditions(41.3, -79.6)
    assert "cloud_cover_pct" not in provider["factual_fields_available"]
    monkeypatch.setattr(service, "compute_local_planetary_ephemeris", lambda *args, **kwargs: [])
    context = service.build_observability_context(
        lat=41.3, lng=-79.6, elev=400, as_of=datetime.now(timezone.utc), explicit_time=False,
    )
    assert "cloud_cover_pct" not in context["weather"]


def test_cached_above_me_requires_observability_v1_shape():
    legacy = {"status": "ok", "data": {"objects": []}, "meta": {"contract_version": "above-me.v1"}}
    assert above_me_service._is_valid_cached_above_me_payload(legacy) is False
    prior = {"status": "ok", "data": {"objects": []}, "meta": {
        "contract_version": "above-me.v1",
        "observability_context": {"schema_version": "observability.v1", "moon": {"ra_deg": 10, "dec_deg": 20}},
    }}
    assert above_me_service._is_valid_cached_above_me_payload(prior) is False


def test_missing_weather_observation_time_does_not_claim_freshness(monkeypatch):
    monkeypatch.setattr(live_providers, "_cache_get", lambda *_: None)
    monkeypatch.setattr(live_providers, "_cache_set", lambda *args, **kwargs: None)
    monkeypatch.setattr(live_providers, "_http_get_json", lambda *args, **kwargs: {
        "current": {"cloud_cover": 0},
    })
    provider = live_providers.fetch_open_meteo_conditions(41.3, -79.6)
    assert provider["last_updated"] is None
    monkeypatch.setattr(service, "compute_local_planetary_ephemeris", lambda *args, **kwargs: [])
    context = service.build_observability_context(
        lat=41.3, lng=-79.6, elev=400, as_of=datetime.now(timezone.utc), explicit_time=False,
    )
    assert context["weather"]["status"] == "stale"
    assert "cloud_cover_pct" not in context["weather"]


def test_solar_candidates_use_exact_selected_local_ephemeris(monkeypatch):
    instant = datetime(2026, 9, 27, 0, 45, tzinfo=timezone.utc)
    seen = []

    def local(lat, lng, *, elevation_ft, as_of):
        seen.append(as_of)
        return [{"id": "moon", "ra": 10, "dec": 20, "elevation": 19.1,
                 "azimuth": 200, "ephemeris_source": "jpl_de442s_local"}]

    monkeypatch.setattr(above_me_service, "compute_local_planetary_ephemeris", local, raising=False)
    monkeypatch.setattr(above_me_service.live_providers, "fetch_jpl_ephemeris", lambda *args, **kwargs: pytest.fail("hourly fallback used"))
    candidates = above_me_service._build_solar_system_candidates(
        observer=above_me_service.Observer(41.3, -79.6, 400), as_of=instant,
    )
    assert seen == [instant]
    assert candidates[0]["alt"] == 19.1


def test_hourly_fallback_is_not_claimed_as_selected_instant(monkeypatch):
    instant = datetime(2026, 9, 27, 0, 45, tzinfo=timezone.utc)
    monkeypatch.setattr(above_me_service, "compute_local_planetary_ephemeris", lambda *args, **kwargs: (
        _ for _ in ()).throw(above_me_service.EphemerisUnavailableError("missing")))
    monkeypatch.setattr(above_me_service.live_providers, "fetch_jpl_ephemeris", lambda *args, **kwargs: [
        {"id": "moon", "ra": 10, "dec": 20, "elevation": 10, "azimuth": 200,
         "time_basis": "2026-09-27T00:00:00Z", "ephemeris_source": "jpl_horizons"},
    ])
    assert above_me_service._build_solar_system_candidates(
        observer=above_me_service.Observer(41.3, -79.6, 400), as_of=instant,
    ) == []
