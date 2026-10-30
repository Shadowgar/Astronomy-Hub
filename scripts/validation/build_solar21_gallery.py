#!/usr/bin/env python3
"""Private gallery from qualified actual captures; copy bytes without altering them."""
import hashlib
import html
import json
from pathlib import Path
import shutil

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'output/playwright/owner-acceptance/solar-system-2.1'
APP=ROOT/'output/playwright/solar-system-2.1/application-final'
TERRAIN=ROOT/'output/playwright/solar-system-2.1/terrain-windows-final'
SOLAR=ROOT/'output/playwright/solar-system-2.1/solar-regressions'
app=json.loads((APP/'application.json').read_text())
solar=json.loads((SOLAR/'proof.json').read_text())
terrain=json.loads((TERRAIN/'results.json').read_text())
assert app['status']=='PASS' and all(r['status']=='PASS' for r in solar['runs'])
assert len([c for c in terrain['checks'] if c.get('viewport')])==3
# The original terrain run exposed the Earth-return defect after the three
# recorded layout journeys. Their videos/captures remain valid; final handoff
# qualification is separate and must pass before publishing this gallery.
handoff=json.loads((ROOT/'docs/validation/solar-system-2.1/receipts/terrain-windows-handoffs-final.json').read_text())
assert handoff['status']=='PASS' and len(handoff['runs'])==8
files=[]
def copy(source,name):
 raw=source.read_bytes();target=OUT/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
 files.append({'path':name,'source':str(source.relative_to(ROOT)),'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()})
def figure(src,caption):
 return f'<figure><a href="{html.escape(src)}"><img loading="lazy" src="{html.escape(src)}" alt="{html.escape(caption)}"></a><figcaption>{html.escape(caption)}</figcaption></figure>'
parts=['<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Solar System 2.1 · Owner review</title><style>body{margin:0;background:#080e18;color:#e6edf6;font:16px/1.5 system-ui}main{max-width:1500px;margin:auto;padding:24px}a{color:#9edbff}h1{font-size:2rem}h2{margin-top:48px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}figure{margin:0;padding:10px;background:#131d2b;border:1px solid #344054;border-radius:12px}img,video{width:100%;height:auto}figcaption{padding:8px}p{max-width:80ch}.note{border-left:3px solid #d6ac67;padding:12px}@media(max-width:700px){.grid{grid-template-columns:1fr}main{padding:14px}}</style><main><h1>Solar System 2.1</h1><p>Actual Windows Edge / NVIDIA RTX3060 captures. Engineering qualification is separate from owner visual acceptance. Portrait and landscape are desktop emulation; physical iPhone remains unverified.</p><p><a href="/solar-system?solarBody=earth&amp;date=2026-10-27T04:00:00Z">Open Earth in Solar</a> · <a href="/planet-terrain/apollo17-nac-v1?date=2026-10-28T00:00:00Z">Open Apollo 17 terrain</a> · <a href="/owner-review/solar-system-2/">Preserved Solar 2.0 gallery</a></p><p class="note">No merge, production deployment or source publication. Existing native Sky, Earth and Moon remain their own renderers. Moon terrain is a separate regional route with an explicit return.</p><h2>Earth atmosphere · matched A/B</h2><p>Each pair has identical UTC, source positions, camera and output conditions in the current application. Left: custom Solar2 model. Right: actual Takram0.19.1. Other Earth improvements are shared by both columns. Date:27October2026,04:00UTC.</p>']
for name in ['day','limb','crescent','backlit','near-horizon']:
 parts.append('<h3>'+html.escape(name.replace('-',' ').title())+'</h3><div class="grid">')
 for method in ['custom','takram']:
  target=f'atmosphere/{name}-{method}.png';copy(APP/(name+'-'+method+'.png'),target);parts.append(figure(target,method+' · '+name))
 parts.append('</div>')
parts+=['<h2>Moon · real regional detail</h2><p>Native Moon remains the globe route. Apollo17 is a bounded5.12×5.12km region with original PDS5m elevation and matching imagery,85progressive tiles and204.375m measured relief. Historical shadows remain. The gray relief view uses fixed illustrative lighting, not sunlight at the retained UTC. LROC_ME is source qualified; exact ME421 alignment is not claimed.</p>']
for layout in ['1440x900','390x844','844x390']:
 parts.append('<h3>'+layout+'</h3><div class="grid">')
 for case in ['native-moon','overview','detail','relief']:
  target=f'terrain/{layout}-{case}.png';copy(TERRAIN/(layout+'-'+case+'.png'),target);parts.append(figure(target,layout+' · '+case.replace('-',' ')))
 parts.append('</div>')
parts+=['<h2>Preserved exploration</h2><p>Current-build regression journeys cover Saturn, Eros, continuous/reverse time, orbit/follow/free flight, resize, source-backed moon systems and context recovery.</p><div class="grid">']
for name in ['desktop-overview','desktop-saturn-oblique','desktop-saturn-backlit','desktop-eros']:
 target=f'exploration/{name}.png';copy(SOLAR/(name+'.png'),target);parts.append(figure(target,name))
parts+=['</div><h2>Actual recordings</h2><div class="grid">']
for run in solar['runs']:
 target='video/solar-'+run['name']+'.webm';copy(SOLAR/'video'/run['video'],target);parts.append(f'<figure><video controls preload="metadata" src="{target}"></video><figcaption>Solar · {html.escape(run["name"])}</figcaption></figure>')
video_map=json.loads((ROOT/'docs/validation/solar-system-2.1/receipts/terrain-videos.json').read_text())
for row in video_map:
 target='video/terrain-'+row['layout']+'.webm';copy(ROOT/row['file'],target);parts.append(f'<figure><video controls preload="metadata" src="{target}"></video><figcaption>Terrain · {html.escape(row["layout"])}</figcaption></figure>')
parts+=['</div><h2>Approved design references</h2><p>Original approved PNG bytes, preserved as design references. They are not application screenshots or textures.</p><div class="grid">']
manifest=json.loads((ROOT/'docs/design/cinematic-references-2026-10-21/manifest.json').read_text())
for name in ['solar-primary-cinematic.png','solar-adaptive-explorer.png']:
 source=ROOT/'docs/design/cinematic-references-2026-10-21'/name
 assert hashlib.sha256(source.read_bytes()).hexdigest()==manifest['includes'][name]['sha256']
 target='reference/'+name;copy(source,target);parts.append(figure(target,'Approved original · '+name))
parts+=['</div><p><a href="receipt.json">Capture hashes and provenance</a>. Owner acceptance, physical-device qualification and a matching public source release remain open.</p></main></html>']
content='\n'.join(parts)
(OUT/'index.html').write_text(content)
(ROOT/'docs/validation/solar-system-2.1/gallery').mkdir(exist_ok=True)
(ROOT/'docs/validation/solar-system-2.1/gallery/index.html').write_text(content)
receipt={'scope':'Private Windows engineering evidence; not owner acceptance','app':app['status'],'solar':[r['status'] for r in solar['runs']],'terrainLayouts':'Three verified layout journeys reused; separately corrected native exits verified in final handoff receipt','handoff':True,'files':files}
(OUT/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
(ROOT/'docs/validation/solar-system-2.1/gallery/receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('PASS:',len(files),'unaltered capture/reference/video files')
