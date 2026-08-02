from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from functools import lru_cache
import os
from pathlib import Path
from typing import Any

from skyfield.api import Loader, load_file, wgs84

from scripts.skydata.build_oras_planetary_ephemeris import KERNEL_FILENAME, MANIFEST_FILENAME
from scripts.skydata.validate_oras_planetary_ephemeris import validate_release


DEFAULT_RELEASE_DIR = Path("data/runtime-packs/planetary-ephemeris/release")
SOURCE_KEY = "jpl_de442s_local"
FALLBACK_SOURCE_KEY = "jpl_horizons"

BODY_TARGETS: tuple[tuple[str, str, str, str], ...] = (
    ("sun", "Sun", "sun", "Sun"),
    ("moon", "Moon", "moon", "Moon"),
    ("mercury", "Mercury", "mercury", "Mercury"),
    ("venus", "Venus", "venus", "Venus"),
    ("mars", "Mars", "mars barycenter", "Mars barycenter"),
    ("jupiter", "Jupiter", "jupiter barycenter", "Jupiter barycenter"),
    ("saturn", "Saturn", "saturn barycenter", "Saturn barycenter"),
    ("uranus", "Uranus", "uranus barycenter", "Uranus barycenter"),
    ("neptune", "Neptune", "neptune barycenter", "Neptune barycenter"),
)


class EphemerisUnavailableError(RuntimeError):
    pass


class EphemerisOutOfRangeError(EphemerisUnavailableError):
    pass


@dataclass(frozen=True)
class _Runtime:
    manifest: dict[str, Any]
    kernel: Any
    timescale: Any


def _release_dir(release_dir: Path | str | None = None) -> Path:
    if release_dir is not None:
        return Path(release_dir)
    configured = os.getenv("ORAS_PLANETARY_EPHEMERIS_DIR")
    return Path(configured) if configured else DEFAULT_RELEASE_DIR


def _parse_utc(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


@lru_cache(maxsize=4)
def _load_runtime_cached(
    release_path: str,
    manifest_mtime_ns: int,
    kernel_mtime_ns: int,
) -> _Runtime:
    del manifest_mtime_ns, kernel_mtime_ns
    release_dir = Path(release_path)
    manifest = validate_release(release_dir, validate_kernel=False)
    kernel = load_file(str(release_dir / KERNEL_FILENAME))
    names = kernel.names()
    if 10 not in names or 399 not in names or 301 not in names:
        kernel.close()
        raise ValueError("planetary ephemeris kernel lacks Sun, Earth, or Moon targets")
    timescale = Loader(str(release_dir), verbose=False).timescale(builtin=True)
    return _Runtime(manifest=manifest, kernel=kernel, timescale=timescale)


def _load_runtime(release_dir: Path) -> _Runtime:
    manifest_path = release_dir / MANIFEST_FILENAME
    kernel_path = release_dir / KERNEL_FILENAME
    if not manifest_path.is_file() or not kernel_path.is_file():
        raise EphemerisUnavailableError("local DE442s release is not mounted")
    return _load_runtime_cached(
        str(release_dir.resolve()),
        manifest_path.stat().st_mtime_ns,
        kernel_path.stat().st_mtime_ns,
    )


def get_planetary_ephemeris_status(
    release_dir: Path | str | None = None,
) -> dict[str, Any]:
    path = _release_dir(release_dir)
    try:
        runtime = _load_runtime(path)
    except Exception as exc:
        return {
            "loaded": False,
            "status": "degraded",
            "source_key": SOURCE_KEY,
            "fallback_source": FALLBACK_SOURCE_KEY,
            "object_count": 0,
            "release_dir": str(path),
            "message": str(exc),
        }

    manifest = runtime.manifest
    return {
        "loaded": True,
        "status": "loaded",
        "source_key": SOURCE_KEY,
        "fallback_source": FALLBACK_SOURCE_KEY,
        "object_count": len(BODY_TARGETS),
        "release_dir": str(path),
        "release_version": manifest["release_version"],
        "coverage_start": manifest["coverage_start"],
        "coverage_end": manifest["coverage_end"],
        "kernel_filename": manifest["kernel_filename"],
        "sha256": manifest["sha256"],
        "message": "Local JPL DE442s ephemeris is loaded.",
    }


def compute_local_planetary_ephemeris(
    lat: float,
    lon: float,
    *,
    elevation_ft: float | None = None,
    as_of: datetime | None = None,
    release_dir: Path | str | None = None,
) -> list[dict[str, Any]]:
    latitude = float(lat)
    longitude = float(lon)
    if not -90.0 <= latitude <= 90.0:
        raise ValueError("lat must be between -90 and 90")
    if not -180.0 <= longitude <= 180.0:
        raise ValueError("lon must be between -180 and 180")

    instant = as_of or datetime.now(timezone.utc)
    if instant.tzinfo is None:
        raise ValueError("as_of must include timezone")
    instant = instant.astimezone(timezone.utc)

    runtime = _load_runtime(_release_dir(release_dir))
    coverage_start = _parse_utc(runtime.manifest["coverage_start"])
    coverage_end = _parse_utc(runtime.manifest["coverage_end"])
    if not coverage_start <= instant <= coverage_end:
        raise EphemerisOutOfRangeError(
            "requested time is outside DE442s coverage "
            f"{coverage_start.isoformat()} to {coverage_end.isoformat()}"
        )

    elevation_m = float(elevation_ft or 0.0) * 0.3048
    observer = runtime.kernel["earth"] + wgs84.latlon(
        latitude_degrees=latitude,
        longitude_degrees=longitude,
        elevation_m=elevation_m,
    )
    time = runtime.timescale.from_datetime(instant)
    time_basis = instant.isoformat().replace("+00:00", "Z")

    results: list[dict[str, Any]] = []
    for source_id, name, target_name, target_reference in BODY_TARGETS:
        apparent = observer.at(time).observe(runtime.kernel[target_name]).apparent()
        ra, dec, distance = apparent.radec(epoch="date")
        altitude, azimuth, _ = apparent.altaz()
        results.append(
            {
                "id": source_id,
                "name": name,
                "source": SOURCE_KEY,
                "ephemeris_source": SOURCE_KEY,
                "target_reference": target_reference,
                "time_basis": time_basis,
                "ra": float(ra.hours * 15.0) % 360.0,
                "dec": float(dec.degrees),
                "azimuth": float(azimuth.degrees) % 360.0,
                "elevation": float(altitude.degrees),
                "distance_au": float(distance.au),
            }
        )
    return results
