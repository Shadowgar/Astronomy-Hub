"""Optional immutable destination states, independent of the eight-planet service.

Pluto is physical center 999, never system barycenter 9. Minor bodies use
source-sampled numerical states, including hyperbolic comets; no conic solver.
"""
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from functools import lru_cache
import hashlib
import json
import os
from pathlib import Path
import threading
from weakref import finalize

import numpy as np
from jplephem.spk import SPK
from skyfield.api import Loader
from skyfield.data import text_pck
from io import BytesIO
from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError
from backend.app.services import satellite_spk_systems as spk_helpers
from backend.app.services import system_body_orientation as orientation

AU_KM=149597870.7
FIRST,LAST=2460676.5,2462502.5
RELEASE_SHA256='69c3a97875a081d38112f491f14a253af369262c31ad10521480406704d3baf9'
IDS=('ceres','vesta','eros','eris','halley','67p','borisov')
_LOCK=threading.RLock()

@dataclass
class Runtime:
    manifest: dict
    kernel: object
    vectors: dict
    variables: dict
    frame_variables: dict
    timescale: object

def release_dir():
    return Path(os.environ.get('ORAS_SOLAR_DESTINATIONS_DIR','data/runtime-packs/solar-destinations/release-2025-2030-v1'))

def _digest(raw):return hashlib.sha256(raw).hexdigest()
def _iso(stamp):return stamp.isoformat(timespec='microseconds').replace('+00:00','Z')
def _coverage(start,end):return dict(start=_iso(start),end=_iso(end))

def _checked(path,meta):
    if Path(meta['file']).name!=meta['file']:raise ValueError('Invalid source filename')
    raw=(path/meta['file']).read_bytes()
    if len(raw)!=meta['bytes'] or _digest(raw)!=meta['sha256']:raise ValueError('Changed destination source')
    return raw

@lru_cache(maxsize=2)
def _read_runtime(directory,identities):
    path=Path(directory);raw=(path/'manifest.json').read_bytes()
    if _digest(raw)!=RELEASE_SHA256:raise ValueError('Unqualified destination manifest')
    manifest=json.loads(raw)
    if (manifest['schema'],manifest['first_jd_tdb'],manifest['last_jd_tdb'],manifest['frame'],manifest['time_scale'],manifest['corrections'])!=('oras.solar-destinations-release.v1',FIRST,LAST,'ICRF','TDB','NONE') or set(manifest['bodies'])!=set(IDS):raise ValueError('Unqualified destination semantics')
    _checked(path,manifest['pluto']);kernel=SPK.open(str(path/manifest['pluto']['file']))
    try:
        expected={(0,9),(0,10)}|{(9,n) for n in (901,902,903,904,905,999)}
        if {(s.center,s.target) for s in kernel.segments}!=expected or any(s.frame!=1 or s.data_type!=2 or s.start_jd!=FIRST or s.end_jd!=LAST for s in kernel.segments):raise ValueError('Unqualified Pluto kernel chain')
        vectors={}
        for identity,meta in manifest['bodies'].items():
            document=json.loads(_checked(path,meta));values=np.asarray(document['knots'],dtype=float);errors=np.asarray(document['segment_errors_km'],dtype=float)
            if values.shape!=(1827,7) or errors.shape!=(1826,) or not np.isfinite(values).all() or not np.isfinite(errors).all() or np.any(errors<0) or np.max(errors)>=1 or values[0,0]!=FIRST or values[-1,0]!=LAST or not np.all(np.diff(values[:,0])==1):raise ValueError('Unqualified numerical source knots')
            if (meta['headers']['center_id'],meta['headers']['frame'],meta['headers']['time_scale'],meta['headers']['corrections'])!=('10','ICRF','TDB','NONE'):raise ValueError('Unqualified numerical source frame')
            vectors[identity]=(values,errors)
        variables=orientation.load_pck(path/manifest['orientation']['file'])
        frame_variables={}
        for identity,metadata in manifest['shape_frames'].items():
            raw=_checked(path,metadata['source']);constants={};text_pck.load(BytesIO(raw),constants)
            frame_variables[identity]=constants
        runtime=Runtime(manifest,kernel,vectors,variables,frame_variables,Loader(str(path),verbose=False).timescale(builtin=True));finalize(runtime,kernel.close);return runtime
    except Exception:
        kernel.close();raise

def load_runtime(directory=None):
    path=Path(directory) if directory is not None else release_dir()
    try:
        names=['manifest.json','pck00011.tpc','plu060-2025-2030.bsp','eros_alex.tpc.txt','dawn_vesta_grv221108_v1.tpc']+['vectors-'+name+'.json' for name in IDS]
        identities=tuple((name,(path/name).stat().st_mtime_ns,(path/name).stat().st_ctime_ns,(path/name).stat().st_size) for name in names)
        with _LOCK:return _read_runtime(str(path.resolve()),identities)
    except (OSError,ValueError,KeyError,TypeError,IndexError) as exc:
        raise EphemerisUnavailableError('Qualified destination source release unavailable') from exc

def _jd(value):
    jd=np.asarray(value,dtype=float)
    if not np.isfinite(jd).all() or np.any(jd<FIRST) or np.any(jd>LAST):raise ValueError('Epoch outside qualified destination source')
    return jd

def pluto_state(runtime,target,jd_tdb):
    """Physical center or explicitly named barycenter relative to the same Sun."""
    jd=_jd(jd_tdb)
    if int(target) not in (9,999,901,902,903,904,905):raise ValueError('Unqualified Pluto target')
    with _LOCK:
        bp,bv=runtime.kernel[0,9].compute_and_differentiate(jd);sp,sv=runtime.kernel[0,10].compute_and_differentiate(jd)
        if int(target)==9:p,v=bp-sp,bv-sv
        else:
            dp,dv=runtime.kernel[9,int(target)].compute_and_differentiate(jd);p,v=bp+dp-sp,bv+dv-sv
    return p.T,v.T/86400

def pluto_relative(runtime,target,jd_tdb):
    jd=_jd(jd_tdb)
    if int(target)==10:
        p,v=pluto_state(runtime,999,jd);return -p,-v
    if int(target) not in (901,902,903,904,905):raise ValueError('Unqualified Pluto satellite')
    with _LOCK:
        pp,pv=runtime.kernel[9,999].compute_and_differentiate(jd);mp,mv=runtime.kernel[9,int(target)].compute_and_differentiate(jd)
    return (mp-pp).T,(mv-pv).T/86400

def evaluate(runtime,identity,jd_tdb):
    if identity=='pluto':return pluto_state(runtime,999,jd_tdb)
    jd=_jd(jd_tdb);knots,_=runtime.vectors[identity]
    index=np.clip(np.searchsorted(knots[:,0],jd,side='right')-1,0,len(knots)-2)
    a,b=knots[index],knots[index+1];dt=(b[...,0]-a[...,0])*86400;u=(jd-a[...,0])/(b[...,0]-a[...,0]);u=u[...,None];dt=dt[...,None]
    p=(2*u**3-3*u*u+1)*a[...,1:4]+(u**3-2*u*u+u)*dt*a[...,4:]+(-2*u**3+3*u*u)*b[...,1:4]+(u**3-u*u)*dt*b[...,4:]
    v=((6*u*u-6*u)*a[...,1:4]+(3*u*u-4*u+1)*dt*a[...,4:]+(-6*u*u+6*u)*b[...,1:4]+(3*u*u-2*u)*dt*b[...,4:])/dt
    return p,v

def usable_bounds(runtime):return spk_helpers.usable_bounds(runtime)

def _epoch(epoch):
    if epoch.tzinfo is None or epoch.microsecond%1000:raise ValueError('Explicit millisecond UTC epoch required')
    return epoch.astimezone(timezone.utc)

def _state(p,v,au=False):
    scale=AU_KM if au else 1
    return {('position_au' if au else 'position_km'):(np.asarray(p)/scale).tolist(),('velocity_au_s' if au else 'velocity_km_s'):(np.asarray(v)/scale).tolist()}

def _direct_track(runtime,identity,evaluator,stamps,au=False):
    times=runtime.timescale.from_datetimes(stamps);p,v=evaluator(times.tdb)
    f=np.array([.25,.5,.75]);checks=[a+(b-a)*float(u) for a,b in zip(stamps,stamps[1:]) for u in f]
    truth,_=evaluator(runtime.timescale.from_datetimes(checks).tdb)
    u=f[None,:,None];dt=(np.diff(times.tdb)*86400)[:,None,None]
    approximation=(2*u**3-3*u*u+1)*p[:-1,None,:]+(u**3-2*u*u+u)*dt*v[:-1,None,:]+(-2*u**3+3*u*u)*p[1:,None,:]+(u**3-u*u)*dt*v[1:,None,:]
    error=float(np.max(np.linalg.norm(approximation.reshape(-1,3)-truth,axis=1)))
    if not np.isfinite(error) or error>=.1:raise EphemerisUnavailableError('Pluto sampled interpolation error exceeded')
    return dict(id=identity,step_seconds=600,samples=[dict(epoch=_iso(stamp),jd_tdb=float(times.tdb[i]),**_state(p[i],v[i],au)) for i,stamp in enumerate(stamps)]),error

def _numerical_track(runtime,identity,start,end):
    knots,errors=runtime.vectors[identity];left=float(runtime.timescale.from_datetime(start).tdb);right=float(runtime.timescale.from_datetime(end).tdb)
    jds=np.r_[left,knots[(knots[:,0]>left)&(knots[:,0]<right),0],right]
    p,v=evaluate(runtime,identity,jds);stamps=runtime.timescale.tdb_jd(jds).utc_datetime()
    # A float JD round-trip can move an exact UTC millisecond by several
    # microseconds. Preserve requested boundaries so browser Date truncation
    # cannot exclude the published inclusive endpoint by one millisecond.
    stamps[0],stamps[-1]=start,end
    # Return original polynomial breakpoints, never span a daily-knot boundary.
    lo=max(0,int(np.searchsorted(knots[:,0],left,side='right')-1));hi=min(len(errors),int(np.searchsorted(knots[:,0],right,side='left')))
    return dict(id=identity,step_seconds=86400,interpolation='cubic-hermite',max_sampled_error_km=float(np.max(errors[lo:hi])),samples=[dict(epoch=_iso(stamp),jd_tdb=float(jds[i]),**_state(p[i],v[i],True)) for i,stamp in enumerate(stamps)])

def _radius(meta):
    override=meta.get('radius_override')
    if override:return override['radius_km'],override['source']['url']
    diameter=meta.get('physical_parameters',{}).get('diameter')
    if not diameter:return None,None
    value=float(diameter['value'])/2
    return (value,meta['sbdb']['url']) if np.isfinite(value) and value>0 else (None,None)

def destinations_snapshot(epoch,directory=None):
    epoch=_epoch(epoch);runtime=load_runtime(directory);start,end=usable_bounds(runtime);now=float(runtime.timescale.from_datetime(epoch).tdb);valid=start<=epoch<=end
    stamps=spk_helpers._window(runtime,epoch,start,end) if valid else [];tracks=[];orientations={};bodies=[]
    meta=runtime.manifest['pluto'];bodies.append(dict(id='pluto',name='Pluto',classification='dwarf-planet',identity=dict(catalog='JPL-SPK',source_id='999',model='PLU060',reference='Physical Pluto center (999); system barycenter (9) separate'),radius_km=1188.3,radius_source=orientation.PCK_URL,source=dict(id='jpl_plu060_local',url=meta['url'],sha256=meta['sha256'],solution='PLU060',uncertainty='Original JPL SPK; sampled interpolation error does not bound physical ephemeris uncertainty.'),orientation_available=valid,surface_orientation_status='IAU_PLUTO PCK orientation; imagery meridian registration independently unqualified'))
    for identity in IDS:
        meta=runtime.manifest['bodies'][identity];radius,radius_source=_radius(meta)
        bodies.append(dict(id=identity,name={'67p':'67P/Churyumov–Gerasimenko','halley':'1P/Halley','borisov':'2I/Borisov'}.get(identity,meta['name']),classification=meta['classification'],identity=dict(catalog='JPL-SBDB',source_id=meta['spkid'],model='Horizons '+meta['orbit_id'],reference='Numerical solution for '+meta['full_name']),radius_km=radius,radius_source=radius_source,source=dict(id='jpl_horizons_vectors_local',url=meta['source']['url'],sha256=meta['source']['sha256'],solution=meta['orbit_id'],uncertainty=meta['uncertainty']),orientation_available=valid and meta['pck_id'] is not None,surface_orientation_status='IAU reference orientation only; source texture meridian registration unqualified' if meta['pck_id'] else 'No qualified inertial surface orientation; any shape presentation uses its source-fixed frame',eccentricity=meta['eccentricity']))
    for body in bodies:
        identity=body['id'];body.update(status='qualified' if valid else 'unavailable',reason=None if valid else 'Epoch outside the qualified 2025–2030 TDB source interval',coverage=_coverage(start,end),sampled_coverage=_coverage(stamps[0],stamps[-1]) if valid else None,state=_state(*evaluate(runtime,identity,now),True) if valid else None)
        if not valid:continue
        if identity=='pluto':
            track,error=_direct_track(runtime,identity,lambda jd:evaluate(runtime,identity,jd),stamps,True);track.update(interpolation='cubic-hermite',max_sampled_error_km=error);tracks.append(track);pck_id='999'
        else:
            tracks.append(_numerical_track(runtime,identity,stamps[0],stamps[-1]));pck_id=runtime.manifest['bodies'][identity]['pck_id']
        if identity in runtime.frame_variables:
            frame=runtime.manifest['shape_frames'][identity];source=frame['source']
            orientations[identity]=orientation.orientation_track(identity,pck_id,frame['frame'],lambda times:orientation.body_to_icrf(runtime.frame_variables[identity],pck_id,times.tdb),stamps[0],stamps[-1],runtime.timescale,dict(id=frame['model_id'],url=source['url'],sha256=source['sha256']),frame['model'],frame['accuracy'])
            orientations[identity]['model_id']=frame['model_id'];body['surface_orientation_status']=frame['accuracy']
        elif pck_id:orientations[identity]=orientation.pck_orientation(identity,pck_id,runtime.variables,stamps[0],stamps[-1],runtime.timescale)
    return dict(schema='oras.solar-destinations.v1',epoch=_iso(epoch),jd_tdb=now,frame='ICRF',origin='Sun center (10)',units='AU; AU/s',corrections='geometric; no light-time or aberration',source=dict(id='jpl_solar_destinations_local',release=runtime.manifest['release'],sha256=RELEASE_SHA256,url='https://ssd.jpl.nasa.gov/horizons/'),bodies=bodies,tracks=tracks,orientations=orientations,pluto_barycenter=_state(*pluto_state(runtime,9,now),True) if valid else None,qualification='Original PLU060 states and daily Horizons numerical knots checked at independent 6-hour source epochs. Interpolation uses TDB durations; no conic propagation or extrapolation. Sampled errors are not continuous guarantees or orbit uncertainty. UTC uses installed leap-second assumptions. No comet tail or surface orientation is physically inferred.')

def pluto_catalog(qualified=False,runtime=None):
    if qualified and runtime is None:runtime=load_runtime()
    satellites=[dict(id='charon',name='Charon',naif_id='901',radius_km=606,radius_source=orientation.PCK_URL,status='qualified' if qualified else 'unavailable',reason=None if qualified else 'Local Pluto source unavailable',surface=dict(available=False,destination=None))]
    for identity,name,naif in [('nix','Nix','902'),('hydra','Hydra','903'),('kerberos','Kerberos','904'),('styx','Styx','905')]:
        source=runtime.manifest['pluto_satellites'][identity] if qualified else None
        satellites.append(dict(id=identity,name=name,naif_id=naif,radius_km=source['radius_km'] if source else None,radius_source=source['source']['url'] if source else None,status='qualified' if source else 'unavailable',reason=None if source else 'Local Pluto physical-property source unavailable',surface=dict(available=False,destination=None),representation='reference-sphere',radius_uncertainty_km=source['radius_uncertainty_km'] if source else None,orientation_status='No qualified surface rotation or resolved shape; source mean-radius sphere only'))
    return dict(id='pluto',name='Pluto System',parent=dict(id='pluto',name='Pluto',naif_id='999',radius_km=1188.3,radius_source=orientation.PCK_URL,material='pluto'),status='qualified' if qualified else 'unavailable',reason=None if qualified else 'Local Pluto source unavailable',satellites=satellites)

def pluto_snapshot(epoch,directory=None):
    epoch=_epoch(epoch);runtime=load_runtime(directory);start,end=usable_bounds(runtime)
    if not start<=epoch<=end:raise ValueError('Epoch outside qualified Pluto source')
    stamps=spk_helpers._window(runtime,epoch,start,end);now=float(runtime.timescale.from_datetime(epoch).tdb);entry=pluto_catalog(True,runtime);tracks=[];state={};errors=[]
    for identity,target in [('sun',10),('charon',901),('nix',902),('hydra',903),('kerberos',904),('styx',905)]:
        track,error=_direct_track(runtime,identity,lambda jd:pluto_relative(runtime,target,jd),stamps);errors.append(error);state[identity]=_state(*pluto_relative(runtime,target,now))
        if identity=='sun':sun=track
        else:tracks.append(track)
    meta=runtime.manifest['pluto'];orientations={name:orientation.pck_orientation(name,naif,runtime.variables,stamps[0],stamps[-1],runtime.timescale) for name,naif in [('pluto','999'),('charon','901')]}
    series=[dict(target_id='999',center_id='10',target_header='Pluto physical center (999)',center_header='Sun (10)',source_sha256=meta['sha256'],source_url=meta['url'])]
    series += [dict(target_id=moon['naif_id'],center_id='999',target_header=moon['name']+' ('+moon['naif_id']+')',center_header='Pluto physical center (999)',source_sha256=meta['sha256'],source_url=meta['url']) for moon in entry['satellites']]
    return dict(schema='oras.planetary-system.v1',system_id='pluto',epoch=_iso(epoch),time=dict(input_scale='UTC',evaluation_scale='TDB',jd_tdb=now),parent=entry['parent'],satellites=entry['satellites'],origin='Pluto center (999)',frame='ICRF',units='km',corrections='geometric; no light-time or aberration',coverage=_coverage(start,end),sampled_coverage=_coverage(stamps[0],stamps[-1]),source=dict(id='jpl_plu060_local',release=runtime.manifest['release'],sha256=RELEASE_SHA256,url=meta['url'],coverage_start_jd_tdb=FIRST,coverage_end_jd_tdb=LAST,series=series,kernels=[dict(id='pluto',**{k:meta[k] for k in ('file','url','sha256','bytes')})],transition='Both centers use original PLU060 barycentric offsets. Moons minus Pluto; Sun uses same-kernel Sun minus Pluto barycenter minus physical-center offset.'),tracks=tracks,sun_track=sun,state=state,orientations=orientations,sampling=dict(step_seconds=600,interpolation='cubic-hermite',max_position_error_km=max(errors),qualification_points_per_segment=3,time_fraction='UTC fractions; TDB tangent durations; known leap transitions clipped',qualification='Every segment checked at quarter, half and three-quarter times against original PLU060; <0.1 km sampled interpolation error, not physical accuracy. No extrapolation. Nix, Hydra, Kerberos and Styx use source mean-radius spheres with no qualified resolved shape or rotation.'))
