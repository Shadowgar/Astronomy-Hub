"""Bounded, checked DE442s tracks for continuous Solar rendering.

The source remains the mounted, qualified kernel. Interpolation error is checked
against that kernel at three points per segment, not advertised as physical accuracy.
"""
from datetime import datetime, timedelta, timezone
import numpy as np
from backend.app.services import planetary_ephemeris_service as ephemeris
from backend.app.services.solar_exploration import BODIES

KM_PER_AU = 149597870.7
STEP_SECONDS = 3600
WINDOW_DAYS = 8


def _iso(epoch):
    return epoch.isoformat(timespec='milliseconds').replace('+00:00', 'Z')


def _window(runtime, epoch, start, end):
    left, right = max(start, epoch-timedelta(days=WINDOW_DAYS)), min(end, epoch+timedelta(days=WINDOW_DAYS))
    for jd in runtime.timescale.leap_dates:
        transition = datetime.fromtimestamp((float(jd)-2440587.5)*86400, timezone.utc)
        if left < transition <= right:
            if epoch < transition:
                right = min(right, transition-timedelta(milliseconds=1))
            else:
                left = max(left, transition)
    stamps = [epoch]
    for direction, boundary in ((-1,left),(1,right)):
        stamp = epoch
        while True:
            following = stamp+timedelta(seconds=direction*STEP_SECONDS)
            if (direction < 0 and following <= boundary) or (direction > 0 and following >= boundary):
                stamps.append(boundary)
                break
            stamps.append(following)
            stamp = following
    return sorted(set(stamps))


def _evaluate(vector, times):
    state = vector.at(times)
    position, velocity = state.position.au.T, state.velocity.au_per_d.T / 86400
    if not np.isfinite(position).all() or not np.isfinite(velocity).all():
        raise ephemeris.EphemerisUnavailableError('Non-finite Solar motion source')
    return position, velocity


def solar_motion(epoch):
    if epoch.tzinfo is None or epoch.microsecond % 1000:
        raise ValueError('Explicit timezone and millisecond precision required')
    epoch = epoch.astimezone(timezone.utc)
    with ephemeris._RUNTIME_CACHE_LOCK:
        runtime = ephemeris._load_runtime(ephemeris._release_dir())
        start = ephemeris._parse_utc(runtime.manifest['coverage_start'])
        end = ephemeris._parse_utc(runtime.manifest['coverage_end'])
        if not start <= epoch <= end:
            raise ValueError('Epoch outside DE442s coverage')
        stamps = _window(runtime, epoch, start, end)
        times = runtime.timescale.from_datetimes(stamps)
        fractions = np.array([.25,.5,.75])
        checks = [a+(b-a)*float(f) for a,b in zip(stamps,stamps[1:]) for f in fractions]
        check_times = runtime.timescale.from_datetimes(checks)
        u = fractions[None,:,None]
        dt = (np.diff(times.tdb)*86400)[:,None,None]
        tracks, errors = [], []
        for identity,_name,_model,target,reference,_radius,_period in BODIES:
            if target == 10:
                position = velocity = np.zeros((len(stamps),3))
                error = 0.0
            else:
                vector = runtime.kernel[target]-runtime.kernel[10]
                position,velocity = _evaluate(vector,times)
                truth,_ = _evaluate(vector,check_times)
                approximate = ((2*u**3-3*u*u+1)*position[:-1,None,:]+(u**3-2*u*u+u)*dt*velocity[:-1,None,:]
                               +(-2*u**3+3*u*u)*position[1:,None,:]+(u**3-u*u)*dt*velocity[1:,None,:])
                error = float(np.max(np.linalg.norm(approximate.reshape(-1,3)-truth,axis=1)))*KM_PER_AU
                if not np.isfinite(error) or error >= 1:
                    raise ephemeris.EphemerisUnavailableError('Solar interpolation exceeded qualification threshold')
            errors.append(error)
            tracks.append(dict(id=identity,ephemeris_target=str(target),position_reference=reference,samples=[
                dict(epoch=_iso(stamp),jd_tdb=float(times.tdb[i]),position_au=position[i].tolist(),velocity_au_s=velocity[i].tolist())
                for i,stamp in enumerate(stamps)]))
        return dict(schema='oras.solar-motion.v1',epoch=_iso(epoch),origin='Sun center (10)',frame='ICRF',units='AU,AU/s',
            time_scale='UTC input; TDB kernel evaluation',corrections='geometric; no light-time or aberration',
            coverage=dict(start=_iso(start),end=_iso(end)),sampled_coverage=dict(start=_iso(stamps[0]),end=_iso(stamps[-1])),
            source=dict(id=ephemeris.SOURCE_KEY,release=runtime.manifest['release_version'],sha256=runtime.manifest['sha256']),
            tracks=tracks,sampling=dict(step_seconds=STEP_SECONDS,interpolation='cubic-hermite',max_position_error_km=max(errors),
                qualification_points_per_segment=3,time_fraction='UTC; TDB endpoint duration; leap transitions clipped',
                qualification='Checked at quarter, half and three-quarter times against direct DE442s. Sampled interpolation error below 1 km; not a physical accuracy or all-times guarantee. No extrapolation; future UTC uses installed leap-second tables.'))
