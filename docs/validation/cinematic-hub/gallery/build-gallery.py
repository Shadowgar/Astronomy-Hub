from pathlib import Path
import hashlib,json,shutil,subprocess,html,struct
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parent
ASSETS=OUT/'images';ASSETS.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
commit=lambda x:subprocess.check_output(['git','rev-parse',x],cwd=ROOT,text=True).strip()
manifest={'status':'REFERENCE_AND_PACKAGE_GALLERY','assembledAtHead':head,'finalIntegratedQualification':'JOURNEY_PASSED_VISUAL_ACCEPTANCE_PENDING','assets':[],'comparisons':[]}
refs={}
def copy(path,label,mode,kind,source=None,evidence=None):
 p=Path(path);p=p if p.is_absolute() else ROOT/p
 if not p.exists():return None
 h=sha(p);name=f'{mode}-{kind}-{p.stem}-{h[:10]}{p.suffix}';dest=ASSETS/name;shutil.copy2(p,dest);assert sha(dest)==h
 size=struct.unpack('>II',p.read_bytes()[16:24]) if p.suffix.lower()=='.png' else None
 entry={'file':'images/'+name,'label':label,'mode':mode,'evidenceClass':kind,'sourcePath':str(p),'sha256':h,'bytes':p.stat().st_size,'viewport':size,'commitSha':source,'commitRole':('recorded historical runtime baseline' if kind=='historical-b68' else 'assembly HEAD only; runtime source is defined by journey source hashes' if kind=='integrated-capture' else 'versioned evidence commit, not an invented runtime capture SHA'),'qualificationEvidence':evidence}
 manifest['assets'].append(entry);return entry
reference_manifest=json.loads((ROOT/'docs/design/cinematic-references-2026-10-21/manifest.json').read_text())
for mode,file in [('solar','solar-primary-cinematic.png'),('earth','earth-cinematic.png'),('sky','sky-cinematic.png')]:
 path=ROOT/'docs/design/cinematic-references-2026-10-21'/file
 assert sha(path)==reference_manifest['includes'][file]['sha256']
 refs[mode]=copy(path,'Original owner-approved concept — illustrative reference, preserved bytes',mode,'approved-reference',commit('7aaeeef4'),'Committed original design manifest')
packages={'solar':commit('9e7f2336'),'earth':commit('59fd9f0f'),'sky':commit('9eb60f09')}
# A containing commit identifies the versioned evidence; it does not manufacture
# an exact original runtime SHA where the package only recorded source-file hashes.
for mode in ['solar','earth','sky']:
 for width in [1440,390]:
  states=['overview','selected-collapsed','selected-expanded']
  for state in states:
   if mode=='solar':
    after='inner-system' if state=='overview' else 'earth' if state=='selected-collapsed' else 'saturn-expanded'
    ap=ROOT/f'docs/validation/r3-b-major-planets/screenshots/{width}x900-{after}.png'
    if state=='overview':bp=ROOT/f'docs/validation/r3-b-major-planets/screenshots/before-b68-{width}-overview.png'
    elif state=='selected-collapsed':bp=Path('/home/rocco/Astronomy-Hub/.worktrees/r3-a-cinematic-solar-1/output/solar-refinement/correction/screenshots')/f'after-{width}-earth.png'
    else:bp=ROOT/'output/cinematic-hub/gallery/no-retained-saturn-baseline.png'
    bnote='Historical actual b68 baseline: '+('overview' if state=='overview' else 'Earth selected, collapsed, matching the after body and epoch')
    anote='R3-B package: '+('Inner view overview' if state=='overview' else 'Earth selected, collapsed' if state=='selected-collapsed' else 'Saturn selected, expanded — no R3-A Saturn baseline exists')
    evidence='docs/validation/r3-b-major-planets/evidence/browser-proof.json'
   else:
    folder=ROOT/f'docs/validation/cinematic-{mode}/screenshots'
    bp=folder/(f'{width}-before.png' if state=='overview' else f'{width}-before-{state}.png')
    ap=folder/(f'{width}-after-initial.png' if state=='overview' else f'{width}-after-{state}.png')
    bnote=f'Historical actual b68 baseline — {state}, same epoch/location or Sirius where selected'
    anote=f'{mode.title()} package evidence — {state}; scoped package qualification, not a fresh final integrated pass'
    evidence=f'docs/validation/cinematic-{mode}/'+('source-hashes.json' if mode=='earth' else 'evidence/current-native.json')
   b=copy(bp,bnote,mode,'historical-b68',commit('b68e2b40'))
   a=copy(ap,anote,mode,'package-actual',packages[mode],evidence)
   manifest['comparisons'].append({'mode':mode,'width':width,'height':900,'state':state,'reference':refs[mode],'before':b,'actual':a})
 # Short-screen captures are package evidence, not invented matches to a
 # missing short baseline or a desktop concept viewport.
 width=540 if mode=='solar' else 667
 for state in ['selected-collapsed','selected-expanded']:
  ap=ROOT/(f'docs/validation/r3-b-major-planets/screenshots/540x390-saturn{ "-expanded" if state.endswith("expanded") else ""}.png' if mode=='solar' else f'docs/validation/cinematic-{mode}/screenshots/{width}-after-{state}.png')
  a=copy(ap,f'Actual short-screen package evidence — {state}; no matched short baseline retained',mode,'package-actual',packages[mode])
  manifest['comparisons'].append({'mode':mode,'width':width,'height':390,'state':state,'reference':refs[mode],'before':None,'actual':a})
 # Appropriate actual science/time/settings states, rather than labeling
 # a provider source panel or native settings panel as simulation time.
 if mode=='solar':p=ROOT/'output/cinematic-hub/navigation/1440-time-dialog.png';kind='integrated-capture';desc='Integrated UTC time dialog capture; see separate journey proof status'
 elif mode=='earth':p=ROOT/'docs/validation/cinematic-earth/screenshots/1440-after-sources.png';kind='package-actual';desc='Earth source availability dialog; frozen UTC is visible in the base selected view'
 else:p=ROOT/'docs/validation/cinematic-sky/screenshots/1440-after-native-settings.png';kind='package-actual';desc='Native observing settings; simulation time remains in native observing controls'
 a=copy(p,desc,mode,kind,head if kind=='integrated-capture' else packages[mode])
 if a:manifest['comparisons'].append({'mode':mode,'width':1440,'height':900,'state':'time-source-settings','reference':refs[mode],'before':None,'actual':a})
# Separate optional final integrated captures. Final proof status is carried
# explicitly; presence of an image never implies the suite passed.
nav=ROOT/'output/cinematic-hub/navigation';proofpath=nav/'proof.json'
proof=json.loads(proofpath.read_text()) if proofpath.exists() else {'status':'NOT_YET_AVAILABLE'}
manifest['integratedJourneyProofStatus']=proof['status'];manifest['integratedSourceHashCount']=len(proof.get('sourceHashes',{}))
for p in sorted(nav.glob('*.png')):
 mode='sky' if 'sky' in p.stem else 'earth' if 'earth-native' in p.stem else 'solar'
 a=copy(p,f'Integrated journey capture — {p.stem}; proof status {proof["status"]}, separate from package captures',mode,'integrated-capture',head,str(proofpath))
 manifest['comparisons'].append({'mode':mode,'width':int(p.stem.split('-')[0]) if p.stem.split('-')[0].isdigit() else 0,'state':'integrated-'+p.stem,'reference':refs[mode],'before':None,'actual':a})
review=ROOT.parent/'cinematic-foundation-1/output/cinematic-hub-review'
for p in sorted(review.glob('final*/*.png')):
 mode=p.stem.split('-')[0]
 if mode not in refs:continue
 a=copy(p,'Independent final integrated actual — '+p.stem+'; qualified per scoped review record',mode,'integrated-capture',commit('34eb8f08'),str(review/'REVIEW.md'))
 manifest['comparisons'].append({'mode':mode,'width':int(p.stem.split('-')[1].split('x')[0]),'state':'final-review-'+p.stem,'reference':refs[mode],'before':None,'actual':a})
for mode in ['earth','sky']:
 p=review/f'before-b68-{mode}-667x390.png'
 a=copy(p,'Actual preserved b68 source — fresh 667×390 baseline capture, not a new candidate pass',mode,'historical-b68',commit('b68e2b40'),str(review/'baseline-short.json'))
 after=next((x['actual']for x in manifest['comparisons']if x['mode']==mode and x.get('width')==667 and x['actual']),None)
 manifest['comparisons'].append({'mode':mode,'width':667,'state':'matched-short-baseline','reference':refs[mode],'before':a,'actual':after})
manifest['missingEvidence']=['No physical GPU/mobile visual acceptance','No owner visual acceptance','Solar Saturn has no R3-A baseline body; expanded view has no fabricated before capture','Final integrated captures remain separate and their proof status is explicit']
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
def figure(a):
 if not a:return '<div class="missing">No corresponding retained capture. This gap has not been filled with a mockup or another viewport.</div>'
 return '<figure><a href="'+a['file']+'" target="_blank"><img loading="lazy" src="'+a['file']+'" alt="'+html.escape(a['label'])+'"></a><figcaption>'+html.escape(a['label'])+'<details><summary>Source identity</summary><code>'+html.escape(a['sha256'])+'</code><p>Commit attribution (see manifest role): '+html.escape(a['commitSha'] or 'not recorded')+'</p><p>Capture runtime identity remains defined by the package source-hash evidence. A containing commit is not an invented capture commit.</p></details></figcaption></figure>'
sections=''
for c in manifest['comparisons']:
 if not c['actual']:continue
 sections+='<section data-mode="'+c['mode']+'"><h2>'+c['mode'].title()+' · '+str(c['width'])+' px · '+html.escape(c['state'])+'</h2><div class="compare">'+figure(c['reference'])+figure(c['before'])+figure(c['actual'])+'</div></section>'
htmltext='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Astronomy Hub — reference and actual visual comparison</title><style>:root{color-scheme:dark}body{margin:0;background:#070d17;color:#e9eef5;font:15px/1.65 system-ui,sans-serif}header,main{max-width:1700px;margin:auto;padding:24px}header{border-bottom:1px solid #36465d}h1{font-weight:500;font-size:27px}h2{font-weight:500;font-size:20px}p{max-width:1100px}a{color:#9ad0ff}nav{display:flex;flex-wrap:wrap;gap:14px}button{min-height:44px;padding:8px 18px;border:1px solid #627289;background:#132034;color:inherit;border-radius:12px;font:inherit;cursor:pointer}button[aria-pressed=true]{background:#28425e}section{margin:36px 0;border-top:1px solid #334055;padding-top:18px}.compare{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}figure{margin:0;background:#101925;border:1px solid #35445c;border-radius:14px;overflow:hidden}img{display:block;width:100%;height:440px;object-fit:contain;background:#02050a}figcaption{padding:14px;font-size:13px}.missing{padding:24px;border:1px dashed #576980;color:#a8b6c8;display:flex;align-items:center}code{font-size:11px;overflow-wrap:anywhere}details{margin-top:12px}summary{cursor:pointer;min-height:32px}.banner{padding:18px;border:1px solid #9a7647;background:#3b291e77;border-radius:12px}@media(max-width:950px){.compare{grid-template-columns:1fr}img{height:auto;max-height:80vh}header,main{padding:16px}}</style><header><h1>Astronomy Hub · original references and actual application</h1><p class="banner">Visual acceptance remains pending. Approved concepts are illustrative composition references. Historical baseline, package evidence and final integrated captures are explicitly distinguished. Passing tests do not confer visual acceptance. Original image bytes are preserved; click any image to inspect it at its native resolution.</p><p>All retained package comparisons use 2026-02-28 UTC. Solar positions remain real and planetary glyph sizes exaggerated; Earth imagery depends on lawful source availability; Sky preserves actual native Stellarium positions, illumination and the illustrative Pennsylvania horizon. Concept labels, weather, city lights and planetary arrangements are not scientific measurements.</p><nav><a href="http://127.0.0.1:4216/solar-system?date=2026-02-28T00:00:00Z">Open Solar</a><a href="http://127.0.0.1:4216/earth?date=2026-02-28T00:00:00Z">Open Earth</a><a href="http://127.0.0.1:4216/sky-engine?date=2026-02-28T00:00:00Z">Open Sky</a><a href="manifest.json">Image provenance manifest</a><a href="README.md">Remaining gaps</a></nav><p>Final integration journey proof status at assembly: <strong>STATUS</strong>. Rebuild this output gallery after final source freeze to incorporate later captures. This status is not inferred from image presence.</p><nav aria-label="Filter comparisons"><button aria-pressed="true" data-filter="all">All modes</button><button aria-pressed="false" data-filter="solar">Solar</button><button aria-pressed="false" data-filter="earth">Earth</button><button aria-pressed="false" data-filter="sky">Sky</button></nav></header><main>SECTIONS</main><script>for(const b of document.querySelectorAll('[data-filter]'))b.addEventListener('click',()=>{for(const x of document.querySelectorAll('[data-filter]'))x.setAttribute('aria-pressed',String(x===b));for(const s of document.querySelectorAll('section'))s.hidden=b.dataset.filter!=='all'&&s.dataset.mode!==b.dataset.filter})</script></html>'''
(OUT/'index.html').write_text(htmltext.replace('STATUS',html.escape(proof['status'])).replace('SECTIONS',sections))
print('Gallery:',len(manifest['assets']),'byte-identical copied assets;',len(manifest['comparisons']),'comparison groups; integrated status',proof['status'])
