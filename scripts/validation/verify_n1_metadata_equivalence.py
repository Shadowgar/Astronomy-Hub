"""Strictly qualify the identity-flag-only delta from the browser-tested N1 head."""
from pathlib import Path
import hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[2]
BASE='90f2a5bd6c19eb4d0f86a113c622aae5d34eb621'
LOCK='integrations/renderers.lock.json';MARKER='frontend/public/oras-sky-engine/oras-runtime-build.json'
sha=lambda b:hashlib.sha256(b).hexdigest()
def old(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def verify():
 marker=json.loads(old(MARKER));marker['native_wasm_identical']=False;marker['native_vendor_chunks_identical']=False
 marker_bytes=(json.dumps(marker,indent=2)+'\n').encode();assert (ROOT/MARKER).read_bytes()==marker_bytes,'Only two native identity flags may change'
 lock=json.loads(old(LOCK));row=next(x for x in lock['sky']['artifact_files']if x['path']=='oras-runtime-build.json');row.update(bytes=len(marker_bytes),sha256=sha(marker_bytes))
 assert (ROOT/LOCK).read_bytes()==(json.dumps(lock,indent=2)+'\n').encode(),'Only the marker admission row may change'
 assert (ROOT/'frontend/public/runtime-versions.json').read_bytes()==old('frontend/public/runtime-versions.json')
 for row in lock['sky']['artifact_files']:
  data=(ROOT/'frontend/public/oras-sky-engine'/row['path']).read_bytes();assert len(data)==row['bytes']and sha(data)==row['sha256'],row['path']
 prior=json.loads(old('docs/validation/n1-final-remediation/evidence/hub-reproduction.json'));expected=prior['artifacts'].copy();expected['oras-sky-engine/oras-runtime-build.json']=sha(marker_bytes)
 def inventory(folder):return {p.relative_to(folder).as_posix():sha(p.read_bytes())for p in folder.rglob('*')if p.is_file()}
 for name in ['frontend/dist','output/n1/remediation/hub-metadata-reproduction']:assert inventory(ROOT/name)==expected,name
 reports=[]
 for name in ['observer-history','elevation-desktop','elevation-mobile','snapshots-final','satellites-final','journeys-desktop','journeys-mobile','landscape']:
  proof=json.loads((ROOT/'output/n1/remediation'/name/'proof.json').read_text());assert proof['status']=='PASS'
  for path,digest in proof['sourceHashes'].items():
   if path==LOCK:
    assert sha(old(path))==digest,name
   else:assert sha((ROOT/path).read_bytes())==digest,(name,path)
  reports.append({'name':name,'status':'PASS','metadataDelta':LOCK if LOCK in proof['sourceHashes'] else None,'originalSourceHashesPreserved':True})
 result={'status':'PASS','browserQualifiedBase':BASE,'scope':'Only two identity flags and their admission row changed; all rendering payloads, Hub JS, versions and browser proof source inputs remain byte-identical. Original proof hashes are retained, not rewritten.','markerSha256':sha(marker_bytes),'lockSha256':sha((ROOT/LOCK).read_bytes()),'hubFiles':len(expected),'reports':reports}
 (ROOT/'output/n1/remediation/metadata-equivalence.json').write_text(json.dumps(result,indent=2)+'\n');return result
if __name__=='__main__':
 r=verify();print('METADATA-ONLY EQUIVALENCE PASS',r['hubFiles'],'Hub files;',len(r['reports']),'unaltered browser proof records')
