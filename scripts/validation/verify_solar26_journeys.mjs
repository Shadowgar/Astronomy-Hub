// Actual private-preview journeys. Portrait/landscape emulate viewport sizes;
// they are not physical iPhone acceptance. Run only in the exclusive GPU slot.
import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import path from 'node:path'

assert.equal(process.platform,'win32','Requires actual headed Windows Edge/NVIDIA')
const [base='http://localhost:4231',out,selected='all',pack='data/runtime-packs/heliophysics/release-v1']=process.argv.slice(2)
assert.ok(out,'Usage: node verify_solar26_journeys.mjs BASE OUTPUT [A|B|C|D|all] [OBSERVATION_PACK]')
await mkdir(out,{recursive:true})
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const files=['frontend/src/features/beyond/BeyondWorkspace.tsx','frontend/src/features/beyond/BeyondScene.ts','frontend/src/features/beyond/beyondContracts.ts','frontend/src/features/beyond/beyondNavigation.ts','frontend/src/features/beyond/beyondMath.ts','frontend/src/features/beyond/ObservationViews.tsx','frontend/src/features/beyond/beyond.css','backend/app/services/beyond_exploration.py','backend/app/data/beyond_context.json']
const sourceHashes=async()=>Object.fromEntries(await Promise.all(files.map(async file=>[file,hash(await readFile(file))])))
const manifestRaw=await readFile(path.join(pack,'manifest.json')),manifest=JSON.parse(manifestRaw),products={}
for(const [id,entry] of Object.entries(manifest.products)){
 const raw=await readFile(path.join(pack,entry.file));assert.equal(hash(raw),entry.sha256);assert.equal(raw.length,entry.bytes);products[id]=JSON.parse(raw)
}
const receipt={status:'RUNNING',base,startedUtc:new Date().toISOString(),evidenceClass:'actual-api-production-preview-headed-windows-edge-nvidia',physicalDevice:false,ownerAcceptance:false,harnessSha256:hash(await readFile(new URL(import.meta.url))),sourceHashes:await sourceHashes(),sourcePack:{manifestSha256:hash(manifestRaw),releaseId:manifest.release_id,products:manifest.products},runs:[],errors:[],httpFailures:[],failedRequests:[],servedScripts:[]}
const save=()=>writeFile(path.join(out,'journeys.json'),JSON.stringify(receipt,null,2))
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
const sizes=[['desktop',{width:1440,height:900}],['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]
const observer={lat:'35.2472',lng:'-116.7933',elev:'1000'},epoch='2026-10-27T04:00:00.000Z',events={voyager1:'2012-08-25T12:00:00.000Z',voyager2:'2018-11-05T12:00:00.000Z'}
const observed=page=>page.evaluate(()=>Object.fromEntries(new URLSearchParams(sessionStorage.getItem('oras.runtime.intent.v1')||'')))
const diagnostics=page=>page.evaluate(()=>window.orasBeyondDiagnostics?.())
// Native Sky round-trips angular units; preserve numeric position, not decimal formatting.
receipt.observerPreservation={tolerances:{lat:1e-9,lng:1e-9,elev:1e-4},units:{lat:'degrees',lng:'degrees',elev:'metres'},maxAbsDelta:{lat:0,lng:0,elev:0},samples:[]}
const assertObserver=async(page,expectedEpoch)=>{
 const o=await observed(page),audit=receipt.observerPreservation,sample={route:new URL(page.url()).pathname,expectedEpoch,observed:{lat:o.lat,lng:o.lng,elev:o.elev,date:o.date},absDelta:{}}
 audit.samples.push(sample)
 for(const [k,v] of Object.entries(observer)){
  assert.ok(typeof o[k]==='string'&&o[k].trim().length>0&&Number.isFinite(Number(o[k])),`Finite observer ${k}`)
  const delta=Math.abs(Number(o[k])-Number(v));sample.absDelta[k]=delta;audit.maxAbsDelta[k]=Math.max(audit.maxAbsDelta[k],delta)
  assert.ok(delta<=audit.tolerances[k],`Observer ${k} preserved within ${audit.tolerances[k]} ${audit.units[k]}; actual delta ${delta}`)
 }
 assert.ok(Number.isFinite(Date.parse(o.date))&&Number.isFinite(Date.parse(expectedEpoch)),'Finite shared UTC')
 assert.equal(Date.parse(o.date),Date.parse(expectedEpoch),'Shared UTC preserved exactly');return o
}
const settle=async(page,view,expectedEpoch=null)=>{
 await page.waitForFunction(({view,expectedEpoch})=>{const d=window.orasBeyondDiagnostics?.();return document.querySelector('.beyond-shell')?.getAttribute('data-beyond-status')==='ready'&&d?.view===view&&d.renderCount>0&&!d.animating&&(!expectedEpoch||Date.parse(d.epoch)===Date.parse(expectedEpoch))},{view,expectedEpoch},{timeout:90000})
 const d=await diagnostics(page);assert.equal(d.disposed,false);assert.equal(d.contextLost,false);assert.equal(d.shaderFailures,0);assert.equal(d.independentAnimationLoops,1)
 assert.equal(await page.locator('.beyond-canvas canvas').count(),1);assert.equal(await page.locator('.solar-canvas canvas,.mission-canvas canvas,.system-canvas canvas,iframe').count(),0)
 assert.match(d.renderer,/NVIDIA.*RTX 3060/i);assert.doesNotMatch(d.renderer,/SwiftShader|Microsoft Basic/i)
 return d
}
const solarReady=async(page,expectedEpoch)=>{await page.waitForFunction(e=>{const d=window.orasSolarDiagnostics?.();return d&&Date.parse(d.epoch)===Date.parse(e)&&d.renderCount>0&&!d.animating&&!d.assets.requests&&!d.detail.pending},expectedEpoch,{timeout:90000});return page.evaluate(()=>window.orasSolarDiagnostics())}
const missionReady=async(page,id,expectedEpoch=null)=>{await page.waitForFunction(({id,expectedEpoch})=>{const d=window.orasMissionDiagnostics?.();return document.querySelector('.mission-shell')?.getAttribute('data-mission-status')==='ready'&&d?.mission===id&&(!expectedEpoch||Date.parse(d.epoch)===Date.parse(expectedEpoch))&&d.renderCount>0&&!d.animating&&!d.assets.requests&&!d.playing},{id,expectedEpoch},{timeout:90000});return page.evaluate(()=>window.orasMissionDiagnostics())}
const retain=async(page,key,kind='Beyond')=>page.evaluate(({key,kind})=>{window.__beyondRetired??={};window.__beyondRetired[key]=window['oras'+kind+'Diagnostics']},{key,kind})
const retired=async(page,key)=>{const result=await page.evaluate(key=>window.__beyondRetired[key]?.(),key),d=result?.retired??result;assert.ok(d,'Retired diagnostic captured');assert.equal(d.disposed,true);if(d.independentAnimationLoops!==undefined)assert.equal(d.independentAnimationLoops,0);assert.equal(d.ownedResources??d.assets.resources,0);assert.equal(d.assets.requests,0);return d}
const tab=async(page,name,view,e=null)=>{await page.getByRole('navigation',{name:'Beyond the Planets views'}).getByRole('button',{name,exact:true}).click();return settle(page,view,e)}
const modes=async(page,name)=>{await page.getByRole('button',{name:'Choose exploration mode',exact:true}).click();await page.getByRole('navigation',{name:'Exploration modes'}).getByRole('button',{name,exact:true}).click()}
const capture=async(page,run,name)=>{
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
 const file=`${run.id}-${name}.png`;await page.screenshot({path:path.join(out,file)})
 const layout=await page.evaluate(()=>({width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,canvases:document.querySelectorAll('canvas').length,frames:document.querySelectorAll('iframe').length,controls:[...document.querySelectorAll('.beyond-header>button,.beyond-actions>button')].filter(e=>!e.disabled).map(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return{text:e.getAttribute('aria-label')||e.textContent,within:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,hit:!!hit&&(e===hit||e.contains(hit))}})}))
 assert.ok(layout.documentWidth<=layout.width+1,'No page horizontal overflow');assert.ok(layout.controls.every(c=>c.within&&c.hit),'Essential Beyond controls visible and uncovered')
 run.captures.push({file,layout,diagnostics:await diagnostics(page)})
}
const verifyCrossingPresentation=async(page,run,mission)=>{
 const tabName=mission==='voyager1'?'Voyager 1':'Voyager 2',selected=page.getByRole('navigation',{name:'Beyond the Planets views'}).getByRole('button',{name:tabName,exact:true})
 await selected.hover()
 const layout=await page.evaluate(()=>{
  const intro=document.querySelector('.beyond-intro'),tabs=document.querySelector('.beyond-tabs'),selected=tabs.querySelector('button[aria-pressed="true"]'),style=getComputedStyle(selected)
  const rgb=value=>value.match(/[\d.]+/g).slice(0,3).map(Number),luminance=values=>values.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4}).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0)
  const foreground=luminance(rgb(style.color)),background=luminance(rgb(style.backgroundColor))
  return{introBottom:intro.getBoundingClientRect().bottom,tabsTop:tabs.getBoundingClientRect().top,hovered:selected.matches(':hover'),foreground:style.color,background:style.backgroundColor,contrast:(Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05)}
 })
 assert.ok(layout.introBottom<=layout.tabsTop+.5,'Crossing explanation ends before fixed tabs')
 assert.equal(layout.hovered,true);assert.ok(layout.contrast>=4.5,'Selected tab retains normal-text contrast while hovered')
 const summary=page.locator('.beyond-context summary').filter({hasText:'What was measured'}),details=summary.locator('..')
 await summary.focus();await page.keyboard.press('Enter');assert.equal(await details.evaluate(element=>element.open),true)
 const paragraph=details.locator('p');await paragraph.scrollIntoViewIfNeeded()
 assert.equal(await paragraph.innerText(),receipt.context.crossings.find(c=>c.mission_id===mission).interpretation,'Complete qualified interpretation retained')
 const visibility=await paragraph.evaluate(element=>{const text=element.getBoundingClientRect(),panel=element.closest('.beyond-context').getBoundingClientRect();return{top:text.top,bottom:text.bottom,panelTop:panel.top,panelBottom:panel.bottom,within:text.top>=panel.top&&text.bottom<=panel.bottom&&text.top>=0&&text.bottom<=innerHeight}})
 assert.equal(visibility.within,true,'Expanded measured-event explanation is fully visible inside its scrollable panel')
 await capture(page,run,mission+'-measured-explanation')
 await summary.focus();await page.keyboard.press('Enter');assert.equal(await details.evaluate(element=>element.open),false)
 run.presentation??=[];run.presentation.push({mission,layout,visibility,keyboardDisclosure:true})
}
const enter=async(page,run)=>{
 await page.goto(base+'/solar-system?'+new URLSearchParams({date:epoch,...observer}));await solarReady(page,epoch);await assertObserver(page,epoch);await retain(page,'initial-solar','Solar')
 await page.getByText('Explore Solar System',{exact:true}).click();await page.getByRole('button',{name:/^Beyond the Planets/}).click()
 await settle(page,'outer',epoch);run.solarDeparture=await page.evaluate(()=>history.state?.usr?.beyondReturn?.state?.r4SolarView);assert.ok(run.solarDeparture?.camera)
 run.lifecycle.push(await retired(page,'initial-solar'));await assertObserver(page,epoch)
}
const waitObservation=async(page,id)=>{await page.waitForFunction(id=>window.orasBeyondDiagnostics?.().observationId===id,id,{timeout:30000});await page.getByTestId(id==='ibex-ena-map'?'ibex-observation':'imap-observation').waitFor()}

try{
 const api=await browser.newContext(),r=await api.request.get(base+'/api/v1/solar/beyond/context');assert.equal(r.status(),200);receipt.context=await r.json()
 for(const id of Object.keys(products)){const r=await api.request.get(base+'/api/v1/solar/beyond/observations/'+id);assert.equal(r.status(),200);const body=await r.json();assert.deepEqual(body.data,products[id].data);assert.deepEqual(body.metadata,products[id].metadata)}
 await api.close()
 for(const id of ['A','B','C','D'].filter(id=>selected==='all'||selected===id)){
  const run={id,status:'RUNNING',checks:[],captures:[],lifecycle:[],console:[]};receipt.runs.push(run)
  const context=await browser.newContext({viewport:sizes[0][1],reducedMotion:'no-preference',recordVideo:{dir:path.join(out,'video'),size:sizes[0][1]}}),page=await context.newPage(),scripts=new Set()
  page.on('pageerror',e=>receipt.errors.push({id,error:e.message}));page.on('console',m=>{if(m.type()==='error')run.console.push(m.text())})
  page.on('response',r=>{if(r.status()>=400)receipt.httpFailures.push({id,url:r.url(),status:r.status(),negativeCase:run.negativeCase??null});if(r.url().startsWith(base)&&r.request().resourceType()==='script')scripts.add(r.url())})
  page.on('requestfailed',r=>receipt.failedRequests.push({id,url:r.url(),error:r.failure()}))
  try{
   await enter(page,run);await capture(page,run,'outer-overview')
   if(id==='A'){
    await tab(page,'Voyager 1','voyager1',events.voyager1);await page.locator('.beyond-canvas canvas').focus();await page.keyboard.press('ArrowRight');const before=await settle(page,'voyager1',events.voyager1);run.event=before
    assert.equal(before.crossings.find(c=>c.id==='voyager1-heliopause').quality,'predicted');await capture(page,run,'voyager1-crossing');await verifyCrossingPresentation(page,run,'voyager1');await retain(page,'crossing-to-mission')
    await page.getByRole('button',{name:'Open Voyager 1 mission →',exact:true}).click();await missionReady(page,'voyager1',events.voyager1);run.lifecycle.push(await retired(page,'crossing-to-mission'))
    for(const [mission,name] of [['voyager2','Voyager 2'],['voyager1','Voyager 1']]){
     const key='mission-switch-'+mission;await retain(page,key,'Mission');await page.getByText('Spacecraft & Missions',{exact:true}).click()
     await page.locator('.mission-discovery').getByRole('button').filter({has:page.locator('strong',{hasText:name})}).click();await missionReady(page,mission);run.lifecycle.push(await retired(page,key))
     assert.ok(await page.evaluate(()=>history.state?.usr?.beyondReturn?.state?.beyondView),'Mission switching preserves originating Beyond camera/view')
    }
    await retain(page,'mission-return','Mission')
    await page.getByRole('button',{name:'Return to Beyond view →',exact:true}).click();const back=await settle(page,'voyager1',events.voyager1);run.lifecycle.push(await retired(page,'mission-return'))
    assert.ok(Math.hypot(...before.camera.position.map((v,i)=>v-back.camera.position[i]))<1e-8,'Beyond camera restored after mission visit');await assertObserver(page,events.voyager1)
    await retain(page,'beyond-to-solar');await page.getByRole('button',{name:'← Solar System',exact:true}).click();const solar=await solarReady(page,events.voyager1);run.lifecycle.push(await retired(page,'beyond-to-solar'))
    assert.ok(Math.hypot(...run.solarDeparture.camera.map((v,i)=>v-solar.camera[i]))<1e-8,'Original Solar camera restored at historical UTC');await assertObserver(page,events.voyager1)
    // A direct historical mission entry must select the crossing's date, not
    // display the 2012 anchor under a 1979 scene UTC.
    await page.goto(base+'/missions/voyager1?'+new URLSearchParams({date:'1979-03-05T12:00:00.000Z',...observer}));await missionReady(page,'voyager1','1979-03-05T12:00:00.000Z')
    await page.getByRole('button',{name:'Explore heliopause crossings →',exact:true}).click();await settle(page,'voyager1',events.voyager1);await capture(page,run,'direct-encounter-to-canonical-crossing')
    run.checks.push('Solar departure camera, historical crossing UTC, predicted geometry, Voyager2→Voyager1 switching preserves originating Beyond camera, and direct encounter→canonical crossing')
   }else if(id==='B'){
    await tab(page,'Voyager 2','voyager2',events.voyager2);await capture(page,run,'voyager2-crossing');await verifyCrossingPresentation(page,run,'voyager2');const comparison=await tab(page,'Compare','comparison',events.voyager2)
    assert.equal(comparison.planetsVisible,false);assert.equal(comparison.crossings.filter(c=>c.visible).length,2)
    for(const c of comparison.crossings){const source=receipt.context.crossings.find(s=>s.id===c.id);assert.equal(c.observedDate,source.observed.date);assert.deepEqual(c.position,source.geometry.position);assert.equal(Date.parse(c.sourceEpoch),Date.parse(source.geometry.epoch))}
    assert.notEqual(comparison.crossings[0].sourceEpoch,comparison.crossings[1].sourceEpoch);await capture(page,run,'separate-historical-comparison')
    await page.locator('.beyond-context').getByRole('button',{name:'Mission timeline →',exact:true}).first().click();await missionReady(page,'voyager1',events.voyager1)
    await page.getByRole('button',{name:'Return to Beyond view →',exact:true}).click();await settle(page,'comparison',events.voyager2);await assertObserver(page,events.voyager2)
    for(const [name,size] of sizes){await page.setViewportSize(size);await capture(page,run,'comparison-'+name)}
    run.checks.push('Separate event vectors/dates, no simultaneous planet layer, comparison context UTC restored after opening different-epoch mission; three viewports')
   }else if(id==='C'){
    await tab(page,'Heliosphere','heliosphere');assert.match(await page.locator('.beyond-context').innerText(),/not qualified|conceptual/i);await capture(page,run,'illustrative-heliosphere')
    await tab(page,'IBEX','ibex');await waitObservation(page,'ibex-ena-map');assert.equal(await page.locator('[data-observation-cell]').count(),1800)
    assert.equal(await page.locator('[data-observation-cell][data-masked="true"]').count(),products['ibex-ena-map'].data.mask.flat().filter(Boolean).length)
    const longitude=page.getByLabel('Ecliptic longitude bin',{exact:true});await longitude.focus();await longitude.press('Home');assert.equal(await longitude.inputValue(),'0');await longitude.press('ArrowRight');assert.equal(await longitude.inputValue(),'1')
    assert.match(await page.locator('.beyond-observation-readout').innerText(),/9° E/);await capture(page,run,'ibex-native-cell-selection')
    await tab(page,'IMAP','imap');await waitObservation(page,'imap-magnetic-field');const svg=page.getByTestId('imap-observation').locator('svg')
    // Independent screen reference includes viewBox letterboxing/max-height.
    for(const [name,size] of sizes){await page.setViewportSize(size);await svg.scrollIntoViewIfNeeded();const index=600,point=await svg.evaluate((s,index)=>{const p=s.createSVGPoint();p.x=55+660*index/1440;p.y=180;const q=p.matrixTransform(s.getScreenCTM());return{x:q.x,y:q.y,width:s.getBoundingClientRect().width,height:s.getBoundingClientRect().height}},index);await page.mouse.move(point.x,point.y);await page.waitForFunction(index=>Number(document.querySelector('input[aria-label="Observation minute"]')?.value)===index,index);run.checks.push(`Actual ${name} SVG screen point selects minute600 with letterboxing respected`);await capture(page,run,'imap-'+name)}
    await page.setViewportSize(sizes[0][1]);const missing=products['imap-magnetic-field'].data.value.findIndex(v=>v===null);assert.ok(missing>=0)
    const minute=page.getByLabel('Observation minute',{exact:true});await minute.focus();await minute.press('Home');for(let n=0;n<missing;n++)await minute.press('ArrowRight');assert.equal(await minute.inputValue(),String(missing));assert.match(await page.locator('.beyond-observation-readout').innerText(),/Unmeasured minute/);await capture(page,run,'imap-real-quality-gap')
    await tab(page,'IBEX','ibex');await waitObservation(page,'ibex-ena-map');run.negativeCase='intentional missing observation503'
    await page.route('**/api/v1/solar/beyond/observations/imap-magnetic-field',route=>route.fulfill({status:503,contentType:'application/json',body:'{"detail":"qualification missing-source case"}'}))
    await tab(page,'IMAP','imap');await page.getByRole('alert').filter({hasText:'No substitute data'}).waitFor();assert.equal(await page.getByTestId('imap-observation').count(),0);await capture(page,run,'missing-source-controlled')
    await page.unroute('**/api/v1/solar/beyond/observations/imap-magnetic-field');run.negativeCase=null;await tab(page,'IBEX','ibex');await waitObservation(page,'ibex-ena-map');await tab(page,'IMAP','imap');await waitObservation(page,'imap-magnetic-field')
    await page.route('**/api/v1/solar/beyond/observations/ibex-ena-map',async route=>{await new Promise(resolve=>setTimeout(resolve,350));await route.continue().catch(()=>{})})
    await tab(page,'IBEX','ibex');await tab(page,'IMAP','imap');await waitObservation(page,'imap-magnetic-field');await page.waitForTimeout(500)
    assert.equal(await page.getByTestId('ibex-observation').count(),0,'Cancelled IBEX cannot replace selected IMAP');assert.equal((await diagnostics(page)).observationId,'imap-magnetic-field');await page.unroute('**/api/v1/solar/beyond/observations/ibex-ena-map')
    await tab(page,'Overview','outer',epoch);run.negativeCase='intentional unsupported planetary epoch1000'
    await page.getByRole('button',{name:'Science & sources',exact:true}).click();await page.getByLabel('Beyond epoch UTC',{exact:true}).fill('1000-01-01T00:00');await page.getByRole('button',{name:'Apply UTC to overview',exact:true}).click()
    await settle(page,'outer','1000-01-01T00:00:00.000Z');await page.locator('.beyond-notice').waitFor({timeout:30000});const unsupported=await diagnostics(page);assert.equal(unsupported.snapshotEpoch,null);assert.equal(unsupported.planetsVisible,false);await capture(page,run,'unsupported-epoch-no-stale-planets')
    await page.getByRole('button',{name:'Science & sources',exact:true}).click();await page.getByLabel('Beyond epoch UTC',{exact:true}).fill(epoch.slice(0,16));await page.getByRole('button',{name:'Apply UTC to overview',exact:true}).click();await settle(page,'outer',epoch);run.negativeCase=null
    run.checks.push('Actual IBEX pixels/quality mask; measured IMAP gap; no fabricated replacement on503 and real source recovery')
    run.checks.push('Rapid instrument switch cannot admit a cancelled product; unsupported planetary UTC removes stale positions and current UTC recovers')
   }else{
    await tab(page,'Oort Cloud','oort',epoch)
    for(const [name,size] of sizes){await page.setViewportSize(size);await page.getByRole('button',{name:'100,000 AU',exact:true}).click();let d=await settle(page,'oort',epoch);assert.equal(d.radius,100000);assert.match(d.precision,/CPU64/);assert.ok(d.camera.position.every(Number.isFinite));const before=d.camera.position
     await page.locator('.beyond-canvas canvas').focus();await page.keyboard.press('ArrowRight');d=await settle(page,'oort',epoch);assert.ok(Math.hypot(...before.map((v,i)=>v-d.camera.position[i]))>1,'Extreme-scale orbit changes actual camera');await page.getByRole('button',{name:'Recenter on Sun',exact:true}).click();await settle(page,'oort',epoch);await capture(page,run,'oort-100k-'+name)}
    await page.setViewportSize(sizes[0][1]);await retain(page,'oort-to-solar');await page.getByRole('button',{name:'← Solar System',exact:true}).click();const solar=await solarReady(page,epoch);run.lifecycle.push(await retired(page,'oort-to-solar'));await assertObserver(page,epoch)
    assert.ok(Math.hypot(...run.solarDeparture.camera.map((v,i)=>v-solar.camera[i]))<1e-8,'Extreme scale does not contaminate Solar camera')
    await page.getByText('Explore Solar System',{exact:true}).click();await page.getByRole('button',{name:'Saturn',exact:true}).hover();await page.getByRole('button',{name:'Explore Saturn System',exact:true}).click()
    await page.locator('.system-shell[data-system-status="ready"]').waitFor({timeout:90000});await assertObserver(page,epoch);await page.screenshot({path:path.join(out,'D-return-saturn-system.png')});await retain(page,'system-to-sky','System')
    await modes(page,'Sky');await page.locator('[data-runtime-mode="sky"][data-runtime-status="ready"]').waitFor({timeout:90000});run.lifecycle.push(await retired(page,'system-to-sky'));await assertObserver(page,epoch)
    assert.equal(await page.locator('iframe').count(),1);assert.equal(await page.locator('.beyond-canvas canvas,.system-canvas canvas').count(),0);await page.screenshot({path:path.join(out,'D-return-native-sky.png')})
    await modes(page,'Earth');await page.locator('[data-runtime-mode="earth"][data-runtime-status="ready"]').waitFor({timeout:90000});await assertObserver(page,epoch);assert.equal(await page.locator('iframe').count(),1);await page.screenshot({path:path.join(out,'D-return-native-earth.png')})
    run.checks.push('100000AU orbit/recenter in three viewports; original Solar camera; Saturn system; native Sky/Earth with same observer/UTC and serial renderer ownership')
   }
   for(const url of scripts){const r=await context.request.get(url);assert.equal(r.status(),200);receipt.servedScripts.push({url,sha256:hash(await r.body())})}
   run.status='PASS'
  }catch(error){run.status='FAIL';run.failure=String(error);run.body=await page.locator('body').innerText().catch(()=>null);await page.screenshot({path:path.join(out,id+'-failure.png')}).catch(()=>{});console.error(id,error)}
  finally{run.video=path.basename(await page.video().path());await context.close();await save();console.log(id,run.status)}
 }
 const audit=await browser.newContext();for(const script of receipt.servedScripts){const response=await audit.request.get(script.url);assert.equal(response.status(),200);assert.equal(hash(await response.body()),script.sha256,'Served application changed during qualification')}await audit.close()
 receipt.finalSourceHashes=await sourceHashes();receipt.workingTreeChangesDuringRun=files.filter(f=>receipt.finalSourceHashes[f]!==receipt.sourceHashes[f])
 assert.equal(receipt.runs.length,selected==='all'?4:1);assert.ok(receipt.runs.every(r=>r.status==='PASS'),'Every requested journey must pass');assert.deepEqual(receipt.errors,[],'No uncaught browser errors')
 assert.ok(!receipt.httpFailures.some(r=>r.url.includes('/api/v1/solar/beyond/')&&!r.negativeCase),'Unexpected heliophysics source HTTP failure')
 receipt.status='PASS'
}catch(error){receipt.status='FAIL';receipt.failure=String(error);console.error(error)}
finally{await browser.close();receipt.finishedUtc=new Date().toISOString();await save();if(receipt.status!=='PASS')process.exitCode=1}
