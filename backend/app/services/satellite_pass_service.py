"""Bounded, offline pass planning for the explicitly admitted native visual pilot."""
from __future__ import annotations

from collections import OrderedDict, deque
from copy import deepcopy
from datetime import datetime, timedelta
import hashlib
import math
import os
from pathlib import Path
import threading
import time as clock
import zlib
from typing import Any

import numpy as np
from skyfield.api import EarthSatellite, wgs84

from backend.app.services import planetary_ephemeris_service as ephemeris
from backend.app.services import satellite_feed_status_service as feed
from backend.app.services.satellite_propagation_service import (
    MAX_TLE_AGE_DAYS, _TIMESCALE, _optional_magnitude, _parse_tle_epoch,
)
from backend.app.services.satellite_tle_catalog_service import load_satellite_tle_catalog

LIMITS = {
    "max_hours": 24, "max_records": 155, "max_passes": 40,
    "sample_seconds": 15, "min_optical_altitude_deg": 10,
    "max_optical_solar_altitude_deg": -6,
    "max_uncached_requests_per_minute": 12, "max_compute_seconds": 45,
}
_COMPUTE_LOCK = threading.Lock()
_CACHE: OrderedDict[tuple, dict] = OrderedDict()
_REQUESTS: deque[float] = deque()


class PassServiceBusy(RuntimeError):
    """The bounded worker or request budget is occupied."""


def _utc(value: datetime) -> str:
    return value.isoformat(timespec="microseconds").replace("+00:00", "Z")


def _generation() -> tuple:
    path = Path(os.getenv(feed.FEED_PATH_ENV, "frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz")).resolve()
    manifest = Path(os.getenv(feed.MANIFEST_PATH_ENV, str(path.with_name("manifest.json")))).resolve()
    release = ephemeris._release_dir().resolve()
    paths = (path, manifest, *(path.with_name(name) for name in (
        feed.SOURCE_FILENAME, feed.SOURCE_MANIFEST_FILENAME, feed.BASELINE_FILENAME,
    )), release / ephemeris.MANIFEST_FILENAME, release / ephemeris.KERNEL_FILENAME)
    return (os.getenv(feed.RELEASE_PROFILE_ENV, ""), os.getenv(feed.MINIMUM_COUNT_ENV, ""),
            tuple((str(p), feed._file_identity(p)) for p in paths))


def build_satellite_passes(*, lat: float, lng: float, elev: float = 0,
                           time: str | None = None, hours: int = 24) -> dict[str, Any]:
    latitude, longitude, elevation = float(lat), float(lng), float(elev)
    if not math.isfinite(latitude) or not -90 <= latitude <= 90:
        raise ValueError("lat must be finite and between -90 and 90")
    if not math.isfinite(longitude) or not -180 <= longitude <= 180:
        raise ValueError("lng must be finite and between -180 and 180")
    if not math.isfinite(elevation) or not -1000 <= elevation <= 10000:
        raise ValueError("elev must be finite and between -1000 and 10000 metres")
    if isinstance(hours, bool) or not isinstance(hours, int) or not 1 <= hours <= LIMITS["max_hours"]:
        raise ValueError("hours must be an integer between 1 and 24")
    start = feed._parse_time(time)
    try:
        end = start + timedelta(hours=hours)
    except OverflowError as exc:
        raise ValueError("time and hours exceed the supported datetime range") from exc
    if not _COMPUTE_LOCK.acquire(blocking=False):
        raise PassServiceBusy("Satellite pass calculation is busy; retry shortly.")
    try:
        generation = _generation()
        key = (generation, latitude, longitude, elevation, start, hours)
        if key in _CACHE:
            _CACHE.move_to_end(key)
            return deepcopy(_CACHE[key])
        now = clock.monotonic()
        while _REQUESTS and now - _REQUESTS[0] >= 60:
            _REQUESTS.popleft()
        if len(_REQUESTS) >= LIMITS["max_uncached_requests_per_minute"]:
            raise PassServiceBusy("Satellite pass request limit reached; retry in a minute.")
        _REQUESTS.append(now)
        result = _build(latitude, longitude, elevation, start, end, generation, now)
        if generation != _generation():
            result["data"].update(status="unavailable", reason="Mounted source changed during calculation; retry.", passes=[])
            result["data"]["counts"]["passes_returned"] = 0
            return result
        _CACHE[key] = deepcopy(result)
        if len(_CACHE) > 8:
            _CACHE.popitem(last=False)
        return result
    finally:
        _COMPUTE_LOCK.release()


def _build(lat: float, lon: float, elev: float, start: datetime, end: datetime,
           generation: tuple, began: float) -> dict:
    source = feed.build_satellite_feed_status(time=_utc(start))["data"]
    data = {
        "status": "unavailable", "reason": "", "window_start": _utc(start), "window_end": _utc(end),
        "observer": {"lat": lat, "lon": lon, "elevationM": elev}, "source": source, "passes": [],
        "limits": dict(LIMITS), "counts": {"records_scanned": 0, "records_skipped_stale": 0,
            "records_failed": 0, "passes_found": 0, "passes_returned": 0, "potentially_observable": 0},
        "truncated": False,
    }
    response = {"status": "ok", "data": data, "meta": {}, "error": None}
    if not source["release_validated"]:
        data["reason"] = source["reason"]
        return response
    if generation[0] != feed.VISUAL_PILOT_PROFILE or source.get("source_profile") != feed.VISUAL_PILOT_PROFILE:
        data["reason"] = "Next Passes requires the explicitly admitted limited visual-satellite pilot."
        return response
    if not 0 < source["record_count"] <= LIMITS["max_records"]:
        data["reason"] = "Satellite source exceeds the bounded pilot record limit."
        return response
    try:
        path = Path(generation[2][0][0])
        if hashlib.sha256(path.read_bytes()).hexdigest() != source.get("sha256"):
            raise ValueError("native feed hash differs from the admitted release")
        # Bypass the legacy path-only cache; generation is checked after parsing and calculation.
        catalog = load_satellite_tle_catalog.__wrapped__(path)
        if catalog.count != source["record_count"] or catalog.malformed_count:
            raise ValueError("native feed record inventory differs from the admitted release")
        if generation != _generation():
            raise ValueError("mounted source changed during validation")
        runtime = ephemeris._load_runtime(ephemeris._release_dir())
        if not ephemeris._parse_utc(runtime.manifest["coverage_start"]) <= start <= end <= ephemeris._parse_utc(runtime.manifest["coverage_end"]):
            raise ephemeris.EphemerisUnavailableError("requested window is outside local ephemeris coverage")
    except (OSError, EOFError, ValueError, zlib.error, ephemeris.EphemerisUnavailableError) as exc:
        data["reason"] = f"Validated source or solar ephemeris unavailable: {exc}"
        return response
    observer = wgs84.latlon(lat, lon, elevation_m=elev)
    sun_observer = runtime.kernel["earth"] + observer
    t0, t1 = _TIMESCALE.from_datetime(start), _TIMESCALE.from_datetime(end)
    passes = []
    counts = data["counts"]
    for record in catalog.records_by_norad.values():
        if clock.monotonic() - began > LIMITS["max_compute_seconds"]:
            data["reason"] = "Bounded calculation time exceeded; narrow the requested window."
            return response
        counts["records_scanned"] += 1
        try:
            line1, line2 = record["model_data"]["tle"]
            epoch = _parse_tle_epoch(line1)
            # A record may cross the freshness boundary inside the requested window.
            nearest = min(max(epoch, start), end)
            if abs((nearest - epoch).total_seconds()) / 86400 > MAX_TLE_AGE_DAYS:
                counts["records_skipped_stale"] += 1
                continue
            satellite = EarthSatellite(line1, line2, record["name"], _TIMESCALE)
            events, kinds = satellite.find_events(observer, t0, t1, altitude_degrees=0.0)
            initial_alt = float((satellite - observer).at(t0).altaz()[0].degrees)
            if not math.isfinite(initial_alt):
                raise ValueError("invalid propagated altitude")
            intervals = _intervals(start, end, initial_alt >= 0, events.utc_datetime(), kinds)
            record_passes = []
            stale_pass = False
            for rise, setting, peaks, clipped_start, clipped_end in intervals:
                max_age = max(abs((rise - epoch).total_seconds()), abs((setting - epoch).total_seconds())) / 86400
                if max_age > MAX_TLE_AGE_DAYS:
                    stale_pass = True
                    continue
                record_passes.append(_describe_pass(record, satellite, observer, sun_observer, runtime,
                    rise, setting, peaks, epoch, max_age, clipped_start, clipped_end))
            if stale_pass and not record_passes:
                counts["records_skipped_stale"] += 1
            passes.extend(record_passes)
        except (ValueError, TypeError, KeyError, IndexError, OverflowError):
            counts["records_failed"] += 1
    passes.sort(key=lambda item: (item["optical_status"] != "potentially_observable", item["rise_utc"], item["norad_id"]))
    counts.update(passes_found=len(passes), passes_returned=min(len(passes), LIMITS["max_passes"]),
                  potentially_observable=sum(p["optical_status"] == "potentially_observable" for p in passes))
    data.update(status="ready", reason="Geometric horizon passes with sampled sunlit/dark-sky conditions; brightness and weather are not predicted.",
                passes=passes[:LIMITS["max_passes"]], truncated=len(passes) > LIMITS["max_passes"])
    if counts["records_skipped_stale"] == counts["records_scanned"]:
        data.update(status="unavailable", reason="No TLE records are fresh for the requested pass window.")
    elif counts["records_failed"]:
        data["reason"] += " Some records failed propagation; see counts."
    return response


def _intervals(start, end, initially_above, event_times, kinds):
    """Keep all culminations; windows can start/end mid-pass or have no events."""
    active = start if initially_above else None
    clipped_start = initially_above
    peaks = []
    intervals = []
    for instant, kind in zip(event_times, kinds):
        if kind == 0:
            active, clipped_start, peaks = instant, False, []
        elif kind == 1 and active is not None:
            peaks.append(instant)
        elif kind == 2 and active is not None:
            if instant > active:
                intervals.append((active, instant, peaks, clipped_start, False))
            active, peaks = None, []
    if active is not None and end > active:
        intervals.append((active, end, peaks, clipped_start, True))
    return intervals


def _describe_pass(record, satellite, observer, sun_observer, runtime, rise, setting,
                   peaks, epoch, max_age, clipped_start, clipped_end):
    duration = (setting - rise).total_seconds()
    offsets = np.arange(0, duration, LIMITS["sample_seconds"])
    instants = {rise + timedelta(seconds=float(offset)) for offset in offsets}
    instants.update([rise, setting, *peaks])
    for peak in peaks:
        if rise <= peak - timedelta(seconds=15) <= setting:
            instants.add(peak - timedelta(seconds=15))
    instants = sorted(instants)
    times = _TIMESCALE.from_datetimes(instants)
    positions = (satellite - observer).at(times)
    altitude, azimuth, _ = positions.altaz()
    alt, az = np.asarray(altitude.degrees), np.asarray(azimuth.degrees)
    solar_alt = np.asarray(sun_observer.at(times).observe(runtime.kernel["sun"]).apparent().altaz()[0].degrees)
    sunlit = np.asarray(satellite.at(times).is_sunlit(runtime.kernel), dtype=bool)
    if not (np.all(np.isfinite(alt)) and np.all(np.isfinite(az)) and np.all(np.isfinite(solar_alt))):
        raise ValueError("nonfinite propagated geometry")
    peak_index = int(np.argmax(alt))
    peak = instants[peak_index]
    qualified = np.flatnonzero((alt >= 10) & (solar_alt <= -6) & sunlit)
    early = [int(i) for i in qualified if instants[i] <= peak - timedelta(seconds=15)]
    watch_index = early[-1] if early else int(qualified[0]) if len(qualified) else None
    magnitude = _optional_magnitude(record)
    direction = ("N", "NE", "E", "SE", "S", "SW", "W", "NW")[int((float(az[peak_index]) + 22.5) // 45) % 8]
    potential = watch_index is not None
    conditions = ("Sunlit sample at altitude ≥10° with Sun ≤−6°. Potentially observable; brightness, weather and local obstructions unknown."
        if potential else "Geometric pass only: no sampled interval meets sunlight, dark-sky and ≥10° altitude criteria. Brightness and weather unknown.")
    return {
        "id": f"{record['source_id']}:{_utc(rise)}", "norad_id": str(record["source_id"]),
        "name": record["name"], "catalog": record["catalog"], "source_id": str(record["source_id"]), "model": record["model"],
        "rise_utc": _utc(rise), "peak_utc": _utc(peak), "set_utc": _utc(setting),
        "peak_altitude_deg": float(alt[peak_index]), "peak_azimuth_deg": float(az[peak_index]), "direction": direction,
        "tle_epoch": _utc(epoch), "tle_age_days": max_age, "freshness_status": "fresh",
        "sunlit_at_peak": bool(sunlit[peak_index]), "solar_altitude_at_peak_deg": float(solar_alt[peak_index]),
        "conditions": conditions, "brightness_status": "standard_magnitude_only" if magnitude is not None else "unavailable",
        "optical_status": "potentially_observable" if potential else "geometric_only",
        "watch_utc": _utc(instants[watch_index]) if potential else None,
        "watch_altitude_deg": float(alt[watch_index]) if potential else None,
        "watch_azimuth_deg": float(az[watch_index]) if potential else None,
        "standard_magnitude": magnitude, "window_clipped_start": clipped_start, "window_clipped_end": clipped_end,
    }
