from __future__ import annotations

from collections import OrderedDict
from dataclasses import dataclass
from datetime import datetime, timezone
import os
from pathlib import Path
import threading
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


_RUNTIME_CACHE: OrderedDict[tuple[str, int, int], _Runtime] = OrderedDict()
_RUNTIME_CACHE_MAXSIZE = 4
_RUNTIME_CACHE_LOCK = threading.RLock()


def _release_dir(release_dir: Path | str | None = None) -> Path:
    if release_dir is not None:
        return Path(release_dir)
    configured = os.getenv("ORAS_PLANETARY_EPHEMERIS_DIR")
    return Path(configured) if configured else DEFAULT_RELEASE_DIR


def _parse_utc(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def _load_runtime_cached(
    release_path: str,
    manifest_mtime_ns: int,
    kernel_mtime_ns: int,
) -> _Runtime:
    cache_key = (release_path, manifest_mtime_ns, kernel_mtime_ns)
    with _RUNTIME_CACHE_LOCK:
        cached = _RUNTIME_CACHE.get(cache_key)
        if cached is not None:
            _RUNTIME_CACHE.move_to_end(cache_key)
            return cached

        release_dir = Path(release_path)
        manifest = validate_release(release_dir, validate_kernel=False)
        kernel = None
        try:
            kernel = load_file(str(release_dir / KERNEL_FILENAME))
            names = kernel.names()
            if 10 not in names or 399 not in names or 301 not in names:
                raise ValueError("planetary ephemeris kernel lacks Sun, Earth, or Moon targets")
            timescale = Loader(str(release_dir), verbose=False).timescale(builtin=True)
        except Exception:
            if kernel is not None:
                kernel.close()
            raise

        runtime = _Runtime(manifest=manifest, kernel=kernel, timescale=timescale)
        _RUNTIME_CACHE[cache_key] = runtime
        if len(_RUNTIME_CACHE) > _RUNTIME_CACHE_MAXSIZE:
            _, evicted = _RUNTIME_CACHE.popitem(last=False)
            evicted.kernel.close()
        return runtime


def _clear_runtime_cache() -> None:
    with _RUNTIME_CACHE_LOCK:
        runtimes = list(_RUNTIME_CACHE.values())
        _RUNTIME_CACHE.clear()
    for runtime in runtimes:
        runtime.kernel.close()


def _load_runtime(release_dir: Path) -> _Runtime:
    manifest_path = release_dir / MANIFEST_FILENAME
    kernel_path = release_dir / KERNEL_FILENAME
    if not manifest_path.is_file() or not kernel_path.is_file():
        raise EphemerisUnavailableError("local DE442s release is not mounted")
    try:
        return _load_runtime_cached(
            str(release_dir.resolve()),
            manifest_path.stat().st_mtime_ns,
            kernel_path.stat().st_mtime_ns,
        )
    except (KeyError, OSError, ValueError) as exc:
        raise EphemerisUnavailableError(f"local DE442s release is invalid: {exc}") from exc


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
            "message": str(exc),
        }

    manifest = runtime.manifest
    return {
        "loaded": True,
        "status": "loaded",
        "source_key": SOURCE_KEY,
        "fallback_source": FALLBACK_SOURCE_KEY,
        "object_count": len(BODY_TARGETS),
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
        astrometric = observer.at(time).observe(runtime.kernel[target_name])
        apparent = astrometric.apparent()
        ra, dec, distance = apparent.radec(epoch="date")
        ra_icrf, dec_icrf, _ = astrometric.radec()
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
                "ra_icrf": float(ra_icrf.hours * 15.0) % 360.0,
                "dec_icrf": float(dec_icrf.degrees),
                "azimuth": float(azimuth.degrees) % 360.0,
                "elevation": float(altitude.degrees),
                "distance_au": float(distance.au),
            }
        )
    return results

class LocalNightEphemeris:
    """Bounded, vectorized local-kernel access for night planning (no network fallback)."""

    def __init__(
        self, lat: float, lon: float, elevation_m: float, start: datetime, end: datetime
    ):
        self.runtime = _load_runtime(_release_dir())
        if not (
            _parse_utc(self.runtime.manifest["coverage_start"])
            <= start
            <= end
            <= _parse_utc(self.runtime.manifest["coverage_end"])
        ):
            raise EphemerisOutOfRangeError(
                "requested night is outside local DE442s coverage"
            )
        self.observer = self.runtime.kernel["earth"] + wgs84.latlon(
            lat, lon, elevation_m=elevation_m
        )
        self.targets = {source_id: target for source_id, _, target, _ in BODY_TARGETS}
        self._positions: dict[tuple[str, float], dict[str, float]] = {}

    def prime(self, source_id: str, timestamps: list[float]) -> None:
        instants = [datetime.fromtimestamp(s, timezone.utc) for s in timestamps]
        t = self.runtime.timescale.from_datetimes(instants)
        astrometric = self.observer.at(t).observe(
            self.runtime.kernel[self.targets[source_id]]
        )
        apparent = astrometric.apparent()
        ra, dec, _ = apparent.radec(epoch="date")
        ra_i, dec_i, _ = astrometric.radec()
        alt, az, _ = apparent.altaz()
        for i, s in enumerate(timestamps):
            self._positions[source_id, s] = dict(
                alt=float(alt.degrees[i]),
                az=float(az.degrees[i]),
                ra=float(ra.hours[i] * 15) % 360,
                dec=float(dec.degrees[i]),
                ra_icrf=float(ra_i.hours[i] * 15) % 360,
                dec_icrf=float(dec_i.degrees[i]),
            )

    def position(self, source_id: str, timestamp: float) -> dict[str, float]:
        if (source_id, timestamp) not in self._positions:
            self.prime(source_id, [timestamp])
        return self._positions[source_id, timestamp]

    def moon_illumination(self, timestamp: float) -> float:
        from skyfield.almanac import fraction_illuminated

        t = self.runtime.timescale.from_datetime(
            datetime.fromtimestamp(timestamp, timezone.utc)
        )
        return float(fraction_illuminated(self.runtime.kernel, "moon", t))
