"""Admission and no-overwrite regressions for source-qualified visual assets."""
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest

import acquire_solar_visual_assets as assets


class AssetAdmissionTest(unittest.TestCase):
    def test_original_mesh_and_uv_assets_verify_offline(self):
        with contextlib.redirect_stdout(io.StringIO()) as output:
            assets.run(assets.ASSETS)
        self.assertIn('7 GLBs + 1 PNG', output.getvalue())

    def test_existing_corrupt_asset_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            path = root / 'jupiter-nasa.glb'
            path.write_bytes(b'owner bytes')
            with self.assertRaisesRegex(ValueError, 'byte length mismatch'):
                assets.run(root, cache=assets.ASSETS)
            self.assertEqual(path.read_bytes(), b'owner bytes')

    def test_same_length_tampering_rejected(self):
        manifest = json.loads((assets.ASSETS / 'manifest.json').read_text())
        record = next(asset for asset in manifest['assets'] if asset['id'] == 'eros')
        data = bytearray((assets.ASSETS / record['file']).read_bytes())
        data[-1] ^= 1
        with self.assertRaisesRegex(ValueError, 'SHA-256 mismatch'):
            assets.checked(data, record)

    def test_missing_assets_do_not_trigger_network_without_fetch(self):
        with tempfile.TemporaryDirectory() as temporary:
            with self.assertRaisesRegex(FileNotFoundError, 'use --fetch'):
                assets.run(Path(temporary))


if __name__ == '__main__':
    unittest.main()
