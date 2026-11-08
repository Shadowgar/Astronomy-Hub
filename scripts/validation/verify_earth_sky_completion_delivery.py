"""Verify the combined preview against source and repeated build bytes."""
import hashlib
import json
from pathlib import Path
import subprocess
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/earth-sky-completion'
BASE = 'http://127.0.0.1:4220'
def sha(data):
    return hashlib.sha256(data).hexdigest()
def files(path):
    return {p.relative_to(path).as_posix(): sha(p.read_bytes()) for p in path.rglob('*') if p.is_file()}
def served(path, expected):
    with urllib.request.urlopen(BASE + path, timeout=20) as response:
        assert response.status == 200
        assert sha(response.read()) == expected, path

lock = json.loads((ROOT / 'integrations/renderers.lock.json').read_text())
marker = json.loads((ROOT / 'frontend/public/oras-sky-engine/oras-runtime-build.json').read_text())
assert marker['adapter_sha256'] == sha((ROOT / 'runtimes/sky-adapter/plugin.js').read_bytes())
assert marker['artifact_sha256'] == lock['sky']['artifact_sha256']
ui = files(OUT / 'sky-ui/apps/web-frontend/dist')
repeat = files(OUT / 'sky-repeat/apps/web-frontend/dist')
assert ui == repeat
for row in lock['sky']['artifact_files']:
    relative = '/oras-sky-engine/' + row['path']
    assert sha((ROOT / 'frontend/public' / relative.lstrip('/')).read_bytes()) == row['sha256']
    served(relative, row['sha256'])
hub = files(OUT / 'hub')
assert hub == files(OUT / 'hub-repeat')
for relative, digest in hub.items():
    served('/' + relative, digest)
earth = files(ROOT.parent / 'cinematic-earth-completion-1/output/earth-sky-completion/earth')
for relative, digest in earth.items():
    served('/earth-runtime/' + relative, digest)
protected = ['frontend/src/features/solar', 'backend/app', 'scripts/skydata',
             'runtimes/sky-adapter/assets', 'runtimes/sky-adapter/native-wheel.mjs',
             'runtimes/sky-adapter/satellite-presentation.mjs',
             'runtimes/earth-runtime/core/CameraController.mjs',
             'docs/design/cinematic-references-2026-10-21']
assert not subprocess.check_output(['git', 'diff', '89491f72', '--', *protected], cwd=ROOT)
changed = subprocess.check_output(['git', 'diff', '--name-only', '94f98598'], cwd=ROOT, text=True).splitlines()
changed += subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], cwd=ROOT, text=True).splitlines()
source_hashes = {p: sha((ROOT / p).read_bytes()) for p in sorted(set(changed)) if not p.startswith('docs/') and (ROOT / p).is_file()}
result = {'status': 'PASS', 'sky_artifact': marker['artifact_sha256'],
          'sky_repeated_files': len(ui), 'sky_served_files': len(lock['sky']['artifact_files']),
          'hub_repeated_and_served_files': len(hub), 'earth_served_files': len(earth),
          'protected_identical_to_89491f72': protected, 'source_sha256': source_hashes,
          'sky_payload_sha256': ui, 'hub_payload_sha256': hub,
          'data_limit': 'Source/assets verified. No database-byte snapshot or owner GPU qualification claimed.'}
(OUT / 'delivery.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k:v for k,v in result.items() if not isinstance(v, (dict,list))}, indent=2))
