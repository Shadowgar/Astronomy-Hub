"""Provenance, native UV, no-upscale, and measured-shape delivery regressions."""
import hashlib
import io
import json
import math
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image
import build_solar23_assets as builder

ROOT = Path(__file__).resolve().parents[2]
PACK = ROOT / 'frontend/public/planetary-assets/v2.3'
CACHE = ROOT / 'output/playwright/solar-system-2.3/source-cache'
NASA = ('io', 'europa', 'ganymede', 'callisto', 'titan', 'enceladus',
        'ariel', 'umbriel', 'titania', 'oberon', 'miranda', 'triton')


def glb(data):
    size = struct.unpack_from('<I', data, 12)[0]
    return json.loads(data[20:20 + size]), data[28 + size:]


def view(doc, binary, index):
    item = doc['bufferViews'][index]
    start = item.get('byteOffset', 0)
    return binary[start:start + item['byteLength']]


class Solar23Assets(unittest.TestCase):
    def setUp(self):
        self.assertTrue((PACK / 'manifest.json').exists(),
                        'Solar 2.3 asset delivery manifest has not been built')
        self.manifest = json.loads((PACK / 'manifest.json').read_text())

    def test_delivered_hashes_and_bounded_native_source_resolutions(self):
        assets = self.manifest['assets']
        self.assertEqual(set(assets), {*NASA, 'phobos', 'deimos'})
        total = 0
        for asset in assets.values():
            records = [asset['overview'], *asset['detail']]
            for record in records:
                data = (PACK / record['file']).read_bytes()
                self.assertEqual(len(data), record['bytes'])
                self.assertEqual(hashlib.sha256(data).hexdigest(), record['sha256'])
                total += len(data)
            for image in asset['detail']:
                with Image.open(PACK / image['file']) as decoded:
                    self.assertEqual(decoded.size, (image['width'], image['height']))
                    self.assertLessEqual(decoded.width, asset['source']['sourceResolution'][0])
                    self.assertLessEqual(decoded.height, asset['source']['sourceResolution'][1])
            for key in ('organization', 'url', 'download', 'sha256', 'terms',
                        'projection', 'datum', 'coverage', 'orientationClassification'):
                self.assertIn(key, asset['source'])
        self.assertEqual(total, self.manifest['delivery']['networkBytes'])
        self.assertLessEqual(total, 64 * 1024**2)
        self.assertLessEqual(self.manifest['delivery']['rawSourceBytes'], 128 * 1024**2)

    def test_original_nasa_geometry_uv_nodes_and_sampler_are_byte_identical(self):
        for body in NASA:
            with self.subTest(body=body):
                asset = self.manifest['assets'][body]
                original, original_bytes = glb((CACHE / f'{body}-nasa-original.glb').read_bytes())
                delivered, delivered_bytes = glb((PACK / asset['overview']['file']).read_bytes())
                for key in ('accessors', 'nodes', 'meshes', 'samplers', 'materials'):
                    self.assertEqual(original.get(key), delivered.get(key))
                images = {item['bufferView'] for item in original['images']}
                for index in range(len(original['bufferViews'])):
                    if index not in images:
                        self.assertEqual(view(original, original_bytes, index),
                                         view(delivered, delivered_bytes, index))
                with Image.open(io.BytesIO(view(delivered, delivered_bytes,
                                               delivered['images'][0]['bufferView']))) as image:
                    self.assertLessEqual(image.width, 1024)
                    self.assertEqual(image.size, (asset['overview']['width'], asset['overview']['height']))

    def test_source_frame_unknowns_and_partial_coverage_are_not_promoted(self):
        for body in NASA:
            source = self.manifest['assets'][body]['source']
            self.assertEqual(source['orientationClassification'], 'illustrative-source-registration')
            self.assertIsNone(source['datum'])
            self.assertIsNone(source['longitudeConvention'])
        titan = self.manifest['assets']['titan']['source']
        self.assertEqual(titan['appearanceClass'], 'visible-haze-visualization')
        self.assertIn('not an infrared', titan['disclosure'])
        for body in ('ariel', 'umbriel', 'titania', 'oberon', 'miranda', 'triton'):
            source = self.manifest['assets'][body]['source']
            self.assertEqual(source['coverage'], 'partial-with-neutral-source-gaps')
            self.assertIn('unobserved', source['disclosure'])

    def test_shape_vertices_keep_source_kilometers_and_original_topology(self):
        for body in ('phobos', 'deimos'):
            asset = self.manifest['assets'][body]
            geometry = asset['geometry']
            self.assertEqual(geometry['units'], 'km')
            self.assertGreater(geometry['maxBoundingRadiusKm'], 8)
            self.assertEqual(asset['mapping'], 'none')
            self.assertEqual(asset['detail'], [])
            self.assertTrue(asset['runtimeAllowed'])
            self.assertIn('PDS', asset['source']['organization'])
            self.assertIn('public domain', asset['source']['rightsStatus'])
            self.assertEqual(asset['source']['orientationClassification'], 'qualified-source-body-frame')
            self.assertIn('legacy', asset['source']['orientationQualification'])
            self.assertEqual(asset['source']['orientationModelId'], geometry['expectedOrientationModelId'])
            self.assertEqual(asset['source']['orientationFrame'], geometry['expectedOrientationFrame'])
            self.assertEqual((geometry['expectedOrientationFrame'], geometry['expectedOrientationModelId']),
                             ('IAU_PHOBOS', 'pds-gaskell-phobos-pck00006') if body == 'phobos'
                             else ('PDS_THOMAS_DEIMOS', 'pds-thomas-deimos-label-v1'))
            lines = (CACHE / asset['source']['file']).read_text().splitlines()
            doc, binary = glb((PACK / asset['overview']['file']).read_bytes())
            primitive = doc['meshes'][0]['primitives'][0]
            position = doc['accessors'][primitive['attributes']['POSITION']]
            index = doc['accessors'][primitive['indices']]
            vertices = list(struct.iter_unpack('<fff', view(doc, binary, position['bufferView'])))
            faces = list(struct.iter_unpack('<III', view(doc, binary, index['bufferView'])))
            if body == 'phobos':
                count, triangle_count = map(int, lines[0].split())
                self.assertEqual(position['count'], count)
                self.assertEqual(len(faces), triangle_count)
                self.assertEqual(view(doc, binary, position['bufferView']),
                                 b''.join(struct.pack('<fff', *map(float, row.split()[1:])) for row in lines[1:count+1]))
                self.assertEqual(faces, [tuple(int(x)-1 for x in row.split()[1:]) for row in lines[count+1:]])
                self.assertIn('pck00006', geometry['frame'])
            else:
                expected = {(lat, lon): radius for lat, lon, radius in (map(float, row.split()) for row in lines)}
                self.assertEqual(len(vertices), 2522)
                self.assertEqual(len(faces), 5040)
                for x, y, z in vertices:
                    radius = math.sqrt(x*x+y*y+z*z)
                    lat = round(math.degrees(math.asin(z/radius))/5)*5
                    lon = round(math.degrees(math.atan2(y, x))/5)*5 % 360 if abs(lat) != 90 else 0
                    self.assertAlmostEqual(radius, expected[lat, lon], places=5)
                self.assertEqual(asset['source']['longitudeConvention'], 'east-positive; PDS planetocentric definition')
            edges = {}
            for a, b, c in faces:
                for x, y in ((a, b), (b, c), (c, a)):
                    key = tuple(sorted((x, y)))
                    edges[key] = edges.get(key, 0) + 1
            self.assertEqual(set(edges.values()), {2})
            self.assertEqual(len({v for face in faces for v in face}) - len(edges) + len(faces), 2)
        self.assertFalse(any('HOLD' in path.name for path in PACK.iterdir()))

    def test_missing_or_corrupt_cached_source_never_silently_fetches_or_overwrites(self):
        source = builder.SOURCES[0]
        with tempfile.TemporaryDirectory() as temporary:
            cache = Path(temporary)
            with patch.object(builder.urllib.request, 'urlopen', side_effect=AssertionError('Unexpected network')):
                with self.assertRaises(FileNotFoundError):
                    builder.admitted(source, cache)
                path = cache / source['file']
                path.write_bytes(b'corrupt source retained for diagnosis')
                with self.assertRaisesRegex(ValueError, 'hash mismatch'):
                    builder.admitted(source, cache, fetch=True)
                self.assertEqual(path.read_bytes(), b'corrupt source retained for diagnosis')

    def test_different_existing_derivative_is_preserved_on_rerun(self):
        with tempfile.TemporaryDirectory() as temporary:
            output = Path(temporary)
            (output / 'body.jpg').write_bytes(b'owner bytes')
            with self.assertRaisesRegex(ValueError, 'Refusing to overwrite'):
                builder.emit(output, 'body.jpg', b'replacement bytes')
            self.assertEqual((output / 'body.jpg').read_bytes(), b'owner bytes')


if __name__ == '__main__':
    unittest.main()
