"""Rebuild only from this extracted archive, explicit images and fresh dependencies.

Run from an extracted candidate. Output, caches and node_modules start absent.
Does not install/promote rebuilt artifacts into the owner's checkout.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

from package_source import validate, sha, inventory


def rebuild(root, output):
    manifest = json.loads((root / 'source-manifest.json').read_text())
    validate(root, manifest['files'])
    if output.exists() or output.resolve().is_relative_to(root.resolve()):
        raise ValueError('Use a fresh output directory outside the extracted source')
    output.mkdir(parents=True)
    commands = []

    def run(args, name, timeout=900):
        commands.append(args)
        (output / 'commands.json').write_text(json.dumps(commands, indent=2) + '\n')
        with (output / (name + '.log')).open('w') as stream:
            result = subprocess.run(args, stdout=stream, stderr=subprocess.STDOUT, timeout=timeout)
        if result.returncode:
            raise RuntimeError(name + ' failed; see ' + str(output / (name + '.log')))

    hub, native = root / 'hub', root / 'stellarium'
    tool = hub / 'scripts/source-distribution'
    settings = json.loads((tool / 'toolchain.json').read_text())
    downloads = output / 'downloads'
    run([sys.executable, str(tool / 'acquire_toolchain.py'), '--output-dir', str(downloads)], 'acquire', 90)
    image = 'astronomy-hub-source-native:' + manifest['source_revision'][:12]
    run(['docker', 'build', '--no-cache', '--network', 'none', '--platform', 'linux/amd64',
         '-f', str(tool / 'Native.Dockerfile'), '-t', image, str(downloads)], 'native-image', 300)
    run(['docker', 'run', '--rm', '--network', 'none', '--platform', 'linux/amd64',
         '--mount', f'type=bind,src={native},dst=/app', image, '/bin/bash', '-lc',
         settings['native']['build_command']], 'native-build', 600)
    for filename, expected in manifest['expected_native'].items():
        if sha((native / 'build' / filename).read_bytes()) != expected:
            raise ValueError('Rebuilt native output differs: ' + filename)
    app = native / 'apps/web-frontend'
    (app / 'src/assets/js').mkdir(parents=True, exist_ok=True)
    for filename in manifest['expected_native']:
        shutil.copyfile(native / 'build' / filename, app / 'src/assets/js' / filename)
    node_image = settings['node']['image']
    def node(directory, command, name, env):
        args = ['docker', 'run', '--rm', '--platform', 'linux/amd64',
                '--network', 'bridge' if command == 'install' else 'none',
                '--user', str(os.getuid()) + ':' + str(os.getgid()),
                '--mount', f'type=bind,src={root},dst=/source', '-w', '/source/' + directory,
                '-e', 'npm_config_cache=/tmp/npm-cache',
                '-e', 'npm_config_fetch_retries=1', '-e', 'npm_config_fetch_timeout=60000']
        for key, value in env.items():
            args += ['-e', key + '=' + value]
        shell = ('npm ci --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org'
                 if command == 'install' else 'npm run build')
        run(args + [node_image, 'sh', '-c', shell], name, 900)
    for directory in ['stellarium/apps/web-frontend', 'hub/frontend']:
        node(directory, 'install', 'dependencies-sky' if directory.startswith('stellarium') else 'dependencies-hub', {})
    node('stellarium/apps/web-frontend', 'build', 'sky-build', settings['node']['build_environment'])
    dist = app / 'dist'
    expected = [row for row in manifest['expected_sky'] if row['path'] != 'oras-runtime-build.json']
    actual = inventory(dist)
    if {row['path']: row['sha256'] for row in actual} != {row['path']: row['sha256'] for row in expected}:
        (output / 'sky-mismatch.json').write_text(json.dumps(actual, indent=2))
        raise ValueError('Sky output file set or digest differs')
    destination = hub / 'frontend/public/oras-sky-engine'
    shutil.copytree(dist, destination, dirs_exist_ok=True)
    node('hub/frontend', 'build', 'hub-build', {'VITE_SOURCE_REVISION': manifest['source_revision']})
    actual_hub = inventory(hub / 'frontend/dist')
    if {r['path']: r['sha256'] for r in actual_hub} != {r['path']: r['sha256'] for r in manifest['expected_hub']}:
        (output / 'hub-mismatch.json').write_text(json.dumps(actual_hub, indent=2))
        raise ValueError('Hub output file set or digest differs')
    # Every original input must still match after reconstruction. Generated files
    # may now exist, but no source may have been changed by install/build scripts.
    for row in manifest['files']:
        if sha((root / row['path']).read_bytes()) != row['sha256']:
            raise ValueError('Build changed an archived input: ' + row['path'])
    result = {'status': 'PASS', 'source_revision': manifest['source_revision'],
              'native': manifest['expected_native'], 'sky_files': len(actual),
              'hub_files': len(actual_hub), 'input_files_unchanged': len(manifest['files']),
              'node_modules': 'fresh npm ci, lock integrity, no host caches, install scripts disabled',
              'limits': ['No mounted scientific data or existing renderer artifacts used as build inputs.',
                         'Earth/Planet artifacts and external datasets are preserved, not rebuilt here.',
                         'No publication, legal compliance or physical-device qualification.']}
    (output / 'reconstruction.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', required=True, type=lambda p: Path(p).resolve())
    parser.add_argument('--output', required=True, type=lambda p: Path(p).resolve())
    args = parser.parse_args()
    rebuild(args.root, args.output)
