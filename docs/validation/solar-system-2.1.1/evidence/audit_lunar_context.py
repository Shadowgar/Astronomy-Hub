#!/usr/bin/env python3
"""Read-only source comparison; deliberately NOT a cross-frame registration.

Run from the repository root. No downloads and no source/geometry modifications.
The root GLB's surface vertices retain original NAC posts at 40 m spacing.
"""
import hashlib
import json
import math
from pathlib import Path
import struct


ROOT = Path(__file__).resolve().parents[4]
PACK = ROOT / 'frontend/public/planet-terrain/apollo17-nac-v1'
manifest = json.loads((PACK / 'manifest.json').read_text())
transform = json.loads((PACK / 'tileset.json').read_text())['root']['transform']
checked = 0
for item in manifest['content']:
    payload = (PACK / item['uri']).read_bytes()
    assert len(payload) == item['bytes']
    assert hashlib.sha256(payload).hexdigest() == item['sha256']
    checked += 1

height_manifest = json.loads((ROOT / 'frontend/public/solar-assets/lunar-height-v1/manifest.json').read_text())
grid = (ROOT / 'frontend/public/solar-assets/lunar-height-v1/ldem_4.img').read_bytes()
assert hashlib.sha256(grid).hexdigest() == height_manifest['files'][0]['sha256']
assert len(grid) == 1440 * 720 * 2


def lola(longitude, latitude):
    x = (longitude % 360) * 4 - 0.5
    y = (90 - latitude) * 4 - 0.5
    x0, y0 = math.floor(x), math.floor(y)
    tx, ty = x - x0, y - y0

    def pixel(column, row):
        assert 0 <= row < 720
        return struct.unpack_from('<h', grid, 2 * (row * 1440 + column % 1440))[0] * 0.5

    north = (1 - tx) * pixel(x0, y0) + tx * pixel(x0 + 1, y0)
    south = (1 - tx) * pixel(x0, y0 + 1) + tx * pixel(x0 + 1, y0 + 1)
    return north * (1 - ty) + south * ty


payload = (PACK / 'tiles/0/0/0.glb').read_bytes()
assert payload[:4] == b'glTF'
json_length = struct.unpack_from('<I', payload, 12)[0]
gltf = json.loads(payload[20:20 + json_length])
binary = payload[28 + json_length:]
accessor = gltf['accessors'][gltf['meshes'][0]['primitives'][0]['attributes']['POSITION']]
assert accessor['componentType'] == 5126 and accessor['type'] == 'VEC3'
view = gltf['bufferViews'][accessor['bufferView']]
offset = view.get('byteOffset', 0) + accessor.get('byteOffset', 0)
assert view.get('byteStride', 12) == 12
count = manifest['content'][0]['surfaceVertices']
assert count == 129 * 129
deltas, edge_deltas = [], []
for index in range(count):
    east, up, minus_north = struct.unpack_from('<fff', binary, offset + index * 12)
    enu = (east, -minus_north, up)
    point = [transform[12 + k] + sum(transform[4 * j + k] * enu[j] for j in range(3)) for k in range(3)]
    radius = math.hypot(*point)
    latitude = math.degrees(math.asin(point[2] / radius))
    longitude = math.degrees(math.atan2(point[1], point[0]))
    delta = lola(longitude, latitude) - (radius - manifest['radiusM'])
    deltas.append(delta)
    if index // 129 in (0, 128) or index % 129 in (0, 128):
        edge_deltas.append(delta)

lat, lon = map(math.radians, [manifest['latitudeDeg'], manifest['longitudeDeg']])
result = {
    'status': 'PASS_READ_ONLY_COMPARISON_NOT_REGISTRATION',
    'comparison': 'LOLA bilinear minus NAC radial height at nominal equal latitude/longitude; no qualified cross-frame transform',
    'verifiedGlbHashes': checked,
    'lolaSha256': hashlib.sha256(grid).hexdigest(),
    'sampledRootVertices': len(deltas),
    'sampledRootEdgeVertices': len(edge_deltas),
    'centerLolaM': lola(manifest['longitudeDeg'], manifest['latitudeDeg']),
    'centerNacM': manifest['centerSurfaceHeightM'],
    'deltaMinM': min(deltas),
    'deltaMaxM': max(deltas),
    'edgeDeltaMinM': min(edge_deltas),
    'edgeDeltaMaxM': max(edge_deltas),
    'rmsM': math.sqrt(sum(value * value for value in deltas) / len(deltas)),
    'nearSideOrthographicMarkerNormalized': {
        'right': math.cos(lat) * math.sin(lon),
        'up': math.sin(lat),
        'towardViewer': math.cos(lat) * math.cos(lon),
    },
    'wacContinuousPixelCenter': {
        'column': (manifest['longitudeDeg'] + 180) * 8 - 0.5,
        'row': (90 - manifest['latitudeDeg']) * 8 - 0.5,
    },
}
print(json.dumps(result, indent=2))
