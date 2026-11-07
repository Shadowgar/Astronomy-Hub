"""Source identity, bounded orbit domain, and read-only population admission."""
import asyncio
import copy
import hashlib
import json
import math
from pathlib import Path

import httpx
import pytest
from fastapi import FastAPI


def row(**overrides):
    value = dict(spkid='9007199254740993123', pdes='TEST-1', full_name='Test source body', name=None,
                 prefix=None, orbit_id='42', epoch='2461400.5', equinox='J2000', e='0.2', a='2.5', q='2',
                 i='12', om='30', w='45', ma='60', n='0.249341', H=None, diameter=None,
                 condition_code='0', data_arc='12000', n_obs_used='800', sigma_e='0.00001',
                 sigma_a='0.000001', **{'class':'MBA'})
    return value | overrides


def test_source_identity_and_unknown_physical_values_survive_normalization():
    from scripts.skydata.acquire_solar24_populations import normalize_body
    body = normalize_body(row(), 'asteroid-belt')
    assert body['source_id'] == '9007199254740993123'
    assert body['diameter_km'] is None and body['absolute_magnitude'] is None
    assert body['orbit_class'] == 'MBA' and body['dynamical_subclass'] is None
    assert body['representation'] == 'symbolic-approximate'
    assert body['coverage']['start_jd_tdb'] == 2461220.5
    assert body['uncertainty']['sigma_a_au'] == 0.000001


@pytest.mark.parametrize('eccentricity,a,expected', [('1','-1','parabolic'),('1.2','-4','hyperbolic'),('0.999','100','near-parabolic'),('0.5','4','elliptical')])
def test_comets_remain_catalog_only_for_all_orbit_classes(eccentricity,a,expected):
    from scripts.skydata.acquire_solar24_populations import normalize_body
    body = normalize_body(row(e=eccentricity,a=a,**{'class':'HYP'}), 'comets')
    assert body['orbit_domain'] == expected
    assert body['representation'] == 'catalog-only' and body['coverage'] is None
    assert 'source trajectory' in body['unavailable_reason']


def test_equatorial_frame_is_not_silently_accepted_as_ecliptic():
    from scripts.skydata.acquire_solar24_populations import normalize_body
    with pytest.raises(ValueError,match='equinox'):
        normalize_body(row(equinox='B1950'), 'asteroid-belt')


def test_analytic_velocity_and_domain_are_physical_not_display_coordinates():
    from scripts.skydata.acquire_solar24_populations import normalize_body, propagate
    body = normalize_body(row(e='0',a='1',i='0',om='0',w='0',ma='0',n='1'), 'asteroid-belt')
    p,v = propagate(body,2461400.5)
    epsilon = math.radians(84381.448/3600)
    assert p == pytest.approx([1,0,0], abs=1e-14)
    assert v == pytest.approx([0,math.radians(1)*math.cos(epsilon)/86400,math.radians(1)*math.sin(epsilon)/86400],abs=1e-14)
    delta = .0001
    left,_ = propagate(body,2461400.5-delta);right,_ = propagate(body,2461400.5+delta)
    assert [(b-a)/(2*delta*86400) for a,b in zip(left,right)] == pytest.approx(v,rel=3e-6)
    with pytest.raises(ValueError,match='coverage'):propagate(body,2461580.501)
    with pytest.raises(ValueError,match='catalog-only'):propagate(normalize_body(row(e='1.2',a='-4'),'comets'),2461400.5)


def test_missing_pack_fails_closed_without_paths_in_http(monkeypatch,tmp_path):
    from backend.app.routes.solar_populations import router
    from backend.app.services import solar_populations
    monkeypatch.setenv('ORAS_SOLAR_POPULATIONS_DIR',str(tmp_path/'private-source-path'))
    solar_populations.load_population.cache_clear()
    app=FastAPI();app.include_router(router,prefix='/api/v1')
    async def request():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://test') as client:
            return await client.get('/api/v1/solar-populations')
    response=asyncio.run(request())
    assert response.status_code == 503
    assert response.json() == {'detail':'Qualified local Solar population source is unavailable.'}
    assert 'private-source-path' not in response.text


def test_reference_checks_reject_target_frame_epoch_and_nonfinite_states():
    from scripts.skydata.acquire_solar24_populations import parse_reference
    body={'designation':'1','source_id':'20000001'};epochs=[2461220.5,2461400.5,2461580.5]
    raw='Target body name: 1 Ceres (2000001)\nCenter body name: Sun (10)\nReference frame : ICRF\nOutput units    : AU-D\nOutput type     : GEOMETRIC cartesian states\nJDTDB\n$$SOE\n'
    raw+='\n'.join(f'{jd},date,1,2,3,0,0,0,' for jd in epochs)+'\n$$EOE'
    assert len(parse_reference(raw,body,epochs))==3
    for changed in [raw.replace('1 Ceres','2 Pallas'),raw.replace('ICRF','ECLIPJ2000'),raw.replace('AU-D','KM-S'),raw.replace('2461220.5','2461221.5'),raw.replace(',1,2,3',',nan,2,3')]:
        with pytest.raises(ValueError):parse_reference(changed,body,epochs)


def reference_fixture():
    return json.loads((Path(__file__).parent/'fixtures/solar_populations_reference.json').read_text())


def fixture_pack():
    fixture=reference_fixture()
    return dict(schema='oras.solar-populations.v1',release=fixture['release'],acquired_utc='2026-11-03T00:00:00Z',
        catalog='JPL SBDB',origin='Sun center (10)',element_frame='ECLIPJ2000',output_frame='ICRF',time_scale='TDB',position_units='AU',velocity_units='AU/s',
        body_count=len(fixture['bodies']),bodies=fixture['bodies'],model=fixture['model'],selection='Explicit small source reference fixture; never a production catalog.',
        groups=[dict(id=str(i),population='comets',available=100,included=1,limit=1,selection={'sort':'H'}) for i in range(4)],
        sources=fixture['source_records'],terms={'publisher':'NASA/JPL SSD'},
        qualification=dict(reference='JPL Horizons sampled source comparisons',max_comparison_error_km=max(c['error_km'] for c in fixture['source_comparisons']),
            max_velocity_error_km_s=max(c['velocity_error_km_s'] for c in fixture['source_comparisons']),comparisons=fixture['source_comparisons'],reference_files=list(fixture['source_records'])))


def install_fixture(directory,pack,monkeypatch):
    from backend.app.services import solar_populations as service
    from scripts.skydata.acquire_solar24_populations import encode,digest
    raw=encode(pack)
    manifest=encode(dict(schema='oras.solar-population-release.v1',release=pack['release'],file='population.json',bytes=len(raw),sha256=digest(raw),body_count=pack['body_count']))
    (directory/'population.json').write_bytes(raw);(directory/'manifest.json').write_bytes(manifest)
    monkeypatch.setattr(service,'PINNED_MANIFEST_SHA256',digest(manifest));service.load_population.cache_clear()
    return service


def test_source_fixture_reproduces_all_independent_comparisons_and_canonical_ids():
    from scripts.skydata.acquire_solar24_populations import propagate,AU_KM
    from backend.app.schemas.solar_populations import PopulationPack
    fixture=reference_fixture();bodies={b['source_id']:b for b in fixture['bodies']}
    PopulationPack.parse_obj(fixture_pack())
    assert {'20000001','20000004','20136199','1000036','1000012'}<=bodies.keys()
    assert len(fixture['source_comparisons'])==115
    for c in fixture['source_comparisons']:
        p,v=propagate(bodies[c['source_id']],c['jd_tdb'])
        assert math.dist(p,c['position_au'])*AU_KM==pytest.approx(c['error_km'],abs=1e-6)
        assert math.dist(v,c['velocity_au_s'])*AU_KM==pytest.approx(c['velocity_error_km_s'],abs=1e-12)
    for c in fixture['python_propagation']:
        p,v=propagate(bodies[c['source_id']],c['jd_tdb'])
        assert p==pytest.approx(c['position_au'],abs=1e-13)
        assert v==pytest.approx(c['velocity_au_s'],abs=1e-19)


@pytest.mark.parametrize('mutation',[lambda p:p['bodies'][0].update(source_id=20000001),
    lambda p:p['bodies'][0].update(dynamical_subclass='resonant'),
    lambda p:p['bodies'][0]['coverage'].update(end_jd_tdb=2469999),
    lambda p:p.update(body_count=p['body_count']+1),
    lambda p:p['bodies'].__setitem__(0,copy.deepcopy(p['bodies'][1])),
    lambda p:p['model'].update(population_wide_accuracy_qualified=True)])
def test_model_rejects_identity_coverage_and_accuracy_overclaims(mutation):
    from pydantic import ValidationError
    from backend.app.schemas.solar_populations import PopulationPack
    pack=fixture_pack();mutation(pack)
    with pytest.raises(ValidationError):PopulationPack.parse_obj(pack)


def test_pinned_release_serves_validated_bytes_and_rejects_tampering(monkeypatch,tmp_path):
    service=install_fixture(tmp_path,fixture_pack(),monkeypatch)
    raw,sha=service.load_population(str(tmp_path))
    assert json.loads(raw)['pack_sha256']==sha
    with (tmp_path/'population.json').open('ab') as stream:stream.write(b' ')
    service.load_population.cache_clear()
    with pytest.raises(service.PopulationUnavailable):service.load_population(str(tmp_path))
    service=install_fixture(tmp_path,fixture_pack(),monkeypatch)
    (tmp_path/'manifest.json').write_text('{}')
    with pytest.raises(service.PopulationUnavailable):service.load_population(str(tmp_path))


def test_rehashed_pack_still_requires_scientific_schema(monkeypatch,tmp_path):
    pack=fixture_pack();pack['output_frame']='ECLIPJ2000'
    service=install_fixture(tmp_path,pack,monkeypatch)
    with pytest.raises(service.PopulationUnavailable):service.load_population(str(tmp_path))


def test_acquisition_resume_never_trusts_changed_bytes_or_unreceipted_files(tmp_path):
    from scripts.skydata.acquire_solar24_populations import Acquisition,MAX_BYTES,digest,encode
    with pytest.raises(ValueError,match='32 MiB'):Acquisition(tmp_path,MAX_BYTES+1)
    (tmp_path/'example.json').write_text('{}')
    acquisition=Acquisition(tmp_path)
    with pytest.raises(ValueError,match='Unreceipted'):acquisition.get('example.json','https://ssd-api.jpl.nasa.gov/example')
    acquisition.receipt['files']['example.json']=dict(url='https://ssd-api.jpl.nasa.gov/example',sha256=digest(b'{}'),bytes=2)
    assert acquisition.get('example.json','https://ssd-api.jpl.nasa.gov/example')==b'{}'
    (tmp_path/'example.json').write_text('{"changed":true}')
    with pytest.raises(ValueError,match='Changed acquisition'):acquisition.get('example.json','https://ssd-api.jpl.nasa.gov/example')


@pytest.mark.parametrize('mean',[0,1e-10,.01,1,179.99,180,359.99])
def test_high_e_elliptical_solver_converges_without_hyperbolic_extension(mean):
    from scripts.skydata.acquire_solar24_populations import normalize_body,propagate
    body=normalize_body(row(e='.9799',a='200',q='4.02',ma=str(mean),n='.0003'),'trans-neptunian')
    p,v=propagate(body,2461400.5)
    radius=math.sqrt(sum(x*x for x in p))
    assert 4.02-1e-9<=radius<=395.98+1e-9 and all(math.isfinite(x) for x in v)
    blocked=normalize_body(row(e='.98',a='200',q='4',ma=str(mean)),'trans-neptunian')
    assert blocked['representation']=='catalog-only'
