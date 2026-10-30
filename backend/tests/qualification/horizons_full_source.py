"""Explicit full-source qualification; excluded from default test collection by filename.

Run: python -m pytest backend/tests/qualification/horizons_full_source.py -q
The preserved original raw archive is required; no network fallback or silent skip.
"""
from pathlib import Path
import json
import os
import numpy as np
import pytest
from backend.app.services import horizons_systems as service
from scripts.skydata import import_horizons_systems as importer

REPO=Path(__file__).resolve().parents[3]
SOURCES=Path(os.environ.get('ORAS_HORIZONS_QUALIFICATION_SOURCE_DIR',str(REPO/'data/runtime-packs/planetary-systems/source/horizons-oct2026')))
EVIDENCE=Path(os.environ.get('ORAS_HORIZONS_EVIDENCE_DIR',str(REPO/'output/planetary-systems/ps2/science')))

@pytest.fixture(scope='session')
def release(tmp_path_factory):
    if not (SOURCES/'oct2026/manifest.json').is_file():
        pytest.fail('Preserved Horizons qualification source archive is required; see science handoff.')
    path=tmp_path_factory.mktemp('horizons-full-source-release')
    assert importer.build(SOURCES,path)==service.RELEASE_SHA256
    EVIDENCE.mkdir(parents=True,exist_ok=True)
    return path

def test_all_independent_source_midpoints_and_quarters(release):
    pack = service.load_pack(release)
    manifest = json.loads((SOURCES/'oct2026/manifest.json').read_text())
    count = 0
    for meta in manifest['files']:
        if not meta['raw_file'].endswith('-midpoints.json'):
            continue
        source = pack['series'][meta['target_id']]
        rows = importer.parse_response((SOURCES/'oct2026'/meta['raw_file']).read_bytes(), meta)
        for i, row in enumerate(rows):
            jd = source['first_jd_tdb'] + (i+.5)*source['step_seconds']/86400
            position, _ = service.evaluate(source, jd)
            assert np.linalg.norm(position-np.array(row[1:4])) < .1
            count += 1
    assert count == 20832
    for meta in json.loads((SOURCES/'extra/quarter-comparisons.json').read_text()):
        raw = json.loads((SOURCES/'extra'/f"quarter-{meta['target']}.json").read_text())['result']
        rows = importer.parse_csv(raw)
        source = pack['series'][meta['target']]
        for jd,row in zip(meta['jd_tdb'],rows):
            position, _ = service.evaluate(source,jd)
            assert np.linalg.norm(position-np.array(row[1:4])) < .1



def test_browser_millisecond_timestamp_interpolation_stays_under_gate(release):
    """Mirror Date.parse truncation + frontend UTC fraction/TDB tangent duration."""
    pack=service.load_pack(release);ts=service._timescale(str(release))
    manifest=json.loads((SOURCES/'oct2026/manifest.json').read_text())
    max_error=0.;records=[]
    for meta in manifest['files']:
        if not meta['raw_file'].endswith('-midpoints.json'):continue
        row=pack['series'][meta['target_id']];values=row['values'];h=row['step_seconds']
        truths=importer.parse_response((SOURCES/'oct2026'/meta['raw_file']).read_bytes(),meta)
        jds=np.array([row['first_jd_tdb']+i*h/86400 for i in range(len(values))])
        utc=ts.tdb_jd(jds).utc_datetime()
        stamps=np.array([int(t.timestamp()*1000) for t in utc])
        mids=ts.tdb_jd(jds[:-1]+h/172800).utc_datetime()
        midms=np.array([int(t.timestamp()*1000) for t in mids])
        u=((midms-stamps[:-1])/(stamps[1:]-stamps[:-1]))[:,None]
        dt=(np.diff(jds)*86400)[:,None]
        p=(2*u**3-3*u*u+1)*values[:-1,:3]+(u**3-2*u*u+u)*dt*values[:-1,3:]+(-2*u**3+3*u*u)*values[1:,:3]+(u**3-u*u)*dt*values[1:,3:]
        error=float(np.max(np.linalg.norm(p-np.array(truths)[:,1:4],axis=1)))
        assert error<.1
        max_error=max(max_error,error);records.append({'target':meta['target_id'],'max_midpoint_error_km_with_browser_UTC_ms':error})
    (EVIDENCE/'browser-time-qualification.json').write_text(json.dumps({'max_km':max_error,'records':records},indent=2)+'\n')
