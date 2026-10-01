"""Hourly forecast facts, independent of astronomical ranking and caching."""

import itertools
import json
import logging
import math
from datetime import datetime, timezone

from backend.app.cache.redis_cache import cache_get, cache_set
from backend.app.schemas.tonight import Forecast
from backend.app.services.live_providers import _http_get_json
from backend.app.services.oras_site import ORAS_SITE

TTL_SECONDS = 600
MAX_AGE_SECONDS = 1800
FIELDS = {
    "cloud_cover": "cloud_cover_pct",
    "visibility": "visibility_m",
    "precipitation_probability": "precipitation_probability_pct",
    "temperature_2m": "temperature_c",
    "relative_humidity_2m": "humidity_pct",
    "wind_speed_10m": "wind_kmh",
    "dew_point_2m": "dew_point_c",
    "weather_code": "weather_code",
}
logger = logging.getLogger(__name__)


def iso(dt):
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def unavailable_forecast():
    return {
        "status": "unavailable",
        "provider": "open_meteo_hourly",
        "fetched_at": None,
        "generated_at": None,
        "coverage_start": None,
        "coverage_end": None,
        "hours": [],
    }


def normalize_forecast(raw, start, end, *, fetched_at, now=None):
    result = unavailable_forecast()
    result["fetched_at"] = iso(fetched_at)
    if (
        now is not None
        and not 0 <= (now - fetched_at).total_seconds() <= MAX_AGE_SECONDS
    ):
        result["status"] = "stale"
        return result
    hourly = raw.get("hourly", {}) if isinstance(raw, dict) else {}
    timestamps = hourly.get("time", []) if isinstance(hourly, dict) else []
    rows = {}
    for i, stamp in enumerate(timestamps):
        try:
            timestamp = float(stamp)
        except (ValueError, TypeError):
            continue
        if (
            not math.isfinite(timestamp)
            or not start.timestamp() - 3600 < timestamp < end.timestamp() + 3600
        ):
            continue
        row = {"time": iso(datetime.fromtimestamp(timestamp, timezone.utc))}
        for source, dest in FIELDS.items():
            values = hourly.get(source, [])
            value = values[i] if isinstance(values, list) and i < len(values) else None
            if (
                isinstance(value, (int, float))
                and not isinstance(value, bool)
                and math.isfinite(value)
            ):
                if dest.endswith("_pct") and not 0 <= value <= 100:
                    continue
                if dest in ("visibility_m", "wind_kmh") and value < 0:
                    continue
                row[dest] = value
        if len(row) > 1:
            rows[timestamp] = row
    if not rows:
        return result
    stamps = sorted(rows)
    result.update(
        hours=[rows[t] for t in stamps],
        coverage_start=rows[stamps[0]]["time"],
        coverage_end=rows[stamps[-1]]["time"],
    )
    complete = (
        stamps[0] <= start.timestamp()
        and stamps[-1] >= end.timestamp()
        and all(b - a <= 3600 for a, b in itertools.pairwise(stamps))
        and all("cloud_cover_pct" in rows[t] for t in stamps)
    )
    result["status"] = "available" if complete else "partial"
    return result


def fetch_forecast(*, start, end):
    key = f"tonight-forecast:v1:{ORAS_SITE['latitude']}:{ORAS_SITE['longitude']}:{iso(start)}:{iso(end)}"
    now = datetime.now(timezone.utc)
    try:
        cached = cache_get(key)
        if cached:
            try:
                payload = Forecast.parse_raw(cached).dict()
                fetched = datetime.fromisoformat(
                    payload["fetched_at"].replace("Z", "+00:00")
                )
                timestamps = [
                    datetime.fromisoformat(row["time"].replace("Z", "+00:00"))
                    for row in payload["hours"]
                ]
                valid = (
                    payload["status"] in {"available", "partial"}
                    and payload["provider"] == "open_meteo_hourly"
                    and bool(timestamps)
                    and all(t.tzinfo is not None for t in timestamps)
                    and all(
                        math.isfinite(value)
                        for row in payload["hours"]
                        for key, value in row.items()
                        if key != "time" and value is not None
                    )
                    and 0 <= (now - fetched).total_seconds() <= TTL_SECONDS
                )
                if valid:
                    return payload
            except (ValueError, TypeError, KeyError, AttributeError):
                logger.warning(
                    "Invalid Tonight forecast cache entry; fetching fresh hourly facts"
                )
        raw = _http_get_json(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": ORAS_SITE["latitude"],
                "longitude": ORAS_SITE["longitude"],
                "hourly": ",".join(FIELDS),
                "timezone": "UTC",
                "timeformat": "unixtime",
                "start_date": start.date().isoformat(),
                "end_date": end.date().isoformat(),
            },
            timeout_s=4,
        )
        result = normalize_forecast(raw, start, end, fetched_at=now)
        if result["status"] in ("available", "partial"):
            cache_set(key, json.dumps(result), ttl_seconds=TTL_SECONDS)
        return result
    except Exception:
        logger.warning("Tonight hourly forecast unavailable", exc_info=True)
        return unavailable_forecast()
