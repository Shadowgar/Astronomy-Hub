"""Copy original screenshots/references without modification into a local gallery."""
from pathlib import Path
import hashlib
import html
import json
import shutil
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/earth-sky-completion'
GALLERY=OUT/'gallery'
ASSETS=GALLERY/'assets'
ASSETS.mkdir(parents=True,exist_ok=True)
rows=[]
def add(path, name, caption):
    target=ASSETS/name
    shutil.copyfile(path,target)
    digest=hashlib.sha256(target.read_bytes()).hexdigest()
    rows.append({'file':'assets/'+name,'sha256':digest,'bytes':target.stat().st_size,'source':str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path),'caption':caption})
    return '<figure><a href="assets/'+html.escape(name)+'"><img loading="lazy" src="assets/'+html.escape(name)+'"></a><figcaption>'+html.escape(caption)+'</figcaption></figure>'
sections=[]
for mode in ['earth','sky']:
    ref=ROOT/f'docs/design/cinematic-references-2026-10-21/{mode}-cinematic.png'
    sections.append('<h2>'+mode.title()+' — approved original</h2>'+add(ref,mode+'-reference.png','Approved original PNG; unchanged bytes. Visual direction, not measured conditions.'))
    for size in ['1440x900','390x900','667x390']:
        items=[]
        for revision in ['baseline','candidate']:
            name=f'{size}-{mode}-{revision}.png'
            items.append(add(OUT/'comparison'/name,name,f'{mode.title()} {size} {revision}; same requested UTC and fresh browser settings. Native readiness/diagnostics in comparison/proof.json.'))
        sections.append('<h3>'+size+'</h3><div class="pair">'+''.join(items)+'</div>')
earth=ROOT.parent/'cinematic-earth-completion-1/output/earth-sky-completion/browser-reviewed'
# E1 retained screenshots have exact source/artifact identity; do not call them S1 recaptures.
for mode,folder,names in [
 ('Earth selected location (retained E1 source-matched evidence)',earth,[f'{size}-{state}.png' for size in ['1440x900','390x900','667x390'] for state in ['selected','expanded']]),
 ('Sky selected star and controls (fresh final S1)',OUT/'sky-final',[f'{size}-{state}.png' for size in ['1440x900','390x900','667x390'] for state in ['selected','expanded','display']]),
 ('Sky controlled native scenes (fresh S1)',OUT/'sky-scenes',['historical-wide.png','Moon-close.png','Moon-expanded.png','Jupiter-close.png','Jupiter-expanded.png','M42-close.png','M42-expanded.png','orion-context.png','historical-atmosphere-on.png']),
 ('Preserved Solar and integrated Sky return (fresh I1)',OUT/'integration',['1440-solar-preserved.png','390-solar-preserved.png','1440-sky-return.png','390-sky-return.png'])]:
    cards=[]
    for name in names:
        path=folder/name
        assert path.exists(),str(path)
        cards.append(add(path,folder.name+'-'+name,mode+': '+name))
    sections.append('<h2>'+html.escape(mode)+'</h2><div class="pair">'+''.join(cards)+'</div>')
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Astronomy Hub Earth/Sky visual review</title><style>body{margin:0 auto;padding:24px;max-width:1600px;background:#080d17;color:#e6edf5;font:16px system-ui}a{color:#92d8ff}h2{margin-top:48px}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:0 0 24px}img{display:block;width:100%;height:auto;border:1px solid #344153}figcaption{padding:12px;color:#c7d4e4}p{max-width:1000px;line-height:1.6}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><h1>Earth and Sky — owner visual review</h1><p>Working native application captures, not mockups. Solar remains unchanged. PR88 baseline 89491f72; Earth E1 94f98598; final S1 artifact 7170519b. All packages remain draft. These images do not establish owner acceptance or hardware performance.</p><p>Earth source pixels and loading state limit close-range detail. Clouds/night lights and measured terrain were not added. Sky uses genuine catalog/ephemeris positions; adjustable exposure and star point size are display effects, not measured visibility. Pennsylvania landscape is illustrative. Close-up captures use native zoom; separate integration evidence covers genuine keyboard/touch.</p><p><a href="/earth">Open Earth</a> · <a href="/sky-engine?date=2026-08-13T04:00:00Z">Open source-backed dark Sky</a> · <a href="/solar-system">Open preserved Solar</a> · <a href="../comparison/proof.json">Matched diagnostics</a> · <a href="manifest.json">Original image hashes</a></p>'''+''.join(sections)+'</html>'
(GALLERY/'index.html').write_text(page)
(GALLERY/'manifest.json').write_text(json.dumps(rows,indent=2)+'\n')
print('Gallery:',len(rows),'original-byte images')
