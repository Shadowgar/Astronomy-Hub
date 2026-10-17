#!/usr/bin/env python3
"""Add the frame adapter after qualification, without changing vendor source."""
from pathlib import Path
import hashlib,json,shutil,sys
repo=Path(__file__).resolve().parents[2]; app=Path(sys.argv[1])
plugin=app/'src/plugins/orasRuntime';plugin.mkdir(parents=True,exist_ok=True)
(plugin/'index.js').write_bytes((repo/'runtimes/sky-adapter/plugin.js').read_bytes())
(plugin/'satellite-presentation.mjs').write_bytes((repo/'runtimes/sky-adapter/satellite-presentation.mjs').read_bytes())
(plugin/'observer-elevation.mjs').write_bytes((repo/'packages/runtime-protocol/observer-elevation.mjs').read_bytes())
(plugin/'oras-site.json').write_bytes((repo/'frontend/src/config/orasSite.json').read_bytes())
(plugin/'native-wheel.mjs').write_text((repo/'runtimes/sky-adapter/native-wheel.mjs').read_text().replace('../../packages/runtime-protocol/','./'))
(plugin/'continued-input.mjs').write_bytes((repo/'packages/runtime-protocol/continued-input.mjs').read_bytes())
# The Vue wheel adapter needs only the qualified FOV constants. Keep protocol
# validators out of its bundle so Babel does not change qualified vendor chunks.
fov_line=next(line for line in (repo/'packages/runtime-protocol/navigation.mjs').read_text().splitlines() if line.startswith('export const SKY_OUTWARD_FOV='))
(plugin/'navigation.mjs').write_text(fov_line.replace('Object.freeze(', '(')+'\n')
html=app/'public/index.html';text=html.read_text()
marker='<script type="module" src="/runtime-bridge/sky/entry.mjs"></script>'
if marker not in text:text=text.replace('</head>',marker+'\n</head>')
html.write_text(text)

# Small original scene artwork is application content, separate from mounted skydata.
landscape=repo/'runtimes/sky-adapter/assets/pennsylvania-woodland-v1'
manifest=json.loads((landscape/'manifest.json').read_text())
assert hashlib.sha256((landscape/'panorama.png').read_bytes()).hexdigest()==manifest['source']['sha256']
for row in manifest['files']:
 source=landscape/'hips'/row['path']
 assert hashlib.sha256(source.read_bytes()).hexdigest()==row['sha256']
 dest=app/'public/landscapes/pennsylvania-woodland-v1'/row['path']
 dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest)
