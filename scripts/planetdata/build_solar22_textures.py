#!/usr/bin/env python3
"""Build bounded Solar 2.2 LODs from pinned originals; no protected file is changed.

Requires Pillow. --fetch admits one NASA 8k Blue Marble (26 MB cap), and exactly
128 NASA Trek level-3 Viking tiles (8 MiB aggregate cap), never a recursive crawl.
Source cache stays outside runtime. All output hashes and dimensions are recorded.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import struct
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'frontend/public/solar-assets/v2.2'
EARTH = 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_8192.png'
EARTH_SHA256 = 'aaddcd967a9f09fb2d7ef50ff452bebfcf10192c520465d5eb1ad8446c716e98'
MARS = 'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0'
RIGHTS = 'https://www.nasa.gov/nasa-brand-center/images-and-media/'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def admit(path, url, cap, fetch):
    if path.exists():
        data = path.read_bytes()
    elif fetch:
        with urllib.request.urlopen(url, timeout=30) as response:
            if response.status != 200 or not response.url.startswith(('https://eoimages.gsfc.nasa.gov/', 'https://trek.nasa.gov/')):
                raise ValueError('Unexpected source response')
            data = response.read(cap + 1)
        if len(data) > cap:
            raise ValueError('Source network cap exceeded')
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    else:
        raise FileNotFoundError(f'{path}: --fetch admits the bounded source')
    if len(data) > cap:
        raise ValueError('Source network cap exceeded')
    return data


def image_record(path, data):
    image = Image.open(io.BytesIO(data))
    return {'file': path.name, 'url': '/solar-assets/v2.2/' + path.name,
            'bytes': len(data), 'sha256': sha(data), 'width': image.width,
            'height': image.height, 'gpuRgba8WithMipmapsBytes': (image.width * image.height * 16 + 2) // 3}


def jpeg(image, size):
    scaled = image.convert('RGB')
    scaled.thumbnail((size, size), Image.Resampling.LANCZOS)
    target = io.BytesIO()
    scaled.save(target, format='JPEG', quality=95, subsampling=0, optimize=True)
    return target.getvalue()


def write_image(output, name, data):
    path = output / name
    if path.exists() and path.read_bytes() != data:
        raise ValueError(f'Refusing to overwrite differing derivative: {path}')
    path.write_bytes(data)
    return image_record(path, data)


def parse_glb(data):
    length = struct.unpack_from('<I', data, 12)[0]
    return json.loads(data[20:20 + length]), data[28 + length:]


def compact_glb(data):
    gltf, binary = parse_glb(data)
    image_views = {item['bufferView'] for item in gltf['images']}
    output = bytearray()
    for index, view in enumerate(gltf['bufferViews']):
        start = view.get('byteOffset', 0)
        content = binary[start:start + view['byteLength']]
        if index in image_views:
            image = Image.open(io.BytesIO(content))
            # Keep radial-strip alpha intact. Other NASA body maps are opaque.
            if image.height > 32:
                content = jpeg(image, 1024)
                for item in gltf['images']:
                    if item['bufferView'] == index:
                        item['mimeType'] = 'image/jpeg'
        view['byteOffset'], view['byteLength'] = len(output), len(content)
        output.extend(content)
        output.extend(b'\x00' * (-len(output) % 4))
    gltf['buffers'][0]['byteLength'] = len(output)
    document = json.dumps(gltf, separators=(',', ':')).encode()
    document += b' ' * (-len(document) % 4)
    return (struct.pack('<III', 0x46546C67, 2, 28 + len(document) + len(output)) +
            struct.pack('<II', len(document), 0x4E4F534A) + document +
            struct.pack('<II', len(output), 0x004E4942) + output)


def variants(output, name, image, sizes):
    return [write_image(output, f'{name}-{size}.jpg', jpeg(image, size)) for size in sizes]


def run(cache, output=OUTPUT, fetch=False):
    output.mkdir(parents=True, exist_ok=True)
    old = json.loads((ROOT / 'frontend/public/solar-assets/v2/manifest.json').read_text())
    assets, sources = {}, []
    for source in old['assets']:
        path = ROOT / 'frontend/public/solar-assets/v2' / source['file']
        data = path.read_bytes()
        if sha(data) != source['sha256']:
            raise ValueError('Pinned NASA original changed')
        document, binary = parse_glb(data)
        view = document['bufferViews'][document['images'][source['meshes'][0]['baseColorImage']]['bufferView']]
        image_data = binary[view.get('byteOffset', 0):view.get('byteOffset', 0) + view['byteLength']]
        image = Image.open(io.BytesIO(image_data))
        compact = compact_glb(data)
        name = source['id'] + '-overview.glb'
        path = output / name
        if path.exists() and path.read_bytes() != compact:
            raise ValueError('Refusing to overwrite differing model')
        path.write_bytes(compact)
        max_size = max(image.size)
        sizes = sorted(set([min(max_size, 2048), max_size]))
        assets[source['id']] = {'mapping': 'source-uv', 'source': source['sourcePage'],
            'modelUrl': '/solar-assets/v2.2/' + name,
            'overview': {'file': name, 'bytes': len(compact), 'sha256': sha(compact),
                         'width': min(1024, image.width), 'height': round(image.height * min(1, 1024 / image.width))},
            'detail': variants(output, source['id'], image, sizes)}
        sources.append({'id': source['id'], 'sha256': source['sha256'], 'sourceManifest': '../v2/manifest.json',
                        'transformation': '1024 overview resampling and JPEG quality95; unchanged source POSITION/TEXCOORD_0/nodes/samplers. Detail source atlas dimensions retained; no inferred weather or terrain.'})
    earth_data = admit(cache / 'land_ocean_ice_8192.png', EARTH, 26000000, fetch)
    if sha(earth_data) != EARTH_SHA256:
        raise ValueError('Pinned NASA Earth source changed')
    earth = Image.open(io.BytesIO(earth_data))
    if earth.size != (8192, 4096):
        raise ValueError('Unexpected Earth dimensions')
    earth_lods = variants(output, 'earth', earth, [1024, 2048, 4096, 8192])
    assets['earth'] = {'mapping': 'equirectangular', 'source': 'https://science.nasa.gov/earth/earth-observatory/the-blue-marble-2181/',
                       'mapUrl': earth_lods[0]['url'], 'overview': earth_lods[0], 'detail': earth_lods[1:]}
    sources.append({'id': 'earth', 'download': EARTH, 'bytes': len(earth_data), 'sha256': sha(earth_data),
                    'width': 8192, 'height': 4096, 'attribution': 'NASA/GSFC; Reto Stockli; NASA Earth Observatory',
                    'termsUrl': RIGHTS, 'classification': 'Historical 2002 Blue Marble land/ocean/ice composite; not current weather or measured terrain',
                    'mapping': 'Global equirectangular -180 to 180 degrees east, 90N to 90S; no rotation, cropping, or image flip in derivatives.'})
    cloud_data = (ROOT / 'frontend/src/features/solar/assets/earth-clouds-2002.jpg').read_bytes()
    cloud = write_image(output, 'earth-clouds-1024.jpg', jpeg(Image.open(io.BytesIO(cloud_data)), 1024))
    assets['clouds'] = {'mapping': 'equirectangular', 'mapUrl': cloud['url'], 'overview': cloud, 'detail': [],
                        'source': 'https://science.nasa.gov/earth/earth-observatory/the-blue-marble-2181/'}
    sources.append({'id': 'clouds', 'sourceManifest': '../../../src/features/solar/assets/provenance.json', 'sha256': sha(cloud_data),
                    'transformation': '1024 JPEG overview from unchanged historical 2048 cloud composite; no synthetic detail.'})
    capabilities = admit(cache / 'mars-wmts.xml', MARS + '/WMTSCapabilities.xml', 64000, fetch)
    admitted = json.loads((OUTPUT / 'manifest.json').read_text()) if (OUTPUT / 'manifest.json').exists() else None
    mars_source = next((s for s in admitted['sources'] if s['id'] == 'mars'), None) if admitted else None
    if mars_source and sha(capabilities) != mars_source['capabilitiesSha256']:
        raise ValueError('Pinned NASA Mars grid changed')
    pinned_tiles = {(t['row'], t['column']): t for t in mars_source['tiles']} if mars_source else {}
    import xml.etree.ElementTree as ET
    ns = {'w': 'http://www.opengis.net/wmts/1.0', 'o': 'http://www.opengis.net/ows/1.1'}
    root = ET.fromstring(capabilities)
    if root.findtext('.//o:SupportedCRS', namespaces=ns) != 'urn:ogc:def:crs:EPSG::104905':
        raise ValueError('Mars source projection changed')
    matrix = next(m for m in root.findall('.//w:TileMatrix', ns) if m.findtext('o:Identifier', namespaces=ns) == '3')
    expected = {'TopLeftCorner': '-180.0 90.0', 'TileWidth': '256', 'TileHeight': '256', 'MatrixWidth': '16.0', 'MatrixHeight': '8.0'}
    if any(matrix.findtext('w:' + key, namespaces=ns) != value for key, value in expected.items()):
        raise ValueError('Mars grid definition changed')
    def tile(rc):
        row, col = rc
        url = f'{MARS}/default/default028mm/3/{row}/{col}.jpg'
        data = admit(cache / 'mars' / f'{row}-{col}.jpg', url, 98304, fetch)
        pin = pinned_tiles.get((row, col))
        if pin and (sha(data) != pin['sha256'] or len(data) != pin['bytes']):
            raise ValueError('Pinned NASA Mars tile changed')
        image = Image.open(io.BytesIO(data))
        if image.size != (256, 256):
            raise ValueError('Unexpected Mars tile size')
        return row, col, data, image
    with ThreadPoolExecutor(max_workers=4) as executor:
        tiles = list(executor.map(tile, [(r, c) for r in range(8) for c in range(16)]))
    total = sum(len(t[2]) for t in tiles)
    if total > 8 * 1024 * 1024:
        raise ValueError('Mars source cap exceeded')
    mars = Image.new('RGB', (4096, 2048))
    receipts = []
    for row, col, data, image in tiles:
        mars.paste(image, (col * 256, row * 256))
        receipts.append({'row': row, 'column': col, 'bytes': len(data), 'sha256': sha(data)})
    mars_lods = variants(output, 'mars', mars, [1024, 2048, 4096])
    assets['mars'] = {'mapping': 'equirectangular', 'source': 'https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars',
                      'mapUrl': mars_lods[0]['url'], 'overview': mars_lods[0], 'detail': mars_lods[1:]}
    sources.append({'id': 'mars', 'downloadTemplate': f'{MARS}/default/default028mm/3/{{row}}/{{column}}.jpg',
                    'capabilitiesUrl': MARS + '/WMTSCapabilities.xml', 'capabilitiesSha256': sha(capabilities), 'bytes': total,
                    'width': 4096, 'height': 2048, 'attribution': 'NASA/JPL-Caltech/USGS; NASA Solar System Treks',
                    'termsUrl': RIGHTS, 'classification': 'Historical Viking colorized MDIM2.1 mosaic, resampled from 232m map; display sampling approximately 5.2km/pixel at equator. Not current weather, photometrically calibrated color, or terrain.',
                    'mapping': 'EPSG:104905 equirectangular global grid, -180 to 180 degrees east, 90N to 90S. Source sphere UVs; static illustrative Mars orientation.',
                    'tiles': receipts})
    result = {'schema': 'oras.solar.visual-lods.v2.2', 'assets': assets, 'sources': sources,
              'delivery': {'overviewImageMaxSize': 1024, 'overviewBytes': sum(a['overview']['bytes'] for a in assets.values()),
                           'maximumSingleRuntimeFileBytes': max(p.stat().st_size for p in output.iterdir() if p.suffix != '.json'),
                           'terms': 'Educational/informational use with attribution under NASA media guidelines; no NASA endorsement. All original files retained.'}}
    (output / 'manifest.json').write_text(json.dumps(result, indent=2) + '\n')
    print(f"PASS {len(assets)} sources; overview {result['delivery']['overviewBytes']} bytes; Mars {len(tiles)} tiles / {total} bytes; Earth {len(earth_data)} bytes")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    parser.add_argument('--fetch', action='store_true')
    args = parser.parse_args()
    run(args.cache, args.output, args.fetch)
