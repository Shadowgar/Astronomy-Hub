"""Verify task-only builds, served bytes, source bindings and preserved pilot/data."""
from pathlib import Path
import argparse
import hashlib
import json
import subprocess
from datetime import datetime, timezone
from urllib.request import urlopen, Request

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/satellite-observing'
BASE = 'd2909a52d3f747c555ca87eff112bab83c064779'
OWNER = Path('/home/rocco/Astronomy-Hub')
RELEASE = ROOT.parent / 'sky-satellite-visual-pilot-1/output/satellite-visual-pilot/release'

def sha(data): return hashlib.sha256(data).hexdigest()
def git(*args, cwd=ROOT): return subprocess.check_output(['git',*args],cwd=cwd).decode().strip()
def tree(path): return {str(p.relative_to(path)):sha(p.read_bytes()) for p in sorted(path.rglob('*')) if p.is_file()}
def fetch(path):
    with urlopen(Request('http://127.0.0.1:4228'+path, headers={'Accept-Encoding':'identity'}),timeout=20) as response:
        assert response.status==200
        return response.read()

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--committed',action='store_true');args=parser.parse_args()
    report={'status':'RUNNING','at_utc':datetime.now(timezone.utc).isoformat(),'base':BASE,'head':git('rev-parse','HEAD'),'committed':args.committed,'checks':{}}
    try:
        builds={name:tree(OUT/name) for name in ('hub','hub-repeat','hub-container')}
        assert builds['hub'] and builds['hub']==builds['hub-repeat']==builds['hub-container']
        for path,digest in builds['hub'].items():assert sha(fetch('/'+path))==digest,path
        report['checks']['builds_served']={'files':len(builds['hub']),'sha256':builds['hub']}
        lock=json.loads((ROOT/'integrations/renderers.lock.json').read_text())
        for row in lock['sky']['artifact_files']:
            assert sha(fetch('/oras-sky-engine/'+row['path']))==sha((ROOT/'frontend/public/oras-sky-engine'/row['path']).read_bytes())
        report['checks']['native_sky_files']=len(lock['sky']['artifact_files'])
        original=OWNER/'frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz'
        assert sha(original.read_bytes())=='431592eb5ec6db56d79c26792853f3fafe36ddf76c98834d9ddb36ddc0846436'
        manifest=json.loads((RELEASE/'manifest.json').read_text());feed=sha((RELEASE/'tle_satellite.jsonl.gz').read_bytes())
        assert feed==manifest['sha256']=='9f063125517b9a6cc990159009ec7e46b764dc6dd14afc7a4b44a651e5920185'
        assert sha(fetch('/oras-sky-engine/skydata/tle_satellite.jsonl.gz'))==feed
        status=json.loads(fetch('/api/sky/satellite-feed'))['data'];assert status['sha256']==feed and status['record_count']==155 and status['release_validated']
        report['checks']['source']=status
        prior=json.loads((ROOT/'docs/validation/sky-satellite-live/evidence/source-audit/preservation.json').read_text())
        exempt={'runtimes/sky-adapter/entry.mjs','packages/runtime-protocol/index.mjs','packages/runtime-protocol/endpoint.mjs','packages/runtime-protocol/index.d.mts'}
        kept=[]
        for row in prior['protected_tracked_rows']:
            if row['path'] in exempt:continue
            assert sha((ROOT/row['path']).read_bytes())==row['current_sha256'],row['path'];kept.append(row['path'])
        for row in prior['bounded_data_hashes']:assert sha(Path(row['path']).read_bytes())==row['sha256'],row['path']
        report['checks']['preservation']={'unchanged_tracked':kept,'bounded_data':prior['bounded_data_hashes'],'explicit_bridge_changes':sorted(exempt)}
        assert git('rev-parse','HEAD',cwd=OWNER)=='1cb71b848a1ed46390945fe0fa636676b8b8f744'
        assert sha((OWNER/'.vscode/settings.json').read_bytes())=='6fd3157fba44f86fa00268bd53d0429cc2c17a697a2c196890e80934bc54bce0'
        report['checks']['owner']={'status':git('status','--short',cwd=OWNER),'settings':'unchanged'}
        for name,destination in [('oras-satellite-observing-preview','/pilot'),('oras-satellite-observing-backend','/runtime/satellite-visual-pilot')]:
            data=json.loads(subprocess.check_output(['docker','inspect','--format','{"running":{{json .State.Running}},"readonly":{{json .HostConfig.ReadonlyRootfs}},"mounts":{{json .Mounts}}}',name]))
            assert data['running'] and data['readonly']
            assert all(not m['RW'] for m in data['mounts'] if m['Type']=='bind')
            assert Path(next(m['Source'] for m in data['mounts'] if m['Destination']==destination)).resolve()==RELEASE.resolve()
            report['checks'][name]=data
        names=set(git('diff',BASE,'--name-only').splitlines())|set(git('ls-files','--others','--exclude-standard').splitlines())
        sources={p:sha((ROOT/p).read_bytes()) for p in sorted(names) if not p.startswith('docs/') and (ROOT/p).is_file()}
        if args.committed:
            browser=json.loads((OUT/'browser-delivery/proof.json').read_text())
            assert browser['status']=='PASS' and browser['source_unchanged']
            assert [(r['width'],r['height'],r['status']) for r in browser['runs']]==[(1440,900,'PASS'),(390,900,'PASS'),(667,390,'PASS')]
            for path,digest in browser['source_sha256'].items():assert sha((ROOT/path).read_bytes())==digest,path
            assert (OUT/'browser-delivery/proof.json').read_bytes()==(ROOT/'docs/validation/satellite-observing/evidence/browser/proof.json').read_bytes()
            media=json.loads((ROOT/'docs/validation/satellite-observing/evidence/browser/media-sha256.json').read_text())
            for name,info in media.items():assert sha((OUT/'browser-delivery'/name).read_bytes())==info['sha256'],name
            report['checks']['browser']={'source_matched':True,'assertions':[len(r['checks']) for r in browser['runs']],'media_files':len(media),'hardware_qualified':False}
            assert not git('status','--porcelain'), 'Uncommitted work remains'
            for path,digest in sources.items():assert sha(subprocess.check_output(['git','show','HEAD:'+path],cwd=ROOT))==digest
        report['checks']['source_sha256']=sources
        report['status']='PASS' if args.committed else 'CANDIDATE_VERIFIED'
    except Exception as exc:report.update(status='FAIL',failure=str(exc))
    (OUT/('delivery.json' if args.committed else 'delivery-candidate.json')).write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k!='checks'}));return report['status']=='FAIL'
if __name__=='__main__':raise SystemExit(main())
