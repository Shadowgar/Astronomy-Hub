"""Submitted Earth place search; source fixtures are never production catalogs."""
import asyncio
import copy
import json
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app

client=TestClient(app)
ROOT=Path(__file__).resolve().parents[2]

def test_search_route_preserves_ambiguity_and_real_source_coordinates(monkeypatch):
    from backend.app.services import earth_search as s
    payload=json.loads((ROOT/'tests/fixtures/earth/search-springfield.json').read_text())
    async def fetch(_):return payload
    monkeypatch.setattr(s,'fetch_photon',fetch)
    monkeypatch.setattr(s,'service',s.PlaceSearch())
    r=client.get('/api/earth/search',params={'q':'Springfield'})
    assert r.status_code==200
    body=r.json();assert len(body['results'])>=2
    assert body['results'][0]['lon']==payload['features'][0]['geometry']['coordinates'][0]
    assert body['results'][0]['lat']==payload['features'][0]['geometry']['coordinates'][1]
    assert body['results'][0]['id']!=body['results'][1]['id']
    assert body['source']=='Photon / OpenStreetMap'
    assert 'elevationM'not in body['results'][0]

def test_search_is_registered_and_rejects_short_or_excessive_queries():
    assert client.get('/api/earth/search?q=x').status_code==422
    assert client.get('/api/earth/search',params={'q':'x'*201}).status_code==422

def test_normalization_rejects_corrupt_or_unlocated_source_features():
    from backend.app.services import earth_search as s
    base={'type':'Feature','geometry':{'type':'Point','coordinates':[-79.5,41.3]},'properties':{'osm_type':'N','osm_id':123,'name':'Real fixture name','city':'Fixture city','country':'US','type':'city'}}
    for coordinates in ([0,91],[181,0],[float('nan'),0],['-79',41],[0],None):
        bad=copy.deepcopy(base);bad['geometry']['coordinates']=coordinates
        assert s.normalize_feature(bad)is None
    assert s.normalize_feature({})is None
    out=s.normalize_feature(base)
    assert out['id']=='osm:N:123'and out['lat']==41.3 and out['lon']==-79.5
    assert 'Fixture city'in out['description']

def test_empty_results_and_provider_errors_are_distinct(monkeypatch):
    from backend.app.services import earth_search as s
    async def empty(_):return {'features':[]}
    monkeypatch.setattr(s,'fetch_photon',empty);monkeypatch.setattr(s,'service',s.PlaceSearch())
    assert client.get('/api/earth/search?q=no-such-place').json()['results']==[]
    async def fail(_):raise ValueError('private upstream failure')
    monkeypatch.setattr(s,'fetch_photon',fail);monkeypatch.setattr(s,'service',s.PlaceSearch())
    r=client.get('/api/earth/search?q=provider-failure')
    assert r.status_code==503 and 'private'not in r.text

def test_cache_coalesces_identical_queries_and_refuses_unbounded_parallel_requests(monkeypatch):
    from backend.app.services import earth_search as s
    async def exercise():
        monkeypatch.setattr(s,'service',s.PlaceSearch());entered=asyncio.Event();release=asyncio.Event();seen=[]
        async def fetch(q):seen.append(q);entered.set();await release.wait();return {'features':[]}
        monkeypatch.setattr(s,'fetch_photon',fetch)
        first=asyncio.create_task(s.search_places('Paris'));await entered.wait()
        second=asyncio.create_task(s.search_places(' Paris '));await asyncio.sleep(0)
        try:await s.search_places('Berlin')
        except s.SearchBusy:pass
        else:assert False,'A distinct in-flight query must be refused, not queued'
        release.set();assert await first==await second
        assert await s.search_places('Paris')==[] and len(seen)==1
    asyncio.run(exercise())

def test_malformed_provider_candidates_remain_unavailable_on_cached_retry(monkeypatch):
    from backend.app.services import earth_search as s
    calls=[]
    async def malformed(q):
        calls.append(q)
        return {'features':[{'geometry':{'type':'Point','coordinates':[0,91]},'properties':{'osm_type':'N','osm_id':123,'name':'Invalid fixture'}}]}
    monkeypatch.setattr(s,'fetch_photon',malformed);monkeypatch.setattr(s,'service',s.PlaceSearch())
    for _ in range(2):
        response=client.get('/api/earth/search?q=malformed-provider')
        assert response.status_code==503
        assert 'results'not in response.json()
    assert calls==['malformed-provider']
