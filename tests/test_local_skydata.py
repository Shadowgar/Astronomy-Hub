"""Installed data selection across real disposable Git worktrees; fixtures only."""
import importlib.util
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    'skydata_path', Path(__file__).parents[1] / 'scripts/runtime/skydata_path.py'
)


class LocalSkydataTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.main = Path(self.tmp.name) / 'main'
        self.main.mkdir()
        self.git('init', str(self.main), cwd=Path(self.tmp.name))
        self.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
                 'commit', '--allow-empty', '-m', 'Fixture')
        self.linked = Path(self.tmp.name) / 'linked'
        self.git('worktree', 'add', '-b', 'linked', str(self.linked))
        self.data = self.main / 'frontend/public/oras-sky-engine/skydata'
        self.install_fixture(self.data)
        self.tool = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.tool)

    def git(self, *args, cwd=None):
        return subprocess.run(['git', *args], cwd=cwd or self.main,
                              check=True, capture_output=True, text=True)

    @staticmethod
    def install_fixture(data):
        survey = data / 'surveys/gaia/v1'
        (survey / 'Norder3/Dir0').mkdir(parents=True)
        (survey / 'properties').write_text('type=stars\nhips_tile_format=eph\n')
        (survey / 'Norder3/Dir0/Npix0.eph').write_bytes(b'fixture tile')

    def test_linked_worktree_uses_installed_owner_data(self):
        partial = self.linked / 'frontend/public/oras-sky-engine/skydata/packs'
        partial.mkdir(parents=True)
        self.assertEqual(self.tool.resolve_skydata(self.linked), self.data)

    def test_main_checkout_uses_its_installed_data(self):
        self.assertEqual(self.tool.resolve_skydata(self.main), self.data)

    def test_explicit_installed_directory_is_preserved(self):
        other = Path(self.tmp.name) / 'owner-supplied'
        self.install_fixture(other)
        self.assertEqual(self.tool.resolve_skydata(self.linked, str(other)), other)

    def test_missing_gaia_fails_instead_of_selecting_partial_data(self):
        (self.data / 'surveys/gaia/v1/properties').unlink()
        with self.assertRaisesRegex(ValueError, 'Gaia'):
            self.tool.resolve_skydata(self.linked)

    def test_metadata_without_tiles_fails(self):
        (self.data / 'surveys/gaia/v1/Norder3/Dir0/Npix0.eph').unlink()
        with self.assertRaisesRegex(ValueError, 'Gaia'):
            self.tool.resolve_skydata(self.main)

    def test_launcher_stops_before_runtime_work_when_data_is_missing(self):
        # Intercept later runtime commands so the failure test has no Docker or
        # artifact side effects, even if the launcher's fail-fast guard breaks.
        commands = Path(self.tmp.name) / 'commands'
        commands.mkdir()
        python = commands / 'python3'
        python.write_text(
            '#!/bin/sh\n'
            'if [ "$1" = "scripts/runtime/skydata_path.py" ]; then\n'
            f'  exec "{sys.executable}" "$@"\n'
            'fi\n'
            'echo UNEXPECTED_RUNTIME_WORK >&2\nexit 42\n'
        )
        python.chmod(0o755)
        env = dict(os.environ, PATH=f'{commands}:{os.environ["PATH"]}',
                   ORAS_SKYDATA_HOST_DIR=str(Path(self.tmp.name) / 'missing'))
        result = subprocess.run(
            ['bash', str(Path(__file__).parents[1] / 'scripts/dev-local-stack.sh')],
            env=env, capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn('Gaia', result.stderr)
        self.assertNotIn('UNEXPECTED_RUNTIME_WORK', result.stderr)


if __name__ == '__main__':
    unittest.main()
