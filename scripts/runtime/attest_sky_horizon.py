"""Attest the one authorized downstream native patch and its isolated build."""
from pathlib import Path
import argparse,hashlib,io,json,subprocess,sys,tarfile,tempfile
from sky_source import selected_source
repo=Path(__file__).resolve().parents[2]
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('tree',type=Path);parser.add_argument('--source-repo',type=Path);args=parser.parse_args()
tree=args.tree.resolve()
lock=json.loads((repo/'integrations/renderers.lock.json').read_text())
anchor=lock['sky']['comparison_anchor']
source=selected_source(anchor,args.source_repo)
sha=lambda data:hashlib.sha256(data).hexdigest()
patch=repo/'integrations/sky-patches/0001-configurable-zero-horizon.patch'
archive=subprocess.check_output(['git','-C',str(source),'archive',anchor])
expected={};frontend_expected={}
with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
 for member in tar:
  if member.isfile() and (member.name.startswith(('src/','ext_src/','tools/','data/')) or member.name in ['Makefile','SConstruct']):
   expected[member.name]=tar.extractfile(member).read()
  if member.isfile() and member.name.startswith('apps/web-frontend/'):
   frontend_expected[member.name]=tar.extractfile(member).read()
for name,digest in lock['sky']['overlay'].items():
 data=(repo/'integrations/sky-overlay'/name).read_bytes();assert sha(data)==digest
 if name in expected:expected[name]=data
 if name.startswith('apps/web-frontend/'):frontend_expected[name]=data
with tempfile.TemporaryDirectory() as temporary:
 target=Path(temporary)/'src/modules/landscape.c';target.parent.mkdir(parents=True);target.write_bytes(expected['src/modules/landscape.c'])
 subprocess.run(['patch','--directory',temporary,'--strip','1','--fuzz=0','--input',str(patch)],check=True,stdout=subprocess.DEVNULL)
 expected['src/modules/landscape.c']=target.read_bytes()
for name,data in expected.items():
 assert (tree/name).read_bytes()==data,'Unexpected native source change: '+name
rows=[{'path':name,'sha256':sha(data)} for name,data in sorted(expected.items())]
# Reject unexpected C/JS inputs (generated assets are not new compilation units).
actual_units={p.relative_to(tree).as_posix() for directory in ['src','ext_src'] for p in (tree/directory).rglob('*') if p.suffix in ['.c','.cpp','.js']}
assert actual_units=={name for name in expected if name.startswith(('src/','ext_src/')) and Path(name).suffix in ['.c','.cpp','.js']}
native={name:sha((tree/'build'/name).read_bytes()) for name in ['stellarium-web-engine.js','stellarium-web-engine.wasm']}
with tempfile.TemporaryDirectory() as temporary:
 scratch=Path(temporary)
 for name,data in frontend_expected.items():
  target=scratch/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
 subprocess.run([sys.executable,str(repo/'scripts/runtime/integrate_sky_bridge.py'),str(scratch/'apps/web-frontend')],check=True)
 for name in native:
  target=scratch/'apps/web-frontend/src/assets/js'/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes((tree/'build'/name).read_bytes())
 for p in (scratch/'apps/web-frontend').rglob('*'):
  if p.is_file():
   name=p.relative_to(scratch).as_posix();assert (tree/name).read_bytes()==p.read_bytes(),'Unexpected frontend input: '+name
   rows.append({'path':name,'sha256':sha(p.read_bytes())})
 expected_units={p.relative_to(scratch/'apps/web-frontend').as_posix() for part in ['src','public'] for p in (scratch/'apps/web-frontend'/part).rglob('*') if p.is_file()}
 actual_units={p.relative_to(tree/'apps/web-frontend').as_posix() for part in ['src','public'] for p in (tree/'apps/web-frontend'/part).rglob('*') if p.is_file()}
 assert actual_units==expected_units,'Unexpected frontend source file'
rows.sort(key=lambda row:row['path'])
dist=tree/'apps/web-frontend/dist'
wasms=list((dist/'js').glob('*.wasm'));assert len(wasms)==1 and sha(wasms[0].read_bytes())==native['stellarium-web-engine.wasm']
app=tree/'apps/web-frontend/src/plugins/orasRuntime/index.js';assert app.read_bytes()==(repo/'runtimes/sky-adapter/plugin.js').read_bytes()
artifacts=[{'path':p.relative_to(dist).as_posix(),'sha256':sha(p.read_bytes())} for p in sorted(dist.rglob('*')) if p.is_file()]
record={'schema':1,'source_repository':str(source),'source_revision':anchor,'purpose':'embedded-zero-horizon-colors','comparison_anchor':anchor,'native_builder':lock['sky']['reconstruction']['build_image_id'],'patch_path':patch.relative_to(repo).as_posix(),'patch_sha256':sha(patch.read_bytes()),'landscape_source_sha256':sha(expected['src/modules/landscape.c']),'source_inputs':rows,'source_input_sha256':sha(json.dumps(rows,separators=(',',':')).encode()),'native_output_sha256':native,'adapter_sha256':sha(app.read_bytes()),'frontend_artifacts':artifacts}
out=tree.parent/'native-horizon-attestation.json';out.write_text(json.dumps(record,indent=2)+'\n');print('ATTESTED',out,'native inputs',len(rows),'frontend files',len(artifacts))
