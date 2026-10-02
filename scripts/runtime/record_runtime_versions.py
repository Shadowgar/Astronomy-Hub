"""Bind Hub metadata to an inspected owned Earth artifact; does not deploy."""
import hashlib
import json
import sys
from pathlib import Path

repo=Path(__file__).resolve().parents[2]
artifact=Path(sys.argv[1]); release=json.loads((artifact/'release.json').read_text())
assert release['owner']=='Astronomy Hub' and release['upstream_sha']=='e7707d9a0f34d9fbffc300023c319f95caa5be30'
for row in release['files']:
    path=artifact/row['path']
    assert path.resolve().is_relative_to(artifact.resolve()) and not path.is_symlink() and path.stat().st_size==row['bytes']
    assert hashlib.sha256(path.read_bytes()).hexdigest()==row['sha256'], row['path']
assert hashlib.sha256(json.dumps(release['files'],separators=(',',':')).encode()).hexdigest()==release['artifact_sha256']
for row in release['inputs']:
    path=repo/row['path'] if row['path'].startswith('packages/runtime-protocol/') else repo/'runtimes/earth-runtime'/row['path']
    assert path.resolve().is_relative_to(repo.resolve())
    assert hashlib.sha256(path.read_bytes()).hexdigest()==row['sha256'], 'Source drift: '+row['path']
expected={row['path'] for row in release['files']}|{'release.json'}
assert {p.relative_to(artifact).as_posix() for p in artifact.rglob('*') if p.is_file()}==expected, 'Unexpected artifact files'
p=repo/'integrations/renderers.lock.json';lock=json.loads(p.read_text())
lock['earth'].update({'runtime_version':'oras-earth.v1','cesium':release['cesium'],'artifact_sha256':release['artifact_sha256'],'public_exports':release['public_exports'],'toolchain_image':'node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8','source_input_sha256':hashlib.sha256(json.dumps(release['inputs'],separators=(',',':')).encode()).hexdigest()})
lock['hub']['version']='phase-c-cesium.v1';p.write_text(json.dumps(lock,indent=2)+'\n')
(repo/'frontend/public/runtime-versions.json').write_text(json.dumps({'hub':lock['hub'],'bridge':lock['bridge'],'sky':{k:v for k,v in lock['sky'].items() if k not in {'overlay','baseline_artifacts','artifact_files'}},'earth':lock['earth']},indent=2)+'\n')
print('VERIFIED ARTIFACT '+release['artifact_sha256'])
