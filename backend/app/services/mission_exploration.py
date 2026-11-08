"""Read-only mission-specific historical vectors, with explicit source gaps.

No requests, propagation, two-body orbit synthesis, or current-epoch substitution.
Only the selected mission and compatible bodies are loaded. Physical uncertainty
and attitude are not inferred from interpolation quality or flight direction.
"""
from dataclasses import dataclass
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

AU_KM = 149597870.7
RELEASE_SHA256 = '9b1bf0cde347536ae5d2c923684498c199444084458d72bdbccbe833c4055e94'
MISSION_IDS = ('voyager1','voyager2','cassini','newhorizons','pioneer10','pioneer11','juno','dawn','near','rosetta')
FLAGSHIPS = ('voyager1','voyager2','cassini','newhorizons')
NH_JUPITER_UNCERTAINTY = ('The nh_recon_e2j_v1 source comments quote inertial uncertainties of 200 km / 3.3 mm/s for Earth-to-Jupiter Cruise 1 and 10,000 km / 6.7 mm/s for Jupiter-to-Pluto Cruise 2 (3-D, 1 sigma). This encounter window crosses the phase boundary; no per-epoch covariance is supplied. These source estimates are separate from interpolation residuals and do not qualify other New Horizons intervals.')
EVENTS_FILE = Path(__file__).resolve().parents[1] / 'data/mission_events.json'
MAX_KNOTS = 4096


@dataclass
class Runtime:
    manifest: dict
    mission: dict
    segments: list
    timescale: object


def release_dir():
    return Path(os.environ.get('ORAS_SOLAR_MISSIONS_DIR','data/runtime-packs/solar-missions/release-v3'))


def _digest(raw):
    return hashlib.sha256(raw).hexdigest()


def _iso(stamp):
    return stamp.astimezone(timezone.utc).isoformat(timespec='microseconds').replace('+00:00','Z')


def _epoch(value):
    if isinstance(value,str):
        value=datetime.fromisoformat(value.replace('Z','+00:00'))
    if not isinstance(value,datetime) or value.tzinfo is None or not -62135596800 <= value.timestamp() <= 253402214400:
        raise ValueError('Explicit UTC epoch required')
    return value.astimezone(timezone.utc)


def _identity(identity):
    if identity not in MISSION_IDS:
        raise KeyError('Unknown mission')


@lru_cache(maxsize=4)
def _manifest(directory, fingerprint):
    raw=(Path(directory)/'manifest.json').read_bytes()
    if len(raw)>16*1024*1024 or _digest(raw)!=RELEASE_SHA256:
        raise ValueError('Unqualified mission source manifest')
    doc=json.loads(raw)
    if (doc['schema'],doc['frame'],doc['origin'],doc['units'],doc['time_scale'],doc['corrections']) != ('oras.mission-release.v1','ICRF','sun','km,km/s','TDB','NONE'):
        raise ValueError('Incompatible mission source semantics')
    if not set(doc['missions']).issubset(MISSION_IDS):
        raise ValueError('Unknown mission source identity')
    return doc


def manifest(directory=None):
    path=Path(directory) if directory is not None else release_dir()
    try:
        stat=(path/'manifest.json').stat()
        return _manifest(str(path),(stat.st_ino,stat.st_size,stat.st_mtime_ns,stat.st_ctime_ns))
    except (OSError,ValueError,KeyError,TypeError) as exc:
        raise EphemerisUnavailableError('Local mission source unavailable') from exc


@lru_cache(maxsize=4)
def _runtime(directory,identity,fingerprint,manifest_fingerprint):
    path=Path(directory);doc=_manifest(directory,manifest_fingerprint);meta=doc['missions'][identity]
    if meta['file']!=identity+'.json' or not re_negative_id(meta['naif_id']):
        raise ValueError('Invalid spacecraft source identity')
    raw=(path/meta['file']).read_bytes()
    if len(raw)!=meta['bytes'] or len(raw)>32*1024*1024 or _digest(raw)!=meta['sha256']:
        raise ValueError('Changed mission state source')
    payload=json.loads(raw);segments=[]
    for item in payload['segments']:
        states={name:np.asarray(rows,dtype=float) for name,rows in item['states'].items()}
        craft=states['craft'];pe=np.asarray(item['position_errors_km'],dtype=float);ve=np.asarray(item['velocity_errors_km_s'],dtype=float)
        if craft.ndim!=2 or craft.shape[1]!=7 or not 2<=len(craft)<=200000 or not np.isfinite(craft).all() or np.any(np.diff(craft[:,0])<=0):
            raise ValueError('Invalid mission state knots')
        if set(states)!={'craft',*item['target_ids']} or any(name not in doc['targets'] for name in item['target_ids']):
            raise ValueError('Incompatible admitted target set')
        if any(values.shape!=craft.shape or not np.isfinite(values).all() or not np.array_equal(values[:,0],craft[:,0]) for values in states.values()):
            raise ValueError('Mission targets must share exact source epochs')
        if pe.shape!=(len(craft)-1,) or ve.shape!=pe.shape or not np.isfinite(pe).all() or not np.isfinite(ve).all() or np.min(pe)<0 or np.min(ve)<0 or np.max(pe)>item['position_tolerance_km'] or np.max(ve)>item['velocity_tolerance_km_s']:
            raise ValueError('Unqualified source interpolation residuals')
        if item['quality'] not in ('reconstructed','predicted','mission-design','mixed'):
            raise ValueError('Unknown trajectory quality')
        segments.append(dict(item,states=states,position_errors_km=pe,velocity_errors_km_s=ve))
    segments.sort(key=lambda row:row['states']['craft'][0,0])
    if not segments or any(a['states']['craft'][-1,0]>b['states']['craft'][0,0]+1e-8 for a,b in zip(segments,segments[1:])):
        raise ValueError('Overlapping or missing mission intervals')
    return Runtime(doc,meta,segments,Loader(str(path),verbose=False).timescale(builtin=True))


def re_negative_id(value):
    return isinstance(value,str) and value.startswith('-') and value[1:].isdigit()


def load_runtime(identity,directory=None):
    _identity(identity);path=Path(directory) if directory is not None else release_dir()
    try:
        ms=(path/'manifest.json').stat();fs=(path/(identity+'.json')).stat()
        return _runtime(str(path),identity,(fs.st_ino,fs.st_size,fs.st_mtime_ns,fs.st_ctime_ns),(ms.st_ino,ms.st_size,ms.st_mtime_ns,ms.st_ctime_ns))
    except (OSError,ValueError,KeyError,TypeError) as exc:
        raise EphemerisUnavailableError('Local mission source unavailable') from exc


def evaluate(knots,t):
    if not knots[0,0]<=t<=knots[-1,0]:
        raise ValueError('Epoch outside source interval')
    i=max(0,min(len(knots)-2,int(np.searchsorted(knots[:,0],t,side='right')-1)))
    a,b=knots[i],knots[i+1];dt=(b[0]-a[0])*86400;u=(t-a[0])/(b[0]-a[0])
    p=(2*u**3-3*u*u+1)*a[1:4]+(u**3-2*u*u+u)*dt*a[4:]+(-2*u**3+3*u*u)*b[1:4]+(u**3-u*u)*dt*b[4:]
    v=(6*u*u-6*u)*a[1:4]/dt+(3*u*u-4*u+1)*a[4:]+(-6*u*u+6*u)*b[1:4]/dt+(3*u*u-2*u)*b[4:]
    return dict(position=(p/AU_KM).tolist(),velocity=(v/AU_KM).tolist())


def _stamp(runtime,jd):
    return runtime.timescale.tdb_jd(float(jd)).utc_datetime()


def _bounds(runtime,segment):
    values=segment['states']['craft']
    # Public navigation works in integer milliseconds; move rounded boundaries
    # inward so a displayed endpoint is actually supported after conversion.
    a,b=(_stamp(runtime,x).timestamp() for x in (values[0,0],values[-1,0]))
    return datetime.fromtimestamp(math.ceil(a*1000+.01)/1000,timezone.utc),datetime.fromtimestamp(math.floor(b*1000-.01)/1000,timezone.utc)


def _catalog_segment(row):
    result={k:row[k] for k in ('id','start','end','quality','label','target_ids')}
    a,b=(_epoch(row[key]).timestamp() for key in ('start','end'))
    result.update(start=_iso(datetime.fromtimestamp(math.ceil(a*1000+.01)/1000,timezone.utc)),end=_iso(datetime.fromtimestamp(math.floor(b*1000-.01)/1000,timezone.utc)))
    return result


def _coverage(runtime):
    return [dict(id=s['id'],start=_iso(_bounds(runtime,s)[0]),end=_iso(_bounds(runtime,s)[1]),quality=s['quality'],label=s['label'],target_ids=s['target_ids']) for s in runtime.segments]


def _select(runtime,epoch):
    for segment in runtime.segments:
        first,last=_bounds(runtime,segment)
        if first<=epoch<=last:
            return segment
    raise ValueError('Epoch is outside supported mission source intervals')


def _events(identity,segments):
    source=json.loads(EVENTS_FILE.read_bytes())
    result=[]
    for row in source['events']:
        if row['mission_id']!=identity:
            continue
        epoch=_epoch(row.get('view_epoch',row['epoch']))
        available=any(_epoch(s['start'])<=epoch<=_epoch(s['end']) for s in segments)
        result.append(dict(row,available=available))
    return result


def mission_catalog(directory=None):
    doc=manifest(directory);entries=[]
    labels={'voyager1':'Voyager 1','voyager2':'Voyager 2','cassini':'Cassini–Huygens','newhorizons':'New Horizons','pioneer10':'Pioneer 10','pioneer11':'Pioneer 11','juno':'Juno','dawn':'Dawn','near':'NEAR Shoemaker','rosetta':'Rosetta'}
    ids={'voyager1':'-31','voyager2':'-32','cassini':'-82','newhorizons':'-98','pioneer10':'-23','pioneer11':'-24','juno':'-61','dawn':'-203','near':'-93','rosetta':'-226'}
    for identity in MISSION_IDS:
        meta=doc['missions'].get(identity)
        # Catalog metadata is lightweight: no trajectory arrays or model loads.
        segments=[_catalog_segment(row) for row in meta['segments']] if meta else []
        events=_events(identity,segments)
        first_event=next((e for e in events if e['available'] and e['target_id']!='399'),None)
        preferred={'cassini':'cassini-saturn-arrival','newhorizons':'newhorizons-pluto'}.get(identity)
        first_event=next((e for e in events if e['available'] and e['id']==preferred),first_event)
        default=(first_event.get('view_epoch') or first_event['epoch']) if first_event else segments[0]['start'] if segments else None
        entries.append(dict(id=identity,name=labels[identity],naif_id=ids[identity],summary=meta['summary'] if meta else 'Source identity researched; trajectory not admitted to this release',
            status='qualified' if meta else 'unavailable',representation='flagship' if meta and identity in FLAGSHIPS else 'trajectory-only' if meta else 'catalogued',default_epoch=default,events=events,segments=segments,
            targets=[dict(id='sun',naif_id='10',appearance_id='sun')]+[dict(id=name,naif_id=doc['targets'][name]['naif_id'],appearance_id=doc['targets'][name]['appearance_id']) for name in sorted({name for row in segments for name in row['target_ids']})],
            limitations=['No measured attitude; spacecraft model orientation is illustrative.','Sampled numerical interpolation residuals do not bound physical ephemeris uncertainty.','Only listed compatible targets are available at historical epochs.']+(['Early cruise is approximate mission-design data; encounter reconstructions are separately identified.'] if identity.startswith('voyager') else [])+(['The trajectory is Cassini orbiter (-82). Huygens is a distinct probe; no Huygens position or descent trajectory is supplied.'] if identity=='cassini' else [])+([NH_JUPITER_UNCERTAINTY] if identity=='newhorizons' else [])))
    return dict(schema='oras.mission-catalog.v1',release_id=doc['release_id'],missions=entries)


def _window(runtime,segment,epoch,start=None,end=None):
    first,last=_bounds(runtime,segment)
    left=max(first,epoch-timedelta(days=1)) if start is None else _epoch(start)
    right=min(last,epoch+timedelta(days=1)) if end is None else _epoch(end)
    if not first<=left<=epoch<=right<=last or left>=right:
        raise ValueError('Requested window must contain epoch inside one source interval')
    # Known UTC leap transitions must not be interpolated using ordinary Unix
    # fractions. A new source window is fetched on the far side of the boundary.
    for transition in runtime.timescale.leap_dates:
        stamp=datetime.fromtimestamp((float(transition)-2440587.5)*86400,timezone.utc)
        if left<stamp<=epoch:
            left=stamp
        elif epoch<stamp<=right:
            right=stamp-timedelta(milliseconds=1)
    return left,right


def _samples(runtime,segment,left,right):
    first,last=(float(runtime.timescale.from_datetime(t).tdb) for t in (left,right))
    knots=segment['states']['craft'][:,0]
    times=np.concatenate(([first],knots[(knots>first)&(knots<last)],[last]))
    if len(times)>MAX_KNOTS:
        raise ValueError('Source window exceeds sample budget; select a shorter interval')
    labels=[_iso(left)]+[_iso(_stamp(runtime,x)) for x in times[1:-1]]+[_iso(right)]
    def values(name):
        return [dict(epoch=labels[i],jd_tdb=float(t),**evaluate(segment['states'][name],t)) for i,t in enumerate(times)]
    return dict(start=_iso(left),end=_iso(right),step_seconds=None,craft=values('craft'),bodies=[dict(id=name,samples=values(name)) for name in segment['target_ids']])


def _polyline(values,budget):
    """Largest-error first refinement of original source vertices, never a conic."""
    import heapq
    if len(values)<=budget:
        return values,0.
    selected={0,len(values)-1};queue=[]
    def add(a,b):
        if b-a<=1:return
        line=values[b,1:4]-values[a,1:4];relative=values[a+1:b,1:4]-values[a,1:4]
        fraction=np.clip(relative@line/max(float(line@line),1e-300),0,1)
        distances=np.linalg.norm(relative-fraction[:,None]*line,axis=1)
        idx=int(np.argmax(distances))+a+1
        heapq.heappush(queue,(-float(np.max(distances)),a,b,idx))
    add(0,len(values)-1)
    while queue and len(selected)<budget:
        _,a,b,idx=heapq.heappop(queue);selected.add(idx);add(a,idx);add(idx,b)
    return values[sorted(selected)],max(0.,-queue[0][0] if queue else 0.)


def trajectory(identity,start=None,end=None,max_points=4096,directory=None,runtime=None):
    runtime=runtime or load_runtime(identity,directory)
    if not 32<=max_points<=8192:
        raise ValueError('Trajectory point budget must be 32–8192')
    first=_epoch(start) if start is not None else _bounds(runtime,runtime.segments[0])[0]
    last=_epoch(end) if end is not None else _bounds(runtime,runtime.segments[-1])[1]
    if first>=last: raise ValueError('Invalid trajectory time range')
    slices=[]
    for segment in runtime.segments:
        a,b=_bounds(runtime,segment);left,right=max(a,first),min(b,last)
        if left>=right:continue
        low,high=(float(runtime.timescale.from_datetime(t).tdb) for t in (left,right))
        rows=segment['states']['craft'];middle=rows[(rows[:,0]>low)&(rows[:,0]<high)]
        def endpoint(t):
            state=evaluate(rows,t);return [t,*np.asarray(state['position'])*AU_KM,*np.asarray(state['velocity'])*AU_KM]
        slices.append((segment,np.vstack((endpoint(low),middle,endpoint(high))),left,right))
    if not slices: raise ValueError('No supported trajectory within requested range')
    # Reserve endpoints in every source segment; never bridge a source gap.
    minimum=2*len(slices)
    if minimum>max_points:raise ValueError('Too many source intervals for trajectory budget')
    total=sum(math.sqrt(len(rows)) for _,rows,_,_ in slices);remaining=max_points-minimum;tracks=[]
    for segment,rows,left,right in slices:
        budget=min(len(rows),2+int(remaining*math.sqrt(len(rows))/total))
        points,error=_polyline(rows,budget)
        # Preserve the admitted UTC endpoint labels, rather than roundtripping
        # their JD doubles back to an instant tens of microseconds outside them.
        labels=[_iso(left)]+[_iso(_stamp(runtime,row[0])) for row in points[1:-1]]+[_iso(right)]
        tracks.append(dict(segment_id=segment['id'],quality=segment['quality'],source_label=segment['label'],start=_iso(left),end=_iso(right),
            points=[dict(epoch=labels[i],position=(row[1:4]/AU_KM).tolist()) for i,row in enumerate(points)],max_knot_chord_deviation_km=error))
    return dict(schema='oras.mission-trajectory.v1',mission_id=identity,frame='ICRF',origin='sun',position_units='AU',tracks=tracks,coverage=_coverage(runtime),point_count=sum(len(t['points']) for t in tracks))


def mission_state(identity,epoch,start=None,end=None,directory=None):
    epoch=_epoch(epoch);runtime=load_runtime(identity,directory);segment=_select(runtime,epoch)
    now=float(runtime.timescale.from_datetime(epoch).tdb);left,right=_window(runtime,segment,epoch,start,end)
    samples=_samples(runtime,segment,left,right)
    bodies=[dict(id='sun',name='Sun',naif_id='10',appearance_id='sun',radius_km=695700.,position=[0.,0.,0.],velocity=[0.,0.,0.])]
    for name in segment['target_ids']:
        bodies.append(dict(id=name,**runtime.manifest['targets'][name],**evaluate(segment['states'][name],now)))
    tracks=trajectory(identity,left,right,1024,runtime=runtime)['tracks']
    return dict(schema='oras.mission-state.v1',mission_id=identity,epoch=_iso(epoch),jd_tdb=now,frame='ICRF',origin='sun',position_units='AU',velocity_units='AU/s',segment_id=segment['id'],quality=segment['quality'],source_label=segment['label'],
        craft=dict(id=identity,naif_id=runtime.mission['naif_id'],**evaluate(segment['states']['craft'],now)),bodies=bodies,tracks=tracks,coverage=_coverage(runtime),samples=samples,
        interpolation=dict(method='cubic-hermite',max_sampled_position_error_km=float(max(segment['position_errors_km'])),max_sampled_velocity_error_km_s=float(max(segment['velocity_errors_km_s'])),physical_uncertainty=NH_JUPITER_UNCERTAINTY if identity=='newhorizons' and segment['id']=='jupiter' else 'Not supplied for this interval. These are sampled numerical interpolation residuals, not physical orbit uncertainty or continuous error bounds.'),
        attitude=dict(status='unavailable',description='Illustrative inspection pose; no measured attitude, antenna pointing or maneuver orientation is supplied.'))
