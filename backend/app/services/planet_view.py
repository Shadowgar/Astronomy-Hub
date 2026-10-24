"""Bounded Moon-specific science; renderer math remains in the native runtime."""
from __future__ import annotations

from datetime import datetime, timezone
from functools import lru_cache
import hashlib
import os
from pathlib import Path
import threading
from weakref import finalize

import numpy as np
from skyfield.api import PlanetaryConstants

from backend.app.services import planetary_ephemeris_service as ephemeris
from scripts.skydata.build_lunar_orientation import LUNAR_FILES

FRAME_ID = 31009
FRAME_NAME = 'MOON_ME_DE440_ME421'
COVERAGE_START = datetime(1900, 1, 1, tzinfo=timezone.utc)
COVERAGE_END = datetime(2051, 1, 1, tzinfo=timezone.utc)
_ORIENTATION_LOCK = threading.RLock()


def _orientation_dir() -> Path:
    return Path(os.environ.get('ORAS_LUNAR_ORIENTATION_DIR', 'data/runtime-packs/lunar-orientation/release'))


@lru_cache(maxsize=4)
def _load_orientation(directory: str, identities: tuple):
    pc = PlanetaryConstants()
    path = Path(directory)
    for name, (_, digest) in LUNAR_FILES.items():
        if hashlib.sha256((path / name).read_bytes()).hexdigest() != digest:
            raise ValueError('lunar kernel digest does not match the qualified source')
    for name in ('moon_de440_250416.tf', 'pck00011.tpc'):
        pc.read_text((path / name).open('rb'))
    pc.read_binary((path / 'moon_pa_de440_200625.bpc').open('rb'))
    # Keep the mapped binary open while cached, close on eviction/process exit.
    for binary in pc._binary_files:
        finalize(pc, binary.close)
    if pc.variables['BODY301_RADII'] != [1737.4, 1737.4, 1737.4]:
        raise ValueError('unqualified lunar shape')
    return pc


def _orientation_at(t):
    try:
        path = _orientation_dir().resolve()
        identities = tuple((name, (path / name).stat().st_mtime_ns, (path / name).stat().st_size) for name in LUNAR_FILES)
        # Existing Skyfield/JPL readers share file handles; serialize access to
        # prevent seek/read races across FastAPI worker threads.
        with _ORIENTATION_LOCK:
            pc = _load_orientation(str(path), identities)
            # Skyfield's default map keeps only the final segment for a body.
            # Select actual covering segment, retaining the upstream frame math.
            segment = next(s for s in reversed(pc._segment_list) if s.body == 31008 and s.initial_jd <= t.tdb <= s.final_jd)
            frame = pc.build_frame(FRAME_ID, _segment=segment)
            if frame.center != 301:
                raise ValueError('lunar frame must be centered on body 301')
            rotation = frame.rotation_at(t)
        if not np.isfinite(rotation).all():
            raise ValueError('non-finite lunar orientation')
        return rotation, pc.variables['BODY301_RADII']
    except (OSError, ValueError, KeyError, LookupError, StopIteration) as exc:
        raise ephemeris.EphemerisUnavailableError('Qualified local lunar orientation is unavailable') from exc


def planet_snapshot(instant: datetime) -> dict:
    if instant.tzinfo is None:
        raise ValueError('time requires an explicit timezone')
    instant = instant.astimezone(timezone.utc)
    if not COVERAGE_START <= instant <= COVERAGE_END:
        raise ValueError('time is outside qualified lunar coverage')
    runtime = ephemeris._load_runtime(ephemeris._release_dir())
    if not ephemeris._parse_utc(runtime.manifest['coverage_start']) <= instant <= ephemeris._parse_utc(runtime.manifest['coverage_end']):
        raise ValueError('time is outside ephemeris coverage')
    t = runtime.timescale.from_datetime(instant)
    rotation, radii = _orientation_at(t)
    # Body 301 is the Moon center; never substitute Earth-Moon barycenter 3.
    sun = rotation @ (runtime.kernel[10] - runtime.kernel[301]).at(t).position.km
    sun /= np.linalg.norm(sun)
    if not np.isfinite(sun).all():
        raise ephemeris.EphemerisUnavailableError('Non-finite lunar solar direction')
    return {
        'schema': 'oras.planet-view.v1',
        'body': dict(catalog='Solar System (JPL)', source_id='moon', model='moon', name='Moon', naif_id='301', position_reference='Moon center (301)'),
        'epoch': instant.isoformat().replace('+00:00', 'Z'),
        'time': dict(input_scale='UTC', evaluation_scale='TDB', jd_tdb=float(t.tdb)),
        'frame': dict(inertial='ICRF', body_fixed=FRAME_NAME, naif_frame_id=str(FRAME_ID), icrf_to_body_fixed=rotation.tolist()),
        'shape': dict(model='reference sphere', radii_m=[r * 1000 for r in radii], source='NAIF pck00011 BODY301_RADII'),
        'coordinates': dict(latitude='planetocentric degrees north', longitude='degrees east [-180,180)', height='meters above reference sphere; not terrain elevation'),
        'illumination': dict(direction_body_fixed=sun.tolist(), corrections='geometric; no light-time or aberration', source='JPL DE442s'),
        'capabilities': dict(orientation=True, globe=True, terrain=False, terrain_reason='No terrain/elevation source qualified'),
        'sources': [dict(id=name, url=url, sha256=digest) for name, (url, digest) in LUNAR_FILES.items()] + [dict(id='DE442s', url=runtime.manifest['source_url'], sha256=runtime.manifest['sha256'])],
        'coverage': dict(start='1900-01-01T00:00:00Z', end='2051-01-01T00:00:00Z'),
        'uncertainty': 'Reference sphere, not topography. DE440 ME frame aligned to DE421 ME within about 1.02 m over 1900–2051 (NAIF comparison); this is frame agreement, not surface/imagery accuracy. DE442s positions and DE440 orientation use different dynamical fits; no combined accuracy is asserted.',
    }
