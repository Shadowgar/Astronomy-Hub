"""Create a deterministic source-only candidate; never install or publish it."""
import argparse
import gzip
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import subprocess
import tarfile

ROOT = Path(__file__).resolve().parents[2]
PIN = '023e3b26babf7ffddf45f39293230b14cfe96993'
ROOT_FILES = {'LICENSE', 'THIRD_PARTY_NOTICES.md', 'README.md', 'alembic.ini', 'package.json', 'package-lock.json', '.dockerignore',
              '.gitmodules', 'docker-compose.yml', 'docker-compose.prod.yml'}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def include_hub(name):
    path = PurePosixPath(name)
    # Lock-hashed upstream build configuration, not an owner's environment file.
    if name == 'integrations/sky-overlay/apps/web-frontend/.env.production':
        return True
    if any(p in {'.git', 'node_modules', 'dist', '__pycache__', 'test-results', 'playwright-report'} or p.startswith('.env') for p in path.parts):
        return False
    if name.startswith('frontend/public/oras-sky-engine/'):
        return name.endswith('/oras-runtime-build.json')
    return name in ROOT_FILES or path.parts[0] in {'alembic', 'backend', 'frontend', 'runtimes', 'packages', 'scripts', 'integrations', 'tests'}


def inventory(root):
    rows = []
    for path in sorted(root.rglob('*')):
        if path.is_symlink():
            raise ValueError('Source symlink forbidden: ' + str(path))
        if path.is_file() and path.relative_to(root).as_posix() != 'source-manifest.json':
            data = path.read_bytes()
            rows.append({'path': path.relative_to(root).as_posix(), 'bytes': len(data),
                         'sha256': sha(data), 'executable': bool(path.stat().st_mode & 0o111)})
    return rows


def validate(root, rows):
    if inventory(root) != rows:
        raise ValueError('Source manifest mismatch')


def archive(root, destination):
    with destination.open('wb') as raw, gzip.GzipFile(filename='', fileobj=raw, mode='wb', mtime=0) as zipped:
        with tarfile.open(fileobj=zipped, mode='w') as tar:
            for path in sorted(root.rglob('*')):
                if path.is_symlink():
                    raise ValueError('Source symlink forbidden')
                if not path.is_file():
                    continue
                data = path.read_bytes()
                member = tarfile.TarInfo('astronomy-hub-source/' + path.relative_to(root).as_posix())
                member.size = len(data)
                member.mode = 0o755 if path.stat().st_mode & 0o111 else 0o644
                member.mtime = member.uid = member.gid = 0
                tar.addfile(member, io.BytesIO(data))


def git(repo, *args):
    return subprocess.check_output(['git', '-C', str(repo), *args])


def copy_git(repo, revision, destination, include, paths):
    # Read only committed blobs; do not capture untracked files, credentials or caches.
    with tarfile.open(fileobj=io.BytesIO(git(repo, 'archive', revision, *paths))) as tar:
        for item in tar:
            if not include(item.name):
                continue
            if not item.isfile():
                if item.issym() or item.islnk():
                    raise ValueError('Git source link forbidden: ' + item.name)
                continue
            relative = PurePosixPath(item.name)
            if relative.is_absolute() or '..' in relative.parts:
                raise ValueError('Unsafe source path')
            target = destination / str(relative)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(tar.extractfile(item).read())
            target.chmod(item.mode & 0o777)


def create(args):
    if not (args.expected_hub / 'index.html').is_file():
        raise ValueError('Expected Hub output must be a completed build with index.html')
    revision = git(ROOT, 'rev-parse', args.revision + '^{commit}').decode().strip()
    if revision != args.revision:
        raise ValueError('Use a full immutable source commit SHA')
    if args.output.exists():
        raise ValueError('Choose a fresh output directory; existing output is preserved')
    args.output.mkdir(parents=True)
    stage = args.output / 'source'
    hub, native = stage / 'hub', stage / 'stellarium'
    hub.mkdir(parents=True)
    native.mkdir()
    copy_git(ROOT, revision, hub, include_hub, sorted(ROOT_FILES) +
             ['alembic', 'backend', 'frontend', 'runtimes', 'packages', 'scripts', 'integrations', 'tests'])
    if git(args.upstream_repo, 'rev-parse', 'HEAD').decode().strip() != PIN:
        raise ValueError('Wrong pinned upstream checkout')
    copy_git(args.upstream_repo, PIN, native,
             lambda n: n.startswith(('src/', 'ext_src/', 'tools/', 'data/', 'apps/web-frontend/'))
             or n in {'Makefile', 'SConstruct', 'LICENSE-AGPL-3.0.txt', 'README.md'},
             ['src', 'ext_src', 'tools', 'data', 'apps/web-frontend', 'Makefile', 'SConstruct', 'LICENSE-AGPL-3.0.txt', 'README.md'])
    subprocess.run(['python3', str(hub / 'scripts/runtime/apply_sky_overlay.py'), str(native)], check=True)
    subprocess.run(['patch', '--directory', str(native), '--strip', '1', '--fuzz=0', '--input',
                    str(hub / 'integrations/sky-patches/0001-configurable-zero-horizon.patch')], check=True)
    subprocess.run(['python3', str(hub / 'scripts/runtime/integrate_sky_bridge.py'),
                    str(native / 'apps/web-frontend')], check=True)
    # No generated native JS/WASM or old incremental build/cache state is source.
    for row in inventory(stage):
        if row['path'].endswith(('.wasm', '.sconsign.dblite')) or 'node_modules' in row['path'].split('/'):
            raise ValueError('Generated/cache input in source candidate: ' + row['path'])
    lock = json.loads((hub / 'integrations/renderers.lock.json').read_text())
    expected_hub = inventory(args.expected_hub)
    manifest = {'schema': 1, 'source_revision': revision, 'upstream_revision': PIN,
                'licenses': {'hub': 'hub/LICENSE', 'stellarium': 'stellarium/LICENSE-AGPL-3.0.txt'},
                'excluded': ['mounted scientific catalogs, kernels, imagery and user data',
                             'generated runtimes, node_modules, owner settings, Git metadata and caches',
                             'external Earth SDK source is pinned separately in hub/integrations/renderers.lock.json'],
                'expected_native': lock['sky']['native_horizon']['native_output_sha256'],
                'expected_sky': lock['sky']['artifact_files'], 'expected_hub': expected_hub,
                'files': inventory(stage)}
    (stage / 'source-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    validate(stage, manifest['files'])
    target = args.output / ('astronomy-hub-source-' + revision + '.tar.gz')
    archive(stage, target)
    receipt = {'schema': 1, 'status': 'PREPARED_NOT_PUBLISHED', 'source_revision': revision,
               'archive': {'filename': target.name, 'bytes': target.stat().st_size,
                           'sha256': sha(target.read_bytes())}, 'files': len(manifest['files'])}
    (args.output / 'package.json').write_text(json.dumps(receipt, indent=2) + '\n')
    print(json.dumps(receipt, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--revision', required=True)
    parser.add_argument('--upstream-repo', required=True, type=Path)
    parser.add_argument('--expected-hub', required=True, type=Path)
    parser.add_argument('--output', required=True, type=lambda p: Path(p).resolve())
    create(parser.parse_args())
