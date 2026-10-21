"""Geometric Solar vectors must match independently acquired JPL Horizons values."""
from datetime import datetime, timezone
import json
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services import solar_exploration as solar
from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError

REFERENCE = json.loads((Path(__file__).resolve().parents[2] / 'tests/fixtures/solar/reference.json').read_text())

@pytest.mark.parametrize('row', REFERENCE['rows'])
def test_known_epoch_vector_matches_independent_horizons(row):
    epoch = datetime.fromtimestamp((row['jdUtc'] - 2440587.5) * 86400, timezone.utc)
    result = solar.solar_snapshot(epoch)
    body = next(b for b in result['bodies'] if b['ephemeris_target'] == row['target'])
    # DE442s local versus Horizons current DE441: bounded 50 km inter-kernel tolerance.
    assert max(abs(a-b) for a,b in zip(body['position_au'], row['positionAu'])) * 149597870.7 < 50
    assert result['origin'] == 'Sun center (10)'
    assert result['frame'] == 'ICRF'
    assert result['units'] == 'AU'
    assert result['corrections'] == 'geometric; no light-time or aberration'
    assert result['source']['sha256'] == '54d97562a5b094d298b1b8eafa5a2e17e3e010ce85e1a366d07f003ad159323c'

def test_source_orbits_identity_and_no_invented_body_orientation():
    result = solar.solar_snapshot(datetime(2026,3,1,tzinfo=timezone.utc))
    assert [b['source_id']for b in result['bodies']] == ['sun','earth','mars']
    assert result['bodies'][0]['position_au'] == [0,0,0]
    for body in result['bodies']:
        assert body['catalog'] == 'Solar System (JPL)'
        assert body['shape']['units'] == 'km'
        assert body['orientation']['status'] == 'unavailable'
        assert body['surface']['available'] is False
        assert body['body_fixed_frame'] is None
        assert len(body['trajectory']) <= 129
        assert all(len(s['position_au']) == 3 for s in body['trajectory'])
    mars = result['bodies'][2]
    assert mars['ephemeris_target'] == '4'
    assert 'barycenter' in mars['position_reference']
    assert mars['shape']['mean_radius_km'] == 3389.5
    assert result['bodies'][1]['trajectory'][-1]['position_au'] == result['bodies'][1]['position_au']

def test_route_validates_epoch_and_uses_no_fallback_when_kernel_missing(monkeypatch):
    c = TestClient(app)
    for epoch in ['garbage','2026-01-01','2026-01-01T00:00:00','2200-01-01T00:00:00Z']:
        assert c.get('/api/v1/solar-system',params={'epoch':epoch}).status_code == 422
    monkeypatch.setattr(solar.ephemeris,'_load_runtime',lambda _: (_ for _ in ()).throw(EphemerisUnavailableError('missing')))
    r = c.get('/api/v1/solar-system',params={'epoch':'2026-01-01T00:00:00Z'})
    assert r.status_code == 503
    assert r.json()['detail'] == 'Local Solar ephemeris unavailable.'

def test_naive_time_rejected():
    with pytest.raises(ValueError):solar.solar_snapshot(datetime(2026,1,1))
