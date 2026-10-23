"""Exercise the actual UI promotion script in a disposable repository."""
import json,subprocess,sys,tempfile,unittest,shutil,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
class SkyPromotion(unittest.TestCase):
 def promote(self,horizon,wasm=True,vendor=None):
  with tempfile.TemporaryDirectory() as temp:
   repo=Path(temp);script=repo/'scripts/runtime/record_sky_workspace.py';script.parent.mkdir(parents=True);shutil.copyfile(ROOT/'scripts/runtime/record_sky_workspace.py',script)
   paths=['runtimes/shared/glass.css','runtimes/sky-adapter/native-material.css']+['runtimes/sky-adapter/'+n for n in ['plugin.js','entry.mjs','native-panels.mjs','satellite-presentation.mjs','native-wheel.mjs']]+['packages/runtime-protocol/'+n for n in ['continued-input.mjs','navigation.mjs','observer-elevation.mjs']]+['integrations/sky-overlay/apps/web-frontend/src/components/gui.vue']
   for path in paths:
    target=repo/path;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/path,target)
   dist=repo/'dist';(dist/'js').mkdir(parents=True);(dist/'js/chunk-vendors.fixture.js').write_text('qualified native vendor fixture');(dist/'js/engine.wasm').write_bytes(b'qualified wasm fixture');(dist/'js/app.fixture.js').write_text('UI-only fixture')
   rows=[{'path':p.relative_to(dist).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}for p in sorted(dist.rglob('*'))if p.is_file()]
   lock={'sky':{'comparison_anchor':'fixture-pin','artifact_files':rows,'reconstruction':{'native_wasm_identical':wasm,'bridge_overlay':'workspace.1'},'overlay':{}}}
   if vendor is not None:lock['sky']['reconstruction']['native_vendor_chunks_identical']=vendor
   if horizon:lock['sky']['native_horizon']={'purpose':'embedded-zero-horizon-colors','native_output_sha256':{'fixture':'existing attestation'}}
   lockpath=repo/'integrations/renderers.lock.json';lockpath.write_text(json.dumps(lock));subprocess.run([sys.executable,str(script),str(dist)],check=True,capture_output=True,text=True)
   result=json.loads((repo/'frontend/public/oras-sky-engine/oras-runtime-build.json').read_text());after=json.loads(lockpath.read_text());self.assertEqual(after['sky']['reconstruction'],lock['sky']['reconstruction']);return result,lock
 def test_original_upstream_identity_remains_true(self):
  marker,_=self.promote(False);self.assertIs(marker['native_wasm_identical'],True);self.assertIs(marker['native_vendor_chunks_identical'],True)
 def test_ui_promotion_preserves_existing_horizon_native_changes(self):
  marker,lock=self.promote(True,wasm=False);self.assertEqual(marker['native_horizon'],lock['sky']['native_horizon']);self.assertIs(marker['native_wasm_identical'],False);self.assertIs(marker['native_vendor_chunks_identical'],False)
 def test_explicit_vendor_identity_is_preserved_independently(self):
  marker,_=self.promote(True,wasm=False,vendor=True);self.assertIs(marker['native_wasm_identical'],False);self.assertIs(marker['native_vendor_chunks_identical'],True)
if __name__=='__main__':unittest.main()
