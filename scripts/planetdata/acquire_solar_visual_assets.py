#!/usr/bin/env python3
"""Verify or acquire the pinned Solar v2 NASA visualization assets.

Default is offline verification. --fetch downloads missing assets only, with a
strict byte cap and SHA-256 admission before an atomic write. Existing mismatched
files are rejected, never silently overwritten. No protected runtime pack is used.
The manifest distinguishes source visualization from scientific measurements.
"""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import tempfile
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'frontend/public/solar-assets/v2'


def checked(data, record):
    if len(data) != record['bytes']:
        raise ValueError(f"{record['file']}: byte length mismatch")
    if hashlib.sha256(data).hexdigest() != record['sha256']:
        raise ValueError(f"{record['file']}: SHA-256 mismatch")
    return data


def inspect_glb(data, record):
    if data[:4] != b'glTF' or struct.unpack_from('<II', data, 4) != (2, len(data)):
        raise ValueError('Not the pinned glTF 2 binary')
    length, kind = struct.unpack_from('<II', data, 12)
    if kind != 0x4E4F534A:
        raise ValueError('Missing glTF JSON chunk')
    gltf = json.loads(data[20:20 + length])
    binary_length, binary_kind = struct.unpack_from('<II', data, 20 + length)
    binary = data[28 + length:]
    if binary_kind != 0x004E4942 or len(binary) != binary_length:
        raise ValueError('Missing or incomplete glTF binary chunk')
    if any('uri' in item for item in gltf.get('buffers', []) + gltf.get('images', [])):
        raise ValueError('External resource dependencies are forbidden')
    if gltf['nodes'] != record['nodes']:
        raise ValueError('Source node transforms changed')
    for expected in record['images']:
        actual = gltf['images'][expected['index']]
        view = gltf['bufferViews'][actual['bufferView']]
        start = view.get('byteOffset', 0)
        image = binary[start:start + view['byteLength']]
        if hashlib.sha256(image).hexdigest() != expected['sha256']:
            raise ValueError('Source UV-linked image changed')
        if image[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack_from('>II', image, 16) != (expected['width'], expected['height']):
            raise ValueError('Source image geometry changed')
    for expected in record['meshes']:
        primitive = gltf['meshes'][expected['index']]['primitives'][0]
        attrs = primitive['attributes']
        position = gltf['accessors'][attrs['POSITION']]
        if position['count'] != expected['vertices'] or position['min'] != expected['boundsMin'] or position['max'] != expected['boundsMax']:
            raise ValueError('Source mesh geometry changed')
        if gltf['accessors'][attrs['TEXCOORD_0']]['count'] != expected['vertices']:
            raise ValueError('Source UV count mismatch')
        image_id = gltf['textures'][gltf['materials'][primitive['material']]['pbrMetallicRoughness']['baseColorTexture']['index']]['source']
        if image_id != expected['baseColorImage']:
            raise ValueError('Source UV / image linkage changed')
    return gltf, binary


def atomic_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, delete=False) as temporary:
        staged = Path(temporary.name)
        try:
            temporary.write(data)
            temporary.flush()
            staged.replace(path)
        finally:
            staged.unlink(missing_ok=True)


def run(directory, fetch=False, cache=None):
    manifest = json.loads((ASSETS / 'manifest.json').read_text())
    cap = manifest['delivery']['maximumSingleFileBytes']
    total = 0
    parsed = {}
    for record in manifest['assets']:
        path = directory / record['file']
        if path.exists():
            data = checked(path.read_bytes(), record)
        else:
            cached = cache / record['file'] if cache else None
            if cached and cached.is_file():
                data = checked(cached.read_bytes(), record)
            elif fetch:
                if urllib.parse.urlparse(record['download']).netloc != 'assets.science.nasa.gov':
                    raise ValueError('Source host is outside the admitted NASA resource host')
                with urllib.request.urlopen(record['download'], timeout=45) as response:
                    if urllib.parse.urlparse(response.url).netloc != 'assets.science.nasa.gov':
                        raise ValueError('Source redirected outside the admitted host')
                    data = checked(response.read(cap + 1), record)
            else:
                raise FileNotFoundError(f'{path}; use --fetch to acquire the pinned source')
            if len(data) > cap:
                raise ValueError('Asset exceeds network budget')
            inspect_glb(data, record)
            atomic_write(path, data)
        parsed[record['id']] = inspect_glb(data, record)
        total += len(data)
        print(f"PASS {record['file']}: {len(data)} bytes, {record['sha256']}")
    ring = manifest['ring']
    gltf, binary = parsed['saturn']
    view = gltf['bufferViews'][gltf['images'][ring['imageIndex']]['bufferView']]
    start = view.get('byteOffset', 0)
    original_ring = checked(binary[start:start + view['byteLength']], ring)
    ring_path = directory / ring['file']
    if ring_path.exists():
        checked(ring_path.read_bytes(), ring)
    else:
        atomic_write(ring_path, original_ring)
    total += len(original_ring)
    if total != manifest['delivery']['networkBytes'] or total > manifest['delivery']['maximumPackageBytes']:
        raise ValueError('Package network budget mismatch')
    print(f'PASS original Saturn radial RGBA bytes; package {total} bytes; 7 GLBs + 1 PNG')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch', action='store_true')
    parser.add_argument('--output', type=Path, default=ASSETS)
    parser.add_argument('--cache', type=Path, help='Directory containing pinned original filenames')
    args = parser.parse_args()
    run(args.output, args.fetch, args.cache)
