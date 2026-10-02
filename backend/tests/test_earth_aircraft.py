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
