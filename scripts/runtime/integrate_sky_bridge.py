#!/usr/bin/env python3
"""Add the frame adapter after qualification, without changing vendor source."""
from pathlib import Path
import sys
repo=Path(__file__).resolve().parents[2]; app=Path(sys.argv[1])
plugin=app/'src/plugins/orasRuntime';plugin.mkdir(parents=True,exist_ok=True)
(plugin/'index.js').write_bytes((repo/'runtimes/sky-adapter/plugin.js').read_bytes())
(plugin/'native-wheel.mjs').write_bytes((repo/'runtimes/sky-adapter/native-wheel.mjs').read_bytes())
html=app/'public/index.html';text=html.read_text()
marker='<script type="module" src="/runtime-bridge/sky/entry.mjs"></script>'
if marker not in text:text=text.replace('</head>',marker+'\n</head>')
html.write_text(text)
