import importlib.util
from datetime import datetime, timezone
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[2] / 'scripts/skydata/stage_fresh_native_satellites.py'
spec = importlib.util.spec_from_file_location('recover_tles', SOURCE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

ISS = (
    'ISS (ZARYA)\n'
    '1 25544U 98067A   26297.20915682  .00007800  00000+0  14938-3 0  9991\n'
    '2 25544  51.6335  21.6229 0006884 302.9098  57.1228 15.49030149591752\n'
)

class StageTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026,10,25,12,0,0,tzinfo=timezone.utc)

    def test_recent_valid_record(self):
        data, manifest = mod.select_recent(ISS.encode(),self.now)
        self.assertEqual(data,ISS.encode())
        self.assertEqual(manifest['eligible_record_count'],1)

    def test_excludes_stale(self):
        data, manifest = mod.select_recent(ISS.encode(),datetime(2027,3,1,tzinfo=timezone.utc))
        self.assertEqual(data,b'\n')
        self.assertEqual(manifest['excluded_outside_14day_scope'],1)

    def test_checksum_rejects_fabrication(self):
        changed = ISS.replace('15.49030149591752','15.49030149591753')
        with self.assertRaisesRegex(ValueError,'checksum'):
            mod.select_recent(changed.encode(),self.now)

    def test_no_html(self):
        with self.assertRaisesRegex(ValueError,'HTML'):
            mod.select_recent(b'<html>blocked</html>',self.now)

    def test_no_duplicate(self):
        with self.assertRaisesRegex(ValueError,'Duplicate'):
            mod.select_recent((ISS+ISS).encode(),self.now)

if __name__=='__main__':
    unittest.main()
