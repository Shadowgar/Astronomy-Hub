#!/usr/bin/env python3
"""Independent offline source audit; does not import the terrain converter.

Run with the task-only rasterio environment:
uv run --offline --with rasterio python scripts/validation/verify_solar21_terrain_source.py
"""
import hashlib
import json
import math
from pathlib import Path
import struct

import numpy as np
import rasterio
from rasterio.warp import transform


ROOT = Path(__file__).resolve().parents[2]
PACK = ROOT / 'frontend/public/planet-terrain/apollo17-nac-v1'
CACHE = Path('/tmp/solar21-lunar-source')
REPORT = ROOT / 'docs/validation/solar-system-2.1/evidence/terrain-independent-geometry.json'


def main():
    manifest = json.loads((PACK / 'manifest.json').read_text())
    pin = json.loads((ROOT / 'scripts/planetdata/lunar_apollo17_sources.json').read_text())
    tileset = json.loads((PACK / 'tileset.json').read_text())
    source_checks = 0
    for source in pin['sources']:
        for suffix, expected in [('.head', source['labelSha256']), ('.strip', source['sha256'])]:
            assert hashlib.sha256((CACHE / (source['id'] + suffix)).read_bytes()).hexdigest() == expected
            source_checks += 1

    # Derive source coordinates from GDAL's PDS parser/projection inverse, rather
    # than repeating the converter's offset formula.
    elevation = rasterio.open(CACHE / 'NAC_DTM_APOLLO17_E203N0308.IMG.head')
    x, y = elevation.xy(6812, 4583)
    longitude, latitude = transform(elevation.crs, '+proj=longlat +R=1737400 +no_defs', [x], [y])
    la, lo = np.radians([latitude[0], longitude[0]])
    assert abs(latitude[0] - manifest['latitudeDeg']) < 1e-9
    assert abs(longitude[0] - manifest['longitudeDeg']) < 1e-9
    basis = np.array([
        [-np.sin(lo), -np.sin(la) * np.cos(lo), np.cos(la) * np.cos(lo)],
        [np.cos(lo), -np.sin(la) * np.sin(lo), np.cos(la) * np.sin(lo)],
        [0, np.cos(la), np.sin(la)],
    ])
    assert abs(np.linalg.det(basis) - 1) < 1e-14
    height = np.memmap(CACHE / 'NAC_DTM_APOLLO17_E203N0308.IMG.strip', dtype='<f4', mode='r', shape=(1027, 9985))
    centre_radius = 1737400.0 + float(height[513, 4583])
    origin = centre_radius * np.array([np.cos(la) * np.cos(lo), np.cos(la) * np.sin(lo), np.sin(la)])
    matrix = np.asarray(tileset['root']['transform']).reshape((4, 4), order='F')
    assert np.max(abs(matrix[:3, :3] - basis)) < 1e-12
    assert np.max(abs(matrix[:3, 3] - origin)) < 0.001

    maximum = 0.0
    count = 0
    for entry in manifest['content']:
        raw = (PACK / entry['uri']).read_bytes()
        assert hashlib.sha256(raw).hexdigest() == entry['sha256']
        assert struct.unpack_from('<III', raw) == (0x46546C67, 2, len(raw))
        json_length = struct.unpack_from('<I', raw, 12)[0]
        doc = json.loads(raw[20:20 + json_length])
        blob = raw[28 + json_length:]
        accessor = doc['accessors'][0]
        view = doc['bufferViews'][accessor['bufferView']]
        gltf = np.frombuffer(blob, dtype='<f4', count=129 * 129 * 3, offset=view.get('byteOffset', 0)).reshape(129, 129, 3)
        enu = gltf[:, :, [0, 2, 1]].copy()
        enu[:, :, 1] *= -1
        step = 8 >> entry['level']
        rr = entry['y'] * 128 * step + np.arange(129) * step
        cc = 4071 + entry['x'] * 128 * step + np.arange(129) * step
        rows, columns = np.meshgrid(rr + 6300, cc, indexing='ij')
        xs, ys = elevation.xy(rows, columns)
        lons, lats = transform(elevation.crs, '+proj=longlat +R=1737400 +no_defs', xs, ys)
        lat = np.radians(lats).reshape(129, 129)
        lon = np.radians(lons).reshape(129, 129)
        radius = 1737400.0 + height[(rr + 1)[:, None], cc[None, :]].astype(np.float64)
        xyz = np.stack([radius * np.cos(lat) * np.cos(lon), radius * np.cos(lat) * np.sin(lon), radius * np.sin(lat)], axis=-1)
        expected = (xyz - origin) @ basis
        error = float(np.max(abs(enu - expected)))
        maximum = max(maximum, error)
        count += 129 * 129
        assert error < 0.001, (entry['uri'], error)
        # Every current GLB is self-contained: its loader cannot fetch an
        # unqualified subordinate image/buffer outside the transport plugin.
        assert all('uri' not in b for b in doc['buffers'])
        assert all('uri' not in image for image in doc['images'])
    elevation.close()
    report = {
        'reviewer': 'independent atmosphere agent reviewing terrain conversion',
        'rasterio': rasterio.__version__, 'gdal': rasterio.__gdal_version__,
        'sourceHashChecks': source_checks, 'tiles': len(manifest['content']),
        'sourceVerticesChecked': count, 'maximumPositionErrorM': maximum,
        'glbExternalUris': 0, 'rootBasisDeterminant': float(np.linalg.det(basis)),
        'manifestSha256': hashlib.sha256((PACK / 'manifest.json').read_bytes()).hexdigest(),
        'pass': True,
    }
    REPORT.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


if __name__ == '__main__':
    main()
