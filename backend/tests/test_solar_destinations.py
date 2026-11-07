"""Focused source-backed regressions; mounted packs are optional in ordinary CI."""
from datetime import datetime, timezone, timedelta
import importlib
import json
from pathlib import Path
import numpy as np
import pytest

ROOT=Path(__file__).resolve().parents[2]
PACK=ROOT/'data/runtime-packs/solar-destinations/release-2025-2030-v1'
NOW=datetime(2026,10,27,4,tzinfo=timezone.utc)

def service():
    return importlib.import_module('backend.app.services.solar_destinations')

@pytest.fixture
def runtime():
    if not (PACK/'manifest.json').exists():pytest.skip('Optional mounted destination pack absent')
    return service().load_runtime(PACK)

def test_pluto_is_physical_center_and_charon_is_parent_relative(runtime):
    m=service();jd=2461340.6666666665
    pluto,pv=m.evaluate(runtime,'pluto',jd);bary,bv=m.pluto_state(runtime,9,jd)
    offset,velocity=runtime.kernel[9,999].compute_and_differentiate(jd)
    assert np.linalg.norm(pluto-bary)>1000
    assert np.allclose(pluto-bary,offset,atol=1e-5,rtol=0)
    charon,cv=m.pluto_relative(runtime,901,jd)
    native,nv=runtime.kernel[9,901].compute_and_differentiate(jd)
    assert np.allclose(charon,native-offset,atol=1e-7,rtol=0)
    assert np.allclose(cv,(nv-velocity)/86400,atol=1e-12,rtol=0)

def test_destination_contract_and_hyperbolic_source(runtime):
    m=service();from backend.app.schemas.solar_destinations import Destinations
    document=m.destinations_snapshot(NOW,PACK);Destinations.parse_obj(document)
    by_id={body['id']:body for body in document['bodies']}
    assert set(by_id)=={'pluto','ceres','vesta','eros','eris','halley','67p','borisov'}
    assert by_id['borisov']['eccentricity']>1
    assert by_id['borisov']['radius_km'] is None
    assert by_id['halley']['identity']['source_id']=='1000036'
    assert by_id['67p']['radius_km']==1.7
    assert set(document['orientations']) >= {'pluto','ceres','vesta'}
    assert '67p' not in document['orientations']
    assert all(b['status']=='qualified' for b in by_id.values())
    assert all(t['max_sampled_error_km']<1 for t in document['tracks'])

def test_outside_coverage_is_explicit_and_microseconds_rejected(runtime):
    m=service();start,end=m.usable_bounds(runtime)
    assert m.destinations_snapshot(start-timedelta(milliseconds=1),PACK)['tracks']==[]
    assert all(b['state'] is None and b['status']=='unavailable' for b in m.destinations_snapshot(end+timedelta(milliseconds=1),PACK)['bodies'])
    for value in (NOW.replace(tzinfo=None),NOW.replace(microsecond=1)):
        with pytest.raises(ValueError):m.destinations_snapshot(value,PACK)

def test_jd_roundtrip_does_not_move_published_millisecond_boundaries(runtime):
    m=service()
    for epoch in m.usable_bounds(runtime):
        snapshot=m.destinations_snapshot(epoch,PACK)
        for track in snapshot['tracks']:
            body=next(b for b in snapshot['bodies'] if b['id']==track['id'])
            assert track['samples'][0]['epoch']==body['sampled_coverage']['start']
            assert track['samples'][-1]['epoch']==body['sampled_coverage']['end']

def test_corrupt_optional_pack_does_not_fall_back(tmp_path):
    m=service();(tmp_path/'manifest.json').write_text('{}')
    with pytest.raises(m.EphemerisUnavailableError):m.load_runtime(tmp_path)

def test_pluto_system_keeps_small_moon_frame_unavailable(runtime):
    m=service();from backend.app.schemas.planetary_systems import SystemSnapshot
    value=m.pluto_snapshot(NOW,PACK);SystemSnapshot.parse_obj(value)
    assert value['origin']=='Pluto center (999)'
    assert value['source']['id']=='jpl_plu060_local'
    assert set(value['orientations'])=={'pluto','charon'}
    assert {t['id'] for t in value['tracks']}=={'charon','nix','hydra','kerberos','styx'}
    assert len(value['source']['series'])==6
    for moon in value['satellites'][1:]:
        assert moon['representation']=='reference-sphere' and moon['radius_uncertainty_km']==1
    assert value['sampling']['max_position_error_km']<.1

def test_source_specific_frames_against_independent_cspice(runtime):
    from backend.app.services import system_body_orientation as orientation
    fixture=json.loads((ROOT/'backend/tests/fixtures/solar_destinations_frames.json').read_text())
    for row in fixture['rows']:
        variables=runtime.frame_variables.get(row['body'],runtime.variables)
        actual=orientation.body_to_icrf(variables,row['naif_id'],row['jd_tdb'])
        assert np.max(np.abs(actual-np.asarray(row['matrix'])))<2e-10, row['body']

def test_numerical_states_against_fresh_arbitrary_horizons_epochs(runtime):
    m=service();reference=json.loads((ROOT/'backend/tests/fixtures/solar_destinations_vectors.json').read_text())
    for row in reference['rows']:
        values=np.asarray(row['rows']);identity=row['id']
        if identity=='pluto_barycenter':p,v=m.pluto_state(runtime,9,values[:,0])
        elif row['headers']['center_id']=='999':p,v=m.pluto_relative(runtime,int(row['headers']['target_id']),values[:,0])
        else:p,v=m.evaluate(runtime,identity,values[:,0])
        assert np.max(np.linalg.norm(p-values[:,1:4],axis=1))<.001, identity
        assert np.max(np.linalg.norm(v-values[:,4:],axis=1))<2e-7, identity

def test_optional_source_route_failure_preserves_base_planets(monkeypatch,tmp_path):
    from backend.tests.test_planetary_systems import request
    monkeypatch.setenv('ORAS_SOLAR_DESTINATIONS_DIR',str(tmp_path))
    params={'epoch':NOW.isoformat()}
    response=request('/api/v1/solar-system/destinations',params)
    assert response.status_code==503 and response.json()['detail']=='Local destination source unavailable.'
    base=request('/api/v1/solar-system',params)
    assert base.status_code==200 and len(base.json()['bodies'])==9

def test_real_destination_and_pluto_routes(runtime,monkeypatch):
    from backend.tests.test_planetary_systems import request
    monkeypatch.setenv('ORAS_SOLAR_DESTINATIONS_DIR',str(PACK))
    response=request('/api/v1/solar-system/destinations',{'epoch':NOW.isoformat()})
    assert response.status_code==200 and len(response.json()['bodies'])==8
    assert response.json()['bodies'][0]['eccentricity'] is None
    pluto=request('/api/v1/planetary-systems/pluto',{'epoch':NOW.isoformat()})
    assert pluto.status_code==200 and len(pluto.json()['tracks'])==5
