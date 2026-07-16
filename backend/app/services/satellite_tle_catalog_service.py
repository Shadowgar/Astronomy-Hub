from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
import gzip
import json
import os
from pathlib import Path
from typing import Any

from backend.app.services.sky_engine_links import build_sky_engine_identity_url


SATELLITE_TLE_CATALOG = "Satellite TLE (local)"
SATELLITE_TLE_MODEL = "tle_satellite"
REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_TLE_FEED_PATH = REPO_ROOT / "frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz"
SATELLITE_TLE_FEED_PATH_ENV = "SATELLITE_TLE_FEED_PATH"


@dataclass(frozen=True)
class SatelliteTleCatalog:
    records_by_norad: dict[str, dict[str, Any]]
    count: int
    malformed_count: int
    starlink_count: int
    non_starlink_count: int
    groups: dict[str, int]


@lru_cache(maxsize=1)
def load_satellite_tle_catalog(path: str | Path | None = None) -> SatelliteTleCatalog:
    feed_path = Path(path) if path is not None else _default_feed_path()
    payload = _read_possibly_nested_gzip(feed_path)

    records_by_norad: dict[str, dict[str, Any]] = {}
    malformed_count = 0
    starlink_count = 0
    groups: dict[str, int] = {}

    for line in payload.decode("utf-8", errors="replace").splitlines():
        if not line.strip():
            continue
        try:
            raw = json.loads(line)
            record = _normalize_satellite_record(raw)
        except Exception:
            malformed_count += 1
            continue
        if not record:
            malformed_count += 1
            continue

        source_id = record["source_id"]
        records_by_norad[source_id] = record
        record_groups = record.get("groups") or []
        for group in record_groups:
            groups[group] = groups.get(group, 0) + 1
        if _is_starlink_record(record):
            starlink_count += 1

    count = len(records_by_norad)
    return SatelliteTleCatalog(
        records_by_norad=records_by_norad,
        count=count,
        malformed_count=malformed_count,
        starlink_count=starlink_count,
        non_starlink_count=max(0, count - starlink_count),
        groups=dict(sorted(groups.items())),
    )


def lookup_satellite_tle(
    source_id: str,
    *,
    time: str | None = None,
    lat: str | float | None = None,
    lng: str | float | None = None,
    elev: str | float | None = None,
) -> dict[str, Any]:
    normalized_source_id = _normalize_source_id(source_id)
    if not normalized_source_id:
        raise ValueError("invalid satellite source_id")

    catalog = load_satellite_tle_catalog()
    record = catalog.records_by_norad.get(normalized_source_id)
    if not record:
        raise ValueError("object not found")

    result = dict(record)
    result["sky_engine_url"] = build_sky_engine_identity_url(
        catalog=SATELLITE_TLE_CATALOG,
        source_id=result["source_id"],
        model=SATELLITE_TLE_MODEL,
        name=result["display_name"],
        time=time,
        fov=1.0,
        lat=_optional_float(lat),
        lng=_optional_float(lng),
        elev=_optional_float(elev),
    )
    return result


def is_satellite_tle_identity(catalog: str | None, model: str | None = None) -> bool:
    if str(catalog or "").strip().lower() != SATELLITE_TLE_CATALOG.lower():
        return False
    if model is None:
        return True
    return str(model or "").strip().lower() == SATELLITE_TLE_MODEL


def _read_possibly_nested_gzip(path: Path) -> bytes:
    data = path.read_bytes()
    # Current browser-served runtime bundle is gzip-wrapped around gzip JSONL.
    for _ in range(3):
        if not data.startswith(b"\x1f\x8b"):
            break
        data = gzip.decompress(data)
    return data


def _default_feed_path() -> Path:
    configured = os.getenv(SATELLITE_TLE_FEED_PATH_ENV)
    return Path(configured) if configured else DEFAULT_TLE_FEED_PATH


def _normalize_satellite_record(raw: dict[str, Any]) -> dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None
    model = str(raw.get("model") or "").strip()
    model_data = raw.get("model_data") if isinstance(raw.get("model_data"), dict) else {}
    if model != SATELLITE_TLE_MODEL or not model_data:
        return None

    norad_id = _normalize_source_id(model_data.get("norad_number"))
    tle = model_data.get("tle")
    if not norad_id or not isinstance(tle, list) or len(tle) != 2:
        return None
    tle_lines = [str(line or "").strip() for line in tle]
    if not tle_lines[0].startswith("1 ") or not tle_lines[1].startswith("2 "):
        return None

    names = [str(name).strip() for name in raw.get("names", []) if str(name).strip()]
    display_name = _display_name(raw, names, norad_id)
    groups = [str(group).strip() for group in model_data.get("group", []) if str(group).strip()]
    category = str(model_data.get("subtype") or model_data.get("type") or (groups[0] if groups else "satellite")).strip()

    normalized_model_data = dict(model_data)
    normalized_model_data["norad_number"] = int(norad_id)
    normalized_model_data["tle"] = tle_lines
    normalized_model_data["source_id"] = norad_id
    source_provenance = raw.get("provenance") if isinstance(raw.get("provenance"), dict) else {}
    provenance = {
        key: str(source_provenance[key]).strip()
        for key in ("source_key", "source_url")
        if str(source_provenance.get(key) or "").strip()
    }
    if not provenance:
        provenance = {"source_key": "tle_satellite_local_bundle"}

    return {
        "catalog": SATELLITE_TLE_CATALOG,
        "source_id": norad_id,
        "norad_id": norad_id,
        "display_name": display_name,
        "name": display_name,
        "model": SATELLITE_TLE_MODEL,
        "names": names or [f"NORAD {norad_id}"],
        "types": raw.get("types") if isinstance(raw.get("types"), list) and raw.get("types") else ["Asa"],
        "category": category,
        "groups": groups,
        "short_name": str(raw.get("short_name") or display_name).strip(),
        "model_data": normalized_model_data,
        "indexed": True,
        "status": "indexed",
        "link_status": "exact_link_ready",
        "visibility_status": "propagation_pending",
        "message": "Resolved from the mounted TLE feed. Observer-specific propagation requires time and location.",
        "provenance": provenance,
    }


def _display_name(raw: dict[str, Any], names: list[str], norad_id: str) -> str:
    short_name = str(raw.get("short_name") or "").strip()
    if short_name:
        return short_name
    for name in names:
        if name.startswith("NAME "):
            return name[5:].strip()
    return names[0] if names else f"NORAD {norad_id}"


def _normalize_source_id(value: Any) -> str:
    text = str(value or "").strip()
    if text.upper().startswith("NORAD "):
        text = text.split(None, 1)[1]
    return text if text.isdigit() else ""


def _is_starlink_record(record: dict[str, Any]) -> bool:
    haystack = " ".join(
        [
            record.get("display_name") or "",
            record.get("short_name") or "",
            record.get("category") or "",
            " ".join(record.get("groups") or []),
            " ".join(record.get("names") or []),
        ]
    ).upper()
    return "STARLINK" in haystack


def _optional_float(value: str | float | int | None) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except Exception:
        return None
