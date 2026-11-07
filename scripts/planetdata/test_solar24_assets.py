"""Source identity, kilometer geometry, cartographic UVs and bounded delivery."""
import hashlib
import io
import json
import math
from pathlib import Path
import struct
import tempfile
import unittest
import xml.etree.ElementTree as ET
from unittest.mock import patch

from PIL import Image
import build_solar24_assets as builder


def view(doc, binary, index):
    item = doc['bufferViews'][index]
    return binary[item.get('byteOffset', 0):item.get('byteOffset', 0) + item['byteLength']]


class Solar24Assets(unittest.TestCase):
    def setUp(self):
        self.pack = builder.OUTPUT
        self.manifest = json.loads((self.pack / 'manifest.json').read_text())

    def test_hashes_budgets_no_upscale_and_source_identity(self):
        self.assertEqual(set(self.manifest['assets']), {'pluto', 'charon', 'ceres', 'vesta', 'eros', '67p', 'halley'})
        total = 0
        for asset in self.manifest['assets'].values():
            for record in [asset['overview'], *asset['detail']]:
                data = (self.pack / record['file']).read_bytes()
                self.assertEqual(hashlib.sha256(data).hexdigest(), record['sha256'])
                self.assertEqual(len(data), record['bytes'])
                total += len(data)
            for image in asset['detail']:
                with Image.open(self.pack / image['file']) as decoded:
                    self.assertEqual(decoded.size, (image['width'], image['height']))
                    self.assertLessEqual(decoded.width, asset['source']['sourceResolution'][0])
                    self.assertLessEqual(decoded.height, asset['source']['sourceResolution'][1])
            for key in ('organization', 'url', 'terms', 'rightsStatus', 'sha256', 'acquiredUTC', 'projection', 'coverage', 'orientationClassification', 'disclosure'):
                self.assertTrue(asset['source'].get(key), key)
        self.assertEqual(total, self.manifest['delivery']['networkBytes'])
        self.assertLessEqual(total, builder.PACK_CAP)
        self.assertLessEqual(self.manifest['delivery']['rawSourceBytes'], builder.RAW_CAP)
        documents = sum(item['bytes'] for item in builder.DOCUMENTS)
        self.assertEqual(self.manifest['delivery']['sourceDocumentBytes'], documents)
        self.assertEqual(self.manifest['delivery']['rawSourceBytes'],
                         sum(item['bytes'] for item in builder.SOURCES)+builder.RESEARCH_RAW_BYTES+documents)
        self.assertTrue(all(s['bytes'] <= builder.SINGLE_CAP for s in builder.SOURCES))

    def test_cartography_preserves_axes_and_unknown_coverage(self):
        for body, radius in [('pluto', 1188.3), ('charon', 606.)]:
            asset = self.manifest['assets'][body]
            doc, binary = builder.parse_glb((self.pack / asset['overview']['file']).read_bytes())
            positions = list(struct.iter_unpack('<fff', view(doc, binary, 0)))
            uv = list(struct.iter_unpack('<ff', view(doc, binary, 2)))
            # Independent authoritative XML values, not generator constants.
            xml = ET.parse(builder.CACHE / f'nh-{body}-label.html')
            def value(name):
                return float(xml.find(f'.//{{*}}{name}').text)
            x0, y0 = value('upperleft_corner_x'), value('upperleft_corner_y')
            posting = value('pixel_resolution_x')
            center = math.radians(value('longitude_of_central_meridian'))
            elements = [int(e.text) for e in xml.findall('.//{*}Axis_Array/{*}elements')]
            height, width = elements
            for xyz, (u, v) in zip(positions, uv):
                lon = (u*width*posting+x0)/(radius*1000)+center
                lat = (y0-v*height*posting)/(radius*1000)
                expected = (radius*math.cos(lat)*math.cos(lon), radius*math.cos(lat)*math.sin(lon), radius*math.sin(lat))
                self.assertTrue(all(abs(a-b) < 0.0003 for a, b in zip(xyz, expected)))
                self.assertAlmostEqual(math.sqrt(sum(a*a for a in xyz)), radius, places=3)
            source = asset['source']
            self.assertIn('planetocentric, positive east', source['longitudeConvention'])
            self.assertIn('monochrome', source['disclosure'])
            self.assertIn('unobserved', source['disclosure'])
            # Source data coverage is retained; the unseen south is not painted.
            image = Image.open(self.pack / asset['detail'][-1]['file']).convert('L')
            south = image.crop((0, int(image.height*.85), image.width, image.height))
            self.assertLess(max(south.getdata()), 8)
            self.assertLess(min(image.getdata()), 2)
            self.assertGreater(max(image.getdata()), 220)

    def test_measured_shape_positions_are_original_kilometers(self):
        for body in ('eros', '67p', 'vesta', 'halley'):
            source = next(s for s in builder.SOURCES if s['id'] == body)
            raw = builder.admitted(source, builder.CACHE)
            vertices, faces, _ = builder.source_shape(raw, body, builder.CACHE / source['file'])
            asset = self.manifest['assets'][body]
            doc, binary = builder.parse_glb((self.pack / asset['overview']['file']).read_bytes())
            self.assertEqual(view(doc, binary, 0), b''.join(struct.pack('<fff', *p) for p in vertices))
            self.assertEqual(view(doc, binary, 2), b''.join(struct.pack('<III', *f) for f in faces))
            self.assertEqual(asset['geometry']['units'], 'km')
            self.assertGreater(asset['geometry']['sourceVolumeKm3'], 0)
            self.assertEqual(asset['geometry']['eulerCharacteristic'], -2 if body == '67p' else 2)
            self.assertTrue(asset['geometry']['closedManifold'])
            self.assertEqual(asset['detail'], [])
        eros = self.manifest['assets']['eros']['geometry']
        self.assertGreater(eros['maxBoundingRadiusKm'], 16)
        self.assertLess(eros['maxBoundingRadiusKm'], 18)

    def test_halley_original_radial_samples_and_large_uncertainty_disclosed(self):
        grid = {(lat, lon): radius for lon, lat, radius in
                (map(float, line.split()) for line in (builder.CACHE/'halley-stooke.tab').read_text().splitlines())}
        asset = self.manifest['assets']['halley']
        doc, binary = builder.parse_glb((self.pack/asset['overview']['file']).read_bytes())
        for x, y, z in struct.iter_unpack('<fff', view(doc, binary, 0)):
            radius = math.sqrt(x*x+y*y+z*z)
            lat = round(math.degrees(math.asin(z/radius))/5)*5
            lon = round(math.degrees(math.atan2(y, x))/5)*5 % 360 if abs(lat) != 90 else 0
            self.assertAlmostEqual(radius, grid[lat, lon], places=5)
        self.assertEqual(asset['geometry']['absoluteUncertaintyKm'], [.5, 1.])
        self.assertFalse(asset['geometry']['orientationAtEpochQualified'])
        self.assertIn('Stooke and Abergel', asset['source']['disclosure'])
        self.assertIn('0.5-1 km', asset['source']['disclosure'])

    def test_ceres_original_mesh_uvs_and_material_are_unchanged(self):
        source = next(s for s in builder.SOURCES if s['id'] == 'ceres')
        original, original_binary = builder.parse_glb(builder.admitted(source, builder.CACHE))
        asset = self.manifest['assets']['ceres']
        delivered, binary = builder.parse_glb((self.pack / asset['overview']['file']).read_bytes())
        for key in ('meshes', 'accessors', 'nodes', 'materials', 'samplers'):
            self.assertEqual(original.get(key), delivered.get(key))
        images = {im['bufferView'] for im in original['images']}
        for i in range(len(original['bufferViews'])):
            if i not in images:
                self.assertEqual(view(original, original_binary, i), view(delivered, binary, i))
        self.assertEqual(asset['geometry']['adoption'], 'uniform-reference-scale-preserving-shape')
        self.assertFalse(asset['geometry']['geodeticRegistrationQualified'])

    def test_frame_models_match_independent_science_fixture_and_limits_remain_explicit(self):
        fixture = json.loads((builder.ROOT/'backend/tests/fixtures/solar_destinations_frames.json').read_text())
        for body, frame, model, kernel in (
            ('eros', 'PDS_GASKELL_EROS', 'pds-gaskell-eros-alex', 'eros_alex.tpc.txt'),
            ('vesta', 'IAU_VESTA', 'dawn-vesta-grv221108-v1', 'dawn_vesta_grv221108_v1.tpc'),
        ):
            geometry = self.manifest['assets'][body]['geometry']
            self.assertEqual(geometry['expectedOrientationFrame'], frame)
            self.assertEqual(geometry['expectedOrientationModelId'], model)
            self.assertEqual(geometry['orientationModelSha256'], fixture['source_sha256'][kernel])
            self.assertTrue(geometry['sourceFrameEvaluationQualified'])
            self.assertFalse(geometry['contemporaryMeridianObservationallyQualified'])
        for body in ('pluto', 'charon'):
            asset = self.manifest['assets'][body]
            self.assertTrue(asset['geometry']['cartographicGridQualified'])
            self.assertFalse(asset['geometry']['geodeticRegistrationQualified'])
            self.assertFalse(asset['geometry']['orientationAtEpochQualified'])
            self.assertIn('1.45-degree', asset['source']['disclosure'])

    def test_fail_closed_without_network_or_overwriting_source(self):
        source = builder.SOURCES[0]
        with tempfile.TemporaryDirectory() as folder:
            cache = Path(folder)
            with patch.object(builder.urllib.request, 'urlopen', side_effect=AssertionError('unexpected network')):
                with self.assertRaises(FileNotFoundError):
                    builder.admitted(source, cache)
                (cache / source['file']).write_bytes(b'keep corrupt evidence')
                with self.assertRaisesRegex(ValueError, 'hash mismatch'):
                    builder.admitted(source, cache, fetch=True)
            self.assertEqual((cache / source['file']).read_bytes(), b'keep corrupt evidence')
            with self.assertRaisesRegex(ValueError, 'overwrite'):
                builder.emit(cache, source['file'], b'different')


if __name__ == '__main__':
    unittest.main()
