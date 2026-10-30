from pathlib import Path
import hashlib,json,subprocess,urllib.request
root=Path.cwd();out=root/'output/cinematic-acceptance';sha=lambda b:hashlib.sha256(b).hexdigest();base='http://127.0.0.1:4217'
def tree(p):return {f.relative_to(p).as_posix():sha(f.read_bytes())for f in sorted(p.rglob('*'))if f.is_file()}
a=tree(out/'hub');assert a==tree(out/'hub-second')==tree(out/'hub-docker')
for name,h in a.items():assert sha(urllib.request.urlopen(base+'/'+name,timeout=15).read())==h,name
e=tree(out/'earth-first');assert e==tree(out/'earth-second')
for name,h in e.items():assert sha(urllib.request.urlopen(base+'/earth-runtime/'+name,timeout=15).read())==h,name
lock=json.loads((root/'integrations/renderers.lock.json').read_text());served=json.load(urllib.request.urlopen(base+'/runtime-versions.json'));assert served['earth']==lock['earth'];assert served['sky']['artifact_sha256']==lock['sky']['artifact_sha256']
for row in lock['sky']['artifact_files']:assert sha((root/'frontend/public/oras-sky-engine'/row['path']).read_bytes())==row['sha256'],row['path']
inputs=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard','frontend/src','backend/app','runtimes','packages','integrations/renderers.lock.json','frontend/public/runtime-versions.json','scripts/validation/verify_cinematic_hub.mjs','scripts/validation/verify_cinematic_earth_acceptance.mjs','scripts/validation/verify_cinematic_sky_acceptance.mjs','scripts/validation/verify_solar_acceptance.mjs','scripts/validation/verify_cinematic_lifecycle.mjs'],text=True).splitlines();sources={p:sha((root/p).read_bytes())for p in inputs if (root/p).is_file()}
nav=json.loads((out/'navigation/proof.json').read_text());assert nav['status']=='PASS'
for p,h in nav['sourceHashes'].items():assert sha((root/p).read_bytes())==h,p
r={'status':'PASS_SOURCE_BUILD_SERVED','head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'base':base,'hubArtifact':sha(json.dumps(a,sort_keys=True,separators=(',',':')).encode()),'hubFiles':len(a),'earthFiles':len(e),'hubBuilds':3,'earthBuilds':2,'earthArtifact':lock['earth']['artifact_sha256'],'skyArtifact':lock['sky']['artifact_sha256'],'sourceHashes':sources,'navigationGroups':{str(r['width']):len(r['steps'])for r in nav['runs']},'ownerVisualAcceptance':'PENDING','physicalGpuMobile':'UNQUALIFIED'}
(out/'delivery.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps({k:v for k,v in r.items()if k!='sourceHashes'},indent=2))
