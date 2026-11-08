"""Qualification-only recorded source seam; never a production geocoder."""
import asyncio,hashlib,json
from pathlib import Path
import httpx
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.routes import earth
from backend.app.services import earth_search as service
from scripts.validation.recorded_earth_search_app import RecordedSearch,require_qualification
ROOT=Path(__file__).resolve().parents[2]
FILE=ROOT/'tests/fixtures/earth/r2a-search-recording.json'
SHA='466515b1c87c217f909c9740981360a8ac3b77bd1a4fc7bbd5dd12738e3b517f'

def test_recording_hash_matches_original_committed_r2a_receipt():
    receipt=json.loads((ROOT/'docs/validation/r2-a-earth-search/evidence/working-candidate-receipt.json').read_text())
    assert SHA==next(r['proofSha256']for r in receipt['focusedBrowser']if r['suite']=='desktop')
    assert hashlib.sha256(FILE.read_bytes()).hexdigest()==SHA


def test_replay_rejects_changed_recording_bytes(tmp_path):
    bad=tmp_path/'proof.json';bad.write_bytes(FILE.read_bytes()+b' ')
    with pytest.raises(ValueError,match='hash'):RecordedSearch(bad)


def test_replay_preserves_each_exact_recorded_candidate_and_route_contract(monkeypatch):
    recording=RecordedSearch(FILE);monkeypatch.setattr(earth,'search_places',recording.read)
    rows=json.loads(FILE.read_text())['runs'][0]['responses']
    with TestClient(app)as c:
        for row in rows:
            response=c.get('/api/earth/search',params={'q':row['query']})
            assert response.status_code==200
            assert response.json()=={'results':row['results'],'source':row['source'],'attributionUrl':service.ATTRIBUTION_URL}
            assert response.headers['cache-control']=='no-store'
        assert c.get('/api/earth/search?q=x').status_code==422
    assert recording.calls==[row['query']for row in rows]


def test_replay_errors_use_real_backend_handlers_and_unknown_queries_fail_closed(monkeypatch):
    recording=RecordedSearch(FILE);monkeypatch.setattr(earth,'search_places',recording.read)
    with TestClient(app)as c:
        assert c.get('/api/earth/search?q=R2%20no-results%20fixture').json()['results']==[]
        assert c.get('/api/earth/search?q=R2%20unavailable%20fixture').status_code==503
        busy=c.get('/api/earth/search?q=R2%20busy%20fixture');assert busy.status_code==429 and busy.headers['retry-after']=='2'
        assert c.get('/api/earth/search?q=unrecorded-location').status_code==503
        assert c.get('/api/earth/search?q=Essen').status_code==200


def test_test_server_requires_explicit_qualification_environment():
    with pytest.raises(RuntimeError):require_qualification({})
    require_qualification({'ORAS_RECORDED_SEARCH_QUALIFICATION':'1'})


@pytest.mark.parametrize('kind',['timeout','http429','invalid-shape','invalid-coordinates'])
def test_production_failure_classes_remain_private_and_cached_without_retry(monkeypatch,kind):
    calls=[]
    async def fetch(query):
        calls.append(query)
        if kind=='timeout':raise httpx.ReadTimeout('declared-private-diagnostic')
        if kind=='http429':raise httpx.HTTPStatusError('declared-private-diagnostic',request=httpx.Request('GET',service.PHOTON_URL),response=httpx.Response(429,headers={'Retry-After':'120'}))
        if kind=='invalid-shape':return {'unexpected':[]}
        return {'features':[{'geometry':{'type':'Point','coordinates':[0,91]},'properties':{'osm_type':'N','osm_id':1,'name':'invalid fixture'}}]}
    current=service.PlaceSearch();monkeypatch.setattr(service,'fetch_photon',fetch);monkeypatch.setattr(service,'service',current)
    with TestClient(app)as c:
        for _ in range(2):
            r=c.get('/api/earth/search?q=declared-failure')
            assert r.status_code==503 and r.json()=={'detail':'Place search is unavailable. Coordinates still work.'}
            assert 'declared-private-diagnostic'not in r.text
    assert calls==['declared-failure']
    assert (current.backoff_until>service.time.monotonic())==(kind=='http429')
