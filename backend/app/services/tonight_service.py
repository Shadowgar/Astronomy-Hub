"""tonight.v1: local full-night geometry, independent forecast, exact peak-time links."""

import hashlib
import json
import logging
from datetime import datetime, timezone
from functools import lru_cache
from zoneinfo import ZoneInfo

from backend.app.cache.redis_cache import cache_get, cache_set
from backend.app.services.observability_service import angular_separation_deg
from backend.app.services.oras_site import ORAS_SITE
from backend.app.services.planetary_ephemeris_service import (
    LocalNightEphemeris,
    get_planetary_ephemeris_status,
)
from backend.app.services.sky_coordinates import ra_dec_to_alt_az
from backend.app.services.sky_engine_links import build_sky_engine_object_url
from backend.app.services.solar_system_catalog_service import (
    SOLAR_SYSTEM_BODIES,
    SOLAR_SYSTEM_CATALOG,
)
from backend.app.services.tonight_catalog import fixed_targets
from backend.app.services.tonight_forecast import (
    fetch_forecast,
    iso,
    unavailable_forecast,
)
from backend.app.services.tonight_geometry import (
    TIMEZONE,
    duration_minutes,
    night_interval,
    refine_peak,
    resolve_night_date,
    sample_grid,
    threshold_windows,
)

CONTRACT_VERSION = "tonight.v1"
POLICY_VERSION = "tonight-opportunity.v1"
PLANNING_ALTITUDE_DEG = 20
ASTRONOMY_TTL_SECONDS = 3600
ASTRONOMY_CACHE_KEY_VERSION = "v2"
CATEGORIES = ("solar-system", "deep-sky", "stars")
LIMITATIONS = [
    "Actual site terrain, trees, and buildings are not modeled.",
    "Equipment-specific detectability is not evaluated.",
    "Artificial satellites are excluded.",
    "Geometric altitude is unrefracted; catalog positions use existing sidereal coordinate conversion.",
    "Forecast facts do not affect opportunity ordering.",
]
logger = logging.getLogger(__name__)


def local_ephemeris_available():
    return get_planetary_ephemeris_status()["loaded"]


def utc(timestamp):
    return iso(datetime.fromtimestamp(timestamp, timezone.utc))


def public_windows(windows):
    return [{"start": utc(a), "end": utc(b)} for a, b in windows]


def rank_targets(targets):
    # No magnitude, weather, subjective quality, or mixed-photometry score.
    return sorted(
        targets,
        key=lambda t: (
            -int(t["opportunity"]["planning_altitude_duration_minutes"] > 0),
            -t["opportunity"]["peak_altitude_deg"],
            -t["opportunity"]["planning_altitude_duration_minutes"],
            -t["opportunity"]["dark_duration_minutes"],
            t["catalog"],
            t["source_id"],
            t["model"],
        ),
    )


def balanced_top(ranked, limit=6):
    reserved = [
        next((t for t in ranked if t["category"] == category), None)
        for category in CATEGORIES
    ]
    selected = [t for t in reserved if t is not None][:limit]
    selected.extend(t for t in ranked if t not in selected)
    return selected[:limit]


def evaluate_target(target, position, dark_windows, interval, ephemeris):
    altitude = lambda t: position(t)["alt"]
    horizon = []
    planning = []
    peaks = []
    for a, b in dark_windows:
        windows = threshold_windows(altitude, a, b, 0, above=True)
        horizon.extend(windows)
        planning.extend(
            threshold_windows(altitude, a, b, PLANNING_ALTITUDE_DEG, above=True)
        )
        peaks.append(refine_peak(altitude, a, b))
    if not horizon or duration_minutes(horizon) <= 0:
        return None
    peak = min(peaks, key=lambda t: (-altitude(t), t))
    p = position(peak)
    moon = ephemeris.position("moon", peak) if ephemeris else {}
    moving = target["category"] == "solar-system"
    separation = angular_separation_deg(
        p["ra"],
        p["dec"],
        moon.get("ra" if moving else "ra_icrf"),
        moon.get("dec" if moving else "dec_icrf"),
    )
    all_horizon = threshold_windows(altitude, *interval, 0, above=True)
    minutes = round(duration_minutes(planning), 1)
    peak_local = datetime.fromtimestamp(peak, timezone.utc).astimezone(
        ZoneInfo(TIMEZONE)
    )
    clock = peak_local.strftime("%I:%M %p %Z").lstrip("0")
    reason = f"Peaks at {p['alt']:.0f}° around {clock}; {minutes:.0f} minutes above the {PLANNING_ALTITUDE_DEG}° planning altitude during astronomical darkness."
    result = {k: v for k, v in target.items() if k not in ("ra", "dec")}
    result.update(
        ra=p["ra"],
        dec=p["dec"],
        opportunity={
            "peak_time": utc(peak),
            "peak_altitude_deg": round(p["alt"], 3),
            "peak_azimuth_deg": round(p["az"], 3),
            "dark_duration_minutes": round(duration_minutes(horizon), 1),
            "planning_altitude_duration_minutes": minutes,
            "dark_horizon_windows": public_windows(horizon),
            "above_horizon_windows": public_windows(all_horizon),
            "first_above_horizon": utc(all_horizon[0][0]),
            "last_above_horizon": utc(all_horizon[-1][1]),
            "moon_separation_at_peak_deg": round(separation, 3)
            if separation is not None
            else None,
            "moon_altitude_at_peak_deg": round(moon["alt"], 3) if moon else None,
        },
        ranking={"policy_version": POLICY_VERSION, "rank_reason": reason},
        sky_engine_url=build_sky_engine_object_url(
            catalog=target["catalog"],
            source_id=target["source_id"],
            model=target["model"],
            name=target["name"],
            ra=p["ra"],
            dec=p["dec"],
            time=utc(peak),
            lat=ORAS_SITE["latitude"],
            lng=ORAS_SITE["longitude"],
            elev=ORAS_SITE["elevationMeters"],
        ),
    )
    return result


def build_astronomy(night_date):
    start, end = night_interval(night_date)
    a, b = start.timestamp(), end.timestamp()
    targets, sources = fixed_targets()
    ephemeris_status = get_planetary_ephemeris_status()
    sources["solar_system"] = {
        k: ephemeris_status.get(k)
        for k in (
            "loaded",
            "source_key",
            "release_version",
            "sha256",
            "coverage_start",
            "coverage_end",
        )
    }
    fingerprint = json.dumps(
        {
            "contract": CONTRACT_VERSION,
            "policy": POLICY_VERSION,
            "site": ORAS_SITE,
            "date": str(night_date),
            "sources": sources,
            "targets": targets,
        },
        sort_keys=True,
    )
    key = (
        f"tonight-astronomy:{ASTRONOMY_CACHE_KEY_VERSION}:"
        + hashlib.sha256(fingerprint.encode()).hexdigest()
    )
    cached = cache_get(key)
    if cached:
        try:
            result = json.loads(cached)
            if result["status"] == "ok":
                result["cache"] = {
                    "status": "hit",
                    "ttl_seconds": ASTRONOMY_TTL_SECONDS,
                    "key_version": ASTRONOMY_CACHE_KEY_VERSION,
                }
                return result
        except (ValueError, KeyError, TypeError):
            pass
    night = {
        "night_date": str(night_date),
        "timezone": TIMEZONE,
        "interval_start": iso(start),
        "interval_end": iso(end),
        "status": "ephemeris_unavailable",
        "twilight": {},
        "astronomical_darkness": [],
        "dark_duration_minutes": 0,
        "moon": None,
    }
    result = {
        "night": night,
        "targets": [],
        "top_opportunities": [],
        "sources": sources,
        "status": "degraded",
        "cache": {"status": "not_cached"},
    }
    try:
        ephemeris = LocalNightEphemeris(
            ORAS_SITE["latitude"],
            ORAS_SITE["longitude"],
            ORAS_SITE["elevationMeters"],
            start,
            end,
        )
        ephemeris.prime("sun", sample_grid(a, b))
        sun = lambda t: ephemeris.position("sun", t)["alt"]
        for label, threshold in [
            ("civil", -6),
            ("nautical", -12),
            ("astronomical", -18),
        ]:
            windows = threshold_windows(sun, a, b, threshold, above=False)
            night["twilight"][label] = {
                "sun_altitude_deg": threshold,
                "windows": public_windows(windows),
                "dusk": utc(windows[0][0]) if windows and windows[0][0] > a else None,
                "dawn": utc(windows[-1][1]) if windows and windows[-1][1] < b else None,
            }
        dark = threshold_windows(sun, a, b, -18, above=False)
        night.update(
            status="available" if dark else "no_astronomical_darkness",
            astronomical_darkness=public_windows(dark),
            dark_duration_minutes=round(duration_minutes(dark), 1),
        )
        midpoint = (dark[0][0] + dark[-1][1]) / 2 if dark else (a + b) / 2
        moon = ephemeris.position("moon", midpoint)
        night["moon"] = {
            "time": utc(midpoint),
            "altitude_deg": round(moon["alt"], 3),
            "illumination_fraction": round(ephemeris.moon_illumination(midpoint), 5),
            "source": "jpl_de442s_local",
        }
        if dark:
            for id, config in SOLAR_SYSTEM_BODIES.items():
                if id == "sun":
                    continue
                try:
                    ephemeris.prime(id, sample_grid(a, b))
                except Exception:
                    logger.exception("Tonight moving target unavailable: %s", id)
                    sources["solar_system"].setdefault("unavailable_bodies", []).append(
                        id
                    )
                    continue
                targets.append(
                    {
                        "catalog": SOLAR_SYSTEM_CATALOG,
                        "source_id": id,
                        "model": config["model"],
                        "name": config["name"],
                        "type": config["model"],
                        "category": "solar-system",
                    }
                )
            opportunities = []
            for target in targets:
                if target["category"] == "solar-system":
                    position = lambda t, id=target["source_id"]: ephemeris.position(
                        id, t
                    )
                else:

                    @lru_cache(maxsize=512)
                    def position(t, ra=target["ra"], dec=target["dec"]):
                        alt, az = ra_dec_to_alt_az(
                            ra_hours=ra / 15,
                            dec_deg=dec,
                            observer_lat_deg=ORAS_SITE["latitude"],
                            observer_lon_deg=ORAS_SITE["longitude"],
                            dt=datetime.fromtimestamp(t, timezone.utc),
                        )
                        return {"alt": alt, "az": az, "ra": ra, "dec": dec}

                try:
                    evaluated = evaluate_target(
                        target, position, dark, (a, b), ephemeris
                    )
                    if evaluated:
                        opportunities.append(evaluated)
                except Exception:
                    logger.exception(
                        "Tonight target evaluation failed: %s", target["source_id"]
                    )
                    sources.setdefault(
                        "target_evaluation",
                        {"status": "unavailable", "failed_count": 0},
                    )["failed_count"] += 1
            ranked = rank_targets(opportunities)
            # Bound the public plan while retaining the existing compact Messier set and named stars.
            selected = []
            for category in CATEGORIES:
                group = [t for t in ranked if t["category"] == category]
                reserved = (
                    [t for t in group if t["catalog"] == "Messier (local)"]
                    if category == "deep-sky"
                    else [
                        t
                        for t in group
                        if t["catalog"] == "Bright Star Catalog (local)"
                    ][:6]
                    if category == "stars"
                    else []
                )
                chosen = reserved + [t for t in group if t not in reserved]
                selected.extend(chosen[:24])
            result["targets"] = rank_targets(selected)
            result["top_opportunities"] = [
                {
                    "catalog": t["catalog"],
                    "source_id": t["source_id"],
                    "model": t["model"],
                }
                for t in balanced_top(ranked)
            ]
        result["status"] = (
            "ok"
            if all(
                s.get("status") != "unavailable" and not s.get("unavailable_bodies")
                for s in sources.values()
            )
            else "partial"
        )
    except Exception:
        logger.exception("Tonight local ephemeris unavailable")
        night.update(
            status="ephemeris_unavailable",
            twilight={},
            astronomical_darkness=[],
            dark_duration_minutes=0,
            moon=None,
        )
        result.update(status="degraded", targets=[], top_opportunities=[])
    if result["status"] == "ok":
        cache_set(key, json.dumps(result), ttl_seconds=ASTRONOMY_TTL_SECONDS)
        result["cache"] = {
            "status": "miss",
            "ttl_seconds": ASTRONOMY_TTL_SECONDS,
            "key_version": ASTRONOMY_CACHE_KEY_VERSION,
        }
    return result


def build_tonight_payload(*, date=None):
    night_date = resolve_night_date(date)
    astronomy = build_astronomy(night_date)
    night = astronomy["night"]
    windows = night.get("astronomical_darkness", [])
    start = datetime.fromisoformat(
        (windows[0]["start"] if windows else night["interval_start"]).replace(
            "Z", "+00:00"
        )
    )
    end = datetime.fromisoformat(
        (windows[-1]["end"] if windows else night["interval_end"]).replace(
            "Z", "+00:00"
        )
    )
    try:
        forecast = fetch_forecast(start=start, end=end)
    except Exception:
        logger.warning("Tonight forecast failed independently", exc_info=True)
        forecast = unavailable_forecast()
    return {
        "status": astronomy["status"],
        "data": {
            "night": night,
            "targets": astronomy["targets"],
            "top_opportunities": astronomy["top_opportunities"],
            "forecast": forecast,
        },
        "meta": {
            "contract_version": CONTRACT_VERSION,
            "observer": ORAS_SITE,
            "generated_at": iso(datetime.now(timezone.utc)),
            "policy": {
                "version": POLICY_VERSION,
                "planning_altitude_deg": PLANNING_ALTITUDE_DEG,
                "planning_altitude_definition": "A planning heuristic used to prefer targets reasonably above the geometric horizon.",
                "ordering": [
                    "has_time_above_planning_altitude",
                    "peak_altitude_desc",
                    "planning_duration_desc",
                    "dark_duration_desc",
                    "catalog_source_id_model",
                ],
                "category_balance": "Top: reserve one per available category, then fill by geometric ordering. Groups: at most 24 per category; retain supported Messier objects and six named stars before geometric fill.",
                "sampling_minutes": 10,
                "refinement_seconds": 1,
            },
            "sources": astronomy["sources"],
            "cache": astronomy["cache"],
            "limitations": LIMITATIONS,
        },
    }
