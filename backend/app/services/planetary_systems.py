"""Source-centered planetary systems. PS1 admits Earth399/Moon301 only.

Catalog metadata is normalized from JPL, never a fabricated orbit catalog. All
positions/velocities and interpolation checks use the existing validated DE442s.
"""
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path

import numpy as np

from backend.app.services import planetary_ephemeris_service as ephemeris
from backend.app.services.solar_exploration import BODIES

COVERAGE_START = datetime(1900, 1, 1, tzinfo=timezone.utc)
COVERAGE_END = datetime(2051, 1, 1, tzinfo=timezone.utc)
STEP_SECONDS = 3600
WINDOW_DAYS = 16
SATELLITES = json.loads((Path(__file__).parents[1] / 'data/planetary_satellites.json').read_text())
UNAVAILABLE = 'Physical planet-center and satellite ephemerides are not yet qualified for this system.'


def _iso(epoch):
    return epoch.isoformat().replace('+00:00', 'Z')


def system_catalog():
    systems = []
    for index, (identity, name, _model, _target, _reference, radius, _period) in enumerate(BODIES[1:], 1):
        if identity in ('mercury', 'venus'):
            continue
        satellites = []
        for row in SATELLITES['satellites']:
            if row['parent'] != identity:
                continue
            qualified = identity == 'earth' and row['naif_id'] == '301'
            satellites.append({k: row[k] for k in ('id','name','naif_id','radius_km','radius_source')} | dict(
                status='qualified' if qualified else 'unavailable', reason=None if qualified else UNAVAILABLE,
                surface=dict(available=qualified, destination='/planet-view/moon' if qualified else None)))
        systems.append(dict(id=identity, name=f'{name} System',
            parent=dict(id=identity, name=name, naif_id=str(index * 100 + 99), radius_km=radius,
                        radius_source='https://nssdc.gsfc.nasa.gov/planetary/factsheet/', material=identity),
            status='qualified' if identity == 'earth' else 'unavailable',
            reason=None if identity == 'earth' else ('No natural satellites.' if not satellites else UNAVAILABLE),
            satellites=satellites))
    return dict(schema='oras.planetary-systems.v1', systems=systems)


def _window(runtime, epoch, start, end):
    left, right = max(start, epoch - timedelta(days=WINDOW_DAYS)), min(end, epoch + timedelta(days=WINDOW_DAYS))
    # Browser Date has no leap-second representation. Do not interpolate a UTC
    # segment across a known leap transition: stop at the last whole second
    # before it, or begin at midnight after it. Endpoint TDB durations remain true.
    for jd in runtime.timescale.leap_dates:
        transition = datetime.fromtimestamp((float(jd) - 2440587.5) * 86400, timezone.utc)
        if left < transition <= right:
            if epoch < transition:
                right = min(right, transition - timedelta(seconds=1))
            else:
                left = max(left, transition)
    stamps = [epoch]
    for direction, boundary in ((-1, left), (1, right)):
        stamp = epoch
        while True:
            following = stamp + timedelta(seconds=direction * STEP_SECONDS)
            if (direction == -1 and following <= boundary) or (direction == 1 and following >= boundary):
                stamps.append(boundary)
                break
            stamps.append(following)
            stamp = following
    return sorted(set(stamps))


def _evaluate(vector, times):
    state = vector.at(times)
    position, velocity = state.position.km.T, state.velocity.km_per_s.T
    if not np.isfinite(position).all() or not np.isfinite(velocity).all():
        raise ephemeris.EphemerisUnavailableError('Non-finite source state')
    return position, velocity


def _sample_track(runtime, target, stamps, times):
    vector = runtime.kernel[target] - runtime.kernel[399]
    position, velocity = _evaluate(vector, times)
    samples = [dict(epoch=_iso(stamp), jd_tdb=float(times.tdb[i]), position_km=position[i].tolist(), velocity_km_s=velocity[i].tolist()) for i, stamp in enumerate(stamps)]
    # Measure every segment at 1/4, 1/2 and 3/4 using fresh direct kernel
    # evaluations. This is a sampled error envelope, not a proof over all reals.
    fractions = np.array([.25, .5, .75])
    checkpoints = [a + (b - a) * float(f) for a, b in zip(stamps, stamps[1:]) for f in fractions]
    truth, _ = _evaluate(vector, runtime.timescale.from_datetimes(checkpoints))
    t = fractions[None, :, None]
    dt = (np.diff(times.tdb) * 86400)[:, None, None]
    approximated = ((2*t**3-3*t**2+1)*position[:-1, None, :] + (t**3-2*t**2+t)*dt*velocity[:-1, None, :]
                    + (-2*t**3+3*t**2)*position[1:, None, :] + (t**3-t**2)*dt*velocity[1:, None, :])
    error = float(np.max(np.linalg.norm(approximated.reshape(-1,3) - truth, axis=1)))
    if error > 1:
        raise ephemeris.EphemerisUnavailableError('Source interpolation exceeds the 1 km qualification threshold')
    return samples, error


def system_snapshot(system_id, epoch):
    system = next((s for s in system_catalog()['systems'] if s['id'] == system_id), None)
    if system is None:
        raise KeyError(system_id)
    if system['status'] != 'qualified':
        raise ephemeris.EphemerisUnavailableError(UNAVAILABLE)
    if epoch.tzinfo is None:
        raise ValueError('epoch requires an explicit timezone')
    epoch = epoch.astimezone(timezone.utc)
    if not COVERAGE_START <= epoch <= COVERAGE_END:
        raise ValueError('epoch outside qualified coverage')
    # Keep the runtime alive and shared JPL file reads serialized. The existing
    # cache uses this reentrant lock for load/eviction as well.
    with ephemeris._RUNTIME_CACHE_LOCK:
        runtime = ephemeris._load_runtime(ephemeris._release_dir())
        start = max(COVERAGE_START, ephemeris._parse_utc(runtime.manifest['coverage_start']))
        end = min(COVERAGE_END, ephemeris._parse_utc(runtime.manifest['coverage_end']))
        if not start <= epoch <= end:
            raise ValueError('epoch outside local source coverage')
        stamps = _window(runtime, epoch, start, end)
        if len(stamps) < 2:
            raise ephemeris.EphemerisUnavailableError('Insufficient source coverage')
        times = runtime.timescale.from_datetimes(stamps)
        moon, moon_error = _sample_track(runtime, 301, stamps, times)
        sun, sun_error = _sample_track(runtime, 10, stamps, times)
        index = stamps.index(epoch)
        state = {key: {k: samples[index][k] for k in ('position_km','velocity_km_s')} for key, samples in (('moon',moon),('sun',sun))}
        return dict(schema='oras.planetary-system.v1', system_id=system_id, epoch=_iso(epoch),
            time=dict(input_scale='UTC', evaluation_scale='TDB', jd_tdb=float(times.tdb[index])),
            parent=system['parent'], satellites=system['satellites'], origin='Earth center (399)',
            frame='ICRF', units='km', corrections='geometric; no light-time or aberration',
            coverage=dict(start=_iso(start), end=_iso(end)), sampled_coverage=dict(start=_iso(stamps[0]),end=_iso(stamps[-1])),
            source=dict(id=ephemeris.SOURCE_KEY, release=runtime.manifest['release_version'], sha256=runtime.manifest['sha256'], url=runtime.manifest['source_url']),
            tracks=[dict(id='moon',samples=moon)], sun_track=dict(id='sun',samples=sun), state=state,
            sampling=dict(step_seconds=STEP_SECONDS, interpolation='cubic-hermite', max_position_error_km=max(moon_error,sun_error),
                qualification_points_per_segment=3, time_fraction='UTC; TDB endpoint duration; leap transitions clipped',
                qualification='Every segment checked at quarter, half and three-quarter times against direct DE442s for Moon and parent-to-Sun; measured sampled error, not an all-times accuracy guarantee. Playback stops at sampled coverage. Future UTC uses installed Skyfield leap-second table.'))
