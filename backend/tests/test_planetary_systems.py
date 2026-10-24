"""PS1 exact centers, independent Horizons, bounded source interpolation and failures."""
from datetime import datetime, timezone
import asyncio
import json
from pathlib import Path

import httpx
import numpy as np
import pytest

from backend.app.main import app
from backend.app.services import planetary_systems as systems
from backend.app.services import planetary_ephemeris_service as ephemeris

REFERENCE = json.loads((Path(__file__).resolve().parents[2] / 'tests/fixtures/planetary-systems/horizons.json').read_text())
NOW = datetime(2026, 10, 23, 12, tzinfo=timezone.utc)


def request(path, params=None):
    async def run():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://test') as c:
            return await c.get(path, params=params)
    return asyncio.run(run())


@pytest.mark.parametrize('row', REFERENCE['rows'])
def test_independent_horizons_earth_center_moon_vector(row):
    epoch = datetime.fromtimestamp((row['jd_utc'] - 2440587.5) * 86400, timezone.utc)
    snap = systems.system_snapshot('earth', epoch)
    state = snap['state']['moon']
    assert np.linalg.norm(np.array(state['position_km']) - row['position_km']) < .05
    assert np.linalg.norm(np.array(state['velocity_km_s']) - row['velocity_km_s']) < 1e-6
    assert snap['parent']['naif_id'] == '399'
    assert snap['satellites'][0]['naif_id'] == '301'
    assert snap['origin'] == 'Earth center (399)'
    assert snap['frame'] == 'ICRF' and snap['units'] == 'km'
    runtime = ephemeris._load_runtime(ephemeris._release_dir())
    t = runtime.timescale.from_datetime(epoch)
    wrong = (runtime.kernel[301] - runtime.kernel[3]).at(t).position.km
    assert np.linalg.norm(np.array(state['position_km']) - wrong) > 4000
    assert snap['time']['jd_tdb'] == float(t.tdb)


def test_tracks_are_time_dependent_and_off_grid_qualified():
    snap = systems.system_snapshot('earth', NOW)
    samples = snap['tracks'][0]['samples']
    assert len(samples) == 769
    assert samples[384]['epoch'] == snap['epoch']
    assert samples[384]['position_km'] == snap['state']['moon']['position_km']
    assert samples[0]['position_km'] != samples[-1]['position_km']
    assert len(snap['sun_track']['samples']) == 769
    assert snap['sampling']['max_position_error_km'] < 1
    assert snap['sampling']['qualification_points_per_segment'] == 3
    assert snap['sampling']['interpolation'] == 'cubic-hermite'
    assert snap['sampling']['time_fraction'] == 'UTC; TDB endpoint duration; leap transitions clipped'
    assert snap['sun_track']['samples'][0]['position_km'] != snap['sun_track']['samples'][-1]['position_km']
    assert samples[0]['epoch'] == snap['sampled_coverage']['start']
    assert samples[-1]['epoch'] == snap['sampled_coverage']['end']


@pytest.mark.parametrize('epoch', ['1900-01-01T00:00:00Z', '2051-01-01T00:00:00Z', '2016-12-31T12:00:00Z', '2017-01-01T12:00:00Z'])
def test_coverage_and_leap_boundaries_are_clipped(epoch):
    snap = systems.system_snapshot('earth', datetime.fromisoformat(epoch.replace('Z','+00:00')))
    samples = snap['tracks'][0]['samples']
    assert 2 <= len(samples) <= 769
    for a, b in zip(samples, samples[1:]):
        utc = (datetime.fromisoformat(b['epoch'].replace('Z','+00:00')) - datetime.fromisoformat(a['epoch'].replace('Z','+00:00'))).total_seconds()
        assert 0 < utc <= 3600
        assert abs((b['jd_tdb'] - a['jd_tdb']) * 86400 - utc) < .01
    assert snap['sampling']['max_position_error_km'] < 1


def test_catalog_uses_sourced_metadata_and_honest_unavailability():
    response = request('/api/v1/planetary-systems')
    assert response.status_code == 200
    catalog = response.json()
    rows = {s['id']: s for s in catalog['systems']}
    assert set(rows) == {'earth','mars','jupiter','saturn','uranus','neptune'}
    assert rows['earth']['satellites'][0]['radius_km'] == 1737.4
    assert rows['earth']['satellites'][0]['surface'] == {'available': True, 'destination': '/planet-view/moon'}
    assert [m['name'] for m in rows['mars']['satellites']] == ['Phobos','Deimos']
    for system in rows.values():
        assert system['parent']['naif_id'].endswith('99')
        for moon in system['satellites']:
            assert moon['radius_source'].startswith('https://ssd.jpl.nasa.gov/')
            if system['id'] != 'earth':
                assert moon['status'] == 'unavailable'
                assert moon['surface']['available'] is False
                assert system['status'] == 'unavailable'


@pytest.mark.parametrize('epoch', ['garbage','2026-01-01T00:00:00','1899-12-31T23:59:59Z','2051-01-01T00:00:01Z'])
def test_route_rejects_invalid_and_out_of_range(epoch):
    assert request('/api/v1/planetary-systems/earth', {'epoch':epoch}).status_code == 422


def test_route_valid_snapshot_unknown_and_missing_source(monkeypatch, tmp_path):
    response = request('/api/v1/planetary-systems/earth', {'epoch':NOW.isoformat()})
    assert response.status_code == 200
    assert response.json()['schema'] == 'oras.planetary-system.v1'
    assert request('/api/v1/planetary-systems/mars', {'epoch':NOW.isoformat()}).status_code == 503
    assert request('/api/v1/planetary-systems/fiction', {'epoch':NOW.isoformat()}).status_code == 404
    monkeypatch.setenv('ORAS_PLANETARY_EPHEMERIS_DIR', str(tmp_path))
    assert request('/api/v1/planetary-systems/earth', {'epoch':NOW.isoformat()}).status_code == 503


def test_fractional_epoch_immediately_before_leap_is_in_sampled_coverage():
    epoch = datetime(2016, 12, 31, 23, 59, 59, 500000, tzinfo=timezone.utc)
    snap = systems.system_snapshot('earth', epoch)
    end = datetime.fromisoformat(snap['sampled_coverage']['end'].replace('Z','+00:00'))
    assert epoch <= end < datetime(2017,1,1,tzinfo=timezone.utc)
    assert snap['sampling']['max_position_error_km'] < 1
