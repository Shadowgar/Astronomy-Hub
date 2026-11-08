#!/usr/bin/env python3
"""Assemble the private owner gallery from actual captures, preserving original bytes."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--captures', default='output/playwright/solar2/final')
parser.add_argument('--journeys', default='output/playwright/solar2/final-journeys')
parser.add_argument('--out', default='output/playwright/owner-acceptance/solar-system-2')
args = parser.parse_args()
out, captures, journeys = (ROOT / value for value in (args.out, args.captures, args.journeys))
proof = json.loads((journeys / 'proof.json').read_text())
assert all(run['status'] == 'PASS' for run in proof['runs']), 'Only completed passing journeys qualify the gallery'
fixed = json.loads((captures / 'captures.json').read_text())
assert all(not run['errors'] for run in fixed['runs'])
manifest = json.loads((ROOT / 'docs/design/cinematic-references-2026-10-21/manifest.json').read_text())
files = []
def copy(source, name):
    raw = source.read_bytes()
    target = out / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
    files.append({'file': name, 'source': str(source.relative_to(ROOT)), 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()})

for layout in ('desktop', 'portrait', 'landscape'):
    for scene in ('overview', 'saturn', 'earth', 'mars'):
        name = f'{layout}-{scene}.png'
        copy(ROOT / 'output/playwright/solar2/before' / name, 'before/' + name)
        copy(captures / name, 'after/' + name)
for name, record in manifest['includes'].items():
    source = ROOT / 'docs/design/cinematic-references-2026-10-21' / name
    assert hashlib.sha256(source.read_bytes()).hexdigest() == record['sha256']
    copy(source, 'reference/' + name)
for scene in ('saturn-oblique', 'saturn-backlit', 'eros', 'saturn-system'):
    copy(journeys / f'desktop-{scene}.png', f'detail/desktop-{scene}.png')
for run in proof['runs']:
    copy(journeys / 'video' / run['video'], 'video/' + run['name'] + '.webm')
copy(ROOT / 'docs/validation/solar-system-2/gallery/index.html', 'index.html')
receipt = {'qualification': 'Private Windows/browser engineering evidence; owner acceptance and physical iPhone unverified', 'fixed_epoch': fixed['epoch'], 'platform': proof['platform'], 'captures': fixed['runs'], 'journey_checks': [{'layout': r['name'], 'status': r['status'], 'checks': r['checks'], 'errors': r['errors']} for r in proof['runs']], 'files': files}
(out / 'receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(f'PASS: {len(files)} original-byte files copied; all3 journeys PASS; all4 approved originals exact')
