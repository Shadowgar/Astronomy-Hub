import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('source_package', ROOT / 'scripts/source-distribution/package_source.py')
package = importlib.util.module_from_spec(spec)
spec.loader.exec_module(package)


class SourcePackageTests(unittest.TestCase):
    def test_every_locked_overlay_input_is_in_the_source_package(self):
        lock = json.loads((ROOT / 'integrations/renderers.lock.json').read_text())
        for name in lock['sky']['overlay']:
            self.assertTrue(package.include_hub('integrations/sky-overlay/' + name), name)

    def test_inputs_include_connected_source_and_artwork_but_exclude_bulk_and_outputs(self):
        for name in ['frontend/src/config/orasSite.json', 'runtimes/sky-adapter/entry.mjs',
                     'runtimes/sky-adapter/assets/pennsylvania-woodland-v1/panorama.png',
                     'packages/runtime-protocol/endpoint.mjs', 'scripts/Dockerfile.stellarium-jsbuild',
                     'integrations/sky-overlay/src/modules/stars.c', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'alembic/env.py', 'alembic.ini']:
            self.assertTrue(package.include_hub(name), name)
        for name in ['data/runtime-packs/planetary-systems/release/x.json',
                     'frontend/public/oras-sky-engine/js/runtime.wasm', 'frontend/node_modules/x.js',
                     'docs/validation/screenshot.png', '.env', 'frontend/.env.local', 'frontend/test-results/screen.png', 'output/private.json']:
            self.assertFalse(package.include_hub(name), name)

    def test_archive_is_deterministic_and_manifest_detects_tampering(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / 'source'
            root.mkdir()
            (root / 'source.c').write_text('source\n')
            manifest = package.inventory(root)
            package.validate(root, manifest)
            first, second = Path(directory) / 'a.tgz', Path(directory) / 'b.tgz'
            package.archive(root, first)
            package.archive(root, second)
            self.assertEqual(first.read_bytes(), second.read_bytes())
            (root / 'source.c').write_text('modified\n')
            with self.assertRaises(ValueError):
                package.validate(root, manifest)

    def test_symlinks_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'escape').symlink_to('/etc/passwd')
            with self.assertRaises(ValueError):
                package.inventory(root)


if __name__ == '__main__':
    unittest.main()
