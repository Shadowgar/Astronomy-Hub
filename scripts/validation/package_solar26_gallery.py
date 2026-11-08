"""Package actual retained browser evidence; no generated or retouched imagery."""
from pathlib import Path
import hashlib
import html
import json
import shutil

ROOT=Path(__file__).resolve().parents[2]
RUN=ROOT/'output/playwright/solar-system-2.6/release-journeys'
DOC=ROOT/'docs/validation/solar-system-2.6'
GALLERY=DOC/'gallery'
PRIVATE=ROOT/'output/playwright/owner-acceptance/solar26'

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    report=json.loads((RUN/'journeys.json').read_text())
    assert report['status']=='PASS' and not report['workingTreeChangesDuringRun']
    GALLERY.mkdir(parents=True,exist_ok=True)
    PRIVATE.mkdir(parents=True,exist_ok=True)
    (PRIVATE/'videos').mkdir(exist_ok=True)
    selected=[('A-voyager1-crossing.png','Voyager 1: observed event, predicted source geometry'),('B-separate-historical-comparison.png','Voyager 1 and 2: explicitly different historical dates'),('B-comparison-portrait.png','Historical comparison: portrait viewport'),('C-illustrative-heliosphere.png','Conceptual heliosphere: no qualified MHD reconstruction'),('C-ibex-native-cell-selection.png','Actual IBEX DR18 angular flux and statistical uncertainty'),('C-imap-desktop.png','Actual IMAP MAG time series'),('C-imap-portrait.png','IMAP inspection: portrait viewport'),('C-imap-landscape.png','IMAP inspection: landscape viewport'),('D-oort-100k-desktop.png','Theoretical Oort region: 100000 AU reference'),('D-oort-100k-portrait.png','Oort scale: portrait viewport'),('D-oort-100k-landscape.png','Oort scale: landscape viewport'),('D-return-saturn-system.png','Returned to native planetary-system exploration'),('D-return-native-sky.png','Returned to native Stellarium Sky'),('D-return-native-earth.png','Returned to native Cesium Earth')]
    images=[]
    for file,title in selected:
        source=RUN/file
        for target in [GALLERY/file,PRIVATE/file]:shutil.copy2(source,target)
        images.append({'file':file,'caption':title,'sha256':sha(source),'bytes':source.stat().st_size})
    videos=[]
    for run in report['runs']:
        assert run['status']=='PASS'
        source=RUN/'video'/run['video'];target=PRIVATE/'videos'/(run['id']+'.webm');shutil.copy2(source,target)
        videos.append({'journey':run['id'],'file':'videos/'+target.name,'source_file':run['video'],'sha256':sha(source),'bytes':source.stat().st_size})
    receipt={'schema':'oras.solar26-gallery.v1','evidence_class':report['evidenceClass'],'physical_device':False,'owner_accepted':False,'source_hashes':report['sourceHashes'],'journey_receipt_sha256':sha(RUN/'journeys.json'),'images':images,'videos':videos,'videos_storage':'private loopback preview only; not committed scientific/runtime bulk'}
    (DOC/'evidence').mkdir(exist_ok=True)
    shutil.copy2(RUN/'journeys.json',DOC/'evidence/journeys.json')
    (GALLERY/'manifest.json').write_text(json.dumps(receipt,indent=2)+'\n')
    shutil.copy2(GALLERY/'manifest.json',PRIVATE/'manifest.json')
    cards='\n'.join('<figure><a href="'+html.escape(i['file'],quote=True)+'"><img loading="lazy" src="'+html.escape(i['file'],quote=True)+'" alt="'+html.escape(i['caption'],quote=True)+'"></a><figcaption>'+html.escape(i['caption'])+'</figcaption></figure>' for i in images)
    clips='\n'.join('<section><h3>Journey '+v['journey']+'</h3><video controls preload="none" src="'+v['file']+'"></video></section>'for v in videos)
    page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Solar 2.6 — actual owner evidence</title><style>body{margin:0;background:#080e16;color:#e4eef6;font:16px/1.6 system-ui}main{max-width:1300px;margin:auto;padding:28px}h1{font-weight:400}a{color:#95dcea}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:22px}figure,section{margin:0;border:1px solid #304553;border-radius:12px;overflow:hidden;background:#101b26}img,video{display:block;width:100%;max-height:600px;object-fit:contain}figcaption,h3{padding:12px;margin:0}small{color:#b6c8d6}</style><main><h1>Beyond the Planets · Solar System 2.6</h1><p>Actual Windows Edge / NVIDIA RTX3060 captures. Scientific observation, prediction and theoretical illustration remain distinct. Owner visual acceptance is pending.</p><p><a href="/beyond?date=2026-10-27T04%3A00%3A00.000Z&amp;view=outer">Open the actual private preview</a> · <a href="manifest.json">Capture hashes and source binding</a></p><p><small>Portrait and landscape are desktop browser viewport emulations, not physical iPhone tests. Cold graphics startup still has substantial tasks. No complete empirical heliopause or measured Oort Cloud is claimed. Recordings are available in the local preview copy; the repository stores their hashes and original screenshots.</small></p><h2>Recorded journeys</h2><div class="grid">'''+clips+'''</div><h2>Actual application views</h2><div class="grid">'''+cards+'</div></main></html>\n'
    for target in [GALLERY/'index.html',PRIVATE/'index.html']:target.write_text(page)
    print(json.dumps({'status':'PASS','images':len(images),'recordings':len(videos),'video_bytes':sum(v['bytes']for v in videos),'gallery':'http://localhost:4231/owner-review/solar26/index.html'}))

if __name__=='__main__':main()
