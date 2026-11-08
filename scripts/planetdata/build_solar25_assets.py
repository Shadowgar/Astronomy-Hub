#!/usr/bin/env python3
"""Copy pinned NASA spacecraft GLBs without changing geometry or materials.

Offline by default. --fetch downloads only the three individually pinned models.
Originals stay in an ignored cache. Physical visualization scale is explicitly
normalized to an independently documented antenna diameter, not inferred from
an undocumented exporter unit. No spacecraft attitude is manufactured here.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'output/playwright/solar-system-2.5/assets/source-cache'
OUTPUT = ROOT / 'frontend/public/mission-assets/v2.5'
RECORDS = ROOT / 'docs/validation/solar-system-2.5/asset-source-records.json'
BASE = '/mission-assets/v2.5/'
SINGLE_CAP = 64 * 1024**2
RAW_CAP = 256 * 1024**2
PACK_CAP = 96 * 1024**2
NASA_TERMS = 'https://www.nasa.gov/nasa-brand-center/images-and-media/'
MODEL_REFERENCES = {
    'voyager': {'node': 1, 'nodeName': 'tex_02_AO', 'diameterMeters': 3.7,
                'source': 'voyager-dimensions', 'missions': ['voyager1', 'voyager2'],
                'label': 'Voyager twin spacecraft reference model'},
    'cassini': {'node': 3, 'nodeName': 'dish', 'diameterMeters': 4.0,
                'source': 'cassini-dimensions', 'missions': ['cassini'],
                'label': 'Cassini–Huygens reference model; attached probe configuration is illustrative'},
    'new-horizons': {'node': 1, 'nodeName': 'AO_dish', 'diameterMeters': 2.1,
                     'source': 'new-horizons-dimensions', 'missions': ['newhorizons'],
                     'label': 'New Horizons spacecraft reference model'},
}
COMPONENTS = {5120: ('b', 1), 5121: ('B', 1), 5122: ('h', 2),
              5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
WIDTHS = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}
IDENTITY = [[float(i == j) for j in range(4)] for i in range(4)]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def verify_source(data, record):
    require(len(data) == record['bytes'] and len(data) <= SINGLE_CAP,
            f"Size mismatch: {record['id']}")
    require(digest(data) == record['sha256'], f"SHA256 mismatch: {record['id']}")


def acquire(record, cache, fetch):
    require(0 < record['bytes'] <= SINGLE_CAP, 'Source exceeds individual acquisition cap')
    path = cache / record['file']
    require(path.parent == cache, 'Source cache path must be a basename')
    if path.exists():
        data = path.read_bytes()
        verify_source(data, record)
        return data
    require(fetch, f'Missing pinned source: {path}; explicit --fetch required')
    url = record['download']
    parts = urllib.parse.urlsplit(url)
    require(parts.scheme == 'https' and parts.hostname == 'assets.science.nasa.gov'
            and parts.path.startswith('/content/dam/science/psd/solar/2023/09/'),
            'Unapproved source URL')
    with urllib.request.urlopen(url, timeout=45) as response:
        require(response.status == 200, 'Source download failed')
        require(response.geturl() == url, 'Source redirect requires requalification')
        if response.headers.get('Content-Length'):
            require(int(response.headers['Content-Length']) == record['bytes'],
                    'Changed source Content-Length')
        data = response.read(record['bytes'] + 1)
    verify_source(data, record)
    cache.mkdir(parents=True, exist_ok=True)
    with path.open('xb') as stream:
        stream.write(data)
    return data


def parse_glb(data):
    require(len(data) >= 28, 'Truncated GLB')
    magic, version, length = struct.unpack_from('<4sII', data)
    require(magic == b'glTF' and version == 2 and length == len(data), 'Invalid GLB header')
    json_len, json_type = struct.unpack_from('<II', data, 12)
    require(json_type == 0x4e4f534a and 20 + json_len + 8 <= len(data), 'Invalid GLB JSON')
    document = json.loads(data[20:20 + json_len])
    binary_len, binary_type = struct.unpack_from('<II', data, 20 + json_len)
    require(binary_type == 0x004e4942 and 28 + json_len + binary_len == len(data),
            'Invalid GLB binary chunk')
    binary = data[28 + json_len:]
    require(document['asset']['version'] == '2.0', 'Unsupported glTF version')
    require(not document.get('extensionsUsed') and not document.get('extensionsRequired'),
            'Unqualified glTF extension')
    require(not document.get('skins') and not document.get('animations'),
            'Static spacecraft source expected')
    require(len(document['buffers']) == 1 and 'uri' not in document['buffers'][0],
            'External buffer is forbidden')
    declared = document['buffers'][0]['byteLength']
    require(declared <= len(binary) <= declared + 3, 'Invalid GLB buffer size')
    for view in document['bufferViews']:
        require(view.get('buffer', 0) == 0 and view.get('byteOffset', 0) >= 0
                and view['byteLength'] > 0
                and view.get('byteOffset', 0) + view['byteLength'] <= declared,
                'Invalid buffer view')
    for image in document.get('images', []):
        require('uri' not in image and 'bufferView' in image, 'External image is forbidden')
    return document, binary


def accessor(document, binary, index):
    info = document['accessors'][index]
    require('sparse' not in info and not info.get('normalized'), 'Unqualified accessor')
    require(info['componentType'] in COMPONENTS and info['type'] in WIDTHS,
            'Unsupported accessor layout')
    fmt, size = COMPONENTS[info['componentType']]
    count, width = info['count'], WIDTHS[info['type']]
    view = document['bufferViews'][info['bufferView']]
    stride = view.get('byteStride', width * size)
    offset = info.get('byteOffset', 0)
    require(count > 0 and stride >= width * size and offset >= 0
            and offset + (count - 1) * stride + width * size <= view['byteLength'],
            'Accessor exceeds buffer view')
    start = view.get('byteOffset', 0) + offset
    values = [struct.unpack_from('<' + fmt * width, binary, start + i * stride)
              for i in range(count)]
    require(all(math.isfinite(value) for row in values for value in row), 'Non-finite geometry')
    return values


def multiply(left, right):
    return [[sum(left[i][k] * right[k][j] for k in range(4)) for j in range(4)]
            for i in range(4)]


def node_matrix(node):
    if 'matrix' in node:
        require(not any(key in node for key in ('translation', 'rotation', 'scale')),
                'Matrix and TRS conflict')
        return [[node['matrix'][j * 4 + i] for j in range(4)] for i in range(4)]
    x, y, z, w = node.get('rotation', [0, 0, 0, 1])
    require(abs(x*x + y*y + z*z + w*w - 1) < 1e-5, 'Non-unit quaternion')
    sx, sy, sz = node.get('scale', [1, 1, 1])
    tx, ty, tz = node.get('translation', [0, 0, 0])
    return [
        [(1-2*y*y-2*z*z)*sx, (2*x*y-2*z*w)*sy, (2*x*z+2*y*w)*sz, tx],
        [(2*x*y+2*z*w)*sx, (1-2*x*x-2*z*z)*sy, (2*y*z-2*x*w)*sz, ty],
        [(2*x*z-2*y*w)*sx, (2*y*z+2*x*w)*sy, (1-2*x*x-2*y*y)*sz, tz],
        [0, 0, 0, 1],
    ]


def transform(matrix, point):
    return tuple(sum(matrix[i][j] * point[j] for j in range(3)) + matrix[i][3]
                 for i in range(3))


def inspect_model(data, reference):
    document, binary = parse_glb(data)
    all_points, reference_points, visited = [], [], set()
    triangles = vertices = geometry_bytes = 0

    def visit(index, parent):
        nonlocal triangles, vertices, geometry_bytes
        require(index not in visited, 'Repeated/cyclic scene node')
        visited.add(index)
        node = document['nodes'][index]
        world = multiply(parent, node_matrix(node))
        require(all(math.isfinite(value) for row in world for value in row),
                'Non-finite node transform')
        if 'mesh' in node:
            for primitive in document['meshes'][node['mesh']]['primitives']:
                require(primitive.get('mode', 4) == 4, 'Non-triangle geometry')
                pos_index = primitive['attributes']['POSITION']
                require(document['accessors'][pos_index]['type'] == 'VEC3'
                        and document['accessors'][pos_index]['componentType'] == 5126,
                        'Expected float32 position triples')
                positions = accessor(document, binary, pos_index)
                for attribute in primitive['attributes'].values():
                    rows = accessor(document, binary, attribute)
                    require(len(rows) == len(positions), 'Attribute length mismatch')
                    a = document['accessors'][attribute]
                    geometry_bytes += a['count'] * WIDTHS[a['type']] * COMPONENTS[a['componentType']][1]
                indices = accessor(document, binary, primitive['indices'])
                require(len(indices) % 3 == 0 and all(0 <= row[0] < len(positions) for row in indices),
                        'Triangle index out of range')
                a = document['accessors'][primitive['indices']]
                geometry_bytes += len(indices) * COMPONENTS[a['componentType']][1]
                triangles += len(indices) // 3
                vertices += len(positions)
                points = [transform(world, point) for point in positions]
                all_points.extend(points)
                if index == reference['node']:
                    require(node['name'] == reference['nodeName'], 'Antenna reference node changed')
                    reference_points.extend(points)
        for child in node.get('children', []):
            visit(child, world)

    for root in document['scenes'][document.get('scene', 0)]['nodes']:
        visit(root, IDENTITY)
    require(len(visited) == len(document['nodes']), 'Unqualified unused scene nodes')
    require(reference_points and all_points, 'Missing antenna or spacecraft geometry')
    lower = [min(p[i] for p in all_points) for i in range(3)]
    upper = [max(p[i] for p in all_points) for i in range(3)]
    center = [(lo + hi) / 2 for lo, hi in zip(lower, upper)]
    antenna_spans = [max(p[i] for p in reference_points) - min(p[i] for p in reference_points)
                     for i in (0, 2)]
    require(min(antenna_spans) > 0 and max(antenna_spans) / min(antenna_spans) < 1.01,
            'Antenna circular span no longer qualified')
    span = max(antenna_spans)
    scale = reference['diameterMeters'] / span
    radius = max(math.dist(point, center) for point in all_points) * scale
    images, texture_bytes = [], 0
    for image in document.get('images', []):
        view = document['bufferViews'][image['bufferView']]
        start = view.get('byteOffset', 0)
        payload = binary[start:start + view['byteLength']]
        require(image['mimeType'] == 'image/png' and payload[:8] == b'\x89PNG\r\n\x1a\n',
                'Unqualified texture format')
        width, height = struct.unpack_from('>II', payload, 16)
        require(0 < width <= 4096 and 0 < height <= 4096, 'Texture dimension limit')
        images.append({'name': image.get('name'), 'width': width, 'height': height,
                       'sha256': digest(payload)})
        while True:
            texture_bytes += width * height * 4
            if width == height == 1:
                break
            width, height = max(1, width // 2), max(1, height // 2)
    return {
        'metersPerSourceUnit': scale, 'sourceBounds': {'min': lower, 'max': upper},
        'centerSource': center,
        'boundsMeters': {'min': [v * scale for v in lower], 'max': [v * scale for v in upper]},
        'radiusMeters': radius, 'referenceSourceSpan': span,
        'stats': {'nodes': len(visited), 'meshes': len(document['meshes']),
                  'primitives': sum(len(m['primitives']) for m in document['meshes']),
                  'materials': len(document['materials']), 'vertices': vertices,
                  'triangles': triangles, 'textures': images,
                  'geometryBytesEstimate': geometry_bytes,
                  'rgba8MipTextureBytesEstimate': texture_bytes,
                  'gpuEstimateNote': 'Geometry plus separate RGBA8 texture mip chains; excludes renderer overhead, render targets and driver allocation.'},
    }


def write_once(path, data):
    if path.exists():
        require(path.read_bytes() == data, f'Refusing to overwrite different asset: {path}')
    else:
        with path.open('xb') as stream:
            stream.write(data)


def build(cache=CACHE, output=OUTPUT, fetch=False):
    records = json.loads(RECORDS.read_text())
    require({row['id'] for row in records['models']} == set(MODEL_REFERENCES),
            'Unqualified source set')
    require(records['rawModelBytes'] == sum(row['bytes'] for row in records['models']),
            'Raw source accounting mismatch')
    require(records['documentBytes'] == sum(row['bytes'] for row in records['documents']),
            'Document accounting mismatch')
    raw_bytes = records['rawModelBytes'] + records['documentBytes']
    require(raw_bytes <= RAW_CAP, 'Aggregate acquisition cap exceeded')
    documents = {row['id']: row for row in records['documents']}
    models, missions, staged = {}, {}, {}
    for record in records['models']:
        key = record['id']
        reference = MODEL_REFERENCES[key]
        data = acquire(record, cache, fetch)
        inspected = inspect_model(data, reference)
        span = inspected.pop('referenceSourceSpan')
        models[key] = {
            'id': key, 'modelUrl': BASE + key + '.glb', 'bytes': len(data), 'sha256': digest(data),
            **inspected,
            'centerMeaning': 'Geometric bounding-box center for camera framing, not a qualified center of mass or navigation reference point.',
            'sourcePreservation': 'Byte-identical NASA GLB; all node transforms, vertices, indices, UVs, normals, material parameters and embedded texture bytes retained.',
            'scale': {'status': 'reference-normalized-approximate',
                      'reference': 'High-gain antenna diameter',
                      'referenceMeters': reference['diameterMeters'], 'referenceSourceSpan': span,
                      'referenceNode': reference['node'], 'referenceNodeName': reference['nodeName'],
                      'measurement': 'Maximum source-world X/Z span of the complete antenna mesh; one uniform root scale.',
                      'sourceUnitStatus': 'Exporter unit not independently documented; glTF nominal metres are not assumed physically calibrated.',
                      'accuracy': 'Approximate educational visualization; rounded independent antenna dimension, not engineering CAD or metrology.'},
            'attitude': {'status': 'illustrative-inspection',
                         'label': 'Illustrative inspection pose — historical attitude unavailable',
                         'sourceAxis': 'glTF right-handed +Y-up scene; antenna reference lies in the X/Z plane. No spacecraft frame transform is qualified.',
                         'kernelsQualified': [], 'velocityDerived': False},
            'configuration': {'label': reference['label'], 'epochQualified': False,
                              'note': 'Static source geometry; no historical articulation, deployment, pointing or probe-separation state is asserted.'},
            'sources': {'model': record, 'dimension': documents[reference['source']],
                        'rights': documents['nasa-media-terms']},
            'rights': {'status': 'qualified-for-informational-visualization',
                       'credit': 'NASA Visualization Technology Applications and Development (VTAD)',
                       'termsUrl': NASA_TERMS,
                       'basis': 'Each linked NASA resource credits VTAD. Inspected GLB asset metadata has no third-party copyright notice; the NASA media policy expressly covers polygon and texture data.',
                       'limitations': 'Retain attribution. No endorsement or NASA insignia rights are granted. This asset-specific finding does not apply to other NASA-hosted third-party material.'},
        }
        for mission in reference['missions']:
            missions[mission] = key
        staged[key + '.glb'] = data
    manifest = {'schema': 'astronomy-hub.mission-assets.v1', 'version': '2.5',
                'missions': missions, 'models': models,
                'delivery': {'modelBytes': sum(map(len, staged.values())),
                             'rawSourceBytes': raw_bytes, 'singleFileCapBytes': SINGLE_CAP,
                             'aggregateAcquisitionCapBytes': RAW_CAP, 'runtimePackCapBytes': PACK_CAP,
                             'loading': 'On demand for the selected spacecraft; dispose geometry, materials and textures on renderer exit.'}}
    staged['manifest.json'] = (json.dumps(manifest, indent=2, ensure_ascii=False) + '\n').encode()
    require(sum(map(len, staged.values())) <= PACK_CAP, 'Runtime pack cap exceeded')
    # Preflight every existing path before writing anything; never partly replace a pack.
    output.mkdir(parents=True, exist_ok=True)
    for name, data in staged.items():
        path = output / name
        require(not path.exists() or path.read_bytes() == data,
                f'Refusing to overwrite different asset: {path}')
    for name, data in staged.items():
        write_once(output / name, data)
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, default=CACHE)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    parser.add_argument('--fetch', action='store_true')
    args = parser.parse_args()
    manifest = build(args.cache, args.output, args.fetch)
    print(json.dumps({'models': len(manifest['models']), 'missions': len(manifest['missions']),
                      **manifest['delivery']}, indent=2))


if __name__ == '__main__':
    main()
