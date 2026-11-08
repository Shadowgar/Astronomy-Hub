"""Historical-event separation and bounded, fail-closed observation products."""
from copy import deepcopy
import hashlib
import json
import math

from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError
import pytest

from backend.app.routes.beyond_exploration import router
from backend.app.schemas.beyond_exploration import AngularMap, BeyondContext, ObservationProduct, TimeSeries
from backend.app.services import beyond_exploration as service
from backend.app.services.planetary_ephemeris_service import EphemerisUnavailableError


def encoded(value):
    return json.dumps(value, separators=(',', ':'), allow_nan=False).encode()


@pytest.fixture
def missions(monkeypatch):
    calls = []
    def state(identity, epoch):
        calls.append((identity, epoch))
        # Deliberately unlike the published radial observation: never rescale.
        position = [30., 40., 0.] if identity == 'voyager1' else [0., -60., 80.]
        return dict(epoch=epoch, jd_tdb=2456165.000777578 if identity == 'voyager1' else 2458428.000800724,
                    frame='ICRF', origin='sun', position_units='AU', velocity_units='AU/s', quality='predicted', source_label='Synthetic test fixture only',
                    craft=dict(position=position, velocity=[1e-8, 2e-8, 3e-8], naif_id='-31' if identity == 'voyager1' else '-32'),
                    interpolation=dict(physical_uncertainty='Not supplied'))
    monkeypatch.setattr(service.mission_exploration, 'mission_state', state)
    return calls


@pytest.fixture
def metadata():
    return dict(publisher='Fixture', instrument='Fixture', product='Fixture only', version='test',
                observation_start='2009-01-01T00:00:00Z', observation_end='2009-01-02T00:00:00Z',
                frame='ECLIPJ2000', units='fixture units', energy='fixture band', projection='equirectangular',
                calibration='fixture only', coverage='fixture partial', rights='test fixture', attribution='test fixture',
                source_urls=['https://example.invalid/fixture'], source_sha256=['a' * 64], limitations=['Not scientific data'])


@pytest.fixture
def products(metadata):
    angular = dict(schema='oras.heliophysics-observation.v1', id='ibex-ena-map', kind='angular-map', metadata=metadata,
                   data=dict(longitude_deg=[3., 9.], latitude_deg=[-3., 3.], flux=[[1., None], [3., 4.]], uncertainty=[[.1, None], [.3, .4]], mask=[[False, True], [False, False]]))
    series = dict(schema='oras.heliophysics-observation.v1', id='imap-magnetic-field', kind='time-series', metadata=metadata,
                  data=dict(time_utc=['2009-01-01T00:00:00Z', '2009-01-01T00:01:00Z'], value=[3., None], minimum=[2., None], maximum=[4., None], count=[120, 0], rejected_count=[0, 120], quality_bitmask=[0, 1]))
    return [angular, series]


@pytest.fixture
def source(tmp_path, monkeypatch, products):
    def install(items=products, changes=None):
        manifest = dict(schema='oras.heliophysics-pack.v1', release_id='solar26-observations-v1', products={})
        for product in items:
            identity = product['id']; raw = encoded(product)
            (tmp_path / (identity + '.json')).write_bytes(raw)
            manifest['products'][identity] = dict(file=identity + '.json', bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest(), metadata=product['metadata'])
        if changes:
            changes(manifest)
        raw = encoded(manifest)
        (tmp_path / 'manifest.json').write_bytes(raw)
        monkeypatch.setattr(service, 'RELEASE_SHA256', hashlib.sha256(raw).hexdigest())
        service._manifest.cache_clear(); service._product.cache_clear()
    install()
    monkeypatch.setenv('ORAS_HELIOPHYSICS_DIR', str(tmp_path))
    yield tmp_path, install
    service._manifest.cache_clear(); service._product.cache_clear()


def test_distinct_historical_dates_vectors_not_rescaled_and_sun_direction(missions, source):
    context = BeyondContext(**service.beyond_context())
    a, b = context.crossings
    assert missions == [('voyager1', '2012-08-25T12:00:00Z'), ('voyager2', '2018-11-05T12:00:00Z')]
    assert not context.comparison.simultaneous
    assert a.observed.distance_au == 121.6 and b.observed.distance_au == 119.
    assert a.geometry.position == [30., 40., 0.]
    assert a.geometry.distance_au == 50. and b.geometry.distance_au == 100.
    assert a.geometry.sun_direction == [-.6, -.8, 0.]
    assert math.hypot(*b.geometry.sun_direction) == pytest.approx(1.)
    assert all(c.observed.precision == 'day' and c.geometry.quality == 'predicted' for c in (a, b))
    assert all('?date=' in c.mission_url and '?epoch=' not in c.mission_url for c in (a, b))
    assert a.geometry.jd_tdb != b.geometry.jd_tdb


def test_missing_source_preserves_observed_event_without_substitute_position(monkeypatch, source):
    def missing(*args):
        raise EphemerisUnavailableError('/secret/source/pack')
    monkeypatch.setattr(service.mission_exploration, 'mission_state', missing)
    context = service.beyond_context()
    assert all(c['position_status'] == 'unavailable' and c['geometry'] is None for c in context['crossings'])
    assert context['crossings'][0]['observed']['distance_au'] == 121.6
    assert '/secret' not in json.dumps(context)


def test_changed_mission_semantics_require_requalification(monkeypatch, missions, source):
    original = service.mission_exploration.mission_state
    def barycentric(*args):
        return dict(original(*args), origin='ssb')
    monkeypatch.setattr(service.mission_exploration, 'mission_state', barycentric)
    assert all(c['geometry'] is None for c in service.beyond_context()['crossings'])


def test_theory_bounds_model_status_and_source_classes_are_explicit(missions, source):
    context = service.beyond_context()
    assert context['oort']['inner_extent_au'] == [2000., 5000.]
    assert context['oort']['outer_extent_au'] == [10000., 100000.]
    assert context['oort']['evidence_class'] == 'theoretical'
    assert all(c['orbit_status'] == 'not-admitted' for c in context['oort']['comet_examples'])
    assert context['heliosphere']['representation'] == 'illustrative'
    assert context['heliosphere']['scientific_model_status'] == 'not-qualified'
    assert {c['id'] for c in context['heliosphere']['components']} == {'solar-wind', 'termination-shock', 'heliosheath', 'heliopause', 'interstellar-medium'}
    assert context['constants'] == dict(au_km=149597870.7, light_speed_km_s=299792.458, julian_year_days=365.25)


def test_products_preserve_missing_bins_and_variability_not_uncertainty(source):
    angular = ObservationProduct(**service.observation_product('ibex-ena-map'))
    series = ObservationProduct(**service.observation_product('imap-magnetic-field'))
    assert angular.data.flux[0][1] is None and angular.data.mask[0][1]
    assert series.data.value == [3., None]
    assert series.data.count == [120, 0]
    assert series.data.minimum[0] == 2. and series.data.maximum[0] == 4.


@pytest.mark.parametrize('identity', [
    '../manifest', '../../etc/passwd', '/etc/passwd', r'..\manifest',
    '%2e%2e%2fmanifest', 'ibex-ena-map/../manifest', 'ibex-ena-map.json',
    'ibex-ena-map\x00', 'IBEX-ENA-MAP', '', 'unknown',
])
def test_untrusted_product_identity_rejected_before_filesystem_work(monkeypatch, identity):
    def forbidden(*args, **kwargs):
        pytest.fail('Rejected identity must not reach filesystem or cache lookup')
    monkeypatch.setattr(service, 'release_dir', forbidden)
    monkeypatch.setattr(service, '_fingerprint', forbidden)
    monkeypatch.setattr(service, '_read', forbidden)
    monkeypatch.setattr(service, '_product', forbidden)
    with pytest.raises(KeyError, match='Unknown observation product'):
        service.observation_product(identity)


@pytest.mark.parametrize('identity', ['ibex-ena-map', 'imap-magnetic-field'])
def test_accepted_request_selects_literal_path_components(source, monkeypatch, identity):
    class RequestText(str):
        def __add__(self, other):
            pytest.fail('Raw request text must not be concatenated into a path')
    expected = service.observation_product(identity)
    original = service._product
    def inspect(directory, product_id, filename, *fingerprints):
        assert type(product_id) is str and type(filename) is str
        assert product_id == identity and filename == identity + '.json'
        return original(directory, product_id, filename, *fingerprints)
    with monkeypatch.context() as patch:
        patch.setattr(service, '_product', inspect)
        assert service.observation_product(RequestText(identity)) == expected


@pytest.mark.parametrize('mutation', ['mask', 'shape', 'centers', 'nonfinite'])
def test_invalid_angular_data_rejected(products, mutation):
    data = deepcopy(products[0]['data'])
    if mutation == 'mask': data['mask'][0][1] = False
    if mutation == 'shape': data['flux'][1].pop()
    if mutation == 'centers': data['longitude_deg'][1] = data['longitude_deg'][0]
    if mutation == 'nonfinite': data['flux'][0][0] = float('nan')
    with pytest.raises(ValidationError): AngularMap(**data)


@pytest.mark.parametrize('mutation', ['gap', 'time', 'envelope', 'count', 'length'])
def test_invalid_time_series_rejected(products, mutation):
    data = deepcopy(products[1]['data'])
    if mutation == 'gap': data['value'][1] = 0.
    if mutation == 'time': data['time_utc'][1] = data['time_utc'][0]
    if mutation == 'envelope': data['maximum'][0] = 2.5
    if mutation == 'count': data['count'][0] = -1
    if mutation == 'length': data['quality_bitmask'].pop()
    with pytest.raises(ValidationError): TimeSeries(**data)


def test_corruption_after_cache_load_fails_closed(source):
    path, _ = source
    service.observation_product('ibex-ena-map')
    with (path / 'ibex-ena-map.json').open('ab') as stream: stream.write(b' ')
    with pytest.raises(service.ObservationUnavailableError): service.observation_product('ibex-ena-map')
    assert service.observation_catalog()[0]['status'] == 'unavailable'
    assert service.observation_catalog()[1]['status'] == 'qualified'


@pytest.mark.parametrize('mutation', ['filename', 'size', 'hash', 'metadata', 'identity'])
def test_pinned_but_inconsistent_manifest_rejected(source, mutation):
    _, install = source
    def change(manifest):
        entry = manifest['products']['ibex-ena-map']
        if mutation == 'filename': entry['file'] = '../other.json'
        if mutation == 'size': entry['bytes'] = service.MAX_PRODUCT_BYTES + 1
        if mutation == 'hash': entry['sha256'] = '0' * 64
        if mutation == 'metadata': entry['metadata'] = dict(entry['metadata'], frame='wrong')
        if mutation == 'identity': manifest['products']['unknown'] = entry
    install(changes=change)
    with pytest.raises(service.ObservationUnavailableError): service.observation_product('ibex-ena-map')


def test_api_errors_bounded_and_manifest_tampering(missions, source):
    path, _ = source
    app = FastAPI(); app.include_router(router, prefix='/api/v1'); client = TestClient(app)
    assert client.get('/api/v1/solar/beyond/context').status_code == 200
    assert client.get('/api/v1/solar/beyond/observations/unknown').status_code == 404
    assert client.get('/api/v1/solar/beyond/observations/imap-magnetic-field').status_code == 200
    with (path / 'manifest.json').open('ab') as stream: stream.write(b' ')
    response = client.get('/api/v1/solar/beyond/observations/ibex-ena-map')
    assert response.status_code == 503 and str(path) not in response.text
    assert client.get('/api/v1/solar/beyond/context').status_code == 200


def test_product_type_cannot_change_to_unrelated_data(products):
    item = deepcopy(products[0]); item['data'] = products[1]['data']
    with pytest.raises(ValidationError): ObservationProduct(**item)
