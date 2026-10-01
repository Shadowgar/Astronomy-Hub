from datetime import datetime, timezone
from urllib.parse import urlparse, parse_qs
import math

import pytest
from backend.app.services import tonight_service as service
from backend.app.services.tonight_geometry import night_interval, resolve_night_date


def test_rank_and_category_balance_are_geometry_only():
    def target(id, category, alt):
        return dict(
            catalog="test",
            source_id=id,
            model="star",
            category=category,
            opportunity=dict(
                peak_altitude_deg=alt,
                planning_altitude_duration_minutes=120,
                dark_duration_minutes=200,
            ),
        )

    rows = [target(str(i), "stars", 90 - i) for i in range(20)] + [
        target("moon", "solar-system", 45),
        target("M31", "deep-sky", 60),
    ]
    ranked = service.rank_targets(rows)
    assert ranked[0]["source_id"] == "0"
    assert service.rank_targets(list(reversed(rows))) == ranked
    top = service.balanced_top(ranked, 6)
    assert {x["category"] for x in top} == {"stars", "solar-system", "deep-sky"}
    assert len({x["source_id"] for x in top}) == 6


def test_fixed_target_windows_peak_moon_and_exact_link():
    start, end = night_interval(resolve_night_date("2026-10-01"))
    a, b = start.timestamp(), end.timestamp()
    peak = a + 12 * 3600

    def position(t):
        return dict(
            alt=50 * math.cos((t - peak) / 86400 * 2 * math.pi), az=180, ra=10, dec=20
        )

    class Ephemeris:
        def position(self, id, t):
            return dict(alt=30, az=90, ra=100, dec=20, ra_icrf=100, dec_icrf=20)

    row = service.evaluate_target(
        dict(
            catalog="Messier (local)",
            source_id="M31",
            model="dso",
            type="galaxy",
            name="M31",
            category="deep-sky",
        ),
        position,
        [(a + 6 * 3600, a + 18 * 3600)],
        (a, b),
        Ephemeris(),
    )
    o = row["opportunity"]
    assert datetime.fromisoformat(
        o["peak_time"].replace("Z", "+00:00")
    ).timestamp() == pytest.approx(peak, abs=1)
    assert o["peak_altitude_deg"] == pytest.approx(50, abs=0.01)
    assert o["dark_duration_minutes"] == pytest.approx(720, abs=0.1)
    assert 0 < o["planning_altitude_duration_minutes"] < 720
    assert o["moon_separation_at_peak_deg"] == pytest.approx(83.2823, abs=0.01)
    q = parse_qs(urlparse(row["sky_engine_url"]).query)
    assert q["source_id"] == ["M31"] and q["model"] == ["dso"]
    assert q["date"] == [o["peak_time"]]
    assert q["lat"] == ["41.321903"] and q["elev"] == ["432.816"]
    assert o["above_horizon_windows"][0]["start"] < o["peak_time"]


def test_no_dark_window_and_below_horizon_do_not_make_opportunities():
    t = dict(
        catalog="test",
        source_id="x",
        model="star",
        type="star",
        name="x",
        category="stars",
    )
    assert (
        service.evaluate_target(
            t, lambda s: dict(alt=-10), [(0, 3600)], (0, 7200), None
        )
        is None
    )
    assert (
        service.evaluate_target(t, lambda s: dict(alt=60), [], (0, 7200), None) is None
    )


def test_weather_failure_preserves_astronomy(monkeypatch):
    monkeypatch.setattr(
        service,
        "build_astronomy",
        lambda d: dict(
            night=dict(
                status="available",
                interval_start="2026-10-01T16:00:00Z",
                interval_end="2026-10-02T16:00:00Z",
            ),
            targets=[{"name": "M31"}],
            top_opportunities=[],
            sources={},
            status="ok",
            cache={"status": "miss"},
        ),
    )
    monkeypatch.setattr(
        service,
        "fetch_forecast",
        lambda **kw: (_ for _ in ()).throw(RuntimeError("offline")),
    )
    payload = service.build_tonight_payload(date="2026-10-01")
    assert payload["data"]["targets"] == [{"name": "M31"}]
    assert payload["data"]["forecast"]["status"] == "unavailable"
    assert payload["meta"]["contract_version"] == "tonight.v1"
    assert any("trees" in s for s in payload["meta"]["limitations"])


@pytest.mark.skipif(
    not service.local_ephemeris_available(), reason="local kernel not mounted"
)
def test_real_night_and_representative_trajectories():
    result = service.build_astronomy(resolve_night_date("2026-10-01"))
    assert result["night"]["status"] == "available"
    dark = result["night"]["astronomical_darkness"][0]
    assert "2026-10-01T23:" in dark["start"] or "2026-10-02T00:" in dark["start"]
    assert 500 < result["night"]["dark_duration_minutes"] < 700
    targets = result["targets"]
    assert all(t["model"] != "tle_satellite" for t in targets)
    assert {t["category"] for t in targets} == {"solar-system", "deep-sky", "stars"}
    assert any(t["source_id"] == "jupiter" for t in targets)
    # Later rising targets must survive candidate acquisition.
    assert any(t["source_id"] == "M42" for t in targets)
    for t in targets:
        assert 0 < t["opportunity"]["peak_altitude_deg"] <= 90
        assert (
            t["opportunity"]["dark_duration_minutes"]
            <= result["night"]["dark_duration_minutes"] + 0.1
        )


@pytest.mark.skipif(
    not service.local_ephemeris_available(), reason="local kernel not mounted"
)
def test_astronomy_cache_version_generation_and_weather_independence(monkeypatch):
    stored = {}
    monkeypatch.setattr(service, "cache_get", lambda k: stored.get(k))
    monkeypatch.setattr(
        service, "cache_set", lambda k, v, **kw: stored.update({k: v}) or True
    )
    date = resolve_night_date("2026-10-01")
    first = service.build_astronomy(date)
    assert first["cache"]["status"] == "miss"
    hit = service.build_astronomy(date)
    assert hit["cache"]["status"] == "hit"
    assert first["targets"] == hit["targets"]
    monkeypatch.setattr(service, "POLICY_VERSION", "test-version")
    assert service.build_astronomy(date)["cache"]["status"] == "miss"
    assert len(stored) == 2


@pytest.mark.skipif(
    not service.local_ephemeris_available(), reason="local kernel not mounted"
)
def test_solar_threshold_residuals_moving_positions_and_illumination():
    from backend.app.services.planetary_ephemeris_service import (
        LocalNightEphemeris,
        compute_local_planetary_ephemeris,
    )

    date = resolve_night_date("2026-10-01")
    start, end = night_interval(date)
    eph = LocalNightEphemeris(41.321903, -79.585394, 432.816, start, end)
    result = service.build_astronomy(date)
    for twilight in result["night"]["twilight"].values():
        for instant in (twilight["dusk"], twilight["dawn"]):
            stamp = datetime.fromisoformat(instant.replace("Z", "+00:00")).timestamp()
            assert eph.position("sun", stamp)["alt"] == pytest.approx(
                twilight["sun_altitude_deg"], abs=0.003
            )
    illumination = eph.moon_illumination(start.timestamp())
    assert 0.60 < illumination < 0.75
    planet = next(t for t in result["targets"] if t["source_id"] == "jupiter")
    peak = datetime.fromisoformat(
        planet["opportunity"]["peak_time"].replace("Z", "+00:00")
    )
    canonical = next(
        b
        for b in compute_local_planetary_ephemeris(
            41.321903, -79.585394, elevation_ft=1420, as_of=peak
        )
        if b["id"] == "jupiter"
    )
    assert planet["ra"] == pytest.approx(canonical["ra"], abs=1e-7)
    assert planet["dec"] == pytest.approx(canonical["dec"], abs=1e-7)
    assert planet["opportunity"]["peak_altitude_deg"] == pytest.approx(
        canonical["elevation"], abs=0.001
    )


def test_catalog_acquisition_has_no_current_horizon_filter_and_deduplicates_messier():
    from backend.app.services.tonight_catalog import fixed_targets
    from backend.app.services.openngc_dso_catalog_service import (
        find_openngc_record_by_messier_id,
    )

    targets, sources = fixed_targets()
    assert any(t["source_id"] == "M42" for t in targets)
    ids = {t["source_id"] for t in targets if "OpenNGC" in t["catalog"]}
    for t in targets:
        if t["catalog"] == "Messier (local)":
            canonical = find_openngc_record_by_messier_id(t["source_id"])
            if canonical:
                assert canonical["source_id"] not in ids
    assert sources["hipparcos"]["candidate_count"] <= 120


@pytest.mark.parametrize(
    "sun_altitude,broken_body,status", [(-10, None, "ok"), (-25, "uranus", "partial")]
)
def test_no_darkness_and_partial_body_failure_preserve_honest_night(
    monkeypatch, sun_altitude, broken_body, status
):
    class Ephemeris:
        def __init__(self, *args):
            pass

        def prime(self, id, timestamps):
            if id == broken_body:
                raise RuntimeError("missing body")

        def position(self, id, t):
            return dict(
                alt=sun_altitude if id == "sun" else 35,
                az=180,
                ra=10,
                dec=20,
                ra_icrf=10,
                dec_icrf=20,
            )

        def moon_illumination(self, t):
            return 0.5

    monkeypatch.setattr(service, "LocalNightEphemeris", Ephemeris)
    monkeypatch.setattr(service, "cache_get", lambda k: None)
    monkeypatch.setattr(service, "cache_set", lambda *a, **kw: False)
    monkeypatch.setattr(service, "fixed_targets", lambda: ([], {}))
    result = service.build_astronomy(resolve_night_date("2026-10-01"))
    assert result["status"] == status
    if broken_body:
        assert result["night"]["status"] == "available"
        assert result["targets"]
        assert all(t["source_id"] != broken_body for t in result["targets"])
        assert result["cache"]["status"] == "not_cached"
    else:
        assert result["night"]["status"] == "no_astronomical_darkness"
        assert result["night"]["astronomical_darkness"] == []
        assert result["targets"] == []
