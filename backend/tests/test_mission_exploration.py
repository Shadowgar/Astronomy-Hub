"""Mission boundaries, native identity, exact source windows and numerical math."""
import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from skyfield.api import load

from backend.app.routes.mission_exploration import router
from backend.app.schemas.mission_exploration import MissionCatalog, MissionState, MissionTrajectory
from backend.app.services import mission_exploration as service
from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError


def encoded(value):
    return json.dumps(value,separators=(',',':'),allow_nan=False).encode()


@pytest.fixture
def source(tmp_path,monkeypatch):
    ts=load.timescale(builtin=True)
    first=float(ts.utc(2016,12,30).tdb)
    def rows(start,end):
        result=[]
        for t in np.linspace(start,end,13):
            seconds=(t-first)*86400
            result.append([t,1e8+10*seconds,2e8+2*seconds,3e8,10.,2.,0.])
        return result
    segments=[]
    for index,(a,b) in enumerate([(first,first+4),(first+8,first+9)]):
        craft=rows(a,b)
        body=[[r[0],r[1]-10000.,r[2]+1000.,r[3],r[4],r[5],r[6]] for r in craft]
        segments.append(dict(id='test-'+str(index),label='Synthetic test fixture only',quality='reconstructed',start=ts.tdb_jd(a).utc_iso(places=6),end=ts.tdb_jd(b).utc_iso(places=6),target_ids=['jupiter'],
            states={'craft':craft,'jupiter':body},position_errors_km=[0.]*12,velocity_errors_km_s=[0.]*12,position_tolerance_km=.05,velocity_tolerance_km_s=.00005))
    raw=encoded(dict(segments=segments,gaps=[]));(tmp_path/'voyager1.json').write_bytes(raw)
    doc=dict(schema='oras.mission-release.v1',release_id='test-only',frame='ICRF',origin='sun',units='km,km/s',time_scale='TDB',corrections='NONE',
        missions={'voyager1':dict(name='Voyager 1',naif_id='-31',summary='fixture',file='voyager1.json',bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest(),segments=[{k:v for k,v in row.items() if k not in ('states','position_errors_km','velocity_errors_km_s')} for row in segments])},
        targets={'jupiter':dict(name='Jupiter',naif_id='599',appearance_id='jupiter',radius_km=69911.)})
    manifest=encoded(doc);(tmp_path/'manifest.json').write_bytes(manifest)
    events=tmp_path/'events.json';events.write_bytes(encoded({'events':[]}))
    monkeypatch.setattr(service,'RELEASE_SHA256',hashlib.sha256(manifest).hexdigest())
    monkeypatch.setattr(service,'EVENTS_FILE',events)
    monkeypatch.setenv('ORAS_SOLAR_MISSIONS_DIR',str(tmp_path))
    service._runtime.cache_clear();service._manifest.cache_clear()
    yield tmp_path,doc
    service._runtime.cache_clear();service._manifest.cache_clear()


def test_same_epoch_compatible_targets_and_contract(source):
    catalog=MissionCatalog(**service.mission_catalog())
    assert catalog.missions[0].targets==[{'id':'sun','naif_id':'10','appearance_id':'sun'},{'id':'jupiter','naif_id':'599','appearance_id':'jupiter'}]
    assert catalog.missions[1].status=='unavailable'
    payload=MissionState(**service.mission_state('voyager1','2016-12-31T12:00:00Z'))
    assert payload.craft.naif_id=='-31'
    assert [b.id for b in payload.bodies]==['sun','jupiter']
    delta=(np.array(payload.craft.position)-payload.bodies[1].position)*service.AU_KM
    assert np.allclose(delta,[10000.,-1000.,0.],atol=1e-7)
    assert [s.epoch for s in payload.samples.craft]==[s.epoch for s in payload.samples.bodies[0].samples]
    assert payload.samples.step_seconds is None
    assert payload.attitude.status=='unavailable'


def test_leap_second_windows_do_not_interpolate_unix_time_across_boundary(source):
    before=service.mission_state('voyager1','2016-12-31T12:00:00Z')
    after=service.mission_state('voyager1','2017-01-01T12:00:00Z')
    assert before['samples']['end']=='2016-12-31T23:59:59.999000Z'
    assert after['samples']['start']=='2017-01-01T00:00:00.000000Z'
    assert before['jd_tdb']<after['jd_tdb']
    assert (after['jd_tdb']-before['jd_tdb'])*86400==pytest.approx(86401,abs=.001)


def test_unavailable_epoch_and_cross_segment_window_rejected(source):
    with pytest.raises(ValueError,match='outside supported'):
        service.mission_state('voyager1','2017-01-05T00:00:00Z')
    with pytest.raises(ValueError,match='one source interval'):
        service.mission_state('voyager1','2016-12-31T00:00:00Z',end='2017-01-09T00:00:00Z')
    with pytest.raises(ValueError):
        service.mission_state('voyager1','2016-12-31T00:00:00')


def test_trajectory_never_bridges_a_coverage_gap_and_stays_bounded(source):
    result=MissionTrajectory(**service.trajectory('voyager1',max_points=32))
    assert len(result.tracks)==2
    assert result.point_count<=32
    assert result.tracks[0].end<result.tracks[1].start
    assert all(t.points[0].epoch==t.start and t.points[-1].epoch==t.end for t in result.tracks)
    admitted={row['id']:row for row in service.mission_catalog()['missions'][0]['segments']}
    for track in result.tracks:
        assert track.start==admitted[track.segment_id]['start']
        assert track.end==admitted[track.segment_id]['end']


def test_trajectory_api_preserves_exact_requested_utc_edge_labels(source):
    app=FastAPI();app.include_router(router,prefix='/api/v1');client=TestClient(app)
    start,end='2016-12-31T01:02:03.123000Z','2016-12-31T04:05:06.789000Z'
    response=client.get('/api/v1/solar/missions/voyager1/trajectory',params={'start':start,'end':end})
    assert response.status_code==200
    track=response.json()['tracks'][0]
    assert track['start']==track['points'][0]['epoch']==start
    assert track['end']==track['points'][-1]['epoch']==end


def test_actual_public_boundaries_are_playable(source):
    runtime=service.load_runtime('voyager1')
    for segment in service._coverage(runtime):
        for edge in ('start','end'):
            state=service.mission_state('voyager1',segment[edge])
            assert state['segment_id']==segment['id']
    catalog=service.mission_catalog()['missions'][0]
    for segment in catalog['segments']:
        for edge in ('start','end'):
            assert service.mission_state('voyager1',segment[edge])['segment_id']==segment['id']
    assert service.mission_state('voyager1',catalog['default_epoch'])


def test_source_tampering_after_cache_load_fails_closed(source):
    path,_=source
    service.mission_state('voyager1','2016-12-31T00:00:00Z')
    with (path/'voyager1.json').open('ab') as stream:stream.write(b' ')
    with pytest.raises(EphemerisUnavailableError):
        service.mission_state('voyager1','2016-12-31T00:00:00Z')


def test_manifest_tampering_fails_closed(source):
    path,_=source
    with (path/'manifest.json').open('ab') as stream:stream.write(b' ')
    with pytest.raises(EphemerisUnavailableError):service.mission_catalog()


def test_api_errors_are_bounded_and_do_not_leak_paths(source):
    app=FastAPI();app.include_router(router,prefix='/api/v1');client=TestClient(app)
    assert client.get('/api/v1/solar/missions').status_code==200
    assert client.get('/api/v1/solar/missions/not-a-mission',params={'epoch':'2017-01-01T00:00:00Z'}).status_code==404
    assert client.get('/api/v1/solar/missions/voyager1',params={'epoch':'2026-01-01T00:00:00Z'}).status_code==422
    assert client.get('/api/v1/solar/missions/voyager2',params={'epoch':'2017-01-01T00:00:00Z'}).status_code==503
    assert str(source[0]) not in client.get('/api/v1/solar/missions/voyager2',params={'epoch':'2017-01-01T00:00:00Z'}).text


def test_derivative_uses_tdb_tangent_seconds():
    a=np.array([2451545.,1.,2.,3.,.5,.7,.9]);b=np.array([2451546.,43201.,60482.,77763.,.5,.7,.9])
    state=service.evaluate(np.array([a,b]),2451545.25)
    assert np.asarray(state['position'])*service.AU_KM==pytest.approx([10801.,15122.,19443.])
    assert np.asarray(state['velocity'])*service.AU_KM==pytest.approx([.5,.7,.9])
    with pytest.raises(ValueError):service.evaluate(np.array([a,b]),2451544.)


@pytest.fixture
def builder():
    path=Path(__file__).resolve().parents[2]/'scripts/skydata/acquire_solar25_missions.py'
    spec=importlib.util.spec_from_file_location('mission_builder_test',path)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module


def test_adaptive_numerics_refine_curvature_and_check_velocity(builder):
    class Provider:
        def evaluate(self,epochs):
            return [{'craft':np.array([t**4,0.,0.,4*t**3/86400,0.,0.])} for t in epochs]
    groups,gaps=builder.adaptive(Provider(),0.,2.,1.,.001,.000001)
    assert not gaps and len(groups)==1
    assert len(groups[0]['states']['craft'])>3
    assert max(groups[0]['position_errors_km'])<=.001
    assert max(groups[0]['velocity_errors_km_s'])<=.000001


def test_source_discontinuity_becomes_explicit_gap(builder):
    class Provider:
        def evaluate(self,epochs):
            return [{'craft':np.array([0. if t<.5 else 100.,0.,0.,0.,0.,0.])} for t in epochs]
    groups,gaps=builder.adaptive(Provider(),2451545.,2451546.,1.,.001,.000001)
    # Repeat around a JD-domain discontinuity (fixture only).
    class Jump:
        def evaluate(self,epochs):
            return [{'craft':np.array([0. if t<2451545.5 else 100.,0.,0.,0.,0.,0.])} for t in epochs]
    groups,gaps=builder.adaptive(Jump(),2451545.,2451546.,1.,.001,.000001)
    assert len(groups)==2 and gaps
    assert groups[0]['states']['craft'][-1][0]<groups[1]['states']['craft'][0][0]


def test_parser_requires_signed_identity_frame_and_all_requested_epochs(builder):
    def raw(target='-31',frame='ICRF',rows='2451545.0, calendar, 1,2,3,4,5,6,'):
        return encoded({'result':f'Target body name: Voyager ({target}) {{source: test}}\nCenter body name: Sun (10) {{source: test}}\nReference frame: {frame}\nOutput units: KM-S\nOutput type: GEOMETRIC cartesian states\nJDTDB,\n$$SOE\n{rows}\n$$EOE'})
    values,_=builder.parse_vectors(raw(),'-31','10',[2451545.])
    assert values.shape==(1,7)
    with pytest.raises(ValueError,match='identity'):builder.parse_vectors(raw('31'),'-31','10',[2451545.])
    with pytest.raises(ValueError,match='frame'):builder.parse_vectors(raw(frame='ECLIPJ2000'),'-31','10',[2451545.])
    with pytest.raises(ValueError,match='Incomplete'):builder.parse_vectors(raw(),'-31','10',[2451545.,2451546.])


def test_cache_budget_cannot_be_bypassed(builder,tmp_path):
    (tmp_path/'large').write_bytes(b'0123456789')
    acquisition=builder.Acquisition(tmp_path,8)
    with pytest.raises(ValueError,match='budget'):acquisition.fetch('https://example.invalid/test','large',limit=16)
    with pytest.raises(ValueError):builder.Acquisition(tmp_path,builder.MAX_BYTES+1)


def test_retained_excerpt_ranges_share_aggregate_budget_before_network(builder,tmp_path):
    (tmp_path/'excerpt.receipt.json').write_bytes(encoded({'ranges':[{'bytes':7}]}))
    with pytest.raises(ValueError,match='budget'):builder.Acquisition(tmp_path,6)
    acquisition=builder.Acquisition(tmp_path,10)
    assert acquisition.bytes==7
    acquisition.reserve_range(3)
    with pytest.raises(ValueError,match='before range transfer'):acquisition.reserve_range(1)
    assert builder.Acquisition(tmp_path,10).bytes==10


@pytest.mark.parametrize('case',json.loads((Path(__file__).parent/'fixtures/mission_interpolation.json').read_bytes())['fixtures'],ids=lambda case:case['mission'])
def test_independently_failed_source_cells_pass_after_refinement(case):
    truth=np.asarray(case['independent_source_state'])
    def errors(key):
        state=service.evaluate(np.asarray(case[key]),case['epoch_jd_tdb'])
        return np.linalg.norm(np.asarray(state['position'])*service.AU_KM-truth[:3]),np.linalg.norm(np.asarray(state['velocity'])*service.AU_KM-truth[3:])
    old_position,old_velocity=errors('old_knots')
    assert old_position>case['position_limit_km'] or old_velocity>case['velocity_limit_km_s']
    position,velocity=errors('corrected_knots')
    assert position<=case['position_limit_km']
    assert velocity<=case['velocity_limit_km_s']
