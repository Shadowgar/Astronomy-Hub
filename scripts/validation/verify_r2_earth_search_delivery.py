"""Verify R2 source-bound browser proof, preserved engines and exact preview bytes."""
import argparse,hashlib,json,re,subprocess,sys,urllib.request
from pathlib import Path

root=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--base',default='http://127.0.0.1:4203');p.add_argument('--earth-artifact',required=True);p.add_argument('--committed',action='store_true');args=p.parse_args()
sha=lambda b:hashlib.sha256(b).hexdigest()
run=lambda *cmd:subprocess.check_output(cmd,cwd=root,text=True).strip()
def get(path):
    with urllib.request.urlopen(args.base+path,timeout=15)as response:
        assert response.status==200 and response.headers.get('Cache-Control')=='no-store',path
        return response.read()
sys.path.insert(0,str(root/'scripts/runtime'));from earth_artifact import verify
release=verify(Path(args.earth_artifact).resolve(),root,qualified=True)
protected=['runtimes','vendor','integrations/renderers.lock.json','packages/runtime-protocol','frontend/public/runtime-versions.json','frontend/public/oras-sky-engine']
subprocess.run(['git','diff','--exit-code','d1e3a75c','--',*protected],cwd=root,check=True,stdout=subprocess.DEVNULL)
head=run('git','rev-parse','HEAD');records=[]
builds=json.loads((root/'output/r2-a/builds.json').read_text());assert builds['status']=='PASS'
for folder in [root/'frontend/dist',root/'output/r2-a'/builds['first'],root/'output/r2-a'/builds['second']]:
    actual={str(f.relative_to(folder)):sha(f.read_bytes())for f in folder.rglob('*')if f.is_file()}
    assert actual==builds['hashes']and len(actual)==builds['files'],('build drift',str(folder))
for name,digest in builds['sourceHashes'].items():
    assert sha((root/name).read_bytes())==digest,('build source drift',name)
    if args.committed:assert sha(subprocess.check_output(['git','show',head+':'+name],cwd=root))==digest

for part in ['desktop','mobile']:
    directory=root/f'output/playwright/r2-a-{part}-qualified';proof=json.loads((directory/'proof.json').read_text())
    assert proof['status']=='PASS'and len(proof['runs'])==1 and proof['runs'][0]['status']=='PASS'
    for name,digest in proof['sourceHashes'].items():
        assert sha((root/name).read_bytes())==digest,('browser source drift',name)
        if args.committed:assert sha(subprocess.check_output(['git','show',head+':'+name],cwd=root))==digest
    for scene in proof['runs'][0]['scenes']:assert sha((directory/scene['file']).read_bytes())==scene['sha256']
    records.append({'suite':part,'proofSha256':sha((directory/'proof.json').read_bytes()),'steps':proof['runs'][0]['steps'],'screenshots':proof['runs'][0]['scenes']})
lock=json.loads((root/'integrations/renderers.lock.json').read_text());assert json.loads(get('/runtime-versions.json'))==json.loads((root/'frontend/public/runtime-versions.json').read_text())
assert get('/earth-runtime/release.json')==(Path(args.earth_artifact)/'release.json').read_bytes()
html=get('/').decode();entry=re.search(r'src="(/assets/[^" ]+\.js)"',html)[1];css=re.findall(r'href="(/assets/[^" ]+\.css)"',html)
served=[]
for name in [entry,*css]:
    data=get(name);assert data==(root/('frontend/dist'+name)).read_bytes();served.append({'url':name,'sha256':sha(data)})
for row in lock['sky']['artifact_files']:
    assert sha((root/'frontend/public/oras-sky-engine'/row['path']).read_bytes())==row['sha256']
    if row['path'].endswith(('.js','.wasm')):assert sha(get('/oras-sky-engine/'+row['path']))==row['sha256']
for row in release['files']:
    if row['path'].startswith('assets/')and row['path'].endswith('.js'):assert sha(get('/earth-runtime/'+row['path']))==row['sha256']
assert get('/licenses/gods-eye-search-MIT.txt')==(root/'packages/earth-search/LICENSE.txt').read_bytes()
baseline=json.loads((root/'output/r2-a/preservation-before.json').read_text())
assert sha(Path('/home/rocco/Astronomy-Hub/.vscode/settings.json').read_bytes())==baseline['settingsSha256']
assert sorted(run('docker','volume','ls','-q').splitlines())==sorted(baseline['volumes'])
current_containers={row['Id']:row for row in json.loads(run('docker','inspect',*[row['Id']for row in baseline['containers']]))}
for previous in baseline['containers']:
    now=current_containers[previous['Id']]
    assert now['State']['StartedAt']==previous['State']['StartedAt'] and now['State']['Status']==previous['State']['Status']and sorted(now['Mounts'],key=lambda m:m['Destination'])==sorted(previous['Mounts'],key=lambda m:m['Destination']),previous['Name']
layout=json.loads((root/'output/playwright/r2-a-final-layout/proof.json').read_text());assert layout['status']=='PASS'
for name,digest in layout['sourceHashes'].items():
    assert sha((root/name).read_bytes())==digest
    if args.committed:assert sha(subprocess.check_output(['git','show',head+':'+name],cwd=root))==digest
for row in layout['runs']:
    assert row['status']=='PASS'
    for file,digest in [('file','sha256'),('addressFile','addressSha256')]:
        assert sha((root/'output/playwright/r2-a-final-layout'/row[file]).read_bytes())==row[digest]

license_proof=json.loads((root/'output/r2-a/license-browser/proof.json').read_text());assert license_proof['status']=='PASS'
for name,digest in license_proof['sourceHashes'].items():
    assert sha((root/name).read_bytes())==digest
    if args.committed:assert sha(subprocess.check_output(['git','show',head+':'+name],cwd=root))==digest
assert license_proof['servedSha256']==sha(get('/licenses/gods-eye-search-MIT.txt'))
out={'status':'PASS','head':head,'committed':args.committed,'base':args.base,'N1':'OWNER ACCEPTED; historical full navigation remains5/22 and7/22, not rerun','focusedBrowser':records,'licenseBrowserProofSha256':sha((root/'output/r2-a/license-browser/proof.json').read_bytes()),'layoutProofSha256':sha((root/'output/playwright/r2-a-final-layout/proof.json').read_bytes()),'served':served,'hubBuildFiles':builds['files'],'hubBuildManifestSha256':sha((root/'output/r2-a/builds.json').read_bytes()),'earthArtifact':release['artifact_sha256'],'skyArtifact':lock['sky']['artifact_sha256'],'acceptedRendererSourcesUnchanged':protected,'originalContainersPreserved':len(baseline['containers']),'volumesPreserved':len(baseline['volumes']),'ownerSettingsSha256':baseline['settingsSha256'],'limitations':['Software Chromium/emulated mobile only','PR71 imagery/cache not integrated','Public Photon best-effort availability; local single-worker admission only']}
(root/'output/r2-a'/('delivery-committed.json'if args.committed else'delivery-working.json')).write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
