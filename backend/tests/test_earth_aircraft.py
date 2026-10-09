from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.routes import earth
import pytest
import uuid

@pytest.fixture(autouse=True)
def isolated_aircraft_cache(monkeypatch):
    import asyncio
    monkeypatch.setattr(earth, '_cache', earth.OrderedDict())
    monkeypatch.setattr(earth, '_inflight', {})
    monkeypatch.setattr(earth, '_lock', asyncio.Lock())
    monkeypatch.setattr(earth.shared_aircraft, 'PREFIX', 'oras:test:c57a:'+uuid.uuid4().hex+':')

def require_cache():
    try:
        earth.shared_aircraft.client().ping()
    except Exception:
        pytest.skip('Shared Redis behavior is qualified in Docker with the existing Redis')

client = TestClient(app)

def test_aircraft_transport_is_bounded_and_hides_unavailable_details(monkeypatch):
    async def unavailable(*_):
        raise ValueError('private transport detail')
    monkeypatch.setattr(earth, 'read_aircraft', unavailable)
    response = client.get('/api/earth/aircraft?lat=41.321903&lon=-79.585394')
    assert response.status_code == 503
    assert response.json() == {'detail': 'Aircraft source unavailable'}
    assert client.get('/api/earth/aircraft?lat=91&lon=0').status_code == 422
    assert client.get('/api/earth/aircraft?lat=0&lon=181').status_code == 422

def test_aircraft_schema_excludes_unqualified_fields():
    payload = earth.AircraftFeed.parse_obj({'now': 1780000000000, 'ac': [{'hex': 'abc123', 'lat': 41.0, 'lon': -79.0, 'alt_geom': 12000, 'secret': 'discard'}]})
    assert 'secret' not in payload.dict()['ac'][0]
    assert payload.ac[0].alt_baro is None


def test_negative_position_age_is_rejected_before_upstream_clamping():
    import pytest
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        earth.AircraftFeed.parse_obj({'now': 1780000000000, 'ac': [{'hex': 'abc123', 'lat': 41.0, 'lon': -79.0, 'seen_pos': -1}]})

def test_different_clients_cannot_multiply_provider_acquisition(monkeypatch):
    require_cache()
    import asyncio
    async def exercise():
        calls = []
        async def fetch(point):
            calls.append(point)
            return earth.AircraftFeed(now=1800000000, ac=[])
        monkeypatch.setattr(earth, 'fetch_aircraft', fetch)
        monkeypatch.setattr(earth, '_lock', asyncio.Lock())
        monkeypatch.setattr(earth, '_cache', earth.OrderedDict())
        monkeypatch.setattr(earth, '_inflight', {})
        await asyncio.gather(*(earth.read_aircraft(lat, 0) for lat in (0, 1, 2)), return_exceptions=True)
        assert len(calls) == 1
    asyncio.run(exercise())

def test_independent_worker_paths_share_one_acquisition_and_cache(monkeypatch):
    require_cache()
    import asyncio
    async def exercise():
        calls=[]
        async def fetch(point):
            calls.append(point)
            await asyncio.sleep(.1)
            return earth.AircraftFeed(now=1800000000,ac=[])
        monkeypatch.setattr(earth,'fetch_aircraft',fetch)
        a,b=await asyncio.gather(earth.read_and_cache((20.,20.)),earth.read_and_cache((20.,20.)))
        assert len(calls)==1
        assert sorted([a.cached,b.cached])==[False,True]
        assert a.now==b.now
    asyncio.run(exercise())

def test_cross_worker_waiter_accepts_result_after_four_seconds(monkeypatch):
    require_cache()
    import asyncio
    async def exercise():
        calls = []
        async def fetch(point):
            calls.append(point)
            await asyncio.sleep(5)
            return earth.AircraftFeed(now=1800000000, ac=[])
        monkeypatch.setattr(earth, 'fetch_aircraft', fetch)
        first, second = await asyncio.gather(
            earth.read_and_cache((20., 20.)),
            earth.read_and_cache((20., 20.)),
            return_exceptions=True,
        )
        assert isinstance(first, earth.AircraftFeed), repr(first)
        assert isinstance(second, earth.AircraftFeed), repr(second)
        assert len(calls) == 1
        assert sorted([first.cached, second.cached]) == [False, True]
        assert first.now == second.now
    asyncio.run(exercise())

def test_cross_worker_waiter_keeps_eight_second_whole_call_deadline(monkeypatch):
    require_cache()
    import asyncio
    async def exercise():
        calls = []
        cancelled = asyncio.Event()
        async def fetch(point):
            calls.append(point)
            try:
                await asyncio.Event().wait()
            finally:
                cancelled.set()
        monkeypatch.setattr(earth, 'fetch_aircraft', fetch)
        started = asyncio.get_running_loop().time()
        results = await asyncio.gather(
            earth.read_and_cache((20., 20.)),
            earth.read_and_cache((20., 20.)),
            return_exceptions=True,
        )
        assert asyncio.get_running_loop().time() - started < 9
        assert len(calls) == 1
        assert cancelled.is_set()
        assert all(type(result) is ValueError and str(result) == 'source unavailable'
                   for result in results)
    asyncio.run(exercise())

def test_shared_cache_outage_fails_closed_without_provider_dispatch(monkeypatch):
    import asyncio
    calls=[]
    async def unavailable(_):
        raise ValueError('Cache unavailable')
    async def fetch(point):
        calls.append(point)
        return earth.AircraftFeed(now=1800000000,ac=[])
    monkeypatch.setattr(earth.shared_aircraft,'claim',unavailable)
    monkeypatch.setattr(earth,'fetch_aircraft',fetch)
    with pytest.raises(ValueError):
        asyncio.run(earth.read_aircraft(0,0))
    assert calls==[]

def test_provider_retry_after_applies_to_every_region(monkeypatch):
    require_cache()
    import asyncio,httpx
    async def exercise():
        calls=[]
        async def fetch(point):
            calls.append(point)
            request=httpx.Request('GET','https://declared.invalid/')
            response=httpx.Response(429,headers={'Retry-After':'120'},request=request)
            raise httpx.HTTPStatusError('Declared rate limit',request=request,response=response)
        monkeypatch.setattr(earth,'fetch_aircraft',fetch)
        with pytest.raises(ValueError):await earth.read_aircraft(0,0)
        with pytest.raises(earth.shared_aircraft.AircraftBudgetError):await earth.read_aircraft(1,1)
        assert len(calls)==1
        assert earth.shared_aircraft.client().ttl(earth.shared_aircraft.PREFIX+'dispatch')>=119
    asyncio.run(exercise())

@pytest.mark.parametrize('provider_limited', [False, True])
def test_busy_http_retry_after_reports_remaining_shared_lease(monkeypatch, provider_limited):
    require_cache()
    import httpx
    calls = []

    async def fetch(point):
        calls.append(point)
        if provider_limited:
            request = httpx.Request('GET', 'https://declared.invalid/')
            response = httpx.Response(429, headers={'Retry-After': '120'}, request=request)
            raise httpx.HTTPStatusError('Declared rate limit', request=request, response=response)
        return earth.AircraftFeed(now=1800000000, ac=[])

    monkeypatch.setattr(earth, 'fetch_aircraft', fetch)
    first = client.get('/api/earth/aircraft?lat=0&lon=0')
    assert first.status_code == (503 if provider_limited else 200)
    lease_key = earth.shared_aircraft.PREFIX + 'dispatch'
    assert lease_key.startswith('oras:test:c57a:')
    cache = earth.shared_aircraft.client()
    # Real Redis lease, no sleep or live acquisition; only the unique test namespace.
    remaining = 120 if provider_limited else 30
    busy = client.get('/api/earth/aircraft?lat=1&lon=1')
    assert busy.status_code == 429
    assert remaining - 1 <= int(busy.headers['Retry-After']) <= remaining
    for remaining in (7, 1):
        assert cache.expire(lease_key, remaining)
        busy = client.get('/api/earth/aircraft?lat=1&lon=1')
        assert busy.status_code == 429
        assert max(1, remaining - 1) <= int(busy.headers['Retry-After']) <= remaining
    assert len(calls) == 1
    assert (1.0, 1.0) not in earth._cache

@pytest.mark.parametrize('payload',[{'now':1800000000,'ac':[{'hex':'abc123','lat':91}]},{'now':float('inf'),'ac':[]},{'now':1800000000,'ac':[{'hex':'abc123'}]*2001}])
def test_schema_rejects_nonfinite_positions_epoch_and_source_row_overflow(payload):
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        earth.AircraftFeed.parse_obj(payload)


def test_concurrent_points_do_not_block_and_same_point_is_coalesced(monkeypatch):
    require_cache()
    import asyncio
    import json

    async def exercise():
        entered = asyncio.Event()
        release = asyncio.Event()
        requests = []

        class Response:
            async def __aenter__(self):
                return self
            async def __aexit__(self, *_):
                return False
            def raise_for_status(self):
                pass
            async def aiter_bytes(self):
                requests.append(self.url)
                if len(requests) == 1:
                    entered.set()
                await release.wait()
                yield json.dumps({'now': 1780000000000, 'ac': []}).encode()

        class Client:
            def __init__(self, **_):
                pass
            async def __aenter__(self):
                return self
            async def __aexit__(self, *_):
                return False
            def stream(self, _, url):
                response = Response()
                response.url = url
                return response

        monkeypatch.setattr(earth.httpx, 'AsyncClient', Client)
        monkeypatch.setattr(earth, '_lock', asyncio.Lock())
        monkeypatch.setattr(earth, '_cache', earth.OrderedDict())
        monkeypatch.setattr(earth, '_inflight', {}, raising=False)
        tasks = [asyncio.create_task(earth.read_aircraft(lat, -79)) for lat in (41, 42, 41)]
        try:
            await asyncio.wait_for(entered.wait(), timeout=0.5)
            release.set()
            results = await asyncio.gather(*tasks, return_exceptions=True)
            assert len(requests) == 1
            assert results[0] is results[2]
            # Redis dispatch order across worker threads is intentionally unordered.
            winner = 41 if isinstance(results[0],earth.AircraftFeed) else 42
            loser = results[1] if winner==41 else results[0]
            assert isinstance(loser, earth.shared_aircraft.AircraftBudgetError)
            assert (await earth.read_aircraft(winner, -79)).cached
            assert len(requests) == 1
            assert not earth._inflight
        finally:
            release.set()
            for task in tasks:
                task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)

    asyncio.run(exercise())
