"""Copy actual browser captures unchanged into a static, script-free review page."""
from pathlib import Path
import argparse, html, json, shutil
p=argparse.ArgumentParser();p.add_argument('--before',type=Path,required=True);p.add_argument('--after',type=Path,required=True);p.add_argument('--journeys',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
a.output.mkdir(parents=True,exist_ok=True)
for name in ('before','after','video'):(a.output/name).mkdir(exist_ok=True)
sections=[]
for size in ('1440x900','390x844','844x390'):
 for system in ('earth','mars','jupiter','saturn','uranus','neptune'):
  f=f'{size}-{system}-overview.png';old=a.before/f;new=a.after/f
  if not old.is_file() or not new.is_file():raise RuntimeError(f'Missing matched capture {f}')
  shutil.copy2(old,a.output/'before'/f);shutil.copy2(new,a.output/'after'/f)
  sections.append(f'<section><h2>{html.escape(system.title())} · {size}</h2><div class="pair"><figure><a href="before/{f}"><img loading="lazy" src="before/{f}" alt="Solar 2.2 {system} baseline"></a><figcaption>Before · rejected implementation</figcaption></figure><figure><a href="after/{f}"><img loading="lazy" src="after/{f}" alt="Solar 2.3 {system} candidate"></a><figcaption>After · owner acceptance pending</figcaption></figure></div></section>')
for f in sorted(a.after.glob('*.png')):
 if f.name.endswith('-overview.png'):continue
 shutil.copy2(f,a.output/'after'/f.name)
 if (a.before/f.name).is_file():
  shutil.copy2(a.before/f.name,a.output/'before'/f.name)
  sections.append(f'<section><h2>{html.escape(f.stem)} · close-up</h2><div class="pair"><figure><a href="before/{f.name}"><img loading="lazy" src="before/{f.name}" alt="Before {html.escape(f.stem)}"></a><figcaption>Before · rejected implementation</figcaption></figure><figure><a href="after/{f.name}"><img loading="lazy" src="after/{f.name}" alt="After {html.escape(f.stem)}"></a><figcaption>After · actual available source imagery or shape</figcaption></figure></div></section>')
 else:
  sections.append(f'<figure class="close"><a href="after/{f.name}"><img loading="lazy" src="after/{f.name}" alt="{html.escape(f.stem)} actual browser close-up"></a><figcaption>{html.escape(f.stem)}</figcaption></figure>')
for i,f in enumerate(sorted((a.journeys/'video').glob('*.webm'))):
 name=f'journey-{i+1}.webm';shutil.copy2(f,a.output/'video'/name);sections.append(f'<figure><video controls preload="none" src="video/{name}"></video><figcaption>Actual user-operated journey {i+1}; Windows Edge / NVIDIA.</figcaption></figure>')
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Solar 2.3 — planetary systems review</title><style>body{margin:0;background:#07101a;color:#e7edf5;font:16px system-ui}main{max-width:1600px;margin:auto;padding:24px}h1{font-weight:500}p{max-width:1000px;line-height:1.6;color:#b9c7d8}.pair{display:grid;grid-template-columns:1fr 1fr;gap:14px}figure{margin:0 0 24px}img,video{width:100%;height:auto;background:#000;border-radius:8px}figcaption{padding:8px;color:#b9c7d8;font-size:13px}.close{display:inline-block;width:calc(50% - 12px);vertical-align:top;margin-right:12px}a{color:#a6d7ff}@media(max-width:700px){.pair{grid-template-columns:1fr}.close{width:100%;margin-right:0}}</style><main><h1>Solar 2.3 — planetary systems</h1><p>Actual application captures at 2026-10-27 04:00 UTC. Before: qualified Solar 2.2 branch head 767ec130. After: this Solar 2.3 candidate. Each overview uses its implementation's framing at the same epoch and viewport; source centers are never rearranged. Original owner screenshots were not attached to this session; the running rejected implementation was captured before replacement.</p><p>Desktop, portrait and landscape all use the owner's Windows Edge / NVIDIA RTX 3060. Mobile dimensions are desktop emulation, not a physical iPhone test. NASA moon maps retain original geography but mostly lack qualified meridian registration. Titan shows haze. Phobos/Deimos are measured shapes with neutral albedo. Green engineering checks do not replace owner visual acceptance.</p>'''+''.join(sections)+'</main></html>'
(a.output/'index.html').write_text(page)
print(f'{len(sections)} review sections; original PNG/video bytes copied unchanged')
