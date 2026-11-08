"""Actual SPK physical centers and independent Horizons qualification."""
import importlib
import json
from pathlib import Path
from datetime import datetime,timezone
import numpy as np
import pytest

ROOT=Path(__file__).resolve().parents[2]
RELEASE=ROOT/'data/runtime-packs/planetary-systems-spk/release-2025-2030-v3'
REFERENCE=ROOT/'tests/fixtures/planetary-systems/solar23/horizons-reference.json'


def service():
    try:
        return importlib.import_module('backend.app.services.satellite_spk_systems')
    except ModuleNotFoundError:
        pytest.fail('Extended SPK systems are not implemented')


def test_all_physical_center_vectors_against_independent_horizons():
    s=service();runtime=s.load_runtime(RELEASE)
    for row in json.loads(REFERENCE.read_text())['rows']:
        target=int(row['target_id']);parent=target//100*100+99 if target%100!=99 else target
        identity=next(key for key,value in s.PARENTS.items() if value==str(parent))
        for state in row['states']:
            position,velocity=s.evaluate(runtime,identity,str(target),state['jd_tdb'])
            # Parent rows are parent-from-Sun in Horizons, opposite of runtime lighting.
            sign=-1 if target==parent else 1
            assert np.linalg.norm(sign*position-state['position_km']) < .1,(row['target_header'],state['jd_tdb'])
            assert np.linalg.norm(sign*velocity-state['velocity_km_s']) < 1e-6


@pytest.mark.parametrize('identity,count',[('mars',2),('jupiter',4),('saturn',2),('uranus',5),('neptune',1)])
def test_extended_snapshots_have_correct_centers_time_source_and_orientations(identity,count):
    s=service()
    from backend.app.services.planetary_systems import base_catalog
    entry=next(item for item in base_catalog()['systems'] if item['id']==identity)
    epoch=datetime(2026,11,2,12,30,tzinfo=timezone.utc)
    snap=s.spk_snapshot(identity,epoch,entry,RELEASE)
    assert snap['source']['id']=='jpl_satellite_spk_local'
    assert snap['parent']['naif_id']==s.PARENTS[identity]
    assert len(snap['tracks'])==count
    assert len(snap['orientations'])==count+1
    assert snap['coverage']['end'].startswith('2029-12-31T23:58:50')
    assert snap['sampled_coverage']['start']<snap['epoch']<snap['sampled_coverage']['end']
    assert snap['sampling']['max_position_error_km']<.1
    for body,track in snap['orientations'].items():
        assert track['from_frame']=='body-fixed' and track['to_frame']=='ICRF'
        assert track['max_sampled_interpolation_error_arcsec']<1
        assert 2<=len(track['samples'])<=5000
        assert all(abs(np.linalg.norm(row['quaternion'])-1)<1e-12 for row in track['samples'])


def test_source_boundaries_naive_time_and_corruption_fail_closed(tmp_path):
    s=service();runtime=s.load_runtime(RELEASE)
    for jd in [s.FIRST-1e-6,s.LAST+1e-6,np.nan]:
        with pytest.raises(ValueError):s.evaluate(runtime,'jupiter','501',jd)
    with pytest.raises(s.EphemerisUnavailableError):s.load_runtime(tmp_path)
    (tmp_path/'manifest.json').write_text('{}')
    with pytest.raises(s.EphemerisUnavailableError):s.load_runtime(tmp_path)


def test_route_admits_current_time_and_exposes_checked_orientation_contract(monkeypatch):
    from backend.tests.test_planetary_systems import request
    monkeypatch.setenv('ORAS_PLANETARY_SYSTEMS_SPK_DIR',str(RELEASE))
    response=request('/api/v1/planetary-systems/jupiter',{'epoch':'2026-11-02T12:30:00Z'})
    assert response.status_code==200
    snap=response.json()
    assert snap['source']['id']=='jpl_satellite_spk_local'
    assert len(snap['orientations'])==5
    assert snap['source']['kernels'][0]['id']=='jupiter'
    assert request('/api/v1/planetary-systems/jupiter',{'epoch':'2030-01-02T00:00:00Z'}).status_code==422


@pytest.mark.parametrize('identity',list(('mars','jupiter','saturn','uranus','neptune')))
def test_published_coverage_edges_are_inclusive_without_extrapolation(identity):
    from datetime import timedelta
    from backend.app.services.planetary_systems import base_catalog
    s=service();runtime=s.load_runtime(RELEASE)
    entry=next(row for row in base_catalog()['systems'] if row['id']==identity)
    first,last=s.usable_bounds(runtime)
    for boundary,direction in ((first,-1),(last,1)):
        snap=s.spk_snapshot(identity,boundary,entry,RELEASE)
        assert snap['sampling']['max_position_error_km']<.1
        assert snap['sampled_coverage']['start']<=snap['epoch']<=snap['sampled_coverage']['end']
        with pytest.raises(ValueError):
            s.spk_snapshot(identity,boundary+timedelta(milliseconds=direction),entry,RELEASE)


def test_changed_source_file_does_not_reuse_a_valid_cached_runtime(tmp_path):
    import shutil
    s=service()
    for path in RELEASE.iterdir():
        if path.name=='uranus_solar-2025-2030.bsp':shutil.copyfile(path,tmp_path/path.name)
        else:(tmp_path/path.name).symlink_to(path)
    s.load_runtime(tmp_path)
    changed=tmp_path/'uranus_solar-2025-2030.bsp'
    raw=changed.read_bytes();changed.write_bytes(raw[:-1]+bytes([raw[-1]^1]))
    with pytest.raises(s.EphemerisUnavailableError):s.load_runtime(tmp_path)
