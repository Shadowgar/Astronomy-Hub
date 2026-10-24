"""Self-contained tests against the qualified official source pack."""
from datetime import datetime, timezone
from pathlib import Path
import importlib.util
import json
import os
import sys

import numpy as np
import pytest

REPO = Path(__file__).resolve().parents[2]
FIXTURES = REPO / 'tests/fixtures/planetary-systems/ps2'
from backend.app.services import horizons_systems as service
from scripts.skydata import import_horizons_systems as importer
from backend.app.services.planetary_systems import base_catalog as system_catalog

NOW = datetime(2026,10,23,12,tzinfo=timezone.utc)


@pytest.fixture(scope='session')
def release():
    return Path(os.environ.get('ORAS_PLANETARY_SYSTEMS_DIR', str(REPO / 'data/runtime-packs/planetary-systems/release')))


@pytest.mark.parametrize('identity,count', [('mars',2),('jupiter',4),('saturn',2),('uranus',5),('neptune',1)])
def test_coherent_physical_center_contract_and_surface_unavailable(release, identity, count):
    entry = next(s for s in system_catalog()['systems'] if s['id'] == identity)
    snap = service.horizons_snapshot(identity, NOW, entry, release)
    assert snap['parent']['naif_id'] == service.PARENTS[identity]
    assert snap['origin'] == f"{entry['parent']['name']} center ({service.PARENTS[identity]})"
    assert len(snap['tracks']) == count
    assert snap['frame'] == 'ICRF' and snap['units'] == 'km'
    assert snap['time']['evaluation_scale'] == 'TDB'
    assert snap['source']['id'] == 'jpl_horizons_local'
    assert snap['source']['coverage_start_jd_tdb'] == 2461314.5
    assert snap['source']['coverage_end_jd_tdb'] == 2461345.5
    assert snap['sampling']['max_position_error_km'] < .1
    assert snap['sampling']['qualification_points_per_segment'] == 1
    assert all(not moon['surface']['available'] for moon in snap['satellites'])
    assert all(moon['surface']['destination'] is None for moon in snap['satellites'])
    pack = service.load_pack(release)
    parent = pack['series'][service.PARENTS[identity]]
    pos, vel = service.evaluate(parent, snap['time']['jd_tdb'])
    assert np.allclose(snap['state']['sun']['position_km'], -pos)
    assert np.allclose(snap['state']['sun']['velocity_km_s'], -vel)
    for track in snap['tracks']:
        first = datetime.fromisoformat(track['samples'][0]['epoch'].replace('Z','+00:00'))
        start = datetime.fromisoformat(snap['coverage']['start'].replace('Z','+00:00'))
        last = datetime.fromisoformat(track['samples'][-1]['epoch'].replace('Z','+00:00'))
        end = datetime.fromisoformat(snap['coverage']['end'].replace('Z','+00:00'))
        assert 0 <= (start-first).total_seconds() < .001
        assert 0 <= (last-end).total_seconds() < .001
        assert track['samples'][0]['position_km'] != track['samples'][1]['position_km']


def test_independent_quarter_references_at_two_epochs_for_every_source(release):
    pack = service.load_pack(release)
    count = 0
    for row in json.loads((FIXTURES/'quarter-references.json').read_text()):
        series = pack['series'][row['target']]
        for jd, state in zip(row['jd_tdb'],row['states']):
            position, _ = service.evaluate(series,jd)
            assert np.linalg.norm(position-np.array(state[:3])) < .1
            count += 1
    assert count == 38


def test_utc_coverage_conversion_boundaries_and_no_extrapolation(release):
    entry = next(s for s in system_catalog()['systems'] if s['id']=='mars')
    snap = service.horizons_snapshot('mars',NOW,entry,release)
    assert snap['coverage']['start'].startswith('2026-09-30T23:58:50.')
    assert snap['coverage']['end'].startswith('2026-10-31T23:58:50.')
    for epoch in [datetime(2026,9,30,tzinfo=timezone.utc), datetime(2026,11,1,tzinfo=timezone.utc),datetime(2026,10,23)]:
        with pytest.raises(ValueError): service.horizons_snapshot('mars',epoch,entry,release)
    source=service.load_pack(release)['series']['401']
    for jd in [2461314.5-1e-8,2461345.5+1e-8]:
        with pytest.raises(ValueError): service.evaluate(source,jd)


def test_invalid_or_missing_source_fails_closed(release,tmp_path):
    with pytest.raises(service.EphemerisUnavailableError): service.load_pack(tmp_path)
    (tmp_path/'manifest.json').write_text('{}')
    with pytest.raises(service.EphemerisUnavailableError): service.load_pack(tmp_path)
    meta=json.loads((FIXTURES/'mars-source-meta.json').read_text())
    raw=(FIXTURES/'mars-source.json').read_bytes()
    for original,replacement in [(b'Mars (499)',b'Mars (4)'),(b'Reference frame : ICRF',b'Reference frame : FAKE'),(b'KM-S',b'AU-D'),(b'1.2',b'1.3')]:
        with pytest.raises(ValueError): importer.parse_response(raw.replace(original,replacement),meta)


def test_catalog_admission_preserves_unqualified_moons(release):
    catalog=service.qualify_catalog(system_catalog(),release)
    counts={s['id']:sum(m['status']=='qualified' for m in s['satellites']) for s in catalog['systems']}
    assert counts == {'earth':1,'mars':2,'jupiter':4,'saturn':2,'uranus':5,'neptune':1}
    saturn=next(s for s in catalog['systems'] if s['id']=='saturn')
    assert any(m['status']=='unavailable' for m in saturn['satellites'])


def test_changed_pack_and_barycenter_catalog_fail_closed(release,tmp_path):
    import shutil
    shutil.copy(release/'manifest.json',tmp_path/'manifest.json')
    raw=(release/'pack.json').read_bytes()
    (tmp_path/'pack.json').write_bytes(raw)
    service.load_pack(tmp_path)
    (tmp_path/'pack.json').write_bytes(raw.replace(b'ICRF',b'FAKE'))
    with pytest.raises(service.EphemerisUnavailableError):service.load_pack(tmp_path)
    entry=next(s for s in system_catalog()['systems'] if s['id']=='jupiter')
    entry['parent']['naif_id']='5'
    with pytest.raises(service.EphemerisUnavailableError):service.horizons_snapshot('jupiter',NOW,entry,release)


def test_extended_schema_accepts_ps1_and_ps2_and_retains_provenance(release):
    spec=importlib.util.spec_from_file_location('candidate_schema',REPO/'backend/app/schemas/planetary_systems.py')
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    entry=next(s for s in system_catalog()['systems'] if s['id']=='mars')
    snap=module.SystemSnapshot.parse_obj(service.horizons_snapshot('mars',NOW,entry,release)).dict(by_alias=True)
    assert len(snap['tracks'][0]['samples'])==4465
    assert snap['tracks'][0]['step_seconds']==600
    assert snap['source']['series'][0]['target_id']=='499'
    ps1=json.loads((FIXTURES/'ps1-earth-contract.json').read_text())
    assert module.SystemSnapshot.parse_obj(ps1).system_id=='earth'



def _request(path,params=None):
    import asyncio
    import httpx
    from backend.app.main import app
    async def run():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://test') as client:
            return await client.get(path,params=params)
    return asyncio.run(run())


@pytest.mark.parametrize('identity', ['mars','jupiter','saturn','uranus','neptune'])
def test_integrated_route_preserves_source_provenance(identity,monkeypatch,release):
    monkeypatch.setenv('ORAS_PLANETARY_SYSTEMS_DIR',str(release))
    response=_request('/api/v1/planetary-systems/'+identity,{'epoch':NOW.isoformat()})
    assert response.status_code==200
    body=response.json()
    assert body['source']['transition'].startswith('Separate Horizons physical-center domain')
    assert body['source']['series'][0]['target_id']==service.PARENTS[identity]
    assert body['source']['coverage_start_jd_tdb']==service.FIRST
    assert body['source']['coverage_end_jd_tdb']==service.LAST
    assert body['parent']['naif_id']==service.PARENTS[identity]
    assert all(not moon['surface']['available'] for moon in body['satellites'])


def test_route_exact_finite_coverage_and_failure_states(monkeypatch,release,tmp_path):
    from datetime import timedelta
    import shutil
    monkeypatch.setenv('ORAS_PLANETARY_SYSTEMS_DIR',str(release))
    response=_request('/api/v1/planetary-systems/mars',{'epoch':NOW.isoformat()})
    bounds=response.json()['coverage']
    for key,direction in [('start',-1),('end',1)]:
        bound=datetime.fromisoformat(bounds[key].replace('Z','+00:00'))
        assert _request('/api/v1/planetary-systems/mars',{'epoch':bound.isoformat()}).status_code==200
        outside=bound+timedelta(milliseconds=direction)
        r=_request('/api/v1/planetary-systems/mars',{'epoch':outside.isoformat()})
        assert r.status_code==422
        assert '1900' not in r.json()['detail']
    monkeypatch.setenv('ORAS_PLANETARY_SYSTEMS_DIR',str(tmp_path))
    assert _request('/api/v1/planetary-systems/mars',{'epoch':NOW.isoformat()}).status_code==503
    catalog=_request('/api/v1/planetary-systems').json()
    assert next(s for s in catalog['systems'] if s['id']=='mars')['status']=='unavailable'
    for name in ['manifest.json','pack.json']:shutil.copy(release/name,tmp_path/name)
    assert _request('/api/v1/planetary-systems/mars',{'epoch':NOW.isoformat()}).status_code==200
    raw=(tmp_path/'pack.json').read_bytes()
    (tmp_path/'pack.json').write_bytes(raw.replace(b'ICRF',b'FAKE'))
    assert _request('/api/v1/planetary-systems/mars',{'epoch':NOW.isoformat()}).status_code==503


def test_browser_safe_published_bounds_round_trip_and_strict_exclusion(monkeypatch,release):
    from datetime import timedelta
    monkeypatch.setenv('ORAS_PLANETARY_SYSTEMS_DIR',str(release))
    response=_request('/api/v1/planetary-systems/mars',{'epoch':NOW.isoformat()})
    snap=response.json()
    ts=service._timescale(str(release))
    first=ts.tdb_jd(service.FIRST).utc_datetime()
    last=ts.tdb_jd(service.LAST).utc_datetime()
    expected_start=first.replace(microsecond=first.microsecond//1000*1000)
    if first.microsecond%1000:expected_start+=timedelta(milliseconds=1)
    expected_end=last.replace(microsecond=last.microsecond//1000*1000)
    assert snap['coverage']==snap['sampled_coverage']=={
        'start':expected_start.isoformat(timespec='milliseconds').replace('+00:00','Z'),
        'end':expected_end.isoformat(timespec='milliseconds').replace('+00:00','Z')}
    for key,direction in [('start',-1),('end',1)]:
        bound=datetime.fromisoformat(snap['coverage'][key].replace('Z','+00:00'))
        # JavaScript Date.parse/new Date(...).toISOString preserves these exact ms.
        browser_epoch=bound.isoformat(timespec='milliseconds').replace('+00:00','Z')
        valid=_request('/api/v1/planetary-systems/mars',{'epoch':browser_epoch})
        assert valid.status_code==200
        for delta in [timedelta(milliseconds=direction),timedelta(microseconds=direction)]:
            assert _request('/api/v1/planetary-systems/mars',{'epoch':(bound+delta).isoformat()}).status_code==422
    assert snap['source']['coverage_start_jd_tdb']==service.FIRST
    assert snap['source']['coverage_end_jd_tdb']==service.LAST
