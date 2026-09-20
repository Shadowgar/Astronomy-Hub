#!/usr/bin/env python3
"""Compare mounted canonical science against actual compiled SWE EPHE decoding."""
import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import subprocess
import struct


def verify(metadata, dense, reader):
    manifest=json.loads((metadata/'manifest.json').read_text())
    records=[]
    for pack in manifest['packs']:
        if pack['pack_id']=='stars-core':
            for chunk in pack['chunks']:
                records.extend(json.loads(line) for line in (metadata/chunk['path']).read_text().splitlines())
    supplement=manifest['supplemental_stars']
    data=(metadata/supplement['path']).read_bytes()
    assert hashlib.sha256(data).hexdigest()==supplement['sha256']
    records.extend(json.loads(line) for line in data.splitlines())
    science={}
    for record in records:
        s=record['star_science']
        if s.get('native_tile'):
            science[(s['native_tile']['pix'],s['native_tile']['identity'])]=s
    profile=dense/'profiles/deep-catalog'
    decoded=[]
    for tile in sorted(profile.glob('Norder3/Dir*/Npix*.eph')):
        pix=int(tile.stem[4:])
        output=subprocess.check_output([str(reader.resolve()),str(tile)])
        decoded.extend((pix,json.loads(line)) for line in output.splitlines())
    f32=lambda x:struct.unpack('<f',struct.pack('<f',x))[0]
    epochs=Counter(); gaia_ids=set(); comparisons=0; targets=[]
    for pix,row in decoded:
        identity='HIP '+str(row['hip']) if row['hip'] else 'GAIA '+row['gaia'] if row['gaia']!='0' else next(x for x in row['ids'].split('|') if x.startswith('TYC '))
        s=science[(pix,identity)]
        expected={'epoch':s['coordinate_epoch'],'vmag':s['render_magnitude'], 'bv':s['bv'],
                  'ra':math.radians(s['ra']),'de':math.radians(s['dec']),
                  'plx':None if s['parallax_mas'] is None else s['parallax_mas']/1000,
                  'pra':math.radians((s['proper_motion_ra_mas_per_year'] or 0)/3600000),
                  'pde':math.radians((s['proper_motion_dec_mas_per_year'] or 0)/3600000)}
        for field,value in expected.items():
            assert row[field] == (None if value is None else f32(value)), (identity,field,row[field],value)
            comparisons+=1
        if row['gaia']!='0':
            gaia_ids.add(row['gaia']);epochs[str(row['epoch'])]+=1
        if row['gaia']=='4034171629042489088' or row['hip'] in (32349,25336) or 'TYC 1-1015-1' in row['ids']:
            targets.append({'identity':identity,'science':s,'native':row})
    assert len(decoded)==84129, 'census must match explained corrected count'
    assert len(gaia_ids)==10000 and epochs=={'2000':10000}, epochs
    return {'catalog_version':manifest['release_version'],'dense_version':json.loads((dense/'manifest.json').read_text())['release_version'],
            'native_rows':len(decoded),'scalar_comparisons':comparisons,'gaia_count':len(gaia_ids),'gaia_epochs':dict(epochs),'targets':targets}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--metadata',type=Path,default=Path('data/runtime-packs/catalog-packs'))
    parser.add_argument('--dense',type=Path,default=Path('data/runtime-packs/dense-star-tiles'))
    parser.add_argument('--reader',type=Path,default=Path('output/playwright/star-contract-repair/native-star-reader'))
    parser.add_argument('--output',type=Path,default=Path('output/playwright/star-contract-repair/native-release-science.json'))
    args=parser.parse_args();report=verify(args.metadata,args.dense,args.reader)
    args.output.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='targets'},indent=2))
