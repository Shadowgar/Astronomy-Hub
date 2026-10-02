from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.routes import earth

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


def test_concurrent_points_do_not_block_and_same_point_is_coalesced(monkeypatch):
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
                if len(requests) == 2:
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
            results = await asyncio.gather(*tasks)
            assert len(requests) == 2
            assert results[0] is results[2]
            assert await earth.read_aircraft(41, -79) is results[0]
            assert len(requests) == 2
            assert not earth._inflight
        finally:
            release.set()
            for task in tasks:
                task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)

    asyncio.run(exercise())
