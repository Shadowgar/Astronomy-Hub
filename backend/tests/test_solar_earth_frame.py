"""Earth orientation is tied to the same UTC window, not a static visual spin."""
from datetime import datetime, timezone, timedelta
import numpy as np
from skyfield.framelib import itrs
from backend.app.services import planetary_ephemeris_service as ephemeris
from backend.app.services.solar_motion import solar_motion


def matrix(q):
    x,y,z,w = q
    return np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],
                     [2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],
                     [2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])


def test_earth_frame_is_source_derived_and_qualified_off_grid():
    epoch = datetime(2026,10,28,12,tzinfo=timezone.utc)
    result = solar_motion(epoch)
    earth = result['earth_orientation']
    assert earth['from_frame']=='ICRF' and earth['to_frame']=='ITRS'
    assert earth['polar_motion']=='zero; no observed EOP table installed'
    assert earth['quaternion_order']=='xyzw' and earth['interpolation']=='shortest-slerp'
    samples = earth['samples']
    assert [s['epoch'] for s in samples]==[s['epoch'] for s in result['tracks'][3]['samples']]
    runtime=ephemeris._load_runtime(ephemeris._release_dir())
    for index,u in [(0,.13),(191,.61),(383,.87)]:
        a,b=samples[index:index+2]
        qa,qb=np.array(a['quaternion']),np.array(b['quaternion'])
        if qa@qb<0: qb=-qb
        theta=np.arccos(np.clip(qa@qb,-1,1))
        q=(np.sin((1-u)*theta)*qa+np.sin(u*theta)*qb)/np.sin(theta)
        stamp=datetime.fromisoformat(a['epoch'].replace('Z','+00:00'))+timedelta(seconds=3600*u)
        direct=itrs.rotation_at(runtime.timescale.from_datetime(stamp))
        assert np.linalg.norm(matrix(q)-direct)<2e-7  # <0.03 arcsec, interpolation only
        assert np.allclose(matrix(qa)@matrix(qa).T,np.eye(3),atol=1e-12)
        assert abs(np.linalg.det(matrix(qa))-1)<1e-12
    assert earth['max_sampled_interpolation_error_arcsec']<.05
