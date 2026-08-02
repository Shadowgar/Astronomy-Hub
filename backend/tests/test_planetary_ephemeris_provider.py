from __future__ import annotations

from datetime import datetime, timezone
import logging

import pytest

from backend.app.services import above_me_service, live_providers
from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError
from backend.app.services.solar_system_catalog_service import build_solar_system_object_payload


AS_OF = datetime(2026, 6, 4, 2, 16, 4, tzinfo=timezone.utc)
LOCAL_MARS = {
    "id": "mars",
    "name": "Mars",
    "ra": 40.0,
    "dec": 15.0,
    "azimuth": 220.0,
    "elevation": 31.0,
    "distance_au": 1.8,
    "source": "jpl_de442s_local",
    "ephemeris_source": "jpl_de442s_local",
    "target_reference": "Mars barycenter",
    "time_basis": "2026-06-04T02:16:04Z",
}


def _disable_cache(monkeypatch) -> None:
    monkeypatch.setattr(live_providers, "_cache_get", lambda key: None)
    monkeypatch.setattr(live_providers, "_cache_set", lambda key, payload, ttl_seconds: None)


def test_fetch_jpl_ephemeris_prefers_configured_local_release(monkeypatch) -> None:
    _disable_cache(monkeypatch)
    monkeypatch.setenv("ORAS_PLANETARY_EPHEMERIS_DIR", "/runtime/test-de442s")
    seen = []

    def _compute(lat, lon, *, elevation_ft=None, as_of=None, release_dir=None):
        seen.append((lat, lon, elevation_ft, as_of, str(release_dir)))
        return [dict(LOCAL_MARS)]

    monkeypatch.setattr(
        live_providers.planetary_ephemeris_service,
        "compute_local_planetary_ephemeris",
        _compute,
    )
    monkeypatch.setattr(
        live_providers,
        "_http_get_json",
        lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("Horizons must not run")),
    )

    result = live_providers.fetch_jpl_ephemeris(41.44, -79.69, elevation_ft=0.0, as_of=AS_OF)

    assert seen == [
        (
            41.44,
            -79.69,
            0.0,
            AS_OF.replace(minute=0, second=0, microsecond=0),
            "/runtime/test-de442s",
        )
    ]
    assert result[0]["source"] == "jpl_ephemeris"
    assert result[0]["ephemeris_source"] == "jpl_de442s_local"
    assert result[0]["target_reference"] == "Mars barycenter"


def test_fetch_jpl_ephemeris_falls_back_to_horizons(monkeypatch, caplog) -> None:
    _disable_cache(monkeypatch)
    monkeypatch.setenv("ORAS_PLANETARY_EPHEMERIS_DIR", "/runtime/missing")
    monkeypatch.setattr(
        live_providers.planetary_ephemeris_service,
        "compute_local_planetary_ephemeris",
        lambda *args, **kwargs: (_ for _ in ()).throw(EphemerisUnavailableError("missing")),
    )
    monkeypatch.setattr(
        live_providers,
        "_http_get_json",
        lambda *args, **kwargs: {
            "result": "$$SOE\n2026-Jun-04 02:00 N 02 39 09.40 +14 52 48.0 340.7 31.0\n$$EOE"
        },
    )

    with caplog.at_level(logging.WARNING, logger=live_providers.__name__):
        result = live_providers.fetch_jpl_ephemeris(
            41.44,
            -79.69,
            elevation_ft=0.0,
            as_of=AS_OF,
        )

    assert len(result) == len(live_providers.JPL_EPHEMERIS_BODIES)
    assert all(body["source"] == "jpl_ephemeris" for body in result)
    assert all(body["ephemeris_source"] == "jpl_horizons" for body in result)
    assert "falling back to Horizons" in caplog.text


def test_fetch_jpl_ephemeris_does_not_hide_unexpected_local_errors(monkeypatch) -> None:
    _disable_cache(monkeypatch)
    monkeypatch.setenv("ORAS_PLANETARY_EPHEMERIS_DIR", "/runtime/broken-code")
    monkeypatch.setattr(
        live_providers.planetary_ephemeris_service,
        "compute_local_planetary_ephemeris",
        lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError("programming error")),
    )
    monkeypatch.setattr(
        live_providers,
        "_http_get_json",
        lambda *args, **kwargs: (_ for _ in ()).throw(AssertionError("Horizons must not run")),
    )

    with pytest.raises(RuntimeError, match="programming error"):
        live_providers.fetch_jpl_ephemeris(
            41.44,
            -79.69,
            elevation_ft=0.0,
            as_of=AS_OF,
        )


def test_exact_solar_object_exposes_local_ephemeris_provenance(monkeypatch) -> None:
    monkeypatch.setattr(
        live_providers,
        "fetch_jpl_ephemeris",
        lambda *args, **kwargs: [dict(LOCAL_MARS)],
    )

    payload = build_solar_system_object_payload(
        source_id="mars",
        model="planet",
        lat=41.44,
        lng=-79.69,
        time="2026-06-04T02:16:04Z",
        elev=0,
    )

    assert payload["ephemeris_source"] == "jpl_de442s_local"
    assert payload["target_reference"] == "Mars barycenter"
    assert payload["distance_au"] == 1.8
    assert payload["provenance"]["source_key"] == "jpl_de442s_local"
    assert "DE442s" in payload["message"]


def test_above_me_candidate_exposes_local_ephemeris_source(monkeypatch) -> None:
    monkeypatch.setattr(
        above_me_service.live_providers,
        "fetch_jpl_ephemeris",
        lambda *args, **kwargs: [dict(LOCAL_MARS)],
    )

    candidates = above_me_service._build_solar_system_candidates(
        observer=above_me_service.Observer(lat=41.44, lng=-79.69, elev=0.0),
        as_of=AS_OF,
    )

    assert candidates[0]["ephemeris_source"] == "jpl_de442s_local"
    assert candidates[0]["target_reference"] == "Mars barycenter"
    assert candidates[0]["distance_au"] == 1.8
    assert "DE442s" in candidates[0]["reason"]
