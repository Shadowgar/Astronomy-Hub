"""Promote a frontend-only SWE build only after native/vendor identity checks."""
from pathlib import Path
import hashlib,json,sys,shutil
repo=Path(__file__).resolve().parents[2]
dist=Path(sys.argv[1]).resolve();target=repo/'frontend/public/oras-sky-engine'
lockpath=repo/'integrations/renderers.lock.json';lock=json.loads(lockpath.read_text())
for row in lock['sky']['artifact_files']:
 if row['path'].startswith('js/') and not Path(row['path']).name.startswith('app.'):
  assert hashlib.sha256((dist/row['path']).read_bytes()).hexdigest()==row['sha256'],'Qualified native/vendor chunk changed'
marker={'runtime':'oras-sky-engine','comparison_anchor':lock['sky']['comparison_anchor'],'overlay_version':'oras-sky-workspace.1','native_wasm_identical':True,'native_vendor_chunks_identical':True,'builder':'node:20-bookworm-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0','adapter_sha256':hashlib.sha256((repo/'runtimes/sky-adapter/plugin.js').read_bytes()).hexdigest()}
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
(target/'oras-runtime-build.json').write_text(json.dumps(marker,indent=2)+'\n')
paths=[target/relative for relative,_ in files]+[target/'oras-runtime-build.json']
rows=[{'path':p.relative_to(target).as_posix(),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(paths)]
lock['sky']['workspace_adapter_sha256']=marker['adapter_sha256']
lock['sky']['artifact_files']=rows
lock['sky']['artifact_sha256']=hashlib.sha256(json.dumps(rows,separators=(',',':')).encode()).hexdigest()
lock['sky']['overlay']['apps/web-frontend/src/components/gui.vue']=hashlib.sha256((repo/'integrations/sky-overlay/apps/web-frontend/src/components/gui.vue').read_bytes()).hexdigest()
lock['sky']['reconstruction']['bridge_overlay']='workspace.1'
lock['sky']['overlay_version']='oras-sky-workspace.1';lock['bridge']={'major':1,'minor':1}
lockpath.write_text(json.dumps(lock,indent=2)+'\n')
print('SKY WORKSPACE ARTIFACT',lock['sky']['artifact_sha256'],'native WASM/vendor chunks unchanged',len(rows),'files')
