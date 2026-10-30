"""Offline normalizer for the pinned October 2026 Horizons PS2 release.

Never fetches URLs. Input is the preserved official research bundle. Raw source archives remain outside source control. The small normalized release is
versioned separately, excluded from images and mounted read-only; digests pin its bytes.
"""
import csv
import hashlib
import io
import json
import math
from pathlib import Path
import re
import sys

SOURCE_MANIFEST_SHA256 = '2148f8b649e3429cbe6d3dc63e1cbabd3c2d953c46ca078f25b310f39f0656a7'
RADII_SHA256 = '77eb2d31c4e86d77bcc0be579ae7066216b370b0c7bc787882c6441e7e0b417b'
QUARTER_SHA256 = '397ada161941629dffb039d7b3def18ca92e11a9db642529f772ec340f3165c9'
TARGETS = {'499':'10','599':'10','699':'10','799':'10','899':'10','401':'499','402':'499','501':'599','502':'599','503':'599','504':'599','602':'699','606':'699','701':'799','702':'799','703':'799','704':'799','705':'799','801':'899'}
FIRST, LAST = 2461314.5, 2461345.5


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def checked(path, expected):
    raw = path.read_bytes()
    if digest(raw) != expected:
        raise ValueError(f'Unqualified source digest: {path.name}')
    return json.loads(raw)


def parse_csv(result):
    if result.count('$$SOE') != 1 or result.count('$$EOE') != 1:
        raise ValueError('Missing or ambiguous vector block')
    rows = []
    for row in csv.reader(io.StringIO(result.split('$$SOE')[1].split('$$EOE')[0].strip())):
        if len(row) != 9 or row[-1].strip():
            raise ValueError('Unexpected vector columns')
        values = [float(row[0])] + [float(v) for v in row[2:8]]
        if not all(math.isfinite(v) for v in values):
            raise ValueError('Non-finite vector')
        rows.append(values)
    if len(rows) < 2:
        raise ValueError('Insufficient samples')
    return rows


def parse_response(raw, meta):
    if digest(raw) != meta['sha256'] or len(raw) != meta['bytes']:
        raise ValueError('Response digest/size mismatch')
    data = json.loads(raw)
    if data.get('signature') != {'source':'NASA/JPL Horizons API','version':'1.2'}:
        raise ValueError('Unqualified Horizons response version')
    result = data['result']; header = result.split('$$SOE')[0]
    for line in [meta['target_header'],meta['center_header'],'Reference frame : ICRF','Output units    : KM-S','Output type     : GEOMETRIC cartesian states']:
        if line not in header:
            raise ValueError('Unqualified vector semantics')
    if not re.search(r'JDTDB\s*,',header):
        raise ValueError('Expected TDB epoch column')
    target, center = meta['target_id'], meta['center_id']
    if TARGETS.get(target) != center:
        raise ValueError('Body center differs from admitted identity')
    if not re.search(rf'^Target body name:.*\({target}\)',header,re.M) or not re.search(rf'^Center body name:.*\({center}\)',header,re.M):
        raise ValueError('Header identity mismatch')
    required={'COMMAND':f"'{target}'",'CENTER':f"'500@{center}'",'EPHEM_TYPE':"'VECTORS'",'TIME_TYPE':"'TDB'",'REF_SYSTEM':"'ICRF'",'REF_PLANE':"'FRAME'",'VEC_CORR':"'NONE'",'OUT_UNITS':"'KM-S'",'VEC_TABLE':"'2'"}
    if any(meta['query'].get(k) != v for k,v in required.items()):
        raise ValueError('Request semantic mismatch')
    rows = parse_csv(result)
    if len(rows) != meta['samples']:
        raise ValueError('Unexpected sample count')
    step = meta['step_minutes']*60
    for i,row in enumerate(rows):
        expected = meta['first_jd_tdb'] + i*step/86400
        if abs(row[0]-expected) > 1.1e-9:
            raise ValueError('Unexpected epoch spacing/order')
    if rows[-1][0] != meta['last_jd_tdb']:
        raise ValueError('Coverage end mismatch')
    return rows


def encode(obj):
    return (json.dumps(obj,sort_keys=True,separators=(',',':'),allow_nan=False)+'\n').encode()


def build(source, output):
    source, output = Path(source), Path(output)
    manifest = checked(source/'oct2026/manifest.json',SOURCE_MANIFEST_SHA256)
    radii = checked(source/'physical-radii.json',RADII_SHA256)
    quarters = checked(source/'extra/quarter-comparisons.json',QUARTER_SHA256)
    comparisons = {str(r['target']):r for r in manifest['comparisons']}
    series = {}
    for meta in manifest['files']:
        if meta['raw_file'].endswith('-midpoints.json'):
            continue
        if Path(meta['raw_file']).name != meta['raw_file']:
            raise ValueError('Non-local filename')
        rows = parse_response((source/'oct2026'/meta['raw_file']).read_bytes(),meta)
        if rows[0][0] != FIRST or rows[-1][0] != LAST:
            raise ValueError('Unexpected finite coverage')
        target = meta['target_id']; comparison = comparisons[target]
        error = max(comparison['max_midpoint_error_km'], *next(x['quarter_errors_km'] for x in quarters if x['target']==target))
        if error >= .1:
            raise ValueError('Interpolation admission threshold exceeded')
        step = meta['step_minutes']*60
        series[target] = dict(target_id=target,center_id=meta['center_id'],first_jd_tdb=FIRST,last_jd_tdb=LAST,
            step_seconds=step,values=[r[1:] for r in rows],source_sha256=meta['sha256'],source_url=meta['url'],
            target_header=meta['target_header'],center_header=meta['center_header'],max_position_error_km=error,
            midpoint_comparisons=comparison['check_samples'],quarter_comparisons=2)
    if set(series) != set(TARGETS):
        raise ValueError('Missing or duplicate admitted series')
    pack=dict(schema='oras.horizons-system-pack.v1',series=series,radii=radii,
              first_jd_tdb=FIRST,last_jd_tdb=LAST,frame='ICRF',units='km,km/s',corrections='NONE',time_scale='TDB')
    raw=encode(pack)
    release=dict(schema='oras.horizons-system-release.v1',release='horizons-oct2026',source='NASA/JPL Horizons',
                 source_manifest_sha256=SOURCE_MANIFEST_SHA256,pack_file='pack.json',pack_sha256=digest(raw),pack_bytes=len(raw))
    release_raw=encode(release)
    output.mkdir(parents=True,exist_ok=True)
    # Prepare releases in a staging directory; publish via explicit atomic rename
    # after validation. Never overwrite a mounted/active release in place.
    if any(output.iterdir()):
        raise ValueError('Output directory must be empty')
    (output/'pack.json').write_bytes(raw)
    (output/'manifest.json').write_bytes(release_raw)
    return digest(release_raw)


if __name__=='__main__':
    print(build(*sys.argv[1:]))
