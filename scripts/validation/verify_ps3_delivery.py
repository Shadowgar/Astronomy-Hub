"""Bind the PS3 source/build/served bytes and preserved PR92 resources.

--candidate permits uncommitted source during qualification, never in final proof.
Historical browser evidence is not rerun or relabeled by this identity verifier.
"""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/planetary-systems'
R4 = ROOT.parent / 'r4-a-planet-view-1'
BASE = 'c510759ba78c011679c2479a2fa9f48bf260afce'
URL = 'http://127.0.0.1:4225'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def tree(path):
    return {str(p.relative_to(path)): sha(p.read_bytes()) for p in sorted(path.rglob('*')) if p.is_file()}


def served(path, digest):
    with urlopen(URL + path, timeout=20) as response:
        assert response.status == 200
        assert sha(response.read()) == digest, path


hub = tree(OUT / 'hub')
assert hub and hub == tree(OUT / 'hub-repeat') == tree(OUT / 'hub-container'), 'Hub builds differ'
planet = tree(R4 / 'output/r4-a/planet')
assert planet and planet == tree(R4 / 'output/r4-a/planet-repeat'), 'Native repeated builds differ'
for relative, digest in hub.items():
    served('/' + relative, digest)
for relative, digest in planet.items():
    served('/planet-runtime/' + relative, digest)

ledger = json.loads((ROOT / 'runtimes/planet-runtime/moon-source-manifest.json').read_text())
for filename, key in [('moon-wac.png', 'runtime_sha256'), ('WAC_GLOBAL_E000N0000_008P.TIF', 'source_sha256')]:
    assert sha((R4 / 'data/runtime-packs/lunar-surface/release' / filename).read_bytes()) == ledger[key]
    served('/planet-data/' + filename, ledger[key])

protected = ['runtimes/planet-runtime', 'backend/app/services/planet_view.py', 'backend/app/services/solar_exploration.py', 'frontend/src/features/solar/SolarScene.ts', 'runtimes/earth-runtime', 'runtimes/sky-adapter', 'vendor', 'integrations', 'packages/runtime-protocol',
             'frontend/public/oras-sky-engine', 'frontend/public/runtime-versions.json',
             'frontend/src/features/workspace', 'frontend/src/features/runtime',
             'frontend/src/features/solar/assets', 'frontend/src/features/solar/solarMaterials.ts',
             'frontend/src/features/solar/solarPresentation.ts', 'frontend/src/features/solar/solarContracts.ts',
             'frontend/package.json', 'frontend/package-lock.json', 'package.json', 'package-lock.json',
             'backend/requirements.txt', 'docs/design/cinematic-references-2026-10-21']
assert not git('diff', BASE, '--', *protected).strip(), 'Protected PR92 source changed'
earth_path = ROOT.parent / 'cinematic-earth-completion-1/output/earth-sky-completion/earth'
earth = tree(earth_path)
assert earth
for relative, digest in earth.items():
    served('/earth-runtime/' + relative, digest)

lock = json.loads((ROOT / 'integrations/renderers.lock.json').read_text())
for row in lock['sky']['artifact_files']:
    served('/oras-sky-engine/' + row['path'], row['sha256'])
assert subprocess.check_output(['git', '-C', '/var/tmp/oras-cesium/gods-eye', 'rev-parse', 'HEAD'], text=True).strip() == lock['earth']['sha']
assert not subprocess.check_output(['git', '-C', '/var/tmp/oras-cesium/gods-eye', 'status', '--porcelain']).strip()

changed = git('diff', BASE, '--name-only').decode().splitlines() + git('ls-files', '--others', '--exclude-standard').decode().splitlines()
sources = {p: sha((ROOT / p).read_bytes()) for p in sorted(set(changed)) if not p.startswith('docs/') and (ROOT / p).is_file()}
if '--candidate' not in sys.argv:
    for p, digest in sources.items():
        assert sha(git('show', 'HEAD:' + p)) == digest, 'Uncommitted qualified source: ' + p

containers = {}
for name in ['oras-ps3-preview', 'oras-ps2-backend']:
    container = json.loads(subprocess.check_output(['docker', 'inspect', name]))[0]
    assert all(not m['RW'] for m in container['Mounts']), 'Expected readonly runtime mounts'
    containers[name] = {'image': container['Image'], 'mounts': [{k: m[k] for k in ['Source', 'Destination', 'RW']} for m in container['Mounts']]}

assert not git('diff', '26aa6111', '--', 'backend', 'data/runtime-packs/planetary-systems', 'frontend/src/features/systems/SystemScene.ts', 'frontend/src/features/systems/systemMaterials.ts').strip(), 'PS2 science/rendering changed'

pack_dir = ROOT / 'data/runtime-packs/planetary-systems/release'
assert sha((pack_dir / 'manifest.json').read_bytes()) == '770352992eeda04a7005172b2d57d6a3809deaf612f0e16971f74751df2eca61'
assert sha((pack_dir / 'pack.json').read_bytes()) == '27cd2de7e54db3316c84b8f8366dce1f00c2d6f3955f80594c7a65b9a718f40f'
assert 'data/runtime-packs/planetary-systems/' in (ROOT / '.dockerignore').read_text()
assert any(m['Destination'] == '/runtime/oras-planetary-systems' and not m['RW'] for m in containers['oras-ps2-backend']['mounts'])

result = {'status': 'PASS', 'candidate': '--candidate' in sys.argv, 'head': git('rev-parse', 'HEAD').decode().strip(),
          'hub_repeated_and_served_files': len(hub), 'unchanged_native_repeated_and_served_files': len(planet),
          'unchanged_earth_served_files': len(earth), 'unchanged_sky_served_files': len(lock['sky']['artifact_files']),
          'hub_sha256': hub, 'planet_sha256': planet, 'source_sha256': sources,
          'protected_identical_to_PR92': protected, 'containers': containers,
          'limits': 'No database-byte snapshot or physical GPU qualification. Runtime data mounts readonly; no owner volumes altered.'}
(OUT / 'delivery.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: v for k, v in result.items() if not isinstance(v, (dict, list))}, indent=2))
