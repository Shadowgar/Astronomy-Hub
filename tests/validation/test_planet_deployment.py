"""Check the canonical Compose delivery contract without starting any services."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


class PlanetDeploymentTests(unittest.TestCase):
    def model(self, filename):
        # This checkout need not contain the owner's private development .env.
        with tempfile.TemporaryDirectory() as folder:
            override = Path(folder) / 'env-only.yaml'
            override.write_text('services:\n  frontend:\n    env_file: !reset []\n')
            result = subprocess.run([
                'docker', 'compose', '--env-file', '/dev/null',
                '--project-directory', str(ROOT), '-f', str(ROOT / filename),
                '-f', str(override), 'config', '--format', 'json',
            ], capture_output=True, text=True,
                env={**os.environ, 'POSTGRES_PASSWORD': 'test-only'})
        self.assertEqual(result.returncode, 0, result.stderr)
        return json.loads(result.stdout)['services']

    def test_science_sources_are_readonly_runtime_mounts(self):
        for filename in ('docker-compose.yml', 'docker-compose.prod.yml'):
            with self.subTest(compose=filename):
                backend = self.model(filename)['backend']
                for variable in ('ORAS_LUNAR_ORIENTATION_DIR', 'ORAS_PLANETARY_SYSTEMS_DIR'):
                    target = backend['environment'].get(variable)
                    self.assertIsNotNone(target, variable)
                    mount = next(m for m in backend['volumes'] if m['target'] == target)
                    self.assertEqual(mount['type'], 'bind')
                    self.assertTrue(mount['read_only'])
                    self.assertFalse(mount.get('bind', {}).get('create_host_path', False))

    def test_moon_delivery_is_separate_from_hub_and_earth_artifacts(self):
        for filename in ('docker-compose.yml', 'docker-compose.prod.yml'):
            with self.subTest(compose=filename):
                services = self.model(filename)
                planet = services['planet-runtime']
                self.assertIn('planet-runtime', services['frontend']['depends_on'])
                mounts = {m['target']: m for m in planet['volumes']}
                for target in ('/runtime', '/planet-data'):
                    self.assertTrue(mounts[target]['read_only'])
                    self.assertFalse(mounts[target].get('bind', {}).get('create_host_path', False))
                self.assertNotEqual(mounts['/runtime']['source'],
                    next(m['source'] for m in services['earth-runtime']['volumes'] if m['target'] == '/runtime'))


if __name__ == '__main__':
    unittest.main()
