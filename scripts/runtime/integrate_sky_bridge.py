#!/usr/bin/env python3
"""Add the frame adapter after qualification, without changing vendor source."""
from pathlib import Path
import sys
repo=Path(__file__).resolve().parents[2]; app=Path(sys.argv[1])
plugin=app/'src/plugins/orasRuntime';plugin.mkdir(parents=True,exist_ok=True)
(plugin/'index.js').write_bytes((repo/'runtimes/sky-adapter/plugin.js').read_bytes())
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
