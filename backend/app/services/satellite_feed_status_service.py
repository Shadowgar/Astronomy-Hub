from __future__ import annotations

from bisect import bisect_left, bisect_right
from datetime import datetime, timedelta, timezone
from functools import lru_cache
import json
import os
import zlib
from pathlib import Path
from typing import Any

from backend.app.services.satellite_propagation_service import (
    MAX_TLE_AGE_DAYS,
    _format_utc,
    _parse_tle_epoch,
    _satellite_feed_freshness_from_epochs,
)
from backend.app.services.satellite_tle_catalog_service import load_satellite_tle_catalog
from scripts.skydata.build_oras_satellite_tle_release import (
    DEFAULT_MINIMUM_COUNT,
    FEED_FILENAME,
    MANIFEST_FILENAME,
    read_validated_release,
)


MANIFEST_PATH_ENV = "ORAS_SATELLITE_TLE_MANIFEST_PATH"
FEED_PATH_ENV = "SATELLITE_TLE_FEED_PATH"
MINIMUM_COUNT_ENV = "ORAS_SATELLITE_MINIMUM_COUNT"


def build_satellite_feed_status(*, time: str | None = None, norad: str | None = None) -> dict[str, Any]:
    as_of = _parse_time(time)
    if norad is not None and (not norad.isascii() or not norad.isdigit() or norad.startswith("0") or len(norad) > 9):
        raise ValueError("norad must be a positive canonical catalog number containing 1 to 9 ASCII digits")
    feed_path = Path(os.getenv(FEED_PATH_ENV, "frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz")).resolve()
    manifest_path = Path(os.getenv(MANIFEST_PATH_ENV, str(feed_path.with_name("manifest.json")))).resolve()
    minimum_count = os.getenv(MINIMUM_COUNT_ENV, str(DEFAULT_MINIMUM_COUNT))

    snapshot = _feed_snapshot(str(feed_path), _file_identity(feed_path), str(manifest_path), _file_identity(manifest_path), minimum_count)
    epochs = snapshot["epochs"]
    count = snapshot["record_count"]
    freshness = _satellite_feed_freshness_from_epochs(as_of, epochs)
    window = timedelta(days=MAX_TLE_AGE_DAYS)
    fresh_count = bisect_right(epochs, as_of + window) - bisect_left(epochs, as_of - window)
    stale_count = len(epochs) - fresh_count
    unknown_count = count - len(epochs)
    if fresh_count:
        freshness["freshness_status"] = "fresh" if fresh_count == count and not snapshot["malformed_count"] else "mixed"
    elif stale_count:
        freshness["freshness_status"] = "stale"
    else:
        freshness["freshness_status"] = "unavailable"
    nearest_age = freshness["nearest_tle_age_days"]
    max_age = max(abs((as_of - epoch).total_seconds()) / 86400 for epoch in (epochs[0], epochs[-1])) if epochs else None
    qualified = snapshot["release_validated"] and freshness["freshness_status"] == "fresh"
    reason = snapshot["reason"]
    if snapshot["release_validated"]:
        reason = (
            "Mounted CelesTrak satellite release is valid and fresh for the requested time."
            if qualified
            else "Mounted satellite release has stale, mixed or unavailable TLE epochs for the requested time."
        )
    data = {
        **snapshot["manifest"],
        **freshness,
        "mounted": snapshot["mounted"],
        "status": "ready" if qualified else "degraded",
        "reason": reason,
        "release_manifest_available": snapshot["release_manifest_available"],
        "release_validated": snapshot["release_validated"],
        "provenance_status": "validated_release" if snapshot["release_validated"] else "unavailable",
        "record_count": count,
        "malformed_count": snapshot["malformed_count"],
        "fresh_record_count": fresh_count,
        "stale_record_count": stale_count,
        "unknown_epoch_count": unknown_count,
        "as_of_utc": _format_utc(as_of),
        "max_tle_age_days": MAX_TLE_AGE_DAYS,
        "epoch_min": _format_utc(epochs[0]) if epochs else None,
        "epoch_max": _format_utc(epochs[-1]) if epochs else None,
        "epoch_median": _format_utc(epochs[len(epochs) // 2]) if epochs else None,
        "tle_age_days_min": nearest_age,
        "tle_age_days_max": round(max_age, 3) if max_age is not None else None,
    }
    if norad is not None:
        # Selection reports current-data qualification even in a historical scene.
        current_utc = datetime.now(timezone.utc)
        epoch = snapshot["epochs_by_norad"].get(str(int(norad)))
        age = abs((current_utc - epoch).total_seconds()) / 86400 if epoch else None
        data["selected"] = {
            "norad_id": norad,
            "tle_epoch": _format_utc(epoch) if epoch else None,
            "tle_age_days": round(age, 3) if age is not None else None,
            "freshness_status": "unavailable" if age is None else "fresh" if age <= MAX_TLE_AGE_DAYS else "stale",
            "freshness_reference": "current_utc",
            "as_of_utc": _format_utc(current_utc),
        }
    return _response(data)


def _file_identity(path: Path) -> tuple[int, ...] | None:
    try:
        stat = path.stat()
        return (stat.st_dev, stat.st_ino, stat.st_size, stat.st_mtime_ns, stat.st_ctime_ns) if path.is_file() else None
    except OSError:
        return None


@lru_cache(maxsize=4)
def _feed_snapshot(feed: str, feed_identity: tuple[int, ...] | None, manifest: str, manifest_identity: tuple[int, ...] | None, minimum_count: str) -> dict[str, Any]:
    """Parse once per mounted file generation, never once per status poll.

    Reuse the catalog parser without its path-only cache: this snapshot cache also
    includes file identity so changed files cannot leave status on an older copy.
    A legacy native feed remains unqualified without its release manifest.
    """
    result: dict[str, Any] = {
        "mounted": feed_identity is not None,
        "release_manifest_available": manifest_identity is not None,
        "release_validated": False,
        "manifest": {},
        "record_count": 0,
        "malformed_count": 0,
        "epochs": (),
        "epochs_by_norad": {},
        "reason": "Satellite release feed or manifest is missing.",
    }
    if feed_identity is None:
        return result
    if manifest_identity is not None:
        try:
            if Path(feed).parent != Path(manifest).parent:
                raise ValueError("satellite feed and manifest must share the same release directory")
            if Path(feed).name != FEED_FILENAME or Path(manifest).name != MANIFEST_FILENAME:
                raise ValueError("configured satellite feed and manifest must use canonical release filenames")
            minimum = int(minimum_count)
            if minimum < 1:
                raise ValueError("satellite minimum count must be positive")
            release, _ = read_validated_release(Path(manifest).parent, minimum_count=minimum)
            result.update(manifest=release, release_validated=True)
        except (OSError, TypeError, ValueError) as exc:
            reason = "manifest.json is invalid" if isinstance(exc, json.JSONDecodeError) else str(exc).strip() or "release data is invalid"
            result["reason"] = f"Satellite release validation failed: {reason}"
    else:
        result["reason"] = "Native satellite feed is mounted; release manifest is missing and source provenance is unavailable."
    try:
        catalog = load_satellite_tle_catalog.__wrapped__(Path(feed))
        epochs_by_norad = {}
        for source_id, record in catalog.records_by_norad.items():
            try:
                epochs_by_norad[source_id] = _parse_tle_epoch(record["model_data"]["tle"][0])
            except (KeyError, IndexError, TypeError, ValueError, OverflowError):
                continue
        result.update(record_count=catalog.count, malformed_count=catalog.malformed_count, epochs=tuple(sorted(epochs_by_norad.values())), epochs_by_norad=epochs_by_norad)
    except (OSError, EOFError, TypeError, ValueError, zlib.error) as exc:
        result.update(release_validated=False, manifest={})
        result["reason"] += f" Native satellite feed could not be parsed: {type(exc).__name__}"
    return result


def _response(data: dict[str, Any]) -> dict[str, Any]:
    return {"status": "ok", "data": data, "meta": {}, "error": None}


def _parse_time(value: str | None) -> datetime:
    if not value:
        return datetime.now(timezone.utc)
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("time must be ISO-8601") from exc
    if parsed.tzinfo is None:
        raise ValueError("time must include timezone (Z or offset)")
    return parsed.astimezone(timezone.utc)
