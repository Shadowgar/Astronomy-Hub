"""One science contract for metadata, native tiles and selected stars."""
import importlib
import importlib.util
import json
import math

import pytest


@pytest.fixture
def science():
    assert importlib.util.find_spec('backend.app.services.star_science'), 'shared star science contract is missing'
    return importlib.import_module('backend.app.services.star_science')


def star(**changes):
    row = dict(catalog='Hipparcos (CDS)', source_id='hip-42', hip_id='42', model='star',
               ra=120.5, dec=-20.0, coordinate_epoch=2000.0, coordinate_frame='ICRS',
               magnitude=0.0, magnitude_band='V')
    row.update(changes)
    return row


@pytest.mark.parametrize('value', [-1.46, 0.0])
def test_zero_and_negative_visual_magnitudes_survive(science, value):
    row = star(); row['magnitude'] = value
    contract = science.normalize_star_science(row)
    assert contract['source_magnitude'] == contract['visual_magnitude'] == contract['render_magnitude'] == value
    assert contract['render_magnitude_band'] == 'V'
    assert contract['visual_magnitude_method'] == 'johnson'
    assert contract['coordinate_epoch'] == 2000.0
    assert contract['native_tile']['identity'] == 'HIP 42'
    json.dumps(contract, allow_nan=False)


@pytest.mark.parametrize('band,extras,method', [
    ('Gaia G', {'gaia_g_mag': 7.1}, 'gaia_g_only'),
    ('Tycho V_T', {'tycho_vt_mag': 7.1}, 'tycho_vt_only'),
])
def test_fallback_never_claims_measured_or_transformed_visual(science, band, extras, method):
    row = star(); row.update(magnitude=7.1, magnitude_band=band, **extras)
    contract = science.normalize_star_science(row)
    assert contract['visual_magnitude'] is None
    assert contract['visual_magnitude_method'] is None
    assert contract['render_magnitude'] == 7.1
    assert contract['render_magnitude_band'] == band
    assert contract['render_magnitude_method'] == method
    assert contract['bv'] is None and contract['bv_method'] is None
    json.dumps(contract, allow_nan=False)


def test_gaia_transformation_preserves_original_band_color_and_large_id(science):
    row = star(); row.update(catalog='Gaia DR3', source_id='5853498713190525696',
                            magnitude=7.1, magnitude_band='Gaia G', gaia_bp_rp=0.82,
                            color_index=0.82, color_index_band='Gaia BP-RP',
                            proper_motion_ra=-15.2, proper_motion_dec=4.1, parallax=12.5,
                            radial_velocity_km_s=22.3, spectral_type='G2V')
    contract = science.normalize_star_science(row)
    assert contract['gaia_id'] == '5853498713190525696'
    assert contract['source_magnitude'] == 7.1
    assert contract['source_magnitude_band'] == 'Gaia G'
    assert contract['color_index_band'] == 'Gaia BP-RP'
    assert contract['visual_magnitude'] == pytest.approx(7.25247013232)
    assert contract['bv'] != 0
    assert contract['proper_motion_ra_mas_per_year'] == -15.2
    assert contract['proper_motion_dec_mas_per_year'] == 4.1
    assert contract['parallax_mas'] == 12.5
    assert contract['radial_velocity_km_s'] == 22.3
    assert contract['spectral_type'] == 'G2V'


@pytest.mark.parametrize('field', ['coordinate_epoch', 'coordinate_frame'])
def test_missing_astrometry_declaration_fails_closed(science, field):
    row = star(); del row[field]
    with pytest.raises(ValueError, match=field):
        science.normalize_star_science(row)


def test_cross_id_reconciliation_shares_science_without_fabricating_motion(science):
    hip = star(proper_motion_ra=99.0, proper_motion_dec=90.0, parallax=22.0)
    hip.update(magnitude=1.0, johnson_bv=0.3, color_index=0.3, color_index_band='Johnson B-V')
    gaia = star(); gaia.update(catalog='Gaia DR3', source_id='5853498713190525696',
                               ra=120.6, dec=-20.1, magnitude=0.9, magnitude_band='Gaia G')
    canonical, stats = science.reconcile_star_records([hip, gaia])
    assert stats['canonical_records'] == 1
    assert canonical[0]['star_science']['proper_motion_ra_mas_per_year'] is None
    enriched = science.attach_canonical_star_science([hip, gaia], canonical)
    left, right = [r['star_science'] for r in enriched]
    for field in ('ra', 'dec', 'coordinate_epoch', 'render_magnitude', 'render_magnitude_band', 'bv', 'native_tile'):
        assert left[field] == right[field]
    assert left['ra'] == 120.6 and left['render_magnitude'] == 1.0
    assert left['source_id'] == 'hip-42'
    assert right['source_id'] == '5853498713190525696'
    assert right['source_magnitude'] == 0.9 and right['source_magnitude_band'] == 'Gaia G'
    assert enriched[0]['ra'] == 120.5  # original source coordinates are retained
    assert enriched[0]['source_star_science']['proper_motion_ra_mas_per_year'] == 99.0


def test_tycho_valid_transform_preserves_bt_vt_color(science):
    row = star(); row.update(magnitude=5.0, magnitude_band='Tycho V_T', tycho_bt_mag=6.0, tycho_vt_mag=5.0)
    contract = science.normalize_star_science(row)
    assert contract['visual_magnitude'] == pytest.approx(4.91)
    assert contract['bv'] == pytest.approx(0.85)
    assert contract['color_index'] == 1.0 and contract['color_index_band'] == 'Tycho B_T-V_T'


def test_nonfinite_optional_values_become_null(science):
    row = star(proper_motion_ra=float('nan'), parallax=float('inf'), johnson_bv=float('nan'))
    contract = science.normalize_star_science(row)
    assert contract['proper_motion_ra_mas_per_year'] is None
    assert contract['parallax_mas'] is None
    assert contract['bv'] is None
    json.dumps(contract, allow_nan=False)


def test_shared_contract_module_exists():
    assert importlib.util.find_spec('backend.app.services.star_science'), 'shared star science contract is missing'


@pytest.mark.parametrize('order', [2, 3, 4])
def test_native_tile_hint_uses_explicit_release_order(science, order):
    contract = science.normalize_star_science(star(), native_tile_order=order)

    assert contract['native_tile'] == {
        'order': order,
        'pix': science.healpix_ang2pix(
            1 << order,
            math.radians(90 - contract['dec']),
            math.radians(contract['ra']),
        ),
        'identity': 'HIP 42',
    }
    science.validate_star_science(contract)


@pytest.mark.parametrize(
    ('row', 'expected_identity'),
    [
        (star(), 'HIP 42'),
        (
            {
                **star(catalog='Gaia DR3', source_id='5853498713190525696'),
                'hip_id': None,
                'gaia_id': '5853498713190525696',
            },
            'GAIA 5853498713190525696',
        ),
        (
            {
                **star(catalog='Tycho-2 (CDS)', source_id='9012-1234-1'),
                'hip_id': None,
                'tycho2_id': '9012-1234-1',
            },
            'TYC 9012-1234-1',
        ),
    ],
)
def test_native_tile_identity_must_match_contract_identity(science, row, expected_identity):
    contract = science.normalize_star_science(row)
    assert contract['native_tile']['identity'] == expected_identity
    science.validate_star_science(contract)

    contract['native_tile']['identity'] = expected_identity + '-wrong'
    with pytest.raises(ValueError, match='identity'):
        science.validate_star_science(contract)


def test_native_tile_hint_is_omitted_without_a_canonical_identity(science):
    row = star(catalog='Unidentified source', source_id='source-42')
    row['hip_id'] = None
    contract = science.normalize_star_science(row)

    assert contract['native_tile'] is None
    science.validate_star_science(contract)

    contract['native_tile'] = {
        'order': 3,
        'pix': science.healpix_ang2pix(8, math.radians(110), math.radians(120.5)),
        'identity': 'HIP 42',
    }
    with pytest.raises(ValueError, match='identity'):
        science.validate_star_science(contract)


@pytest.mark.parametrize('field,value', [('coordinate_epoch', None), ('coordinate_frame', 'FK5'), ('source_id', 5853498713190525696), ('bv', float('nan'))])
def test_invalid_nested_science_is_rejected_before_loading(science, field, value):
    contract = science.normalize_star_science(star())
    contract[field] = value
    validator = getattr(science, 'validate_star_science', None)
    assert validator is not None, 'science contract must be validated on disk and API load'
    with pytest.raises(ValueError):
        validator(contract)


def test_cross_catalog_photometry_identifies_its_actual_source(science):
    hip = star(); hip.update(magnitude=1.0)
    gaia = star(); gaia.update(catalog='Gaia DR3', source_id='5853498713190525696', magnitude=0.9, magnitude_band='Gaia G')
    canonical, _ = science.reconcile_star_records([hip, gaia])
    contract = canonical[0]['star_science']
    assert contract.get('photometry_source_catalog') == 'Hipparcos (CDS)'
    assert contract.get('photometry_source_id') == 'hip-42'


def test_ambiguous_hip_crossmatch_never_discards_a_distinct_gaia_component(science):
    hip = star()
    first = star(); first.update(catalog='Gaia DR3', source_id='5853498713190525696', gaia_id='5853498713190525696')
    second = star(); second.update(catalog='Gaia DR3', source_id='5853498713190525697', gaia_id='5853498713190525697')
    first['aliases'] = second['aliases'] = ['HIP 42']
    canonical, stats = science.reconcile_star_records([hip, first, second])
    assert len(canonical) == 3
    assert stats['ambiguous_cross_id_records'] == 2
    enriched = science.attach_canonical_star_science([hip, first, second], canonical)
    for row in enriched[1:]:
        assert row['star_science']['native_tile']['identity'] == 'GAIA ' + row['source_id']
        assert row['star_science']['hip_id'] is None
        assert row['source_star_science']['hip_id'] == '42'
        assert row['hip_id'] == '42'
    assert enriched[0]['star_science']['native_tile']['identity'] == 'HIP 42'
