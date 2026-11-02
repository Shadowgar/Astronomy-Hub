"""Pinned NAIF text-PCK body frames, returned as checked quaternion tracks.

Canonical body-fixed axes are X=longitude 0, Y=90 degrees east, Z=north pole.
Transforms map these axes into ICRF. They do not qualify any texture's UV map.
"""
from datetime import timedelta
import hashlib
import json
from functools import lru_cache
from pathlib import Path

import numpy as np
from skyfield.api import PlanetaryConstants

from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError
from backend.app.services.solar_earth_frame import quaternion

PCK_SHA256='3dff7b1dbeceaa01f25467767d3fa25816051c85d162d1edf04acb310ee28bb1'
PCK_URL='https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/pck00011.tpc'
MAX_ERROR_ARCSEC=1.0


def load_pck(path):
    path=Path(path)
    if hashlib.sha256(path.read_bytes()).hexdigest()!=PCK_SHA256:
        raise ValueError('Unqualified text-PCK digest')
    constants=PlanetaryConstants()
    constants.read_text(path.open('rb'))
    return constants.variables


def body_to_icrf(variables, naif_id, jd_tdb):
    """NAIF PCK Euler model including periodic terms and Mars quadratic phases.

    pck00011 defines polynomial pole angles in TDB centuries, prime meridian
    in TDB days, and periodic phase polynomials in TDB centuries from J2000.
    This implementation is independently checked against CSPICE pxform.
    """
    days=np.asarray(jd_tdb,dtype=float)-2451545.0
    centuries=days/36525.0
    prefix=f'BODY{naif_id}_'
    system=f'BODY{int(naif_id)//100}_'
    degree=int(variables.get(system+'MAX_PHASE_DEGREE',1))
    coefficients=np.asarray(variables.get(system+'NUT_PREC_ANGLES',[]),dtype=float).reshape(-1,degree+1)
    phases=np.array([np.polynomial.polynomial.polyval(centuries,row) for row in coefficients])
    phases=np.deg2rad(phases)
    angles=[]
    for name,argument,trig in [('POLE_RA',centuries,np.sin),('POLE_DEC',centuries,np.cos),('PM',days,np.sin)]:
        angle=np.polynomial.polynomial.polyval(argument,variables[prefix+name])
        periodic=np.asarray(variables.get(prefix+'NUT_PREC_'+name.replace('POLE_',''),[]),dtype=float)
        if len(periodic):
            angle=angle+np.einsum('i,i...->...',periodic,trig(phases[:len(periodic)]))
        angles.append(np.deg2rad(np.remainder(angle,360)))
    ra,dec,w=angles
    zero=np.zeros_like(ra)
    node=np.stack([-np.sin(ra),np.cos(ra),zero],axis=-1)
    transverse=np.stack([-np.cos(ra)*np.sin(dec),-np.sin(ra)*np.sin(dec),np.cos(dec)],axis=-1)
    north=np.stack([np.cos(ra)*np.cos(dec),np.sin(ra)*np.cos(dec),np.sin(dec)],axis=-1)
    x=np.cos(w)[...,None]*node+np.sin(w)[...,None]*transverse
    y=-np.sin(w)[...,None]*node+np.cos(w)[...,None]*transverse
    return np.stack([x,y,north],axis=-1)


def _sample(provider,stamps,ts):
    times=ts.from_datetimes(stamps)
    matrices=provider(times)
    quaternions=np.asarray([quaternion(matrix) for matrix in matrices])
    checkpoints=[a+(b-a)*fraction for a,b in zip(stamps,stamps[1:]) for fraction in (.25,.5,.75)]
    truth=np.asarray([quaternion(matrix) for matrix in provider(ts.from_datetimes(checkpoints))])
    a,b=quaternions[:-1],quaternions[1:].copy()
    b[np.einsum('ij,ij->i',a,b)<0]*=-1
    theta=np.arccos(np.clip(np.einsum('ij,ij->i',a,b),-1,1))
    u=np.array([.25,.5,.75])[None,:,None]
    theta=theta[:,None,None]
    denominator=np.maximum(np.sin(theta),1e-15)
    interpolated=(np.sin((1-u)*theta)*a[:,None,:]+np.sin(u*theta)*b[:,None,:])/denominator
    linear=(1-u)*a[:,None,:]+u*b[:,None,:]
    interpolated=np.where(theta<1e-8,linear,interpolated).reshape(-1,4)
    interpolated/=np.linalg.norm(interpolated,axis=1)[:,None]
    truth[np.einsum('ij,ij->i',truth,interpolated)<0]*=-1
    errors=4*np.arctan2(np.linalg.norm(interpolated-truth,axis=1),np.linalg.norm(interpolated+truth,axis=1))*180/np.pi*3600
    maximum=float(np.max(errors))
    if not np.isfinite(quaternions).all() or not np.isfinite(maximum):
        raise EphemerisUnavailableError('Non-finite body orientation')
    return times,quaternions,maximum


def orientation_track(body_id,naif_id,frame,provider,start,end,ts,source,model,accuracy,steps=(600,300,150,75)):
    for step in steps:
        count=int(np.ceil((end-start).total_seconds()/step))
        if count>5000:
            raise EphemerisUnavailableError('Body orientation window exceeds bounded sample count')
        stamps=[start+timedelta(seconds=min(i*step,(end-start).total_seconds())) for i in range(count+1)]
        times,quaternions,error=_sample(provider,stamps,ts)
        if error<MAX_ERROR_ARCSEC:
            return dict(body_id=body_id,naif_id=naif_id,from_frame='body-fixed',to_frame='ICRF',
                body_fixed_frame=frame,quaternion_order='xyzw',interpolation='shortest-slerp',model=model,source=source,
                max_sampled_interpolation_error_arcsec=error,accuracy=accuracy,
                samples=[dict(epoch=stamp.isoformat(timespec='microseconds').replace('+00:00','Z'),jd_tdb=float(times.tdb[i]),quaternion=q.tolist()) for i,(stamp,q) in enumerate(zip(stamps,quaternions))])
    raise EphemerisUnavailableError('Body frame interpolation exceeds 1 arcsecond sampled threshold')


def pck_orientation(body_id,naif_id,variables,start,end,ts):
    if body_id in ('phobos','deimos'):
        metadata=shape_frames()[body_id]
        result=orientation_track(body_id,naif_id,metadata['frame'],lambda times:body_to_icrf(metadata['variables'],naif_id,times.tdb),start,end,ts,
            metadata['source'],metadata['model'],metadata['accuracy']+' Source coefficients independently evaluated with CSPICE; not independent observations. Body-fixed X=longitude 0, Y=90 east, Z=north.')
        result['model_id']=metadata['model_id']
        return result
    return orientation_track(body_id,naif_id,'IAU_'+body_id.upper(),lambda times:body_to_icrf(variables,naif_id,times.tdb),start,end,ts,
        dict(id='NAIF pck00011',url=PCK_URL,sha256=PCK_SHA256),
        'NAIF pck00011 IAU pole, prime meridian and periodic rotation model; TDB',
        'Quarter/half/three-quarter checks bound sampled interpolation only, not physical orientation or imagery registration. IAU reference rotation is not live atmospheric weather. Body-fixed X=0 longitude, Y=90 degrees east, Z=north. Ring plane is the reference equator; no ring warp or precession beyond this pole model.')


def earth_moon_orientations(start,end,ts):
    """Reuse the installed ITRS model and qualified native lunar ME frame.

    Missing native Moon files omit its orientation instead of silently replacing
    it with the lower-accuracy generic IAU Moon. Its separate surface route keeps
    the existing frame authority and availability behavior.
    """
    import skyfield
    from skyfield import framelib
    from backend.app.services import planet_view
    from scripts.skydata.build_lunar_orientation import LUNAR_FILES
    earth=orientation_track('earth','399','ITRS',lambda times:np.moveaxis(framelib.itrs.rotation_at(times),-1,0).transpose(0,2,1),start,end,ts,
        dict(id='Skyfield '+skyfield.__version__+' ITRS (framelib.py)',url='https://rhodesmill.org/skyfield/api-framelib.html',sha256=hashlib.sha256(Path(framelib.__file__).read_bytes()).hexdigest()),
        'Existing Solar Earth frame: Skyfield IAU2000A precession/nutation + Earth rotation angle + installed UT1 timescale; inverse ICRF-to-ITRS',
        'Source digest identifies installed framelib.py. Installed historical/predicted Delta T; polar motion is zero, no measured EOP table. Sampled interpolation error is not physical orientation accuracy.',steps=(3600,1800,900,450))
    result={'earth':earth}
    try:
        # Probe once before allocating a large native frame track.
        planet_view._orientation_at(ts.from_datetime(start))
        url,digest=LUNAR_FILES['moon_pa_de440_200625.bpc']
        result['moon']=orientation_track('moon','301',planet_view.FRAME_NAME,native_moon_body_to_icrf,start,end,ts,
            dict(id='NAIF moon_pa_de440_200625.bpc + qualified ME frame kernel',url=url,sha256=digest),
            'Existing native Moon MOON_ME_DE440_ME421 body frame; DE440 binary PCK and pinned frame kernel',
            'Same native lunar frame as the existing Moon route. DE442s position and DE440 orientation are different dynamical fits; no combined accuracy is asserted. Sampled interpolation error does not qualify imagery registration.',steps=(3600,1800,900,450))
    except EphemerisUnavailableError:
        pass
    return result


def native_moon_body_to_icrf(times):
    """Batch the existing native ME frame evaluation, retaining segment priority."""
    from backend.app.services import planet_view
    from scripts.skydata.build_lunar_orientation import LUNAR_FILES
    path=planet_view._orientation_dir().resolve()
    try:
        identities=tuple((name,(path/name).stat().st_mtime_ns,(path/name).stat().st_size) for name in LUNAR_FILES)
        with planet_view._ORIENTATION_LOCK:
            constants=planet_view._load_orientation(str(path),identities)
            result=np.empty((len(times),3,3));remaining=np.ones(len(times),dtype=bool)
            for segment in reversed(constants._segment_list):
                if segment.body!=31008:continue
                mask=remaining&(times.tdb>=segment.initial_jd)&(times.tdb<=segment.final_jd)
                if not np.any(mask):continue
                frame=constants.build_frame(planet_view.FRAME_ID,_segment=segment)
                if frame.center!=301:raise ValueError('Native Moon frame center mismatch')
                result[mask]=np.moveaxis(frame.rotation_at(times[mask]),-1,0).transpose(0,2,1)
                remaining[mask]=False
            if np.any(remaining) or not np.isfinite(result).all():
                raise ValueError('Missing native Moon frame coverage')
        return result
    except (OSError,ValueError,KeyError,LookupError) as exc:
        raise EphemerisUnavailableError('Qualified local lunar orientation is unavailable') from exc


@lru_cache(maxsize=1)
def shape_frames():
    raw=(Path(__file__).parents[1]/'data/system_shape_frames.json').read_bytes()
    if hashlib.sha256(raw).hexdigest()!='2f7d95aa861a060f60dce88122982a8f62155553676d5444aa17a5db8d84a29f':
        raise EphemerisUnavailableError('Unqualified PDS shape-frame metadata')
    return json.loads(raw)['frames']
