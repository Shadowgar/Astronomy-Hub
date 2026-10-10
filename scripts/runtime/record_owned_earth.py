"""Deterministic independently-built artifact and input identity, no data bulk."""
import hashlib
import json
import sys
from pathlib import Path

source, output = map(Path, sys.argv[1:])
repo = Path(__file__).resolve().parents[2]
def files(root, predicate=lambda p: True):
    return [{"path": p.relative_to(root).as_posix(), "bytes": p.stat().st_size, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(root.rglob('*')) if p.is_file() and predicate(p)]
inputs = files(repo / 'runtimes/earth-runtime') + [{**r, 'path': 'packages/runtime-protocol/' + r['path']} for r in files(repo / 'packages/runtime-protocol')]
artifacts = files(output, lambda p: p.name != 'release.json')
digest = hashlib.sha256(json.dumps(artifacts, separators=(',', ':')).encode()).hexdigest()
packages = json.loads((source / 'package-lock.json').read_text())['packages']
release = {'schema': 1, 'owner': 'Astronomy Hub', 'upstream': 'https://github.com/bilawalsidhu/gods-eye-view', 'upstream_sha': 'e7707d9a0f34d9fbffc300023c319f95caa5be30', 'cesium': packages['node_modules/cesium']['version'], 'satellite_js': packages['node_modules/satellite.js']['version'], 'artifact_sha256': digest, 'inputs': inputs, 'files': artifacts, 'public_exports': ['sources/adsb-lol','sources/live','layers/satellites/source','sources/space','sources/regional','layers/earthquakes','layers/perimeters']}
release['public_exports'] += ['layers/flights/records','layers/flights/ingestion','aircraft']
(output / 'release.json').write_text(json.dumps(release, indent=2) + '\n')
print(f"OWNED_EARTH_ARTIFACT {digest} {len(artifacts)} files; Cesium {release['cesium']}")
