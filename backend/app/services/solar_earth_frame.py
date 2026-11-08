"""Skyfield ICRF->ITRS orientation sampled with the Solar UTC source window.

UT1 comes from the installed Skyfield timescale (including historical/predicted
Delta T); no measured polar motion/EOP or sub-metre terrestrial accuracy claimed.
"""
import numpy as np
from skyfield.framelib import itrs
from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError


def quaternion(matrix):
    """Proper rotation to normalized xyzw, stable across 180-degree rotations."""
    m = np.asarray(matrix)
    trace = float(np.trace(m))
    if trace > 0:
        s = np.sqrt(trace + 1) * 2
        q = [(m[2,1]-m[1,2])/s, (m[0,2]-m[2,0])/s, (m[1,0]-m[0,1])/s, s/4]
    else:
        i = int(np.argmax(np.diag(m)))
        j, k = (i+1)%3, (i+2)%3
        s = np.sqrt(1+m[i,i]-m[j,j]-m[k,k])*2
        q = np.zeros(4)
        q[i], q[j], q[k], q[3] = s/4, (m[j,i]+m[i,j])/s, (m[k,i]+m[i,k])/s, (m[k,j]-m[j,k])/s
    q = np.asarray(q)
    return q / np.linalg.norm(q)


def earth_orientation(stamps, times, check_times):
    rotations = np.moveaxis(itrs.rotation_at(times), -1, 0)
    quaternions = np.array([quaternion(m) for m in rotations])
    truth = np.array([quaternion(m) for m in np.moveaxis(itrs.rotation_at(check_times),-1,0)])
    errors=[]
    for i,(a,b) in enumerate(zip(quaternions,quaternions[1:])):
        if a@b<0: b=-b
        theta=np.arccos(np.clip(a@b,-1,1))
        for j,u in enumerate((.25,.5,.75)):
            q=((1-u)*a+u*b) if theta<1e-8 else (np.sin((1-u)*theta)*a+np.sin(u*theta)*b)/np.sin(theta)
            q/=np.linalg.norm(q)
            exact=truth[3*i+j]
            if q@exact<0: exact=-exact
            # Stable small-angle quaternion distance (physical angle =2*quat angle).
            error=4*np.arctan2(np.linalg.norm(q-exact),np.linalg.norm(q+exact))*180/np.pi*3600
            errors.append(float(error))
    maximum=max(errors)
    if not np.isfinite(quaternions).all() or not np.isfinite(maximum) or maximum>=.05:
        raise EphemerisUnavailableError('Earth frame interpolation exceeded qualification threshold')
    return dict(from_frame='ICRF',to_frame='ITRS',quaternion_order='xyzw',interpolation='shortest-slerp',
        model='Skyfield IAU2000A precession/nutation + Earth rotation angle + installed UT1 timescale',
        polar_motion='zero; no observed EOP table installed',
        accuracy='Interpolation checked at quarter/half/three-quarter samples only. Not physical orientation accuracy; UT1 uses installed historical/predicted Delta T. Polar motion omitted.',
        max_sampled_interpolation_error_arcsec=maximum,
        samples=[dict(epoch=s.isoformat(timespec='milliseconds').replace('+00:00','Z'),quaternion=q.tolist()) for s,q in zip(stamps,quaternions)])
