"""Continuous Solar motion keeps exact source identities and bounded interpolation."""
from datetime import datetime, timezone
import numpy as np
import pytest
import asyncio
import httpx
from backend.app.main import app
from backend.app.services import planetary_ephemeris_service as ephemeris
from backend.app.services import solar_exploration

NOW = datetime(2026, 10, 28, 12, tzinfo=timezone.utc)


class Client:
    def get(self,path,params=None):
        async def request():
            async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://test') as client:
                return await client.get(path,params=params)
        return asyncio.run(request())


def test_motion_route_has_all_source_targets_and_qualified_tangents():
    response = Client().get('/api/v1/solar-system/motion', params={'epoch':NOW.isoformat()})
    assert response.status_code == 200
    result = response.json()
    assert result['schema'] == 'oras.solar-motion.v1'
    assert result['origin'] == 'Sun center (10)' and result['frame'] == 'ICRF'
    assert result['units'] == 'AU,AU/s'
    assert result['sampling']['max_position_error_km'] < 1
    assert result['sampling']['qualification_points_per_segment'] == 3
    runtime = ephemeris._load_runtime(ephemeris._release_dir())
    for track, body in zip(result['tracks'], solar_exploration.BODIES):
        assert track['id'] == body[0] and track['ephemeris_target'] == str(body[3])
        assert track['position_reference'] == body[4]
        samples = track['samples']
        assert len(samples) == 385
        assert samples[192]['epoch'] == result['epoch']
        if body[3] == 10:
            assert all(s['position_au'] == [0,0,0] and s['velocity_au_s'] == [0,0,0] for s in samples)
            continue
        # Independent off-grid checks, distinct from the service's qualification fractions.
        for index, fraction in [(0,.13),(191,.61),(383,.87)]:
            a,b = samples[index:index+2]
            jd = a['jd_tdb'] + (b['jd_tdb']-a['jd_tdb'])*fraction
            truth = (runtime.kernel[body[3]]-runtime.kernel[10]).at(runtime.timescale.tdb_jd(jd)).position.au
            dt = (b['jd_tdb']-a['jd_tdb'])*86400
            u = fraction
            approximate = ((2*u**3-3*u*u+1)*np.array(a['position_au']) + (u**3-2*u*u+u)*dt*np.array(a['velocity_au_s'])
                           +(-2*u**3+3*u*u)*np.array(b['position_au'])+(u**3-u*u)*dt*np.array(b['velocity_au_s']))
            assert np.linalg.norm(approximate-truth)*149597870.7 < 1


@pytest.mark.parametrize('epoch', ['2016-12-31T23:59:59.500Z','2017-01-01T00:00:00Z','1849-12-26T00:00:00Z','2150-01-22T00:00:00Z'])
def test_motion_window_clips_leaps_and_bounds(epoch):
    response = Client().get('/api/v1/solar-system/motion', params={'epoch':epoch})
    assert response.status_code == 200
    result = response.json()
    assert result['sampled_coverage']['start'] <= result['epoch'] <= result['sampled_coverage']['end']
    for a,b in zip(result['tracks'][1]['samples'],result['tracks'][1]['samples'][1:]):
        utc = (datetime.fromisoformat(b['epoch'].replace('Z','+00:00'))-datetime.fromisoformat(a['epoch'].replace('Z','+00:00'))).total_seconds()
        assert abs((b['jd_tdb']-a['jd_tdb'])*86400-utc) < .01


def test_motion_has_no_unqualified_fallback(monkeypatch, tmp_path):
    client = Client()
    for epoch in ['garbage','2026-01-01T00:00:00','2200-01-01T00:00:00Z']:
        assert client.get('/api/v1/solar-system/motion',params={'epoch':epoch}).status_code == 422
    monkeypatch.setenv('ORAS_PLANETARY_EPHEMERIS_DIR',str(tmp_path))
    response = client.get('/api/v1/solar-system/motion',params={'epoch':NOW.isoformat()})
    assert response.status_code == 503
    assert response.json()['detail'] == 'Local Solar motion source unavailable.'
