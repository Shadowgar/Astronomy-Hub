"""Lunar orientation checked against NAIF's independently published SPICE run."""
from datetime import datetime, timezone
import asyncio

import numpy as np
import pytest
from httpx import ASGITransport, AsyncClient

from backend.app.main import app
from backend.app.services import planet_view as planet


def get(path, **kwargs):
    async def request():
        async with AsyncClient(transport=ASGITransport(app=app), base_url='http://test') as client:
            return await client.get(path, **kwargs)
    return asyncio.run(request())


def test_lunar_rotation_matches_naif_spice_reference():
    # NAIF moon_de440_250416.tf example EX1: 2022 SEP 30 00:00 TDB.
    runtime = planet.ephemeris._load_runtime(planet.ephemeris._release_dir())
    t = runtime.timescale.tdb_jd(2459852.5)
    rotation = planet._orientation_at(t)[0]
    earth_from_moon = (runtime.kernel[399] - runtime.kernel[301]).at(t).position.km
    expected = np.array([374008.654, -23435.970, 10141.334])
    assert np.linalg.norm(rotation @ earth_from_moon - expected) < .002
    assert np.allclose(rotation @ rotation.T, np.eye(3), atol=1e-12)
    assert np.linalg.det(rotation) == pytest.approx(1, abs=1e-12)


@pytest.mark.parametrize('date', ['1900-01-02T00:00:00Z', '2026-10-23T12:00:00Z', '2050-12-31T00:00:00Z'])
def test_honest_body_frame_shape_and_illumination(date):
    r = get('/api/v1/planet-view/moon', params={'time': date})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body['body']['naif_id'] == '301'
    assert body['frame']['body_fixed'] == 'MOON_ME_DE440_ME421'
    assert body['shape']['radii_m'] == [1737400, 1737400, 1737400]
    assert body['capabilities']['terrain'] is False
    assert body['time']['evaluation_scale'] == 'TDB'
    assert np.linalg.norm(body['illumination']['direction_body_fixed']) == pytest.approx(1)
    assert len(body['sources']) == 4
    assert 'not terrain' in body['coordinates']['height']


def test_known_independent_subsolar_reference():
    # Official Skyfield planetary.html: DE421 apparent subsolar point 2019-12-20 11:05 UTC.
    # Geometric DE442s should remain within 0.02 degrees; this tolerance is a
    # regression envelope across ephemerides/corrections, not physical accuracy.
    r = planet.planet_snapshot(datetime(2019, 12, 20, 11, 5, tzinfo=timezone.utc))
    x, y, z = r['illumination']['direction_body_fixed']
    assert np.degrees(np.arcsin(z)) == pytest.approx(.3, abs=.1)
    assert np.degrees(np.arctan2(y, x)) == pytest.approx(-104.9, abs=.1)


@pytest.mark.parametrize('date', ['garbage','2026-01-01T00:00:00','1899-01-01T00:00:00Z','2051-01-02T00:00:00Z'])
def test_invalid_or_unqualified_time_has_no_fallback(date):
    r = get('/api/v1/planet-view/moon', params={'time': date})
    assert r.status_code == 422


def test_unsupported_body_and_missing_or_corrupt_kernel(monkeypatch, tmp_path):
    assert get('/api/v1/planet-view/mars', params={'time':'2026-01-01T00:00:00Z'}).status_code == 404
    monkeypatch.setenv('ORAS_LUNAR_ORIENTATION_DIR', str(tmp_path))
    assert get('/api/v1/planet-view/moon', params={'time':'2026-01-01T00:00:00Z'}).status_code == 503
    for filename in planet.LUNAR_FILES:
        (tmp_path / filename).write_bytes(b'unqualified bytes')
    assert get('/api/v1/planet-view/moon', params={'time':'2026-01-01T00:00:00Z'}).status_code == 503
