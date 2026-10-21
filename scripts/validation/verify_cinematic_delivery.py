"""Exact committed source, served bytes and preserved baseline identities.

This verifier does not execute/relabel earlier browser journeys.
"""
from pathlib import Path
import hashlib,json,subprocess,urllib.request
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'output/solar-cinematic';BASE='7aaeeef4e4e9b6ad406752814270ea0970666104'
def sha(data):return hashlib.sha256(data).hexdigest()
def git(*args):return subprocess.check_output(['git',*args],cwd=ROOT)
def tree(path):return {str(p.relative_to(path)):sha(p.read_bytes())for p in sorted(path.rglob('*'))if p.is_file()}
first=tree(OUT/'hub-first');second=tree(OUT/'hub-second');third=tree(OUT/'hub-docker');assert first==second==third,'Hub reproduction mismatch'
served={}
for path,digest in first.items():
 if path.startswith('earth-runtime/'):continue
 with urllib.request.urlopen('http://127.0.0.1:4211/'+path,timeout=15)as response:served[path]=sha(response.read())
 assert served[path]==digest,path
proof=json.loads((ROOT/'output/playwright/solar-cinematic-reviewed-navigation/proof.json').read_text());assert proof['status']=='PASS'
for path,digest in proof['sourceHashes'].items():
 assert sha((ROOT/path).read_bytes())==digest,'Browser source changed: '+path
 assert '--candidate' in __import__('sys').argv or sha(git('show','HEAD:'+path))==digest,'Uncommitted qualified source: '+path
compact=json.loads((ROOT/'output/playwright/solar-cinematic-compact/proof.json').read_text());assert compact['status']=='PASS'
for path,digest in compact['sourceHashes'].items():
 assert sha((ROOT/path).read_bytes())==digest,path
 assert '--candidate' in __import__('sys').argv or sha(git('show','HEAD:'+path))==digest,path
# Engine artifacts, scientific pipelines, native policy and rollback paths remain exact.
protected=['integrations/renderers.lock.json','frontend/public/runtime-versions.json','runtimes/earth-runtime','runtimes/sky-adapter','packages/runtime-protocol','scripts/skydata']
for path in protected:assert not git('diff',BASE,'HEAD','--',path).strip(),'Protected source changed: '+path
lock=json.loads((ROOT/'integrations/renderers.lock.json').read_text())
original=Path('/home/rocco/Astronomy-Hub/.worktrees/r2-earth-ux-performance-1')
assert not subprocess.check_output(['git','status','--porcelain'],cwd=original).strip(),'PR80 owner baseline dirty'
# Mount native bytes directly from preserved PR80 artifact; compare every served file.
earth=original/'output/r2-earth-ux/earth-first';earth_files=tree(earth)
for path,digest in earth_files.items():
 with urllib.request.urlopen('http://127.0.0.1:4211/earth-runtime/'+path,timeout=15)as response:assert sha(response.read())==digest,path
for row in lock['sky']['artifact_files']:
 assert sha((ROOT/'frontend/public/oras-sky-engine'/row['path']).read_bytes())==row['sha256']
assert subprocess.check_output(['git','-C','/var/tmp/oras-cesium/gods-eye','rev-parse','HEAD'],text=True).strip()==lock['earth']['sha']
assert not subprocess.check_output(['git','-C','/var/tmp/oras-cesium/gods-eye','status','--porcelain']).strip()
previous=ROOT.parent/'r2-b-earth-imagery-cache-1'
for directory,digest in [(previous/'output/r2-b/earth-first','e0a904a201b11b7c6202cc1467b2cd3c80c02beed58bb0956eab2372c37ac0bf'),(ROOT.parent/'n1-sky-earth-navigation-1/output/n1/earth','662e617078a4448d8235a2c9925c339ea7126cd430ec38cca5426fe8b60345b5')]:
 release=json.loads((directory/'release.json').read_text());assert release['artifact_sha256']==digest
 for row in release['files']:assert sha((directory/row['path']).read_bytes())==row['sha256']
# Protected paths must also be unchanged in the candidate working tree.
for path in protected:assert not git('diff',BASE,'--',path).strip(),path
subprocess.check_call(['python3','scripts/validation/verify_cinematic_references.py'],cwd=ROOT)
subprocess.check_call(['python3','scripts/validation/verify_solar_assets.py'],cwd=ROOT)
before=json.loads((OUT/'preservation-before.json').read_text())
ids=[c['Id']for c in before['containers']];now=json.loads(subprocess.check_output(['docker','inspect',*ids]))
for old,c in zip(before['containers'],now):assert old['Id']==c['Id']and old['Status']==c['State']['Status']and sorted(old['Mounts'],key=lambda m:m['Destination'])==sorted(c['Mounts'],key=lambda m:m['Destination']),old['Name']
assert subprocess.check_output(['docker','volume','ls','-q'],text=True).split()==before['volumes']
assert sha(Path('/home/rocco/Astronomy-Hub/.vscode/settings.json').read_bytes())==before['settingsSha256']
kernel=Path('/home/rocco/Astronomy-Hub/data/runtime-packs/planetary-ephemeris/release/de442s.bsp');assert sha(kernel.read_bytes())=='54d97562a5b094d298b1b8eafa5a2e17e3e010ce85e1a366d07f003ad159323c'
# Ensure every committed pre-existing rollback remains byte-identical.
rollbacks=[p for p in git('ls-tree','-r','--name-only',BASE).decode().splitlines()if 'rollback'in p.lower()]
for p in rollbacks:assert git('show',BASE+':'+p)==git('show','HEAD:'+p),p
receipt={'status':'PASS_CANDIDATE_BYTES_AND_PRESERVATION' if '--candidate' in __import__('sys').argv else 'PASS_EXACT_SOURCE_BYTES_AND_PRESERVATION','head':git('rev-parse','HEAD').decode().strip(),'base':BASE,'hubArtifact':sha(json.dumps(first,sort_keys=True,separators=(',',':')).encode()),'reproducibleBuilds':3,'hubFiles':len(first),'hubFilesServed':len(served),'earthFilesServed':len(earth_files),'earthArtifact':lock['earth']['artifact_sha256'],'skyArtifact':lock['sky']['artifact_sha256'],'sourceAssets':json.loads((ROOT/'frontend/src/features/solar/assets/provenance.json').read_text())['assets'],'browserProofSha256':sha((ROOT/'output/playwright/solar-cinematic-reviewed-navigation/proof.json').read_bytes()),'browserGroups':{str(r['width']):len(r['steps'])for r in proof['runs']},'compactBrowserChecks':{str(r['width'])+'x'+str(r['height']):len(r['checks'])for r in compact['runs']},'matchedBrowserSources':len(proof['sourceHashes']),'committedBrowserSources':0 if '--candidate' in __import__('sys').argv else len(proof['sourceHashes']),'preservedOriginalContainers':len(now),'preservedVolumes':len(before['volumes']),'settingsSha256':before['settingsSha256'],'preservedTrackedRollbackFiles':len(rollbacks),'kernelSha256':sha(kernel.read_bytes()),'preview':'http://127.0.0.1:4211/solar-system?date=2026-02-28T00:00:00Z','limits':['Browser evidence is source-matched; this verifier does not execute browser journeys.','No owner visual, physical hardware, full R3/R4, merge or production deployment acceptance.']}
(OUT/'delivery.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt,indent=2))
