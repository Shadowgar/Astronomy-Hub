"""Offline delivered-source validation; Pillow is needed only for pixel checks."""
import hashlib
import io
import json
from pathlib import Path
import struct
import unittest
from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[2]
LOD = ROOT / 'frontend/public/solar-assets/v2.2'


def glb(data):
    length = struct.unpack_from('<I', data, 12)[0]
    return json.loads(data[20:20 + length]), data[28 + length:]


class SolarTextureSources(unittest.TestCase):
    def test_all_runtime_image_dimensions_hashes_and_caps(self):
        manifest = json.loads((LOD / 'manifest.json').read_text())
        startup = 0
        for asset in manifest['assets'].values():
            for record in [asset['overview'], *asset['detail']]:
                path = LOD / record['file']
                data = path.read_bytes()
                self.assertEqual(hashlib.sha256(data).hexdigest(), record['sha256'])
                self.assertEqual(len(data), record['bytes'])
                self.assertLess(len(data), 16 * 1024 * 1024)
                if path.suffix == '.jpg':
                    image = Image.open(io.BytesIO(data))
                    self.assertEqual(image.size, (record['width'], record['height']))
                    self.assertEqual((image.width * image.height * 16 + 2) // 3, record['gpuRgba8WithMipmapsBytes'])
            startup += asset['overview']['bytes']
        self.assertEqual(startup, manifest['delivery']['overviewBytes'])
        self.assertLess(startup, 3 * 1024 * 1024)

    def test_original_geometry_uv_normals_nodes_and_sampler_are_byte_identical(self):
        originals = json.loads((ROOT / 'frontend/public/solar-assets/v2/manifest.json').read_text())
        for source in originals['assets']:
            data = (ROOT / 'frontend/public/solar-assets/v2' / source['file']).read_bytes()
            self.assertEqual(hashlib.sha256(data).hexdigest(), source['sha256'])
            original, binary = glb(data)
            compact, other = glb((LOD / (source['id'] + '-overview.glb')).read_bytes())
            for key in ['nodes', 'meshes', 'accessors', 'samplers', 'textures']:
                self.assertEqual(original.get(key), compact.get(key), source['id'] + ':' + key)
            image_views = {item['bufferView'] for item in original['images']}
            for index, view in enumerate(original['bufferViews']):
                if index in image_views:
                    continue
                a, b = view.get('byteOffset', 0), compact['bufferViews'][index].get('byteOffset', 0)
                self.assertEqual(binary[a:a + view['byteLength']], other[b:b + view['byteLength']])

    def test_mars_is_a_complete_bounded_grid_with_explicit_global_mapping(self):
        manifest = json.loads((LOD / 'manifest.json').read_text())
        source = next(s for s in manifest['sources'] if s['id'] == 'mars')
        self.assertEqual({(t['row'], t['column']) for t in source['tiles']}, {(r, c) for r in range(8) for c in range(16)})
        self.assertEqual(sum(t['bytes'] for t in source['tiles']), source['bytes'])
        self.assertLess(source['bytes'], 8 * 1024 * 1024)
        self.assertIn('EPSG:104905', source['mapping'])
        self.assertIn('static illustrative', source['mapping'])
        self.assertEqual(manifest['assets']['mars']['mapping'], 'equirectangular')

    def test_earth_longitude_registration_matches_existing_qualified_surface(self):
        old = Image.open(ROOT / 'frontend/src/features/solar/assets/earth-blue-marble.png').convert('RGB').resize((512, 256))
        new = Image.open(LOD / 'earth-8192.jpg').convert('RGB').resize((512, 256))
        # Ignore different seasonal polar ice: continental geography must match
        # the old qualified UV longitude, not a rotated or inverted globe.
        bounds = (0, 50, 512, 210)
        def error(image):
            return sum(ImageStat.Stat(ImageChops.difference(old.crop(bounds), image.crop(bounds))).mean) / 3
        scores = {offset: error(ImageChops.offset(new, offset, 0)) for offset in range(-8, 9)}
        self.assertEqual(min(scores, key=scores.get), 0)
        self.assertLess(scores[0], 8)
        self.assertLess(scores[0] * 3, error(new.transpose(Image.Transpose.FLIP_TOP_BOTTOM)))


if __name__ == '__main__':
    unittest.main()
