"""Promote Sky UI; native changes require the bounded horizon build attestation."""
from pathlib import Path
import argparse,hashlib,json,sys,shutil,subprocess
repo=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('dist');parser.add_argument('--native-horizon-attestation')
args=parser.parse_args()
dist=Path(args.dist).resolve();target=repo/'frontend/public/oras-sky-engine'
lockpath=repo/'integrations/renderers.lock.json';lock=json.loads(lockpath.read_text())
native=None
if args.native_horizon_attestation:
 attestation=Path(args.native_horizon_attestation).resolve()
 assert dist==attestation.parent/'upstream/apps/web-frontend/dist','Isolated native build required'
 original=attestation.read_bytes()
 source_record=json.loads(original)
 source_args=['--source-repo',source_record['source_repository']] if 'source_repository' in source_record else []
 subprocess.run([sys.executable,str(repo/'scripts/runtime/attest_sky_horizon.py'),str(attestation.parent/'upstream'),*source_args],check=True)
 assert attestation.read_bytes()==original,'Native attestation no longer matches build inputs'
 native=json.loads(original)
 assert native['purpose']=='embedded-zero-horizon-colors' and native['comparison_anchor']==lock['sky']['comparison_anchor']
 assert native['native_builder']==lock['sky']['reconstruction']['build_image_id']
 expected={row['path']:row['sha256'] for row in native['frontend_artifacts']}
 actual={p.relative_to(dist).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in dist.rglob('*') if p.is_file()}
 assert actual==expected,'Attested frontend artifacts changed'
for row in lock['sky']['artifact_files']:
 if (row['path'].startswith('js/') and not Path(row['path']).name.startswith('app.')) or row['path'].startswith('css/chunk-vendors.'):
  if not native:assert (dist/row['path']).is_file() and hashlib.sha256((dist/row['path']).read_bytes()).hexdigest()==row['sha256'],'Qualified native/vendor chunk changed'
marker={'runtime':'oras-sky-engine','comparison_anchor':lock['sky']['comparison_anchor'],'overlay_version':'oras-sky-workspace.1','native_wasm_identical':True,'native_vendor_chunks_identical':True,'builder':'node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0','adapter_sha256':hashlib.sha256((repo/'runtimes/sky-adapter/plugin.js').read_bytes()).hexdigest()}
if not native and 'native_horizon' in lock['sky']:marker['native_horizon']=lock['sky']['native_horizon']
if native:
 marker['native_wasm_identical']=False
 marker['native_vendor_chunks_identical']=False
 marker['native_horizon']={key:native[key] for key in ['purpose','comparison_anchor','native_builder','patch_path','patch_sha256','landscape_source_sha256','source_input_sha256','native_output_sha256']}
marker['bridge_input_sha256']={name:hashlib.sha256((repo/'runtimes/sky-adapter'/name).read_bytes()).hexdigest() for name in ['entry.mjs','native-panels.mjs','satellite-presentation.mjs']}
marker['wheel_input_sha256']=hashlib.sha256((repo/'runtimes/sky-adapter/native-wheel.mjs').read_bytes()).hexdigest()
marker['navigation_input_sha256']={name:hashlib.sha256((repo/'packages/runtime-protocol'/name).read_bytes()).hexdigest() for name in ['continued-input.mjs','navigation.mjs','observer-elevation.mjs']}
files=[]
for p in sorted(dist.rglob('*')):
 if not p.is_file() or p.name=='oras-runtime-build.json':continue
 relative=p.relative_to(dist)
 assert relative.parts[0]!='skydata','Do not promote data bulk'
 files.append((relative,p))
for row in lock['sky']['artifact_files']:
 p=target/row['path']
 if p.is_file():p.unlink()
for relative,p in files:
 dest=target/relative;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
# Hash the complete application payload, excluding its self-identifying marker.
payload_rows=[{'path':relative.as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for relative,p in files]
marker['artifact_sha256']=hashlib.sha256(json.dumps(payload_rows,separators=(',',':')).encode()).hexdigest()
(target/'oras-runtime-build.json').write_text(json.dumps(marker,indent=2)+'\n')
paths=[target/relative for relative,_ in files]+[target/'oras-runtime-build.json']
rows=[{'path':p.relative_to(target).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(paths)]
lock['sky']['bridge_input_sha256']=marker['bridge_input_sha256']
lock['sky']['workspace_adapter_sha256']=marker['adapter_sha256']
lock['sky']['wheel_input_sha256']=marker['wheel_input_sha256']
lock['sky']['navigation_input_sha256']=marker['navigation_input_sha256']
if native:
 lock['sky']['native_horizon']=marker['native_horizon']
 lock['sky']['build_recipe']='scripts/runtime/build_sky_horizon.sh'
 reconstruction=lock['sky']['reconstruction']
 reconstruction.setdefault('baseline_native_wasm_identical',reconstruction['native_wasm_identical'])
 reconstruction['native_wasm_identical']=False
 if 'regression' in reconstruction:reconstruction['baseline_regression']=reconstruction.pop('regression')
lock['sky']['artifact_files']=rows
lock['sky']['artifact_sha256']=marker['artifact_sha256']
lock['sky']['artifact_hash_scope']='Application files excluding identity marker'
lock['sky']['overlay']['apps/web-frontend/src/components/gui.vue']=hashlib.sha256((repo/'integrations/sky-overlay/apps/web-frontend/src/components/gui.vue').read_bytes()).hexdigest()
lock['sky']['reconstruction']['bridge_overlay']='workspace.1'
lock['sky']['overlay_version']='oras-sky-workspace.1';lock['bridge']={'major':1,'minor':2}
lockpath.write_text(json.dumps(lock,indent=2)+'\n')
print('SKY WORKSPACE ARTIFACT',lock['sky']['artifact_sha256'],'attested native horizon patch' if native else 'native WASM/vendor chunks unchanged',len(rows),'files')
