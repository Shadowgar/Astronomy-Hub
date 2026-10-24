"""Publish only explicitly passing current browser captures; preserve original PNG bytes."""
from pathlib import Path
import hashlib
import html
import json
import shutil

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/r4-a'
DOC = ROOT / 'docs/validation/r4-a-planet-view'
proof = json.loads((OUT / 'browser/proof.json').read_text())
assert proof['status'] == 'PASS'
for path, digest in proof['source_sha256'].items():
    assert hashlib.sha256((ROOT / path).read_bytes()).hexdigest() == digest, path

(DOC / 'screenshots').mkdir(parents=True, exist_ok=True)
rows, manifest = [], {}
for run in proof['runs']:
    assert run['status'] == 'PASS'
    for filename in run['screenshots']:
        source = OUT / 'browser' / filename
        shutil.copyfile(source, DOC / 'screenshots' / filename)
        manifest[filename] = hashlib.sha256(source.read_bytes()).hexdigest()
        rows.append(f'<figure><a href="browser/{html.escape(filename)}"><img loading="lazy" src="browser/{html.escape(filename)}" alt="Actual {run["width"]} by {run["height"]} {html.escape(filename)}"></a><figcaption>{html.escape(filename)} — actual Chromium capture</figcaption></figure>')
page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>R4-A Moon qualification</title><style>body{background:#080e16;color:#e3edf8;font:16px system-ui;margin:2rem auto;max-width:1200px;padding:0 1rem}a{color:#a9dfff}figure{margin:2rem 0}img{display:block;max-width:100%;max-height:850px;border:1px solid #596979}figcaption,p{line-height:1.6}</style><h1>R4-A · source-qualified Moon globe</h1><p>Draft review only. Historical coarse LROC morphology, no terrain. Software Chromium and emulated mobile; owner visual/device acceptance pending.</p><p><a href="/solar-system?date=2026-10-23T01:05:00Z">Open Solar System → Moon</a> · <a href="delivery.json">Build/served identities</a> · <a href="browser/proof.json">16-group browser proof</a> · <a href="recovery-final/proof.json">Recovery/Sky return</a> · <a href="earth-return/proof.json">Earth return</a> · <a href="rendering/raster.json">Illumination pixel evidence</a></p>'''
(OUT / 'gallery.html').write_text(page + '\n'.join(rows) + '</html>')
(DOC / 'screenshots/sha256.json').write_text(json.dumps({'source_sha256': proof['source_sha256'], 'screenshots': manifest}, indent=2) + '\n')
print(f'PASS: {len(manifest)} original actual-browser PNGs copied without modification; source identities matched.')
