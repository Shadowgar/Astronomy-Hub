"""Offline qualification of the actual delivered spacecraft models and provenance."""
import copy
from datetime import datetime
import hashlib
import json
from pathlib import Path
import shutil
import struct
import tempfile
import unittest
from unittest.mock import patch

import build_solar25_assets as assets


class Solar25Assets(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads((assets.OUTPUT / 'manifest.json').read_text())
        cls.records = json.loads(assets.RECORDS.read_text())

    def test_original_models_are_byte_identical_and_budgeted(self):
        total = 0
        for record in self.records['models']:
            model = self.manifest['models'][record['id']]
            data = (assets.OUTPUT / (record['id'] + '.glb')).read_bytes()
            self.assertEqual(len(data), record['bytes'])
            self.assertEqual(hashlib.sha256(data).hexdigest(), record['sha256'])
            self.assertEqual(model['sha256'], record['sha256'])
            self.assertLess(len(data), assets.SINGLE_CAP)
            total += len(data)
        self.assertEqual(total, self.manifest['delivery']['modelBytes'])
        self.assertLess(sum(p.stat().st_size for p in assets.OUTPUT.iterdir()), assets.PACK_CAP)
        self.assertLess(self.manifest['delivery']['rawSourceBytes'], assets.RAW_CAP)

    def test_independent_dimension_references_and_preserved_hierarchy(self):
        # Independently specified source nodes/diameters, rather than reusing
        # builder references, catch wrong antenna selection or presumed metres.
        references = {'voyager': (1, 3.7, 4, 5, 20390),
                      'cassini': (3, 4.0, 12, 10, 26020),
                      'new-horizons': (1, 2.1, 6, 6, 8280)}
        for key, (node_id, diameter, node_count, material_count, triangles) in references.items():
            data = (assets.OUTPUT / (key + '.glb')).read_bytes()
            json_length = struct.unpack_from('<I', data, 12)[0]
            document = json.loads(data[20:20 + json_length])
            node = document['nodes'][node_id]
            self.assertNotIn('scale', node)
            self.assertNotIn('rotation', node)
            self.assertNotIn('matrix', node)
            root = document['nodes'][document['scenes'][0]['nodes'][0]]
            self.assertIn(node_id, root['children'])
            self.assertFalse(any(k in root for k in ('matrix', 'scale', 'rotation')))
            primitive = document['meshes'][node['mesh']]['primitives'][0]
            position = document['accessors'][primitive['attributes']['POSITION']]
            # glTF accessor extents are a second, independent span calculation
            # versus the builder's decoded vertex scan and full world transforms.
            span = max(position['max'][i] - position['min'][i] for i in (0, 2))
            model = self.manifest['models'][key]
            self.assertAlmostEqual(model['metersPerSourceUnit'] * span, diameter, places=6)
            self.assertEqual(len(document['nodes']), node_count)
            self.assertEqual(len(document['materials']), material_count)
            self.assertEqual(model['stats']['triangles'], triangles)
            self.assertEqual(len(root['children']), node_count - 1)
            self.assertTrue(any(m.get('normalTexture') or m['pbrMetallicRoughness'].get('baseColorTexture')
                                for m in document['materials']))

    def test_no_external_resources_and_finite_model_bounds(self):
        for key, model in self.manifest['models'].items():
            document, binary = assets.parse_glb((assets.OUTPUT / (key + '.glb')).read_bytes())
            self.assertFalse(any('uri' in r for r in document['buffers'] + document['images']))
            info = assets.inspect_model((assets.OUTPUT / (key + '.glb')).read_bytes(), assets.MODEL_REFERENCES[key])
            self.assertEqual(info['sourceBounds'], model['sourceBounds'])
            self.assertEqual(info['radiusMeters'], model['radiusMeters'])
            self.assertGreater(model['radiusMeters'], 1)
            self.assertLess(model['radiusMeters'], 12)
            self.assertLess(model['stats']['rgba8MipTextureBytesEstimate'], 32 * 1024**2)
            self.assertGreater(len(binary), 1000)

    def test_shared_voyager_geometry_does_not_alias_mission_identity(self):
        self.assertEqual(self.manifest['missions'], {
            'voyager1': 'voyager', 'voyager2': 'voyager',
            'cassini': 'cassini', 'newhorizons': 'new-horizons'})
        for model in self.manifest['models'].values():
            self.assertEqual(model['attitude']['status'], 'illustrative-inspection')
            self.assertFalse(model['attitude']['velocityDerived'])
            self.assertEqual(model['attitude']['kernelsQualified'], [])
            self.assertFalse(model['configuration']['epochQualified'])
            self.assertIn('not a qualified center of mass', model['centerMeaning'])
            self.assertEqual(model['scale']['status'], 'reference-normalized-approximate')
            self.assertIn('NASA', model['rights']['credit'])
            self.assertEqual(model['sources']['rights']['url'], assets.NASA_TERMS)
        self.assertIn('Huygens', self.manifest['models']['cassini']['configuration']['label'])

    def test_corrupt_missing_changed_and_oversized_sources_fail_closed(self):
        record = self.records['models'][0]
        with tempfile.TemporaryDirectory() as temp:
            cache = Path(temp)
            with self.assertRaisesRegex(ValueError, 'Missing pinned source'):
                assets.acquire(record, cache, False)
            data = (assets.OUTPUT / (record['id'] + '.glb')).read_bytes()
            with self.assertRaisesRegex(ValueError, 'Size mismatch'):
                assets.verify_source(data + b'X', record)
            with self.assertRaisesRegex(ValueError, 'SHA256 mismatch'):
                assets.verify_source(b'X' + data[1:], record)
            oversized = {**record, 'bytes': assets.SINGLE_CAP + 1}
            with self.assertRaisesRegex(ValueError, 'Size mismatch'):
                assets.verify_source(data, oversized)
            with patch('urllib.request.urlopen', side_effect=AssertionError('Cap must precede fetch')):
                with self.assertRaisesRegex(ValueError, 'individual acquisition cap'):
                    assets.acquire(oversized, cache, True)
            bad_url = {**record, 'download': 'https://unqualified.example/model.glb'}
            with self.assertRaisesRegex(ValueError, 'Unapproved source URL'):
                assets.acquire(bad_url, cache, True)

    def test_unsafe_glb_uri_and_invalid_vertex_are_rejected(self):
        source = (assets.OUTPUT / 'new-horizons.glb').read_bytes()
        document, binary = assets.parse_glb(source)

        def encode(doc, buffer):
            text = json.dumps(doc, separators=(',', ':')).encode()
            text += b' ' * (-len(text) % 4)
            return (struct.pack('<4sII', b'glTF', 2, 28 + len(text) + len(buffer))
                    + struct.pack('<II', len(text), 0x4e4f534a) + text
                    + struct.pack('<II', len(buffer), 0x004e4942) + buffer)

        malicious = copy.deepcopy(document)
        malicious['images'][0]['uri'] = 'https://unqualified.example/tracker.png'
        with self.assertRaisesRegex(ValueError, 'External image'):
            assets.parse_glb(encode(malicious, binary))
        position = document['accessors'][document['meshes'][0]['primitives'][0]['attributes']['POSITION']]
        view = document['bufferViews'][position['bufferView']]
        changed = bytearray(binary)
        struct.pack_into('<f', changed, view.get('byteOffset', 0) + position.get('byteOffset', 0), float('nan'))
        with self.assertRaisesRegex(ValueError, 'Non-finite geometry'):
            assets.inspect_model(encode(document, changed), assets.MODEL_REFERENCES['new-horizons'])

    def test_rebuild_is_offline_reproducible_and_does_not_overwrite(self):
        with tempfile.TemporaryDirectory() as temp:
            temp = Path(temp)
            cache, output = temp / 'cache', temp / 'pack'
            cache.mkdir()
            for record in self.records['models']:
                shutil.copyfile(assets.OUTPUT / (record['id'] + '.glb'), cache / record['file'])
            with patch('urllib.request.urlopen', side_effect=AssertionError('Offline build touched network')):
                assets.build(cache, output)
                assets.build(cache, output)
            for path in assets.OUTPUT.iterdir():
                self.assertEqual(path.read_bytes(), (output / path.name).read_bytes())
            (output / 'manifest.json').write_text('owner artifact')
            with self.assertRaisesRegex(ValueError, 'Refusing to overwrite'):
                assets.build(cache, output)
            self.assertEqual((output / 'manifest.json').read_text(), 'owner artifact')

    def test_event_precision_identity_and_source_conflicts(self):
        folder = assets.RECORDS.parent
        records = json.loads((folder / 'mission-event-sources.json').read_text())
        sources = {row['url']: row for row in records['documents']}
        document = json.loads((folder / 'mission-events.json').read_text())
        events = {row['id']: row for row in document['events']}
        self.assertEqual(len(events), len(document['events']))
        self.assertEqual(len(events), 32)
        mission_ids = set(self.manifest['missions']) | {'juno', 'dawn', 'near', 'rosetta', 'pioneer10', 'pioneer11'}
        for event in events.values():
            self.assertIn(event['mission_id'], mission_ids)
            self.assertIsInstance(event['target_id'], str)
            self.assertEqual(event['source_sha256'], sources[event['source_url']]['sha256'])
            instant = datetime.fromisoformat(event['epoch'].replace('Z', '+00:00'))
            if event['precision'] == 'day':
                self.assertEqual((instant.hour, instant.minute, instant.second), (12, 0, 0))
                self.assertEqual(event['epoch_role'], 'representative-noon-not-exact-event')
            elif event['precision'] == 'minute':
                self.assertEqual(instant.second, 0)
            else:
                self.assertEqual(event['precision'], 'second')
        self.assertEqual(events['voyager2-saturn']['epoch'], '1981-08-26T03:24:57Z')
        self.assertTrue(events['voyager2-saturn']['source_url'].endswith('voyager-periapse.html'))
        self.assertEqual(events['voyager2-heliopause']['date'], '2018-11-05')
        self.assertEqual(events['cassini-end']['precision'], 'day')
        self.assertEqual(events['cassini-end']['view_epoch'], '2017-09-15T10:29:59Z')
        self.assertIn('not the destruction instant', events['cassini-end']['view_epoch_note'])
        self.assertEqual(events['juno-jupiter']['date'], '2016-07-05')
        self.assertTrue(events['juno-jupiter']['source_url'].endswith('/juno-orbits/'))
        self.assertEqual(events['dawn-vesta']['date'], '2011-07-16')
        self.assertEqual(events['dawn-ceres']['date'], '2015-03-06')
        self.assertEqual(events['dawn-ceres']['target_id'], '2000001')
        self.assertEqual(events['near-eros']['epoch'], '2000-02-14T15:33:00Z')
        self.assertEqual(events['near-eros']['target_id'], '2000433')
        self.assertEqual(events['rosetta-comet']['date'], '2014-08-06')
        self.assertEqual(events['rosetta-comet']['target_id'], '1000012')
        self.assertEqual(events['pioneer10-launch']['date'], '1972-03-03')
        self.assertEqual(events['pioneer10-launch']['precision'], 'day')
        self.assertEqual(len(document['source_conflicts']), 5)


if __name__ == '__main__':
    unittest.main()
