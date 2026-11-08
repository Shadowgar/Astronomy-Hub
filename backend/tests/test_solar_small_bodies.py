"""Source-backed orbital population, explicit approximation and string identities."""
import json
import os
import shutil
from pathlib import Path
import asyncio
import httpx
import pytest
from backend.app.main import app

SOURCE_DIR=Path(__file__).parents[2]/'docs/validation/solar-system-2/source-data/small-bodies-20261028/receipted'


def test_small_body_route_has_real_catalog_identity_and_model_limits():
    async def request():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),base_url='http://test') as client:
            return await client.get('/api/v1/solar-system/small-bodies')
    response=asyncio.run(request())
    assert response.status_code == 200
    pack=response.json()
    assert pack['schema']=='oras.solar-small-bodies.v1'
    assert pack['frame']=='ECLIPJ2000' and pack['origin']=='Sun center (10)'
    assert pack['population_count']==2048
    assert len(pack['bodies'])==2049
    assert len({r['source_id'] for r in pack['bodies']})==2049
    assert all(isinstance(r['source_id'],str) and r['catalog']=='JPL SBDB' for r in pack['bodies'])
    assert all(r['elements']['epoch_jd_tdb']==2461200.5 for r in pack['bodies'])
    assert pack['model']['kind']=='two-body-osculating'
    assert pack['model']['max_days_from_epoch']==180
    assert pack['model']['population_wide_accuracy_qualified'] is False
    eros=next(r for r in pack['bodies'] if r['designation']=='433')
    assert eros['name']=='433 Eros (A898 PA)' and eros['source_id']=='20000433'
    assert eros['population']=='near-earth-destination'
    assert eros['diameter_km'] > 10
    assert len(pack['qualification']['comparisons'])==16


def test_pinned_pack_contains_reproducible_raw_source_hashes_and_live_acquisition():
    path=Path(__file__).parents[1]/'app/data/solar_small_bodies.json'
    assert path.is_file()
    data=json.loads(path.read_text())
    for source in data['sources']:
        assert source['url'].startswith('https://ssd-api.jpl.nasa.gov/')
        assert len(source['sha256'])==64 and source['bytes']>0
    assert data['qualification']['max_comparison_error_km']<100000


def test_horizons_reference_rejects_wrong_target_units_and_missing_epochs():
    from scripts.skydata import import_solar_small_bodies as importer
    body={'name':'433 Eros (A898 PA)'}
    raw='Target body name: 433 Eros (A898 PA)\nCenter body name: Sun (10)\nReference frame : ICRF\nOutput units    : AU-D\nOutput type     : GEOMETRIC cartesian states\nJDTDB\n$$SOE\n'
    raw+='\n'.join(f'{jd},calendar,1,2,3,0,0,0,' for jd in importer.REFERENCE_JDS)+'\n$$EOE'
    assert len(importer.parse_reference(raw,body))==4
    for changed in [raw.replace('433 Eros','4 Vesta'),raw.replace('AU-D','KM-S'),raw.replace('ICRF','ECLIPJ2000'),raw.replace('GEOMETRIC','APPARENT'),raw.replace('2461341.5','2461342.5')]:
        with pytest.raises(ValueError):importer.parse_reference(changed,body)


def test_rebuild_is_byte_identical_after_source_mtimes_change(tmp_path):
    from scripts.skydata import import_solar_small_bodies as importer
    copied=tmp_path/'copied'
    shutil.copytree(SOURCE_DIR,copied,copy_function=shutil.copyfile)
    first=tmp_path/'first.json';second=tmp_path/'second.json'
    receipt=copied/'acquisition.json'
    first_pack=importer.build(copied,first,receipt)
    assert first_pack['acquired_utc']==json.loads(receipt.read_text())['completed_utc']
    for path in copied.iterdir():os.utime(path,(946684800,946684800))
    importer.build(copied,second,receipt)
    assert first.read_bytes()==second.read_bytes()
    pinned=Path(__file__).parents[1]/'app/data/solar_small_bodies.json'
    assert first.read_bytes()==pinned.read_bytes()


def test_normalization_requires_matching_original_receipt(tmp_path):
    from scripts.skydata import import_solar_small_bodies as importer
    copied=tmp_path/'copied';shutil.copytree(SOURCE_DIR,copied,copy_function=shutil.copyfile)
    output=tmp_path/'output.json';receipt=copied/'acquisition.json'
    with pytest.raises(FileNotFoundError):importer.build(copied,output,copied/'missing.json')
    invalid=json.loads(receipt.read_text());invalid['files']['sbdb-main-belt.json']['sha256']='0'*64
    receipt.write_text(json.dumps(invalid))
    with pytest.raises(ValueError,match='URL/hash/size'):importer.build(copied,output,receipt)
    assert not output.exists()


def test_acquisition_rejects_existing_unreceipted_bytes(tmp_path):
    from scripts.skydata import import_solar_small_bodies as importer
    (tmp_path/'sbdb-main-belt.json').write_bytes(b'preserved unreceipted bytes')
    with pytest.raises(ValueError,match='file times are not evidence'):
        importer.acquire(tmp_path,tmp_path/'acquisition.json')
    assert (tmp_path/'sbdb-main-belt.json').read_bytes()==b'preserved unreceipted bytes'
