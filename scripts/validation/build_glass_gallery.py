"""Versioned recipe for the owner reference/before/after gallery. No image edits."""
from pathlib import Path
import hashlib,html,json,shutil
root=Path(__file__).resolve().parents[2];out=root/'output/cinematic-glass';gallery=out/'gallery';assets=gallery/'assets';assets.mkdir(parents=True,exist_ok=True)
proof=json.loads((out/'browser/proof.json').read_text());rows=[]
def img(path,label,name=None):
 name=name or path.name;target=assets/name;shutil.copyfile(path,target);rows.append({'file':'assets/'+name,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'source':str(path.relative_to(root)),'label':label})
 return '<figure><a href="assets/'+name+'"><img loading="lazy" src="assets/'+name+'"></a><figcaption>'+html.escape(label)+'</figcaption></figure>'
sections=[]
for mode,ref in [('solar','solar-primary-cinematic.png'),('earth','earth-cinematic.png'),('sky','sky-cinematic.png')]:
 sections.append('<h2>'+mode.title()+' approved original</h2>'+img(root/'docs/design/cinematic-references-2026-10-21'/ref,'Original approved bytes; visual direction, not scientific fixture.'))
 crop={'solar':(1298,244,356,542),'earth':(1220,130,435,660),'sky':(1310,190,340,540)}[mode]
 sections.append(f'<h3>Approved material region — original bytes, browser crop</h3><svg role="img" aria-label="Approved {mode} selected-card material crop" viewBox="{crop[0]} {crop[1]} {crop[2]} {crop[3]}" style="max-height:460px;width:100%"><image href="assets/{ref}" width="1672" height="941"/></svg>')
 for w,h in [(1440,900),(390,900),(667,390)]:
  cards=[]
  for rev in ['baseline','candidate']:
   r=next(r for r in proof['runs'] if (r['w'],r['h'],r['mode'],r['revision'])==(w,h,mode,rev))
   for state in ['initial','selected','expanded']:
    cards.append(img(out/'browser'/r[state],f'{mode} {w}×{h} {rev} {state}; actual native application'))
  sections.append(f'<h3>{w}×{h}</h3><div class="grid">'+''.join(cards)+'</div>')
  for name in [f'{w}x{h}-{mode}-material-crop.png',f'{w}x{h}-{mode}-candidate-controls.png']:
   p=out/'browser'/name
   if p.exists():sections.append(img(p,'Actual material/control detail: '+name))
sections.append('<h2>Solar Adaptive Explorer interaction reference</h2>'+img(root/'docs/design/cinematic-references-2026-10-21/solar-adaptive-explorer.png','Original Adaptive Explorer reference; unchanged bytes.'))
for folder,names in [('compositing',['actual-bright-globe-dialog.png','standard.png','diagnostic-filter-disabled.png','diagnostic-opaque.png']),('accessibility',['night-opaque.png','forced-colors.png'])]:
 for name in names:
  p=out/folder/name
  if p.exists():sections.append(img(p,folder+' — '+name,folder+'-'+name))
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Astronomy Hub glass visual review</title><style>body{margin:auto;max-width:1680px;padding:24px;background:#080d17;color:#e9f4ff;font:16px system-ui}a{color:#a6dcff}p{max-width:1050px;line-height:1.6}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}img{width:100%;height:auto;display:block}figure{margin:0 0 28px;border:1px solid #66778c55;border-radius:20px;overflow:hidden}figcaption{padding:14px;font-size:14px}h2{margin-top:60px}@media(max-width:700px){.grid{grid-template-columns:1fr}}</style><h1>Cinematic glass — owner visual acceptance pending</h1><p>Original reference / PR90 baseline / working glass candidate. These are actual application captures over native Cesium, native Stellarium and the preserved Solar renderer. No source positions, geography, models or scene artwork have been fabricated. Controls use one shared translucent contract. Blur and opacity variants below are explicitly labeled diagnostics. No automated similarity percentage or visual acceptance is claimed.</p><p><a href="/earth">Open Earth</a> · <a href="/sky-engine?date=2026-08-13T04:00:00Z">Open dark Sky</a> · <a href="/solar-system">Open Solar</a> · <a href="../browser/proof.json">Capture diagnostics</a> · <a href="manifest.json">Original-byte image provenance</a></p><p>Earth clouds, city lights, terrain and higher-resolution source coverage remain unavailable under the current qualification. Sky reference angular sizes and star arrangements are not reproduced by moving objects. Solar scientific and camera behavior is preserved. Automated performance uses SwiftShader, not a physical GPU. Prior normal-state captures retained across the narrow Night/portrait correction are identified in the report; their material rules were unchanged.</p>'''+''.join(sections)+'</html>'
(gallery/'index.html').write_text(page);(gallery/'manifest.json').write_text(json.dumps(rows,indent=2)+'\n');print('PASS gallery images',len(rows))
