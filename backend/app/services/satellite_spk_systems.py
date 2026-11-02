"""Bounded, immutable JPL satellite SPKs; physical planet centers, never Kepler fits.

Each moon is evaluated relative to its physical parent by subtracting the two
source vectors with the same barycenter. Sun lighting uses the kernel's complete
parent chain. URA182 is paired explicitly with URA184 barycenter and DE441 Sun excerpts.
No network requests are made by this service.
"""
from copy import deepcopy
from dataclasses import dataclass
from datetime import datetime,timedelta,timezone
from functools import lru_cache
import hashlib
import json
import math
import os
from pathlib import Path
import threading
from weakref import finalize

import numpy as np
from jplephem.spk import SPK
from skyfield.api import Loader

from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError
from backend.app.services import system_body_orientation as orientation

PARENTS={'mars':'499','jupiter':'599','saturn':'699','uranus':'799','neptune':'899'}
MOONS={'mars':('401','402'),'jupiter':('501','502','503','504'),'saturn':('602','606'),
       'uranus':('701','702','703','704','705'),'neptune':('801',)}
FIRST,LAST=2460676.5,2462502.5
RELEASE_SHA256='e268784c53783932386399c84f7e1a065b2f3c15141e7f77712527d372998085'
STEP_SECONDS=600
WINDOW_DAYS=2
_LOCK=threading.RLock()


def release_dir():
    return Path(os.environ.get('ORAS_PLANETARY_SYSTEMS_SPK_DIR','data/runtime-packs/planetary-systems-spk/release-2025-2030-v3'))


def source_present(directory=None):
    """An explicitly present but corrupt release fails closed, without fallback."""
    return ((Path(directory) if directory is not None else release_dir())/'manifest.json').exists()


@dataclass
class Runtime:
    manifest:dict
    kernels:dict
    variables:dict
    timescale:object


def _digest(raw):
    return hashlib.sha256(raw).hexdigest()


@lru_cache(maxsize=2)
def _read_runtime(directory,identities):
    path=Path(directory)
    raw=(path/'manifest.json').read_bytes()
    if _digest(raw)!=RELEASE_SHA256:
        raise ValueError('Unqualified SPK release manifest')
    manifest=json.loads(raw)
    if (manifest['first_jd_tdb'],manifest['last_jd_tdb'],manifest['frame'],manifest['time_scale'],manifest['corrections'])!=(FIRST,LAST,'ICRF','TDB','NONE'):
        raise ValueError('Unqualified SPK semantics')
    kernels={}
    try:
        for name,meta in manifest['sources'].items():
            source=path/meta['file']
            if source.name!=meta['file'] or source.stat().st_size!=meta['bytes'] or _digest(source.read_bytes())!=meta['sha256']:
                raise ValueError('Changed SPK excerpt')
            kernel=SPK.open(str(source));kernels[name]=kernel
            expected={(0,7)} if name=='uranus_solar' else {(0,10)} if name=='reference_sun' else {(int(PARENTS[name])//100,int(PARENTS[name]))}|{(int(PARENTS[name])//100,int(m)) for m in MOONS[name]}
            if name not in ('uranus','uranus_solar','reference_sun'):
                expected|={(0,int(PARENTS[name])//100),(0,10)}
            if {(s.center,s.target) for s in kernel.segments}!=expected or any(s.frame!=1 or s.data_type!=2 or s.start_jd!=FIRST or s.end_jd!=LAST for s in kernel.segments):
                raise ValueError('SPK center, frame, representation or coverage mismatch')
        variables=orientation.load_pck(path/manifest['orientation']['file'])
        runtime=Runtime(manifest,kernels,variables,Loader(str(path),verbose=False).timescale(builtin=True))
        for kernel in kernels.values():finalize(runtime,kernel.close)
        return runtime
    except Exception:
        for kernel in kernels.values():kernel.close()
        raise


def load_runtime(directory=None):
    path=Path(directory) if directory is not None else release_dir()
    try:
        names=['manifest.json','pck00011.tpc']+[name+'-2025-2030.bsp' for name in (*PARENTS,'uranus_solar','reference_sun')]
        identities=tuple((name,(path/name).stat().st_mtime_ns,(path/name).stat().st_ctime_ns,(path/name).stat().st_size) for name in names)
        with _LOCK:return _read_runtime(str(path.resolve()),identities)
    except (OSError,ValueError,KeyError,TypeError) as exc:
        raise EphemerisUnavailableError('Qualified satellite SPK source release is unavailable') from exc


def evaluate(runtime,system_id,target,jd_tdb):
    jd=np.asarray(jd_tdb,dtype=float)
    if not np.isfinite(jd).all() or np.any(jd<FIRST) or np.any(jd>LAST):
        raise ValueError('Epoch outside qualified satellite SPK coverage')
    parent=int(PARENTS[system_id]);barycenter=parent//100;target=int(target)
    if target!=parent and str(target) not in MOONS[system_id]:
        raise ValueError('Unqualified satellite identity')
    kernel=runtime.kernels[system_id]
    with _LOCK:
        pp,pv=kernel[barycenter,parent].compute_and_differentiate(jd)
        if target==parent:
            solar=runtime.kernels['uranus_solar'] if system_id=='uranus' else kernel
            sun_source=runtime.kernels['reference_sun'] if system_id=='uranus' else solar
            sp,sv=sun_source[0,10].compute_and_differentiate(jd)
            bp,bv=solar[0,barycenter].compute_and_differentiate(jd)
            position,velocity=sp-bp-pp,sv-bv-pv
        else:
            mp,mv=kernel[barycenter,target].compute_and_differentiate(jd)
            position,velocity=mp-pp,mv-pv
    position,velocity=position.T,velocity.T/86400
    if not np.isfinite(position).all() or not np.isfinite(velocity).all():
        raise EphemerisUnavailableError('Non-finite satellite SPK state')
    return position,velocity


def usable_bounds(runtime):
    first=runtime.timescale.tdb_jd(FIRST).utc_datetime()
    last=runtime.timescale.tdb_jd(LAST).utc_datetime()
    start=first.replace(microsecond=first.microsecond//1000*1000)
    if first.microsecond%1000:start+=timedelta(milliseconds=1)
    return start,last.replace(microsecond=last.microsecond//1000*1000)


def _admit(entry):
    result=deepcopy(entry);identity=result['id']
    if result['parent']['naif_id']!=PARENTS[identity]:
        raise EphemerisUnavailableError('Catalog parent must be the physical planet center')
    result.update(status='qualified',reason=None)
    for moon in result['satellites']:
        if moon['naif_id'] in MOONS[identity]:
            if moon['radius_km'] is None or moon['radius_km']<=0:
                raise EphemerisUnavailableError('Missing sourced satellite radius')
            moon.update(status='qualified',reason=None)
        moon['surface']=dict(available=False,destination=None)
    return result


def qualify_catalog(catalog,directory=None):
    load_runtime(directory)
    result=deepcopy(catalog)
    result['systems']=[_admit(entry) if entry['id'] in PARENTS else entry for entry in result['systems']]
    return result


def _iso(epoch):
    return epoch.isoformat(timespec='microseconds').replace('+00:00','Z')


def _window(runtime,epoch,start,end):
    left,right=max(start,epoch-timedelta(days=WINDOW_DAYS)),min(end,epoch+timedelta(days=WINDOW_DAYS))
    for jd in runtime.timescale.leap_dates:
        transition=datetime.fromtimestamp((float(jd)-2440587.5)*86400,timezone.utc)
        if left<transition<=right:
            if epoch<transition:right=min(right,transition-timedelta(milliseconds=1))
            else:left=max(left,transition)
    count=int(np.ceil((right-left).total_seconds()/STEP_SECONDS))
    stamps=[left+timedelta(seconds=min(i*STEP_SECONDS,(right-left).total_seconds())) for i in range(count+1)]
    return stamps


def _track(runtime,identity,target,body_id,stamps,times):
    position,velocity=evaluate(runtime,identity,target,times.tdb)
    fractions=np.array([.25,.5,.75])
    checkpoints=[a+(b-a)*float(f) for a,b in zip(stamps,stamps[1:]) for f in fractions]
    truth,_=evaluate(runtime,identity,target,runtime.timescale.from_datetimes(checkpoints).tdb)
    u=fractions[None,:,None];dt=(np.diff(times.tdb)*86400)[:,None,None]
    approximate=(2*u**3-3*u**2+1)*position[:-1,None,:]+(u**3-2*u**2+u)*dt*velocity[:-1,None,:]+(-2*u**3+3*u**2)*position[1:,None,:]+(u**3-u**2)*dt*velocity[1:,None,:]
    error=float(np.max(np.linalg.norm(approximate.reshape(-1,3)-truth,axis=1)))
    if not math.isfinite(error) or error>=.1:
        raise EphemerisUnavailableError('Satellite SPK interpolation exceeds 0.1 km sampled threshold')
    return dict(id=body_id,step_seconds=STEP_SECONDS,samples=[dict(epoch=_iso(stamp),jd_tdb=float(times.tdb[i]),position_km=position[i].tolist(),velocity_km_s=velocity[i].tolist()) for i,stamp in enumerate(stamps)]),error


def spk_snapshot(system_id,epoch,base_entry,directory=None):
    if system_id not in PARENTS or base_entry['id']!=system_id:raise KeyError(system_id)
    if epoch.tzinfo is None:raise ValueError('Epoch requires explicit timezone')
    epoch=epoch.astimezone(timezone.utc)
    runtime=load_runtime(directory);start,end=usable_bounds(runtime)
    if not start<=epoch<=end:raise ValueError('Epoch outside qualified satellite SPK UTC coverage')
    entry=_admit(base_entry);stamps=_window(runtime,epoch,start,end);times=runtime.timescale.from_datetimes(stamps)
    now=runtime.timescale.from_datetime(epoch);source=runtime.manifest['sources'][system_id]
    sun,sun_error=_track(runtime,system_id,PARENTS[system_id],'sun',stamps,times)
    p,v=evaluate(runtime,system_id,PARENTS[system_id],float(now.tdb));state={'sun':dict(position_km=p.tolist(),velocity_km_s=v.tolist())}
    tracks=[];errors=[sun_error];orientations={}
    parent_name=entry['parent']['name']
    headers=[dict(target_id=PARENTS[system_id],center_id='10',target_header=f'{parent_name} physical center ({PARENTS[system_id]})',center_header='Sun (10)',source_sha256=source['sha256'],source_url=source['url'])]
    for moon in entry['satellites']:
        if moon['status']!='qualified':continue
        track,error=_track(runtime,system_id,moon['naif_id'],moon['id'],stamps,times);tracks.append(track);errors.append(error)
        p,v=evaluate(runtime,system_id,moon['naif_id'],float(now.tdb));state[moon['id']]=dict(position_km=p.tolist(),velocity_km_s=v.tolist())
        headers.append(dict(target_id=moon['naif_id'],center_id=PARENTS[system_id],target_header=f"{moon['name']} ({moon['naif_id']})",center_header=f'{parent_name} ({PARENTS[system_id]})',source_sha256=source['sha256'],source_url=source['url']))
        orientations[moon['id']]=orientation.pck_orientation(moon['id'],moon['naif_id'],runtime.variables,stamps[0],stamps[-1],runtime.timescale)
    orientations[system_id]=orientation.pck_orientation(system_id,PARENTS[system_id],runtime.variables,stamps[0],stamps[-1],runtime.timescale)
    dependencies=[system_id]+(['uranus_solar','reference_sun'] if system_id=='uranus' else [])
    return dict(schema='oras.planetary-system.v1',system_id=system_id,epoch=epoch.isoformat().replace('+00:00','Z'),
        time=dict(input_scale='UTC',evaluation_scale='TDB',jd_tdb=float(now.tdb)),parent=entry['parent'],satellites=entry['satellites'],
        origin=f'{parent_name} center ({PARENTS[system_id]})',frame='ICRF',units='km',corrections='geometric; no light-time or aberration',
        coverage=dict(start=start.isoformat(timespec='milliseconds').replace('+00:00','Z'),end=end.isoformat(timespec='milliseconds').replace('+00:00','Z')),
        sampled_coverage=dict(start=_iso(stamps[0]),end=_iso(stamps[-1])),source=dict(id='jpl_satellite_spk_local',release=runtime.manifest['release'],sha256=RELEASE_SHA256,
            url='https://ssd.jpl.nasa.gov/sats/ephem/files.html',coverage_start_jd_tdb=FIRST,coverage_end_jd_tdb=LAST,series=headers,
            kernels=[dict(id=name,**{key:runtime.manifest['sources'][name][key] for key in ('url','sha256','bytes','file')}) for name in dependencies],
            transition='Physical-center SPK domain; moon and parent offsets share a source barycenter and are explicitly subtracted. Sun uses the complete same-source chain; URA182 uses explicit URA184 barycenter and DE441 Sun support matching Horizons. No DE442s offset or Kepler propagation.'),
        tracks=tracks,sun_track=sun,state=state,orientations=orientations,
        sampling=dict(step_seconds=STEP_SECONDS,interpolation='cubic-hermite',max_position_error_km=max(errors),qualification_points_per_segment=3,
            time_fraction='UTC fractions; TDB tangent durations; known leap transitions clipped',
            qualification='Original JPL type-2 Chebyshev coefficients evaluated directly. Every returned interpolation segment checked at quarter/half/three-quarter epochs against direct SPK. Sampled error <0.1 km is not physical ephemeris accuracy or a continuous bound. Playback stops at sampled coverage; request a new window for another epoch. UTC uses installed Skyfield leap-second table, including future UTC assumptions; no extrapolation.'))
