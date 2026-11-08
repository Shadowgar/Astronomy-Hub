from pathlib import Path
import json,hashlib,subprocess
root=Path.cwd();base='4e07ebfb4821b57e6bed3df4937eb78cce9755ee';sha=lambda b:hashlib.sha256(b).hexdigest();git=lambda *a:subprocess.check_output(['git',*a])
protected=['packages/runtime-protocol','packages/imagery-cache','backend/app','scripts/skydata','frontend/src/features/solar/assets','docs/design/cinematic-references-2026-10-21','docs/design/Astronomy_Hub_Approved_Design_References_2026-10-21.zip']
for p in protected:assert not git('diff',base,'--',p).strip(),p
assert git('diff','--name-only',base,'--','runtimes/earth-runtime').decode().splitlines()==['runtimes/earth-runtime/core/ViewerController.mjs']
assert git('diff','--name-only',base,'--','runtimes/sky-adapter').decode().splitlines()==['runtimes/sky-adapter/plugin.js']
for p in git('ls-tree','-r','--name-only',base).decode().splitlines():
 if 'rollback'in p.lower():assert git('show',base+':'+p)==(root/p).read_bytes(),p
old=json.loads(git('show',base+':integrations/renderers.lock.json'));new=json.loads((root/'integrations/renderers.lock.json').read_text())
for kind,key in [('earth','sha'),('sky','comparison_anchor')]:assert old[kind][key]==new[kind][key]
for row in old['sky']['artifact_files']:
 if row['path'] in ['index.html','oras-runtime-build.json'] or row['path'].startswith('js/app.'):continue
 assert sha((root/'frontend/public/oras-sky-engine'/row['path']).read_bytes())==row['sha256'],row['path']
settings=Path('/home/rocco/Astronomy-Hub/.vscode/settings.json');snapshot=json.loads((root.parent/'cinematic-foundation-1/output/cinematic-hub/preservation.json').read_text());assert sha(settings.read_bytes())==snapshot['ownerSettingsSha256']
kernel=Path('/home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release/de442s.bsp');assert sha(kernel.read_bytes())=='54d97562a5b094d298b1b8eafa5a2e17e3e010ce85e1a366d07f003ad159323c'
pin=Path('/var/tmp/oras-cesium/gods-eye');assert subprocess.check_output(['git','-C',str(pin),'rev-parse','HEAD'],text=True).strip()==new['earth']['sha'];assert not subprocess.check_output(['git','-C',str(pin),'status','--porcelain']).strip()
ids=subprocess.check_output(['docker','ps','-aq'],text=True).split();current=json.loads(subprocess.check_output(['docker','inspect',*ids]));byid={c['Id']:c for c in current};changes=[]
for c in snapshot['containers']:
 now=byid.get(c['id']);assert now is not None,c['name'];expected=c['state']
 if c['name'].lstrip('/') in snapshot.get('intentionalTaskStarts',[]):expected='running'
 if now['State']['Status']!=expected or sorted(now['Mounts'],key=lambda m:m['Destination'])!=sorted(c['mounts'],key=lambda m:m['Destination']):changes.append(c['name'])
assert not changes,changes
volumes=subprocess.check_output(['docker','volume','ls','-q'],text=True).split();assert set(snapshot['volumes'])<=set(volumes)
r={'status':'PASS','baseline':base,'head':git('rev-parse','HEAD').decode().strip(),'protectedPaths':protected,'nativeSkyUnchangedPayloadFiles':108,'originalContainers':len(snapshot['containers']),'containerStateAndMountChanges':changes,'originalVolumes':len(snapshot['volumes']),'currentVolumes':len(volumes),'ownerSettingsSha256':sha(settings.read_bytes()),'kernelSha256':sha(kernel.read_bytes()),'upstreamPin':new['earth']['sha'],'earthCandidateArtifact':new['earth']['artifact_sha256'],'skyCandidateArtifact':new['sky']['artifact_sha256'],'allowedChanges':'Owned Earth resolution and owned Sky UI/default only; original artifacts and pins retained'}
print(json.dumps(r,indent=2))
