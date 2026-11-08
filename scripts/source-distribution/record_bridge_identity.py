"""Record the legal-access external bridge change, preserving all native bytes."""
from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parents[2]
lock_path = root / 'integrations/renderers.lock.json'
marker_path = root / 'frontend/public/oras-sky-engine/oras-runtime-build.json'
versions_path = root / 'frontend/public/runtime-versions.json'
lock, marker, versions = [json.loads(p.read_text()) for p in [lock_path, marker_path, versions_path]]
for row in lock['sky']['artifact_files']:
    if row['path'] != 'oras-runtime-build.json':
        data = (marker_path.parent / row['path']).read_bytes()
        assert hashlib.sha256(data).hexdigest() == row['sha256'], row['path']
digest = hashlib.sha256((root / 'runtimes/sky-adapter/entry.mjs').read_bytes()).hexdigest()
for model in [lock['sky'], marker, versions['sky']]:
    model['bridge_input_sha256']['entry.mjs'] = digest
marker_path.write_text(json.dumps(marker, indent=2) + '\n')
row = next(r for r in lock['sky']['artifact_files'] if r['path'] == 'oras-runtime-build.json')
row.update(bytes=marker_path.stat().st_size, sha256=hashlib.sha256(marker_path.read_bytes()).hexdigest())
lock_path.write_text(json.dumps(lock, indent=2) + '\n')
versions_path.write_text(json.dumps(versions, indent=2) + '\n')
print('Recorded legal bridge identity; all native/application payload files unchanged')
