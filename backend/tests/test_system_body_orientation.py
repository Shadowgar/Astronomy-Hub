"""Independent CSPICE transforms catch sign, pole, time and prime-meridian errors."""
import importlib
import json
from pathlib import Path
import numpy as np
import pytest

ROOT=Path(__file__).resolve().parents[2]
REFERENCE=json.loads((ROOT/'tests/fixtures/planetary-systems/solar23/spice-orientation-reference.json').read_text())
PCK=ROOT/'data/runtime-packs/planetary-systems-spk/release-2025-2030-v3/pck00011.tpc'


def service():
    try:
        return importlib.import_module('backend.app.services.system_body_orientation')
    except ModuleNotFoundError:
        pytest.fail('Source-qualified system orientation is not implemented')


@pytest.mark.parametrize('row',REFERENCE['rows'])
def test_matches_independent_cspice_body_to_icrf(row):
    s=service()
    variables=s.load_pck(PCK)
    actual=s.body_to_icrf(variables,row['naif_id'],row['jd_tdb'])
    assert np.max(np.abs(actual-np.array(row['body_to_icrf']))) < 2e-10
    assert np.linalg.det(actual)==pytest.approx(1,abs=2e-14)
    assert np.allclose(actual@actual.T,np.eye(3),rtol=0,atol=2e-14)


def test_tampered_orientation_source_is_rejected(tmp_path):
    s=service();path=tmp_path/'pck00011.tpc';path.write_bytes(PCK.read_bytes()+b'\n')
    with pytest.raises(ValueError,match='digest'):
        s.load_pck(path)


def test_earth_transform_is_inverse_itrs_and_native_moon_is_not_generic_iau():
    from datetime import datetime,timedelta,timezone
    from skyfield.api import load
    from skyfield.framelib import itrs
    s=service();ts=load.timescale(builtin=True)
    start=datetime(2026,11,2,tzinfo=timezone.utc);end=start+timedelta(hours=2)
    tracks=s.earth_moon_orientations(start,end,ts)
    earth=tracks['earth'];q=np.array(earth['samples'][0]['quaternion'])
    x,y,z,w=q
    rotation=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])
    assert np.max(np.abs(rotation-itrs.rotation_at(ts.from_datetime(start)).T))<1e-12
    assert earth['body_fixed_frame']=='ITRS'
    if 'moon' in tracks:
        assert tracks['moon']['body_fixed_frame']=='MOON_ME_DE440_ME421'
        assert 'pck00011 IAU' not in tracks['moon']['model']


def test_vectorized_native_moon_matches_existing_qualified_frame():
    from datetime import datetime,timedelta,timezone
    from skyfield.api import load
    from backend.app.services import planet_view
    s=service();ts=load.timescale(builtin=True)
    times=ts.from_datetimes([datetime(2026,11,2,tzinfo=timezone.utc)+timedelta(hours=i) for i in (0,1,24)])
    actual=s.native_moon_body_to_icrf(times)
    for i in range(3):
        assert np.max(np.abs(actual[i]-planet_view._orientation_at(times[i])[0].T))<1e-14


@pytest.mark.parametrize('row',json.loads((ROOT/'tests/fixtures/planetary-systems/solar23/spice-shape-frame-reference.json').read_text())['rows'])
def test_mesh_specific_legacy_frames_match_independent_cspice(row):
    s=service();frames=s.shape_frames()
    actual=s.body_to_icrf(frames[row['body_id']]['variables'],row['naif_id'],row['jd_tdb'])
    assert np.max(np.abs(actual-np.array(row['body_to_icrf'])))<2e-10
    assert 'legacy' in frames[row['body_id']]['model']
