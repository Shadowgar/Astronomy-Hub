import os,sys,subprocess,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts/runtime'))
PIN='023e3b26babf7ffddf45f39293230b14cfe96993'
DEFAULT=Path('/var/tmp/oras-phase-c/sky-reconstruction/upstream')
class SourceSelection(unittest.TestCase):
 def test_default_and_real_alternate_pinned_checkout(self):
  from sky_source import selected_source
  with patch.dict(os.environ,{},clear=False):
   os.environ.pop('ORAS_SKY_SOURCE_REPO',None);self.assertEqual(selected_source(PIN),DEFAULT.resolve())
  with tempfile.TemporaryDirectory() as d:
   alternate=Path(d)/'alternate'
   subprocess.run(['git','clone','--shared','--quiet','--no-checkout',str(DEFAULT),str(alternate)],check=True)
   subprocess.run(['git','-C',str(alternate),'checkout','--quiet','--detach',PIN],check=True)
   with patch.dict(os.environ,{'ORAS_SKY_SOURCE_REPO':str(alternate)}):self.assertEqual(selected_source(PIN),alternate.resolve())
   subprocess.run(['git','-C',str(alternate),'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','--allow-empty','--quiet','-m','unapproved fixture revision'],check=True)
   with self.assertRaisesRegex(ValueError,'revision'):selected_source(PIN,alternate)
 def test_bad_override_fails_before_attestation_reads_build_inputs(self):
  with tempfile.TemporaryDirectory() as d:
   env={**os.environ,'ORAS_SKY_SOURCE_REPO':str(Path(d)/'absent')}
   result=subprocess.run([sys.executable,str(ROOT/'scripts/runtime/attest_sky_horizon.py'),str(Path(d)/'build')],env=env,capture_output=True,text=True)
   self.assertNotEqual(result.returncode,0);self.assertIn('Invalid Stellarium source',result.stderr)
   self.assertFalse((Path(d)/'native-horizon-attestation.json').exists())
   build=Path(d)/'must-not-create'
   result=subprocess.run(['bash',str(ROOT/'scripts/runtime/build_sky_horizon.sh')],env={**env,'ORAS_SKY_BUILD_DIR':str(build)},capture_output=True,text=True)
   self.assertNotEqual(result.returncode,0);self.assertIn('Invalid Stellarium source',result.stderr);self.assertFalse(build.exists())
 def test_missing_and_unapproved_source_fail_closed(self):
  from sky_source import selected_source
  with tempfile.TemporaryDirectory() as d:
   with self.assertRaisesRegex(ValueError,'Invalid Stellarium source'):selected_source(PIN,Path(d)/'absent')
   with self.assertRaisesRegex(ValueError,'Invalid Stellarium source'):selected_source(PIN,Path(d))
   with self.assertRaisesRegex(ValueError,'revision'):selected_source('0'*40,DEFAULT)
if __name__=='__main__':unittest.main()
