// Actual API + production preview + headed Windows Edge/hardware GPU journeys.
// Viewport sizes are desktop browser emulation, never physical iPhone evidence.
import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import path from 'node:path'

assert.equal(process.platform,'win32','Requires headed Windows Edge and an exclusive hardware GPU slot')
const base=process.argv[2]||'http://localhost:4231',out=process.argv[3],selectedMission=process.argv[4]||'all'
assert.ok(out,'Usage: node verify_solar25_journeys.mjs BASE OUTPUT [MISSION|all] [SOURCE_PACK]')
await mkdir(out,{recursive:true})
const files=['frontend/src/features/missions/MissionWorkspace.tsx','frontend/src/features/missions/MissionScene.ts','frontend/src/features/missions/missionContracts.ts','frontend/src/features/missions/missions.css','frontend/src/features/solar/SolarWorkspace.tsx','backend/app/services/mission_exploration.py','backend/app/data/mission_events.json']
const hashes=async()=>Object.fromEntries(await Promise.all(files.map(async file=>[file,createHash('sha256').update(await readFile(file)).digest('hex')])))
const receipt={status:'RUNNING',evidenceClass:'actual-api-production-preview-headed-windows-edge-nvidia',physicalDevice:false,ownerAcceptance:false,base,startedUtc:new Date().toISOString(),harnessSha256:createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex'),sourceHashes:await hashes(),runs:[],secondary:[],errors:[],httpFailures:[],failedRequests:[],servedScripts:[]}
const pack=process.argv[5]||process.env.ORAS_JOURNEY_SOURCE_PACK||'data/runtime-packs/solar-missions/release-v2'
const sourceManifest=await readFile(path.join(pack,'manifest.json'))
receipt.sourcePack={path:pack,releaseId:JSON.parse(sourceManifest).release_id,manifestSha256:createHash('sha256').update(sourceManifest).digest('hex'),missions:{}}
for(const id of ['voyager1','voyager2','cassini','newhorizons','dawn','near','rosetta']){
 const bytes=await readFile(path.join(pack,id+'.json')),document=JSON.parse(bytes)
 receipt.sourcePack.missions[id]={sha256:createHash('sha256').update(bytes).digest('hex'),segments:document.segments.map(segment=>({id:segment.id,start:segment.start,end:segment.end,sha256:createHash('sha256').update(JSON.stringify(segment)).digest('hex')}))}
}
const save=()=>writeFile(path.join(out,'journeys.json'),JSON.stringify(receipt,null,2))
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
const observer={lat:'35.2472',lng:'-116.7933',elev:'1000'},startEpoch='2026-10-27T04:00:00.000Z'
const required={voyager1:['voyager1-jupiter','voyager1-saturn'],voyager2:['voyager2-jupiter','voyager2-saturn','voyager2-uranus','voyager2-neptune'],cassini:['cassini-titan-a','cassini-enceladus-e21','cassini-end'],newhorizons:['newhorizons-pluto','newhorizons-arrokoth']}
const sizes=[['desktop',{width:1440,height:900}],['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]
const observed=async page=>page.evaluate(()=>Object.fromEntries(new URLSearchParams(sessionStorage.getItem('oras.runtime.intent.v1')||'')))
const diagnostics=page=>page.evaluate(()=>window.orasMissionDiagnostics?.())
const settle=async(page,mission,epoch=null)=>{
 await page.waitForFunction(({mission,epoch})=>{const d=window.orasMissionDiagnostics?.();return document.querySelector('.mission-shell')?.getAttribute('data-mission-status')==='ready'&&d?.mission===mission&&(!epoch||Date.parse(d.epoch)===Date.parse(epoch))&&d.renderCount>0&&!d.animating&&!d.assets.requests&&!d.playing},{mission,epoch},{timeout:90000})
 const d=await diagnostics(page)
 assert.equal(d.shaderFailures,0,'Mission shaders must be runnable')
 assert.equal(d.contextLost,false)
 assert.equal(d.disposed,false)
 assert.equal(await page.locator('.mission-canvas canvas').count(),1)
 assert.equal(await page.locator('.solar-canvas canvas,iframe').count(),0,'Only the mission renderer may be active')
 assert.deepEqual(d.bodies.flatMap(b=>b.errors||[]),[],'Target assets must load without fallback errors')
 return d
}
const solarReady=async(page,epoch)=>{
 await page.waitForFunction(epoch=>{const d=window.orasSolarDiagnostics?.();return d&&Date.parse(d.epoch)===Date.parse(epoch)&&d.renderCount>0&&!d.animating&&!d.assets.requests&&!d.detail.pending},epoch,{timeout:90000})
 return page.evaluate(()=>window.orasSolarDiagnostics())
}
const retain=async(page,key)=>page.evaluate(key=>{window.__journeyRetired??={};window.__journeyRetired[key]=window.orasMissionDiagnostics},key)
const retired=async(page,key)=>{
 const d=await page.evaluate(key=>window.__journeyRetired[key]?.(),key)
 assert.ok(d,'Old renderer diagnostics retained by test')
 assert.equal(d.disposed,true,'Old renderer must be disposed')
 assert.equal(d.independentAnimationLoops,0)
 assert.equal(d.ownedResources,0)
 assert.equal(d.assets.requests,0)
 return {instanceId:d.instanceId,disposed:d.disposed,ownedResources:d.ownedResources,assets:d.assets,independentAnimationLoops:d.independentAnimationLoops}
}
const capture=async(page,run,name)=>{
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
 const file=`${run.mission}-${name}.png`
 await page.screenshot({path:path.join(out,file)})
 const layout=await page.evaluate(()=>({width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,canvasCount:document.querySelectorAll('.mission-canvas canvas').length,controls:[...document.querySelectorAll('.mission-tools button,.mission-playback button')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0}).map(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return{name:e.getAttribute('aria-label')||e.textContent,within:r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,hit:!!hit&&(e===hit||e.contains(hit)),disabled:e.disabled}})}))
 run.captures.push({file,layout,diagnostics:await diagnostics(page)})
 assert.ok(layout.documentWidth<=layout.width+1,'No page horizontal overflow')
 assert.ok(layout.controls.every(c=>c.within&&c.hit),'Essential mission controls are visible and not covered')
}
const settings=async(page,label,value)=>{
 await page.getByRole('button',{name:'Mission display settings',exact:true}).click()
 await page.getByLabel(label,{exact:true}).selectOption(value)
 await page.getByRole('button',{name:'Close mission panel',exact:true}).click()
}
const choose=async(page,entry)=>{
 await page.getByText('Spacecraft & Missions',{exact:true}).click()
 await page.locator('.mission-discovery').getByRole('button').filter({has:page.locator('strong',{hasText:entry.name})}).click()
 return settle(page,entry.id,entry.default_epoch)
}
try{
 const api=await browser.newContext()
 const response=await api.request.get(base+'/api/v1/solar/missions')
 assert.equal(response.status(),200)
 const catalog=await response.json();receipt.catalog=catalog
 assert.equal(catalog.release_id,receipt.sourcePack.releaseId,'API release must match the hashed source pack')
 await api.close()
 for(const mission of Object.keys(required).filter(id=>selectedMission==='all'||id===selectedMission)){
  const entry=catalog.missions.find(m=>m.id===mission),run={mission,status:'RUNNING',checks:[],captures:[],events:[],lifecycle:[],console:[]}
  receipt.runs.push(run)
  const context=await browser.newContext({viewport:sizes[0][1],reducedMotion:'no-preference',recordVideo:{dir:path.join(out,'video'),size:sizes[0][1]}}),page=await context.newPage()
  page.on('pageerror',e=>receipt.errors.push({mission,error:e.message}))
  page.on('console',m=>{if(m.type()==='error')run.console.push(m.text())})
  page.on('requestfailed',r=>receipt.failedRequests.push({mission,url:r.url(),error:r.failure()}))
  page.on('response',r=>{if(r.status()>=400)receipt.httpFailures.push({mission,url:r.url(),status:r.status()})})
  try{
   assert.ok(entry?.default_epoch,'Flagship has a qualified default epoch')
   for(const id of required[mission])assert.equal(entry.events.find(e=>e.id===id)?.available,true,`Required event is qualified: ${id}`)
   await page.goto(base+'/solar-system?'+new URLSearchParams({date:startEpoch,...observer}))
   const beforeSolar=await solarReady(page,startEpoch);run.solarBefore=beforeSolar
   const beforeObserver=await observed(page)
   for(const [key,value] of Object.entries(observer))assert.equal(beforeObserver[key],value)
   await page.evaluate(()=>{window.__journeySolar=window.orasSolarDiagnostics})
   if(!receipt.servedScripts.length){for(const url of await page.locator('script[src]').evaluateAll(nodes=>nodes.map(n=>n.src))){const r=await context.request.get(url);receipt.servedScripts.push({url,status:r.status(),sha256:createHash('sha256').update(await r.body()).digest('hex')})}}
   await page.getByText('Explore Solar System',{exact:true}).click()
   await page.getByRole('button',{name:/^Spacecraft & Missions/}).click()
   await settle(page,'voyager1')
   // Opening Solar's discovery menu can reframe its overview. The saved
   // departure view, captured by the product at the handoff, is authoritative.
   run.solarDeparture=await page.evaluate(()=>history.state?.usr?.missionReturn?.state?.r4SolarView)
   assert.ok(run.solarDeparture?.camera,'Product records its actual Solar departure camera')
   assert.equal(await page.evaluate(()=>window.__journeySolar().disposed),true)
   if(mission!=='voyager1'){await retain(page,'initial-voyager');await choose(page,entry);run.lifecycle.push(await retired(page,'initial-voyager'))}
   let d=await settle(page,mission,entry.default_epoch)
   run.gpu=await page.evaluate(()=>{const gl=document.querySelector('.mission-canvas canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return{vendor:gl.getParameter(e.UNMASKED_VENDOR_WEBGL),renderer:gl.getParameter(e.UNMASKED_RENDERER_WEBGL)}})
   assert.match(run.gpu.renderer,/NVIDIA.*RTX 3060/i)
   assert.doesNotMatch(run.gpu.renderer,/SwiftShader|Microsoft Basic/i)
   assert.equal(d.craft.modelReady,true);assert.ok(d.craft.modelMeshCount>1)
   run.checks.push('Solar entry retires Solar renderer; actual hardware GPU and model loaded')
   await capture(page,run,'default-encounter')

   for(const event of entry.events){
    if(!event.available){run.events.push({id:event.id,status:'UNAVAILABLE',reason:'Catalog source coverage excludes event epoch'});continue}
    const previous=await diagnostics(page),key='before-'+event.id
    await retain(page,key)
    await page.locator('.mission-events').getByRole('button').filter({hasText:event.label}).click()
    d=await settle(page,mission,event.view_epoch||event.epoch)
    if(d.instanceId!==previous.instanceId)run.lifecycle.push(await retired(page,key))
    assert.equal(Date.parse(d.displayEpoch),Date.parse(event.view_epoch||event.epoch))
    const target=entry.targets.find(t=>t.naif_id===event.target_id),present=target&&target.id!=='sun'&&d.bodies.some(b=>b.id===target.id)
    if(present){await page.getByLabel('Focus encounter target',{exact:true}).selectOption(target.id);await page.waitForFunction(id=>{const d=window.orasMissionDiagnostics?.();return d?.focus===id&&d.view==='target'&&!d.animating},target.id);d=await settle(page,mission,event.view_epoch||event.epoch)}
    await capture(page,run,event.id)
    run.events.push({id:event.id,status:'PASS',epoch:d.epoch,target:present?target.id:null,instanceId:d.instanceId})
    if(event.id==='newhorizons-jupiter'){
     await page.getByRole('button',{name:'Mission science & sources',exact:true}).click()
     const sourceText=await page.locator('dialog[open]').innerText()
     assert.match(sourceText,/200 km.*3\.3 mm\/s.*10,000 km.*6\.7 mm\/s/s)
     await page.locator('dialog[open] p').filter({hasText:'3.3 mm/s'}).first().scrollIntoViewIfNeeded()
     await page.screenshot({path:path.join(out,'newhorizons-jupiter-source-uncertainty.png')})
     run.sourceDisclosure=sourceText
     await page.getByRole('button',{name:'Close mission panel',exact:true}).click()
    }
    if(event.id==='newhorizons-arrokoth')assert.match(await page.locator('.mission-context').innerText(),/reference sphere/i)
    if(event.id==='newhorizons-pluto'){
     assert.ok(d.bodies.some(b=>b.id==='charon'),'Historical Charon target included with Pluto')
     await page.getByLabel('Focus encounter target',{exact:true}).selectOption('charon')
     await page.waitForFunction(()=>{const d=window.orasMissionDiagnostics?.();return d?.focus==='charon'&&!d.animating})
     await capture(page,run,'pluto-encounter-charon')
    }
   }

   // Return to an encounter safely inside coverage before continuous playback.
   const inspectEvent=entry.events.find(e=>e.id===required[mission][0])
   await page.locator('.mission-events').getByRole('button').filter({hasText:inspectEvent.label}).click()
   await settle(page,mission,inspectEvent.view_epoch||inspectEvent.epoch)
   // Inspect the complete source model; all source appendages remain intact.
   await page.getByRole('button',{name:'Inspect craft',exact:true}).click()
   await page.waitForFunction(()=>{const d=window.orasMissionDiagnostics?.();return d?.view==='inspection'&&!d.animating})
   d=await settle(page,mission);assert.equal(d.craft.visible,true);assert.equal(d.craft.modelReady,true)
   if(mission==='cassini')assert.match(await page.locator('.mission-context').innerText(),/Huygens.*reference|reference.*Huygens/i)
   await settings(page,'Mission camera mode','follow')
   await page.getByLabel('Mission playback speed',{exact:true}).selectOption('60')
   const before=await diagnostics(page),offset=before.camera.position.map((v,i)=>v-before.craft.position[i])
   await page.getByRole('button',{name:'Play mission playback',exact:true}).click()
   await page.waitForTimeout(1800)
   const playing=await diagnostics(page)
   if(playing.playing)await page.getByRole('button',{name:'Pause mission playback',exact:true}).click()
   d=await settle(page,mission)
   assert.ok(Date.parse(d.epoch)>Date.parse(before.epoch),'Source playback advances time')
   assert.ok(Math.hypot(...d.craft.position.map((v,i)=>v-before.craft.position[i]))>0,'Source spacecraft moves')
   const afterOffset=d.camera.position.map((v,i)=>v-d.craft.position[i])
   assert.ok(Math.hypot(...offset.map((v,i)=>v-afterOffset[i]))<1e-10,'Follow keeps the physical spacecraft camera offset')
   run.playback={before,after:d};run.checks.push('Actual source playback advances spacecraft/time with stable follow offset')
   for(const [size,dimensions] of sizes){await page.setViewportSize(dimensions);await page.waitForTimeout(300);await capture(page,run,'inspection-'+size)}
   await page.setViewportSize(sizes[0][1])
   await page.getByRole('button',{name:'Trajectory',exact:true}).click()
   await page.waitForFunction(()=>{const d=window.orasMissionDiagnostics?.();return d?.view==='trajectory'&&!d.animating},{},{timeout:90000})
   await capture(page,run,'bounded-trajectory')
   d=await diagnostics(page);assert.ok(d.trackSegments.length>0);assert.equal(d.pathsVisible,true)
   run.checks.push('Historical trajectory exposes separate qualified segments')
   const center=Date.parse(d.epoch),rangeStart=new Date(center-3600000).toISOString().slice(0,16),rangeEnd=new Date(center+3600000).toISOString().slice(0,16)
   await page.getByRole('button',{name:'Mission display settings',exact:true}).click()
   await page.getByLabel('Trajectory start UTC',{exact:true}).fill(rangeStart)
   await page.getByLabel('Trajectory end UTC',{exact:true}).fill(rangeEnd)
   const rangeResponse=page.waitForResponse(r=>r.url().includes('/trajectory?')&&r.request().method()==='GET')
   await page.getByRole('button',{name:'Show selected trajectory interval',exact:true}).click()
   const response=await rangeResponse;assert.equal(response.status(),200)
   const bounded=await response.json();run.selectedTrajectory={url:response.url(),sha256:createHash('sha256').update(JSON.stringify(bounded)).digest('hex'),segments:bounded.tracks.map(t=>({id:t.segment_id,points:t.points.length,first:t.points[0].epoch,last:t.points.at(-1).epoch}))}
   for(const track of bounded.tracks)for(const point of track.points){assert.ok(Date.parse(point.epoch)>=Date.parse(rangeStart+':00Z'));assert.ok(Date.parse(point.epoch)<=Date.parse(rangeEnd+':00Z'))}
   await page.waitForFunction(()=>!document.querySelector('dialog[open]')&&!window.orasMissionDiagnostics()?.animating)
   assert.match(await page.locator('.mission-path-key').innerText(),/reconstructed.*predicted/si)
   await capture(page,run,'selected-trajectory-range')
   run.checks.push('User-selected trajectory interval reaches real API and clips source paths')

   if(mission==='voyager1'){
    const fastBefore=await diagnostics(page),segment=entry.segments.find(s=>s.id===fastBefore.segment)
    await page.getByLabel('Mission playback speed',{exact:true}).selectOption('1382400')
    await page.getByRole('button',{name:'Play mission playback',exact:true}).click()
    await page.waitForTimeout(1800)
    const fastRunning=await diagnostics(page)
    if(fastRunning.playing)await page.getByRole('button',{name:'Pause mission playback',exact:true}).click()
    const forward=await settle(page,mission)
    run.fastPlayback={before:fastBefore,forward,forwardStoppedByBoundary:!fastRunning.playing}
    assert.ok(Date.parse(forward.epoch)>Date.parse(fastBefore.epoch))
    assert.ok(Date.parse(forward.epoch)<=Date.parse(segment.end),'Fast playback never extrapolates beyond its source segment')
    if(!fastRunning.playing)assert.match(await page.locator('.mission-notice').innerText(),/boundary|suspension/i)
    await page.getByLabel('Mission playback speed',{exact:true}).selectOption('-86400')
    await page.getByRole('button',{name:'Play mission playback',exact:true}).click()
    await page.waitForTimeout(1500)
    if((await diagnostics(page)).playing)await page.getByRole('button',{name:'Pause mission playback',exact:true}).click()
    const reverse=await settle(page,mission)
    assert.ok(Date.parse(reverse.epoch)<Date.parse(forward.epoch),'Reverse playback follows admitted source time')
    assert.ok(Date.parse(reverse.epoch)>=Date.parse(segment.start))
    run.fastPlayback.reverse=reverse
    run.checks.push('Rapid forward/reverse playback stays within admitted source boundaries')
   }

   // Explicit unsupported seek must retire all historical geometry, then recover.
   await retain(page,'before-gap')
   await page.getByRole('button',{name:'Set mission epoch',exact:true}).click()
   await page.getByLabel('Mission epoch UTC',{exact:true}).fill('1800-01-01T00:00')
   await page.getByRole('button',{name:'Apply epoch',exact:true}).click()
   await page.locator('.mission-shell[data-mission-status="error"]').waitFor({timeout:30000})
   assert.equal(await page.locator('.mission-canvas canvas').count(),0,'Unsupported epoch cannot retain old renderer')
   assert.equal(await page.evaluate(()=>typeof window.orasMissionDiagnostics),'undefined')
   run.lifecycle.push(await retired(page,'before-gap'))
   await page.screenshot({path:path.join(out,mission+'-unsupported-epoch.png')})
   const recovery=entry.events.find(e=>e.id===required[mission][0])
   await page.locator('.mission-events').getByRole('button').filter({hasText:recovery.label}).click()
   d=await settle(page,mission,recovery.view_epoch||recovery.epoch)
   run.checks.push('Unsupported date clears old geometry and supported event recovers')

   // Two mission switches exercise repeated heavyweight renderer retirement.
   const other=catalog.missions.find(m=>m.id===(mission==='voyager1'?'voyager2':'voyager1'))
   for(let cycle=0;cycle<2;cycle++){
    await retain(page,'repeat-out-'+cycle);await choose(page,other);run.lifecycle.push(await retired(page,'repeat-out-'+cycle))
    await retain(page,'repeat-back-'+cycle);await choose(page,entry);run.lifecycle.push(await retired(page,'repeat-back-'+cycle))
   }
   d=await settle(page,mission)
   run.checks.push('Two repeat mission switch cycles retire every previous renderer')
   const leavingEpoch=d.epoch;await retain(page,'solar-return')
   await page.getByRole('button',{name:'← Solar System',exact:true}).click()
   const afterSolar=await solarReady(page,leavingEpoch);run.solarAfter=afterSolar
   run.lifecycle.push(await retired(page,'solar-return'))
   assert.equal(await page.locator('.mission-canvas canvas').count(),0)
   assert.equal(Date.parse(new URL(page.url()).searchParams.get('date')),Date.parse(leavingEpoch))
   const afterObserver=await observed(page)
   for(const [key,value] of Object.entries(observer))assert.equal(afterObserver[key],value,'Observer preserved through mission navigation')
   assert.equal(Date.parse(afterObserver.date),Date.parse(leavingEpoch))
   assert.ok(Math.hypot(...run.solarDeparture.camera.map((v,i)=>v-afterSolar.camera[i]))<1e-8,'Solar departure camera restored at historical epoch')
   run.observer={before:beforeObserver,after:afterObserver}
   await page.screenshot({path:path.join(out,mission+'-return-solar.png')})
   run.checks.push('Return to Solar restores camera and preserves observer and historical UTC')
   run.status='PASS'
  }catch(error){run.status='FAIL';run.failure=String(error);run.body=await page.locator('body').innerText().catch(()=>null);await page.screenshot({path:path.join(out,mission+'-failure.png')}).catch(()=>{});console.error(mission,error)}
  finally{run.video=path.basename(await page.video().path());await context.close();await save();console.log(mission,run.status)}
 }
 // Secondary missions remain trajectory-only unless a separate model is qualified.
 if(selectedMission==='all'){
  const context=await browser.newContext({viewport:sizes[0][1],reducedMotion:'reduce'}),page=await context.newPage()
  page.on('pageerror',e=>receipt.errors.push({mission:'secondary',error:e.message}))
  try{for(const id of ['dawn','near','rosetta']){const entry=catalog.missions.find(m=>m.id===id),run={mission:id,captures:[]};receipt.secondary.push(run);if(!entry?.default_epoch){run.status='UNAVAILABLE';continue}try{await page.goto(base+'/missions/'+id);const d=await settle(page,id,entry.default_epoch);assert.equal(d.craft.modelReady,false);assert.equal(await page.getByRole('button',{name:'Inspect craft',exact:true}).isDisabled(),true);await capture(page,run,'trajectory-only');run.status='PASS'}catch(error){run.status='FAIL';run.failure=String(error)}}}finally{await context.close()}
 }
 receipt.finalSourceHashes=await hashes()
 receipt.workingTreeChangesDuringRun=files.filter(file=>receipt.finalSourceHashes[file]!==receipt.sourceHashes[file])
 // The production preview may remain frozen while authors edit the worktree.
 // Actual served JS hashes, rather than mutable source paths, bind browser proof.
 const audit=await browser.newContext();receipt.finalServedScripts=[]
 for(const script of receipt.servedScripts){const response=await audit.request.get(script.url);receipt.finalServedScripts.push({url:script.url,status:response.status(),sha256:createHash('sha256').update(await response.body()).digest('hex')})}
 const finalCatalog=await (await audit.request.get(base+'/api/v1/solar/missions')).json();await audit.close()
 assert.deepEqual(receipt.finalServedScripts,receipt.servedScripts,'Served application changed during qualification')
 assert.equal(finalCatalog.release_id,receipt.catalog.release_id,'API release changed during qualification')
 assert.deepEqual(receipt.errors,[],'No uncaught browser errors')
 assert.ok(receipt.runs.every(r=>r.status==='PASS'),'Every requested flagship journey must pass')
 assert.ok(receipt.secondary.every(r=>r.status!=='FAIL'),'Qualified secondary missions must open')
 receipt.status='PASS'
}catch(error){receipt.status='FAIL';receipt.failure=String(error);console.error(error)}
finally{await browser.close();receipt.finishedUtc=new Date().toISOString();await save();if(receipt.status!=='PASS')process.exitCode=1}
