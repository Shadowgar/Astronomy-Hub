from __future__ import annotations

from datetime import datetime, timezone
import json
import os
from pathlib import Path
from typing import Any

from backend.app.services.satellite_propagation_service import satellite_feed_freshness
from scripts.skydata.build_oras_satellite_tle_release import validate_release


MANIFEST_PATH_ENV = "ORAS_SATELLITE_TLE_MANIFEST_PATH"
FEED_PATH_ENV = "SATELLITE_TLE_FEED_PATH"


def build_satellite_feed_status(*, time: str | None = None) -> dict[str, Any]:
    as_of = _parse_time(time)
    feed_path = Path(os.getenv(FEED_PATH_ENV, "frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz"))
    manifest_path = Path(os.getenv(MANIFEST_PATH_ENV, str(feed_path.with_name("manifest.json"))))

    if not feed_path.is_file() or not manifest_path.is_file():
        return _response(
            {
                "mounted": False,
                "status": "degraded",
                "reason": "Satellite release feed or manifest is missing.",
                "record_count": 0,
                "freshness_status": "unavailable",
            }
        )

    try:
        manifest = validate_release(manifest_path.parent, minimum_count=1)
        freshness = satellite_feed_freshness(as_of, str(feed_path))
    except json.JSONDecodeError:
        reason_type = "manifest.json is invalid"
        return _response(
            {
                "mounted": True,
                "status": "degraded",
                "reason": f"Satellite release validation failed: {reason_type}",
                "record_count": 0,
                "freshness_status": "unavailable",
            }
        )
    except (OSError, TypeError, ValueError) as exc:
        reason_type = str(exc).strip() or "release data is invalid"
        return _response(
            {
                "mounted": True,
                "status": "degraded",
                "reason": f"Satellite release validation failed: {reason_type}",
                "record_count": 0,
                "freshness_status": "unavailable",
            }
        )

    is_fresh = freshness["freshness_status"] == "fresh"
    data = {
        "mounted": True,
        "status": "ready" if is_fresh else "degraded",
        "reason": (
            "Mounted CelesTrak satellite release is valid and fresh for the requested time."
            if is_fresh
            else "Mounted CelesTrak satellite release is valid but stale for the requested time."
        ),
        **manifest,
        **freshness,
    }
    return _response(data)


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
