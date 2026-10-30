"""Read-only exact-source, served-byte and preservation receipt for R2-B."""
import argparse,hashlib,json,subprocess,sys,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--committed',action='store_true');args=p.parse_args()
sha=lambda b:hashlib.sha256(b).hexdigest()
run=lambda *a:subprocess.check_output(a,cwd=root,text=True).strip()
out=root/'output/r2-b';head=run('git','rev-parse','HEAD');base='27f34a94198f2061c0a5083a68beebd567c7d87f'
def get(path):
    with urllib.request.urlopen('http://127.0.0.1:4204'+path,timeout=15)as r:
        assert r.status==200,path
        return r.read()
def source(path,digest):
    assert sha((root/path).read_bytes())==digest,('source drift',path)
    if args.committed:assert sha(subprocess.check_output(['git','show',head+':'+path],cwd=root))==digest,('uncommitted',path)
sys.path.insert(0,str(root/'scripts/runtime'));from earth_artifact import verify
release=verify(out/'earth-first',root,qualified=True)
for directory in ['earth-final-first','earth-final-second']:
    other=verify(out/directory,root,qualified=True);assert other==release
    assert (out/directory/'release.json').read_bytes()==(out/'earth-first/release.json').read_bytes()
for row in release['inputs']:
    name=row['path'];path=name if name.startswith('packages/')else 'runtimes/earth-runtime/'+name
    source(path,row['sha256'])
assert get('/earth-runtime/release.json')==(out/'earth-first/release.json').read_bytes()
for row in release['files']:assert sha(get('/earth-runtime/'+row['path']))==row['sha256'],row['path']
builds=json.loads((out/'hub-builds.json').read_text());assert builds['status']=='PASS'
for directory in [root/'frontend/dist',out/builds['first'],out/builds['second']]:
    assert {str(f.relative_to(directory)):sha(f.read_bytes())for f in directory.rglob('*')if f.is_file()}==builds['hashes'],str(directory)
for name,digest in builds['hashes'].items():assert sha(get('/'+name))==digest,name
protected=['runtimes/earth-runtime/core/CameraController.mjs','runtimes/earth-runtime/core/RuntimeBridge.mjs','runtimes/earth-runtime/core/EarthRuntime.mjs','packages/runtime-protocol','vendor','runtimes/sky-adapter','frontend/public/oras-sky-engine','packages/earth-search','backend','frontend/src/features/workspace/EarthSearch.tsx','frontend/src/features/workspace/earthSearch.ts','frontend/src/features/workspace/EarthExplore.tsx','frontend/src/features/workspace/earthLocationNavigation.ts','frontend/src/features/workspace/useEarthLocation.ts','package.json','package-lock.json','frontend/package.json','frontend/package-lock.json']
assert not run('git','diff',base,'--',*protected),'protected source changed'
lock=json.loads((root/'integrations/renderers.lock.json').read_text());old=json.loads(run('git','show',base+':integrations/renderers.lock.json'))
assert lock['sky']==old['sky']
for key,value in old['earth'].items():
    if key not in ['artifact_sha256','source_input_sha256','public_exports']:assert lock['earth'][key]==value,('source pin drift',key)
assert lock['earth']['public_exports']==['maps/controller','maps/defaults','maps/catalog','maps/imagery']+old['earth']['public_exports']
assert json.loads(get('/runtime-versions.json'))==json.loads((root/'frontend/public/runtime-versions.json').read_text())
for row in lock['sky']['artifact_files']:assert sha((root/'frontend/public/oras-sky-engine'/row['path']).read_bytes())==row['sha256']
proofs=[]
for folder in ['r2-b-navigation-1440','r2-b-navigation-390','r2-b-imagery-1440','r2-b-imagery-390','r2-b-cache-failures-1440','r2-b-cache-failures-390','r2-b-hub-1440','r2-b-hub-390']:
    directory=root/'output/playwright'/folder;proof=json.loads((directory/'proof.json').read_text());assert proof['status']=='PASS',(folder,proof.get('error'))
    for path,digest in proof['sourceHashes'].items():source(path,digest)
    rows=proof.get('phases',[])+proof.get('scenes',[])
    for r in proof.get('runs',[]):assert r['status']=='PASS';rows+=r['scenes']
    for row in rows:
        if 'file'in row:assert sha((directory/row['file']).read_bytes())==row['sha256']
    if 'sourcesFile'in proof:assert sha((directory/proof['sourcesFile']).read_bytes())==proof['sourcesSha256']
    proofs.append({'suite':folder,'proofSha256':sha((directory/'proof.json').read_bytes()),'status':proof['status']})
search=[]
for part in ['desktop','mobile']:
    directory=root/'output/playwright'/('r2-b-search-'+part)
    current=json.loads((directory/'proof.json').read_text());assert current['status']=='FAIL'and '503 !== 200'in current['error']
    for path,digest in current['sourceHashes'].items():source(path,digest)
    previous=json.loads((root/'output/playwright'/('r2-b-search-'+part+'-phase1')/'proof.json').read_text());assert previous['status']=='PASS'and len(previous['runs'][0]['steps'])==14
    for path,digest in previous['sourceHashes'].items():
        if path not in ['integrations/renderers.lock.json','frontend/public/runtime-versions.json']:source(path,digest)
    search.append({'suite':part,'fresh':'FAIL: first real Springfield lookup503, expected200; remaining13 groups not reached','historical':'Phase1 PASS14 groups; previous artifact3c6c5ffa, not a new pass','currentProofSha256':sha((directory/'proof.json').read_bytes())})
old_phase=json.loads((out/'earth-phase1-before-review/release.json').read_text());assert {r['path']for r in old_phase['inputs']}=={r['path']for r in release['inputs']}
changed_inputs=[r['path']for r in release['inputs']if next(o['sha256']for o in old_phase['inputs']if o['path']==r['path'])!=r['sha256']];assert changed_inputs==['core/ImageryController.mjs']
before=json.loads((out/'preservation-before.json').read_text());assert sha(Path('/home/rocco/Astronomy-Hub/.vscode/settings.json').read_bytes())==before['settingsSha256']
assert sorted(run('docker','volume','ls','-q').splitlines())==sorted(before['volumes'])
now={c['Id']:c for c in json.loads(run('docker','inspect',*[c['Id']for c in before['containers']]))};drift=[]
for old in before['containers']:
    current=now[old['Id']];assert current['Name']==old['Name'];assert sorted(current['Mounts'],key=lambda m:m['Destination'])==sorted(old['Mounts'],key=lambda m:m['Destination'])
    state={k:current['State'][k]for k in old['State']}
    if state!=old['State']:drift.append({'name':old['Name'],'before':old['State'],'now':state})
assert run('git','-C',str(root/'../r2-a-earth-search-1'),'rev-parse','HEAD')==base
assert not run('git','-C',str(root/'../r2-a-earth-search-1'),'status','--porcelain')
assert run('git','-C','/var/tmp/oras-cesium/gods-eye','rev-parse','HEAD')==before['upstream']
assert not run('git','-C','/var/tmp/oras-cesium/gods-eye','status','--porcelain')
old_artifact=root/'../n1-sky-earth-navigation-1/output/n1/earth';old_release=json.loads((old_artifact/'release.json').read_text());assert old_release['artifact_sha256']=='662e617078a4448d8235a2c9925c339ea7126cd430ec38cca5426fe8b60345b5'
for row in old_release['files']:assert sha((old_artifact/row['path']).read_bytes())==row['sha256']
receipt={'status':'AVAILABLE_FUNCTIONALITY_VERIFIED; LIVE_PLACE_REQUALIFICATION_BLOCKED; AERIAL_SOURCE_LIMITATIONS','head':head,'committed':args.committed,'earthArtifact':release['artifact_sha256'],'earthFilesServed':len(release['files']),'hubFilesServed':builds['files'],'skyArtifact':lock['sky']['artifact_sha256'],'protected':protected,'proofs':proofs,'liveSearch':search,'reviewedRuntimeDeltaFromPhase1':changed_inputs,'originalContainersAndMountsIntact':len(now),'volumesIntact':len(before['volumes']),'settingsSha256':before['settingsSha256'],'originalContainerStateDrift':drift,'stateDriftNote':'Observed upon continuation after interruption; cause unknown. No unrelated container was restarted/stopped by this continuation. Only two owned R2-B containers were started.','originalN1Artifact':old_release['artifact_sha256'],'limitations':['Software Chromium/emulated mobile; not physical owner hardware acceptance.','Public providers best effort; partial/fallback observations remain in proof.','PEMA local-only, no managed persistence or public screenshot redistribution.']}
(out/('delivery-committed.json'if args.committed else'delivery-working.json')).write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt,indent=2))
