"""Read-only source, artifact, served-byte and owner-state evidence. No deployment."""
import hashlib,json,subprocess,sys,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[2];out=root/'output/r2-earth-ux';base='158a77053ea18e4d0aed8725f715ca373930fd13'
sha=lambda b:hashlib.sha256(b).hexdigest()
run=lambda *a:subprocess.check_output(a,cwd=root,text=True).strip()
head=run('git','rev-parse','HEAD');sys.path.insert(0,str(root/'scripts/runtime'));from earth_artifact import verify
release=verify(out/'earth-final-first',root,qualified=True);assert release==verify(out/'earth-final-second',root,qualified=True)
for row in release['inputs']:
 name=row['path'];path=name if name.startswith('packages/')else 'runtimes/earth-runtime/'+name
 assert sha((root/path).read_bytes())==row['sha256'];assert sha(subprocess.check_output(['git','show',head+':'+path],cwd=root))==row['sha256']
build=json.loads((out/'reproducible-final-builds.json').read_text());assert build['status']=='PASS'
hub_sources=[]
for path in run('git','ls-files','frontend/src','frontend/index.html','frontend/vite.config.mjs','frontend/package.json','frontend/package-lock.json','frontend/public/runtime-versions.json').splitlines():
 data=(root/path).read_bytes();assert data==subprocess.check_output(['git','show',head+':'+path],cwd=root),('uncommitted Hub source',path);hub_sources.append({'path':path,'sha256':sha(data)})

def get(origin,path):
 with urllib.request.urlopen(origin+path,timeout=15)as response:assert response.status==200;return response.read()
for origin in ['http://127.0.0.1:4206','http://127.0.0.1:4207']:
 assert get(origin,'/earth-runtime/release.json')==(out/'earth-final-first/release.json').read_bytes()
 for row in release['files']:assert sha(get(origin,'/earth-runtime/'+row['path']))==row['sha256'],row['path']
 for row in build['hubRows']:assert sha(get(origin,'/'+row['path']))==row['sha256'],row['path']
protected=['runtimes/earth-runtime/core/CameraController.mjs','runtimes/earth-runtime/core/EarthRuntime.mjs','runtimes/sky-adapter','frontend/public/oras-sky-engine','vendor','backend','packages/earth-search','data','frontend/src/features/workspace/earthSearch.ts','frontend/src/features/workspace/earthLocationNavigation.ts','frontend/src/features/workspace/useEarthLocation.ts','runtimes/earth-runtime/core/imageryCachePolicy.mjs','runtimes/earth-runtime/core/imageryCacheStore.mjs','package.json','package-lock.json','frontend/package.json','frontend/package-lock.json']
assert not run('git','diff',base,'--',*protected),'Protected source/data drift'
lock=json.loads((root/'integrations/renderers.lock.json').read_text());old=json.loads(run('git','show',base+':integrations/renderers.lock.json'));assert lock['sky']==old['sky']
for key,value in old['earth'].items():
 if key not in ['artifact_sha256','source_input_sha256']:assert lock['earth'][key]==value,key
for row in lock['sky']['artifact_files']:assert sha((root/'frontend/public/oras-sky-engine'/row['path']).read_bytes())==row['sha256']
assert run('git','-C','/var/tmp/oras-cesium/gods-eye','rev-parse','HEAD')=='e7707d9a0f34d9fbffc300023c319f95caa5be30';assert not run('git','-C','/var/tmp/oras-cesium/gods-eye','status','--porcelain')
previous=root/'../r2-b-earth-imagery-cache-1';assert run('git','-C',str(previous),'rev-parse','HEAD')==base
for directory,digest in [(previous/'output/r2-b/earth-first','e0a904a201b11b7c6202cc1467b2cd3c80c02beed58bb0956eab2372c37ac0bf'),(root/'../n1-sky-earth-navigation-1/output/n1/earth','662e617078a4448d8235a2c9925c339ea7126cd430ec38cca5426fe8b60345b5')]:
 previous_release=json.loads((directory/'release.json').read_text());assert previous_release['artifact_sha256']==digest
 for row in previous_release['files']:assert sha((directory/row['path']).read_bytes())==row['sha256']
before=json.loads((out/'preservation-before.json').read_text());assert sha(Path('/home/rocco/Astronomy-Hub/.vscode/settings.json').read_bytes())==before['settingsSha256'];assert sorted(run('docker','volume','ls','-q').splitlines())==sorted(before['volumes'])
now={c['Id']:c for c in json.loads(run('docker','inspect',*[c['Id']for c in before['containers']]))};drift=[]
for old in before['containers']:
 current=now[old['Id']];assert current['Name']==old['Name'];assert sorted(current['Mounts'],key=lambda m:m['Destination'])==sorted(old['Mounts'],key=lambda m:m['Destination']);state={k:current['State'][k]for k in old['State']}
 if state!=old['State']:drift.append({'name':old['Name'],'before':old['State'],'now':state})
assert not drift,drift
receipt={'status':'EXACT_SOURCE_BYTES_AND_PRESERVATION_VERIFIED','head':head,'base':base,'earthArtifact':release['artifact_sha256'],'earthFilesServedPerPreview':len(release['files']),'hubArtifact':build['hub'],'hubSourceManifestSha256':sha(json.dumps(hub_sources,separators=(',',':')).encode()),'hubSourceFiles':len(hub_sources),'hubFilesServedPerPreview':build['hubFiles'],'skyArtifact':lock['sky']['artifact_sha256'],'protected':protected,'originalContainersAndMountsAndStatesIntact':len(now),'volumesIntact':len(before['volumes']),'settingsSha256':before['settingsSha256'],'originalContainerStateDrift':drift,'preservedArtifacts':['R2-B e0a904a2','N1 662e6170'],'preview':'http://127.0.0.1:4206/earth','limits':['Browser qualification is recorded separately; this identity receipt does not execute or relabel earlier journeys.']};(out/'delivery.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt,indent=2))
