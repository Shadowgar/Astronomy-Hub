from pathlib import Path
import hashlib,json,subprocess,urllib.request
root=Path.cwd();out=root/'output/solar-cinematic-balance';sha=lambda b:hashlib.sha256(b).hexdigest()
def tree(p):return {f.relative_to(p).as_posix():sha(f.read_bytes())for f in sorted(p.rglob('*'))if f.is_file()}
a=tree(out/'hub');assert a==tree(out/'hub-second')==tree(out/'hub-docker')==tree(root/'output/cinematic-acceptance/hub')
for base in ['http://127.0.0.1:4217','http://172.26.23.204:4218']:
 for name,h in a.items():assert sha(urllib.request.urlopen(base+'/'+name,timeout=15).read())==h,(base,name)
lock=json.load(open('integrations/renderers.lock.json'));served=json.load(urllib.request.urlopen('http://172.26.23.204:4218/runtime-versions.json'));assert served['earth']==lock['earth'] and served['sky']['artifact_sha256']==lock['sky']['artifact_sha256']
protected=['backend/app','packages','runtimes','integrations','frontend/public','frontend/src/features/solar/assets','docs/design/cinematic-references-2026-10-21']
assert not subprocess.check_output(['git','diff','155e7df9','--',*protected]),'Protected source changed'
files=['frontend/src/features/solar/'+name for name in ['solarContracts.ts','SolarScene.ts','SolarWorkspace.tsx','solarPresentation.ts','solar.css']]
r={'status':'PASS','head':subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip(),'note':'Head identifies commit available at capture; sourceHashes identify the actual candidate. Postcommit receipt recorded separately.','sourceHashes':{p:sha(Path(p).read_bytes())for p in files},'hubArtifact':sha(json.dumps(a,sort_keys=True,separators=(',',':')).encode()),'hubFiles':len(a),'identicalBuilds':3,'servedBytesMatched':['127.0.0.1:4217','172.26.23.204:4218'],'earthArtifact':lock['earth']['artifact_sha256'],'skyArtifact':lock['sky']['artifact_sha256'],'protectedPathsUnchanged':protected,'ownerVisualAcceptance':'PENDING'}
(out/'delivery.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r,indent=2))
