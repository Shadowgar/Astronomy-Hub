"""Local, immutable finite Horizons pack; no runtime network or DE442s geometry."""
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from functools import lru_cache
import hashlib
import json
import math
import os
from pathlib import Path

import numpy as np
from skyfield.api import Loader

from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError

PARENTS = {'mars':'499','jupiter':'599','saturn':'699','uranus':'799','neptune':'899'}
TARGETS = {'499':'10','599':'10','699':'10','799':'10','899':'10','401':'499','402':'499','501':'599','502':'599','503':'599','504':'599','602':'699','606':'699','701':'799','702':'799','703':'799','704':'799','705':'799','801':'899'}
RELEASE_SHA256 = '770352992eeda04a7005172b2d57d6a3809deaf612f0e16971f74751df2eca61'
FIRST, LAST = 2461314.5, 2461345.5


def release_dir():
    return Path(os.environ.get('ORAS_PLANETARY_SYSTEMS_DIR','data/runtime-packs/planetary-systems/release'))


def _digest(raw):
    return hashlib.sha256(raw).hexdigest()


@lru_cache(maxsize=2)
def _read_pack(directory, identities):
    path=Path(directory)
    raw=(path/'manifest.json').read_bytes()
    if _digest(raw) != RELEASE_SHA256:
        raise ValueError('Unqualified release manifest')
    manifest=json.loads(raw)
    data=(path/'pack.json').read_bytes()
    if len(data) != manifest['pack_bytes'] or _digest(data) != manifest['pack_sha256']:
        raise ValueError('Changed vector pack')
    pack=json.loads(data)
    if pack['schema']!='oras.horizons-system-pack.v1' or pack['frame']!='ICRF' or pack['time_scale']!='TDB' or pack['units']!='km,km/s' or pack['corrections']!='NONE':
        raise ValueError('Unqualified pack semantics')
    if pack['first_jd_tdb']!=FIRST or pack['last_jd_tdb']!=LAST or set(pack['series'])!=set(TARGETS):
        raise ValueError('Unqualified body set or coverage')
    for target,row in pack['series'].items():
        step=row['step_seconds'];values=np.asarray(row['values'],dtype=float)
        if row['target_id']!=target or row['center_id']!=TARGETS[target] or step not in (600,1800,3600):
            raise ValueError('Physical center or cadence mismatch')
        if row['first_jd_tdb']!=FIRST or row['last_jd_tdb']!=LAST or values.shape!=(round((LAST-FIRST)*86400/step)+1,6) or not np.isfinite(values).all():
            raise ValueError('Invalid coverage/sample count or non-finite states')
        if not 0<=row['max_position_error_km']<.1:
            raise ValueError('Interpolation qualification missing')
        row['values']=values
    pack['release']=manifest['release']
    return pack


def load_pack(directory=None):
    path=Path(directory) if directory is not None else release_dir()
    try:
        identities=tuple((name,(path/name).stat().st_mtime_ns,(path/name).stat().st_ctime_ns,(path/name).stat().st_size) for name in ('manifest.json','pack.json'))
        return _read_pack(str(path.resolve()),identities)
    except (OSError,ValueError,KeyError,TypeError) as exc:
        raise EphemerisUnavailableError('Qualified finite Horizons source pack is unavailable') from exc


def evaluate(series,jd_tdb):
    if not math.isfinite(jd_tdb) or not series['first_jd_tdb']<=jd_tdb<=series['last_jd_tdb']:
        raise ValueError('Epoch outside finite Horizons TDB coverage')
    values=series['values']; h=series['step_seconds']
    offset=(jd_tdb-series['first_jd_tdb'])*86400/h
    i=min(int(offset),len(values)-2);u=offset-i
    a,b=values[i],values[i+1];p0,v0,p1,v1=a[:3],a[3:],b[:3],b[3:]
    position=(2*u**3-3*u*u+1)*p0+(u**3-2*u*u+u)*h*v0+(-2*u**3+3*u*u)*p1+(u**3-u*u)*h*v1
    velocity=(6*u*u-6*u)/h*p0+(3*u*u-4*u+1)*v0+(-6*u*u+6*u)/h*p1+(3*u*u-2*u)*v1
    return position,velocity


@lru_cache(maxsize=2)
def _timescale(directory):
    # builtin=True uses the installed Skyfield table, without download or writes.
    return Loader(directory,verbose=False).timescale(builtin=True)


def _iso(time):
    return time.utc_datetime().isoformat(timespec='microseconds').replace('+00:00','Z')


def _usable_utc_bounds(ts):
    """Inward millisecond bounds round-trip through JavaScript Date and URLs.

    Source samples retain their original TDB grid and precise UTC equivalents.
    Published usable coverage excludes the sub-millisecond edge slivers.
    """
    first = ts.tdb_jd(FIRST).utc_datetime()
    last = ts.tdb_jd(LAST).utc_datetime()
    start = first.replace(microsecond=first.microsecond // 1000 * 1000)
    if first.microsecond % 1000:
        start += timedelta(milliseconds=1)
    end = last.replace(microsecond=last.microsecond // 1000 * 1000)
    return start, end


def _track(identity,series,ts,sign=1):
    samples=[]
    for i,row in enumerate(series['values']):
        jd=series['first_jd_tdb']+i*series['step_seconds']/86400
        samples.append(dict(epoch=_iso(ts.tdb_jd(jd)),jd_tdb=jd,position_km=(sign*row[:3]).tolist(),velocity_km_s=(sign*row[3:]).tolist()))
    return dict(id=identity,step_seconds=series['step_seconds'],samples=samples)


def _admit(entry,pack):
    result=deepcopy(entry)
    parent=PARENTS[result['id']]
    if result['parent']['naif_id']!=parent:
        raise EphemerisUnavailableError('Catalog parent is not the qualified physical center')
    radii={row['naif_id']:row for row in pack['radii']['bodies']}
    result['status']='qualified';result['reason']=None
    for moon in result['satellites']:
        target=moon['naif_id']
        if target in pack['series'] and TARGETS[target]==parent:
            radius=radii[target]
            if radius['name'].lower()!=moon['id'] or radius['parent_name'].lower()!=result['id']:
                raise EphemerisUnavailableError('Satellite catalog identity mismatch')
            moon.update(status='qualified',reason=None,radius_km=radius['mean_radius_km'],radius_source=pack['radii']['source_url'])
        moon['surface']=dict(available=False,destination=None)
    return result


def qualify_catalog(catalog,directory=None):
    """Missing pack preserves existing unavailable states and Earth qualification."""
    result=deepcopy(catalog)
    try:
        pack=load_pack(directory)
    except EphemerisUnavailableError:
        return result
    result['systems']=[_admit(entry,pack) if entry['id'] in PARENTS else entry for entry in result['systems']]
    return result


def horizons_snapshot(system_id,epoch,base_entry,directory=None):
    if system_id not in PARENTS or base_entry['id']!=system_id:
        raise KeyError(system_id)
    if epoch.tzinfo is None:
        raise ValueError('Epoch requires a timezone')
    epoch=epoch.astimezone(timezone.utc)
    directory=Path(directory) if directory is not None else release_dir()
    pack=load_pack(directory);ts=_timescale(str(directory.resolve()))
    start, end = _usable_utc_bounds(ts)
    if not start <= epoch <= end:
        raise ValueError('Epoch outside published finite Horizons UTC coverage')
    instant=ts.from_datetime(epoch);jd=float(instant.tdb)
    if not FIRST<=jd<=LAST:
        raise ValueError('Epoch outside finite October 2026 Horizons coverage')
    entry=_admit(base_entry,pack);parent=pack['series'][PARENTS[system_id]]
    sun=_track('sun',parent,ts,-1)
    p,v=evaluate(parent,jd);state={'sun':dict(position_km=(-p).tolist(),velocity_km_s=(-v).tolist())}
    tracks=[];errors=[parent['max_position_error_km']];headers=[{k:parent[k] for k in ('target_id','center_id','target_header','center_header','source_sha256','source_url')}]
    for moon in entry['satellites']:
        if moon['status']!='qualified':continue
        row=pack['series'][moon['naif_id']];tracks.append(_track(moon['id'],row,ts))
        p,v=evaluate(row,jd);state[moon['id']]=dict(position_km=p.tolist(),velocity_km_s=v.tolist());errors.append(row['max_position_error_km'])
        headers.append({k:row[k] for k in ('target_id','center_id','target_header','center_header','source_sha256','source_url')})
    coverage=dict(start=start.isoformat(timespec='milliseconds').replace('+00:00','Z'),
                  end=end.isoformat(timespec='milliseconds').replace('+00:00','Z'))
    return dict(schema='oras.planetary-system.v1',system_id=system_id,epoch=epoch.isoformat().replace('+00:00','Z'),
        time=dict(input_scale='UTC',evaluation_scale='TDB',jd_tdb=jd),parent=entry['parent'],satellites=entry['satellites'],
        origin=f"{entry['parent']['name']} center ({PARENTS[system_id]})",frame='ICRF',units='km',corrections='geometric; no light-time or aberration',
        coverage=coverage,sampled_coverage=coverage,source=dict(id='jpl_horizons_local',release=pack['release'],sha256=RELEASE_SHA256,
            url='https://ssd.jpl.nasa.gov/horizons/',coverage_start_jd_tdb=FIRST,coverage_end_jd_tdb=LAST,series=headers,
            transition='Separate Horizons physical-center domain; no DE442s barycenter offset applied.'),
        tracks=tracks,sun_track=sun,state=state,sampling=dict(step_seconds=3600,interpolation='cubic-hermite',max_position_error_km=max(errors),
            qualification_points_per_segment=1,time_fraction='UTC fractions; TDB tangent durations; October 2026 has no known leap transitions',
            qualification='Every original interval independently queried at its midpoint; two additional quarter points per series. Observed error <0.1 km, not a continuous or physical-accuracy guarantee. Per-track source steps are 600/1800/3600 seconds. Usable UTC coverage is rounded inward to milliseconds; raw TDB samples are unchanged. UTC conversion uses installed Skyfield tables; no extrapolation.'))
