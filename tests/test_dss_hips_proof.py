from __future__ import annotations

import json
from pathlib import Path

import pytest

from scripts.skydata.mirror_dss_hips_proof import (
    ConfirmationRequiredError,
    apply_target_tile_overrides,
    build_runtime_properties_text,
    get_target,
    mirror_dss_hips_proof,
    parse_hips_properties,
)
from scripts.skydata.scan_runtime_external_dependencies import scan_runtime_external_dependencies


def test_dry_run_does_not_download(tmp_path: Path) -> None:
    source_root = _write_fake_dss_root(tmp_path)

    report = mirror_dss_hips_proof(
        target='m31',
        source_root=source_root.as_uri(),
        raw_root=tmp_path / 'raw',
        processed_root=tmp_path / 'processed',
        order_max=1,
        radius_deg=0.2,
        sample_step_deg=0.2,
        dry_run=True,
    )

    assert report['downloaded'] is False
    assert not (tmp_path / 'raw').exists()
    assert not (tmp_path / 'processed' / 'runtime-ready').exists()


def test_refuses_network_download_without_confirmation(tmp_path: Path) -> None:
    with pytest.raises(ConfirmationRequiredError):
        mirror_dss_hips_proof(
            target='m31',
            source_root='https://example.invalid/dss',
            raw_root=tmp_path / 'raw',
            processed_root=tmp_path / 'processed',
            dry_run=False,
            confirm_download=False,
        )


def test_manifest_records_target_source_and_tile_count(tmp_path: Path) -> None:
    source_root = _write_fake_dss_root(tmp_path)

    report = mirror_dss_hips_proof(
        target='m31',
        source_root=source_root.as_uri(),
        raw_root=tmp_path / 'raw',
        processed_root=tmp_path / 'processed',
        order_max=1,
        radius_deg=0.2,
        sample_step_deg=0.2,
        dry_run=False,
    )

    manifest_path = Path(report['manifest_path'])
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    assert manifest['target']['key'] == 'm31'
    assert manifest['source_survey']['source_root_url'] == source_root.as_uri()
    assert manifest['tile_count'] > 0
    assert manifest['downloaded'] is True
    assert manifest['byte_count'] > 0


def test_generated_runtime_tree_keeps_scanner_clean(tmp_path: Path) -> None:
    source_root = _write_fake_dss_root(tmp_path)

    report = mirror_dss_hips_proof(
        target='m31',
        source_root=source_root.as_uri(),
        raw_root=tmp_path / 'raw',
        processed_root=tmp_path / 'processed',
        order_max=1,
        radius_deg=0.2,
        sample_step_deg=0.2,
        dry_run=False,
    )

    runtime_ready_root = Path(report['processed_runtime_ready_root'])
    scan_report = scan_runtime_external_dependencies(
        scan_roots=[runtime_ready_root],
        fail_on_runtime_forbidden=True,
    )

    assert scan_report['status'] == 'pass'
    assert scan_report['runtime_forbidden_count'] == 0


def test_runtime_path_plan_does_not_touch_live_stars_tree(tmp_path: Path) -> None:
    source_root = _write_fake_dss_root(tmp_path)

    report = mirror_dss_hips_proof(
        target='m31',
        source_root=source_root.as_uri(),
        raw_root=tmp_path / 'raw',
        processed_root=tmp_path / 'processed',
        order_max=1,
        radius_deg=0.2,
        sample_step_deg=0.2,
        dry_run=False,
    )

    manifest = json.loads(Path(report['manifest_path']).read_text(encoding='utf-8'))
    runtime_paths = manifest['generated_runtime_path_plan']['runtime_relative_paths']
    assert runtime_paths
    assert all(path.startswith('surveys/dss/v1/') for path in runtime_paths)
    assert all('stars/' not in path for path in runtime_paths)


def test_runtime_properties_strip_external_urls() -> None:
    source_properties = parse_hips_properties(
        'obs_title = DSS colored\n'
        'obs_copyright = Digitized Sky Survey - STScI/NASA, Colored & Healpixed by CDS\n'
        'hips_license = ODbL-1.0\n'
        'hips_tile_width = 512\n'
        'hips_tile_format = jpeg\n'
        'hips_frame = equatorial\n'
        'dataproduct_type = image\n'
        'dataproduct_subtype = color\n'
        'creator_did = ivo://CDS/P/DSS2/color\n'
        'hips_release_date = 2019-05-07T10:55Z\n'
    )
    text = build_runtime_properties_text(
        source_properties=source_properties,
        proof_target=get_target('m31'),
        order_min=0,
        order_max=1,
        source_root='https://alasky.cds.unistra.fr/DSS/DSSColor',
    )

    assert 'http://' not in text
    assert 'https://' not in text


def test_m31_tile_overrides_expand_bounded_plan() -> None:
    selected_tiles = {
        0: [0],
        1: [2],
        2: [10],
        3: [40],
        4: [163],
        5: [653],
    }

    apply_target_tile_overrides(selected_tiles, target='m31', order_min=0, order_max=5)

    assert {0, 2, 3, 4}.issubset(set(selected_tiles[0]))
    assert {2, 9, 11, 13, 14, 15, 19}.issubset(set(selected_tiles[1]))
    assert {10, 39, 45, 47, 53, 55, 58, 59, 61, 62, 63, 79}.issubset(set(selected_tiles[2]))
    assert {40, 44, 45, 46, 157, 159, 181, 182, 183, 213, 238, 239, 250, 251, 317, 319}.issubset(set(selected_tiles[3]))
    assert {163, 162, 164, 165, 167, 171, 173, 178, 637, 639, 725, 727, 958, 959, 1002, 1003}.issubset(set(selected_tiles[4]))
    assert {653, 659, 665, 670}.issubset(set(selected_tiles[5]))


def _write_fake_dss_root(tmp_path: Path) -> Path:
    source_root = tmp_path / 'source'
    (source_root / 'Norder0' / 'Dir0').mkdir(parents=True, exist_ok=True)
    (source_root / 'Norder1' / 'Dir0').mkdir(parents=True, exist_ok=True)
    (source_root / 'properties').write_text(
        'obs_title = DSS colored\n'
        'obs_copyright = Digitized Sky Survey - STScI/NASA, Colored & Healpixed by CDS\n'
        'hips_license = ODbL-1.0\n'
        'hips_tile_width = 512\n'
        'hips_tile_format = jpeg\n'
        'hips_frame = equatorial\n'
        'dataproduct_type = image\n'
        'dataproduct_subtype = color\n'
        'creator_did = ivo://CDS/P/DSS2/color\n'
        'hips_release_date = 2019-05-07T10:55Z\n',
        encoding='utf-8',
    )
    for relative_path in (
        'Norder0/Dir0/Npix0.jpg',
        'Norder0/Dir0/Npix2.jpg',
        'Norder0/Dir0/Npix3.jpg',
        'Norder0/Dir0/Npix4.jpg',
        'Norder0/Dir0/Npix1.jpg',
        'Norder1/Dir0/Npix0.jpg',
        'Norder1/Dir0/Npix1.jpg',
        'Norder1/Dir0/Npix2.jpg',
        'Norder1/Dir0/Npix9.jpg',
        'Norder1/Dir0/Npix11.jpg',
        'Norder1/Dir0/Npix13.jpg',
        'Norder1/Dir0/Npix14.jpg',
        'Norder1/Dir0/Npix15.jpg',
        'Norder1/Dir0/Npix19.jpg',
        'Norder1/Dir0/Npix3.jpg',
    ):
        path = source_root / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(b'oras-dss-proof')
    return source_root