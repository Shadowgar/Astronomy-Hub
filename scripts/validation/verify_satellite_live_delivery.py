"""Bind satellite repair source, reproducible UI builds and served preview bytes.

Run --candidate before commit; final invocation binds every changed non-doc file to HEAD.
This verifier does not turn historical motion evidence into current TLE qualification.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/sky-satellite-live'
BASE = '9ee6d85982edb3db276490706a82af83538e5e8d'
URL = 'http://127.0.0.1:4226'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def tree(path):
    return {str(p.relative_to(path)): sha(p.read_bytes()) for p in sorted(path.rglob('*')) if p.is_file()}


def served(path, digest):
    with urlopen(URL + path, timeout=20) as response:
        assert response.status == 200 and sha(response.read()) == digest, path


hub = tree(OUT / 'hub')
assert hub and hub == tree(OUT / 'hub-repeat') == tree(OUT / 'hub-container'), 'Hub builds differ'
sky_repro = json.loads((OUT / 'sky-repro.json').read_text())
assert sky_repro['status'] == 'PASS'
sky_dist = tree(OUT / 'native-default/upstream/apps/web-frontend/dist')
assert sky_dist == sky_repro['sha256'], 'Sky UI repeat changed'
for relative, digest in hub.items():
    served('/' + relative, digest)
lock = json.loads((ROOT / 'integrations/renderers.lock.json').read_text())
base_lock = json.loads(git('show', BASE + ':integrations/renderers.lock.json'))
for row in lock['sky']['artifact_files']:
    served('/oras-sky-engine/' + row['path'], row['sha256'])
for key in ['comparison_anchor', 'native_horizon', 'overlay', 'reconstruction']:
    assert lock['sky'][key] == base_lock['sky'][key], key
base_sky = {r['path']: r['sha256'] for r in base_lock['sky']['artifact_files']}
for path, digest in base_sky.items():
    if (path.startswith('js/') and not Path(path).name.startswith('app.')) or path.startswith('css/chunk-vendors.'):
        assert sha((ROOT / 'frontend/public/oras-sky-engine' / path).read_bytes()) == digest, path
assert lock['earth'] == base_lock['earth'], 'Earth source/artifact changed'

protected = [
    'runtimes/planet-runtime', 'runtimes/earth-runtime', 'frontend/src/features/solar',
    'frontend/src/features/systems', 'frontend/src/features/planet', 'frontend/src/features/earth',
    'backend/app/services/planet_view.py', 'backend/app/services/solar_exploration.py',
    'backend/app/services/planetary_systems.py', 'backend/app/services/satellite_propagation_service.py',
    'backend/app/services/satellite_tle_catalog_service.py', 'backend/app/services/satellite_tle_release_service.py',
    'frontend/src/features/sky-engine/RuntimeHost.tsx', 'packages/runtime-protocol',
    'runtimes/sky-adapter/native-wheel.mjs', 'runtimes/shared', 'vendor', 'integrations/sky-overlay',
    'integrations/sky-patches', 'frontend/public/oras-sky-engine/landscapes',
    'frontend/src/config', 'frontend/package.json', 'frontend/package-lock.json',
    'package.json', 'package-lock.json', 'backend/requirements.txt', 'docker-compose.yml',
    'docs/design/cinematic-references-2026-10-21',
]
assert not git('diff', BASE, '--', *protected).strip(), 'Protected PR95 source changed'
changed = git('diff', BASE, '--name-only').decode().splitlines() + git('ls-files', '--others', '--exclude-standard').decode().splitlines()
sources = {p: sha((ROOT / p).read_bytes()) for p in sorted(set(changed)) if not p.startswith('docs/') and (ROOT / p).is_file()}
candidate = '--candidate' in sys.argv
if not candidate:
    for p, digest in sources.items():
        assert sha(git('show', 'HEAD:' + p)) == digest, 'Uncommitted source: ' + p

containers = {}
for name in ['oras-satellite-live-preview', 'oras-satellite-live-backend']:
    c = json.loads(subprocess.check_output(['docker', 'inspect', name]))[0]
    assert all(not m['RW'] for m in c['Mounts']), 'Expected readonly runtime mounts'
    containers[name] = {'image': c['Image'], 'mounts': [{k: m[k] for k in ['Source', 'Destination', 'RW']} for m in c['Mounts']]}
    if name.endswith('backend'):
        mount = next(m for m in c['Mounts'] if m['Destination'] == '/app/backend')
        assert Path(mount['Source']).resolve() == (ROOT / 'backend').resolve(), 'Backend source mismatch'

result = {'status': 'PASS', 'candidate': candidate, 'head': git('rev-parse', 'HEAD').decode().strip(),
          'base': BASE, 'preview': URL, 'hub_served_files': len(hub), 'sky_served_files': len(lock['sky']['artifact_files']),
          'hub_sha256': hub, 'source_sha256': sources, 'sky_artifact_sha256': lock['sky']['artifact_sha256'],
          'earth_artifact_sha256': lock['earth']['artifact_sha256'], 'protected_identical_to_PR95': protected,
          'containers': containers, 'limits': 'No fresh orbital release, physical-device acceptance or database-byte snapshot. Existing data remains readonly and unpromoted.'}
(OUT / ('delivery-candidate.json' if candidate else 'delivery.json')).write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: v for k, v in result.items() if not isinstance(v, (dict, list))}, indent=2))
