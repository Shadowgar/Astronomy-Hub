"""Bind recorded/live search proof to committed source and unchanged R2-B assets."""
import hashlib,json,subprocess,sys,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[2];out=root/'output/r2-b-final-search';out.mkdir(exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
run=lambda *a:subprocess.check_output(a,cwd=root,text=True).strip()
head=run('git','rev-parse','HEAD');baseline='e5239e01ada05e058e4249ddf60981806881fe0e'
protected=['backend','frontend','runtimes','packages','vendor','integrations','data','package.json','package-lock.json']
assert not run('git','diff',baseline,head,'--',*protected),'Production source/data/asset changes require new qualification'
assert not run('git','diff','--',*protected),'Uncommitted production source drift'
# Identity recheck only: does not execute prior successful test/browser suites.
result=subprocess.run([sys.executable,'scripts/validation/verify_r2b_delivery.py','--committed'],cwd=root,capture_output=True,text=True)
(out/'preserved-r2b-identity-log.txt').write_text(result.stdout+result.stderr);assert result.returncode==0,result.stderr
old=json.loads((root/'output/r2-b/delivery-committed.json').read_text());records=[]
for part in ['desktop','mobile']:
 directory=root/'output/playwright'/('r2-b-recorded-search-'+part);proof=json.loads((directory/'proof.json').read_text())
 assert proof['status']=='PASS'and proof['evidenceClass']=='deterministic-recorded-normalized-results-through-real-backend'and proof['livePhotonQualified']is False
 assert run('git','merge-base','--is-ancestor',proof['startedHead'],head)==''
 for name,digest in proof['sourceHashes'].items():
  assert sha((root/name).read_bytes())==digest,name
  assert sha(subprocess.check_output(['git','show',head+':'+name],cwd=root))==digest,('uncommitted source',name)
  assert sha(subprocess.check_output(['git','show',proof['startedHead']+':'+name],cwd=root))==digest,('suite not run at committed source',name)
 assert len(proof['runs'])==1;row=proof['runs'][0];assert row['status']=='PASS'and len(row['steps'])==16
 assert row['coordinateProviderCalls']['before']==row['coordinateProviderCalls']['after']
 assert len(row['nativeAcknowledgments'])==6
 assert row['imageryCache']['status']['status']=='available'
 for image in row['scenes']:assert sha((directory/image['file']).read_bytes())==image['sha256']
 records.append({'suite':part,'status':'PASS','groups':len(row['steps']),'proofSha256':sha((directory/'proof.json').read_bytes()),'startedHead':proof['startedHead'],'cacheEntriesObserved':row['imageryCache']['status']['entries']})
live_dir=root/'output/playwright/r2-b-final-search-live';live=json.loads((live_dir/'proof.json').read_text());assert live['status']=='PASS'and live['coordinateNavigation']=='PASS'
for name,digest in live['sourceHashes'].items():assert sha((root/name).read_bytes())==sha(subprocess.check_output(['git','show',head+':'+name],cwd=root))==digest
assert live['livePhoton']in ['PASS','UNAVAILABLE','FAIL'];assert sha((live_dir/live['file']).read_bytes())==live['sha256']
recording=root/'tests/fixtures/earth/r2a-search-recording.json';original=json.loads((root/'docs/validation/r2-a-earth-search/evidence/working-candidate-receipt.json').read_text());assert sha(recording.read_bytes())==next(r['proofSha256']for r in original['focusedBrowser']if r['suite']=='desktop')
# Both served previews must use the same exact native assets and Hub payloads.
for url in ['/earth-runtime/release.json','/runtime-versions.json','/earth-runtime/imagery-cache-sw.js','/']:
 with urllib.request.urlopen('http://127.0.0.1:4204'+url,timeout=15)as a,urllib.request.urlopen('http://127.0.0.1:4205'+url,timeout=15)as b:assert a.read()==b.read(),url
preserved={k:old[k]for k in ['earthArtifact','skyArtifact','originalContainersAndMountsIntact','volumesIntact','settingsSha256','originalN1Artifact']}
receipt={'status':'DETERMINISTIC_SEARCH_QUALIFIED; LIVE_'+live['livePhoton']+'; NO_MERGE','head':head,'baseline':baseline,'productionPathsUnchanged':protected,'deterministic':records,'livePhoton':live['livePhoton'],'liveAppResponse':live['appResponse'],'liveSmokeProofSha256':sha((live_dir/'proof.json').read_bytes()),'recordingSha256':sha(recording.read_bytes()),'preserved':preserved,'externalContainerStateDifferences':{'count':len(old['originalContainerStateDrift']),'cause':'unknown; historical observation not attributed'},'priorSuccessfulSuitesRerun':False,'limitations':['Recorded normalized service seam does not qualify live Photon transport/normalization/reliability or production rate admission','Prior genuine imagery/cache and suite evidence retained by exact source/artifact identity, not called fresh','PEMA rights/public redistribution, complete aerial detail, scientific terrain/elevation and physical hardware acceptance unchanged']}
(out/'delivery.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt,indent=2))
