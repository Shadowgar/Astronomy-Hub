"""Bind Hub metadata to an inspected owned Earth artifact; does not deploy."""
import hashlib
import json
import sys
from pathlib import Path
from earth_artifact import verify

repo=Path(__file__).resolve().parents[2]
artifact=Path(sys.argv[1]); release=verify(artifact, repo)
assert release['owner']=='Astronomy Hub' and release['upstream_sha']=='e7707d9a0f34d9fbffc300023c319f95caa5be30'
p=repo/'integrations/renderers.lock.json';lock=json.loads(p.read_text())
lock['earth'].update({'runtime_version':'oras-earth.v1','cesium':release['cesium'],'artifact_sha256':release['artifact_sha256'],'public_exports':release['public_exports'],'toolchain_image':'node:24.14.0-bookworm-slim@sha256:d8e448a56fc63242f70026718378bd4b00f8c82e78d20eefb199224a4d8e33d8','source_input_sha256':hashlib.sha256(json.dumps(release['inputs'],separators=(',',':')).encode()).hexdigest()})
lock['hub']['version']='phase-c-cesium.v1';p.write_text(json.dumps(lock,indent=2)+'\n')
(repo/'frontend/public/runtime-versions.json').write_text(json.dumps({'hub':lock['hub'],'bridge':lock['bridge'],'sky':{k:v for k,v in lock['sky'].items() if k not in {'overlay','baseline_artifacts','artifact_files'}},'earth':lock['earth']},indent=2)+'\n')
print('VERIFIED ARTIFACT '+release['artifact_sha256'])
