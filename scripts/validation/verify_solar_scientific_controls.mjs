import {chromium} from '../../node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const base=process.env.SOLAR_BASE||'http://172.26.23.204:4218',out=process.env.SOLAR_OUT||'output/solar-scientific-controls/browser',sizes=process.env.SOLAR_SIZES?JSON.parse(process.env.SOLAR_SIZES):[[1440,900],[390,900],[540,390],[320,568]]
await mkdir(out,{recursive:true})
const hashes={};for(const name of ['SolarScene.ts','SolarWorkspace.tsx','solarPresentation.ts','solar.css','solarContracts.ts'])hashes[name]=createHash('sha256').update(await readFile('frontend/src/features/solar/'+name)).digest('hex')
const proof={status:'RUNNING',base,sourceHashes:hashes,runs:[]},browser=await chromium.launch()
const overlap=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1
try{
 for(const [width,height] of sizes)for(const epoch of ['2026-02-28T00:00:00Z','2026-10-23T01:05:00.123Z']){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',hasTouch:width<768}),page=await context.newPage();page.setDefaultTimeout(15000)
  const run={width,height,epoch,checks:[],states:[]};proof.runs.push(run)
  const record=(name,state)=>{run.checks.push(name);if(state)run.states.push({name,...state})},diag=()=>page.evaluate(()=>window.orasSolarDiagnostics?.()),settle=async()=>{await page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d&&!d.animating&&d.texturesReady===2&&d.cloudsReady});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))}
  const shot=async name=>page.screenshot({path:out+'/'+width+'x'+height+'-'+(epoch.includes('02-28')?'historical':'current')+'-'+name+'.png'})
  try{
   const responsePromise=page.waitForResponse(r=>r.url().includes('/api/v1/solar-system?'));responsePromise.catch(()=>{})
   await page.goto(base+'/solar-system?date='+epoch);const raw=await(await responsePromise).json()
   await page.waitForFunction(()=>document.querySelector('[data-solar-status]')?.getAttribute('data-solar-status')==='ready');await settle()
   let d=await diag();await shot('all')
   for(const body of raw.bodies){const rendered=d.bodies.find(b=>b.id===body.source_id);assert.ok(Math.abs((rendered.radiusAu??rendered.glyphRadius)-body.shape.mean_radius_km/raw.km_per_au)<1e-14,'Physical radius must match API: '+body.source_id);assert.deepEqual(rendered.position,body.position_au);assert.ok(Math.abs(rendered.geometryRadiusAu/(body.shape.mean_radius_km/raw.km_per_au)-1)<1e-5,'Actual mesh geometry uses physical radius')}
   assert.ok(d.bodies.every(b=>Number.isFinite(b.cameraDistance)&&typeof b.inView==='boolean'));assert.equal(d.overviewScope,'full');assert.ok(d.bodies.every(b=>b.inView),'All preset includes every source anchor in the real camera frustum');assert.equal(d.bodies.length,9);assert.ok(d.bodies.every(b=>b.visible));assert.equal(d.effectsVisible,false);assert.equal(d.belt.visible,false);record('default real scale, all bodies/source vectors, illustrative effects off',d)
   for(const label of ['All planets','Inner planets','Outer planets']){const b=page.getByRole('button',{name:label,exact:true});const box=await b.boundingBox();assert.ok(box?.height>=44);assert.ok(box.width>=44);await b.focus();assert.equal(await b.evaluate(el=>el===document.activeElement),true)}
   record('visible keyboard/touch camera presets')
   for(const [label,scope]of[['Inner planets','inner'],['Outer planets','outer'],['All planets','full']]){
    await page.getByRole('button',{name:label,exact:true}).click();await settle();d=await diag();assert.equal(d.cameraView,scope);assert.equal(d.overviewScope,scope);assert.ok(d.bodies.every(b=>b.visible),'Presets never hide any mesh');assert.equal(await page.getByRole('button',{name:label,exact:true}).getAttribute('aria-pressed'),'true');assert.equal(Date.parse(d.epoch),Date.parse(epoch));await shot(scope);record(label+' camera only',d)
   }
   assert.ok(d.bodies.every(b=>b.inView&&b.labelVisible),'All nine bodies must be identifiable in All view')
   const labelRects=await page.locator('.solar-body-label:visible').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom}}))
   for(let i=0;i<labelRects.length;i++)for(let j=i+1;j<labelRects.length;j++)assert.equal(overlap(labelRects[i],labelRects[j]),false,'Position labels do not overlap')
   record('identifiable outer planets and clear source-linked labels')
   await page.getByRole('button',{name:'Inner planets',exact:true}).click();await settle()
   for(let i=0;i<9;i++)await page.getByRole('button',{name:'Zoom Solar view out',exact:true}).click()
   d=await diag();assert.equal(d.cameraView,'custom');assert.ok(d.bodies.every(b=>b.visible));assert.ok(d.bodies.filter(b=>['jupiter','saturn','uranus','neptune'].includes(b.id)).every(b=>b.labelVisible),'Zooming from Inner reveals outer planets without Overview');record('continuous zoom reveals outer planets',d)
   await page.getByRole('button',{name:'Inner planets',exact:true}).click();await settle();assert.equal((await diag()).cameraView,'inner');record('Inner restores framing after manual zoom')
   for(const id of ['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune']){
    const name=raw.bodies.find(b=>b.source_id===id).name;await page.getByRole('button',{name,exact:true}).click();await settle();d=await diag();const body=raw.bodies.find(b=>b.source_id===id),selected=d.bodies.find(b=>b.id===id)
    assert.equal(d.selected,id);assert.equal(d.cameraView,'body');assert.ok(d.target.every((v,i)=>Math.abs(v-body.position_au[i])<1e-12));assert.ok(selected.screenRadius>=12,'Selected true-radius globe is resolved by camera close-up');assert.ok(d.near<selected.radiusAu);assert.equal(Date.parse(d.epoch),Date.parse(epoch))
    const hud=await page.locator('.solar-header,.solar-bodies,.solar-view-tools,.solar-context,.solar-camera,.solar-time-bar').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom}}))
    const [x,y]=selected.screen,r=selected.screenRadius,box={left:x-r,right:x+r,top:y-r,bottom:y+r};assert.ok(box.left>=0&&box.right<=width&&box.top>=0&&box.bottom<=height,'Selected physical globe fits viewport')
    for(const obstacle of hud)assert.equal(overlap(box,obstacle),false,'Selected globe avoids live HUD '+id)
    for(const other of d.bodies.filter(b=>b.id!==id&&b.inView&&b.cameraDistance<selected.cameraDistance)){const distance=Math.hypot(other.screen[0]-x,other.screen[1]-y);assert.ok(distance>=r+other.screenRadius,'No artificial foreground globe occlusion '+id+'/'+other.id)}
    if(['earth','saturn'].includes(id)){
     await shot(id);await page.getByRole('button',{name:'Expand body details',exact:true}).click();await settle();const expanded=await diag(),globe=expanded.bodies.find(b=>b.id===id),[gx,gy]=globe.screen,gr=globe.screenRadius
     const expandedHud=await page.locator('.solar-bodies,.solar-view-tools,.solar-context,.solar-camera,.solar-time-bar').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom}}))
     for(const obstacle of expandedHud)assert.equal(overlap({left:gx-gr,right:gx+gr,top:gy-gr,bottom:gy+gr},obstacle),false,'Expanded HUD clears selected '+id)
     run.lastExpandedHud=expandedHud;await shot(id+'-expanded');
     for(let i=0;i<expandedHud.length;i++)for(let j=i+1;j<expandedHud.length;j++)assert.equal(overlap(expandedHud[i],expandedHud[j]),false,'Controls and details do not overlap')
     await shot(id+'-expanded');record('expanded '+id+' fits physical camera and controls',expanded)
     await page.getByRole('button',{name:'Collapse body details',exact:true}).click();await settle()
    }
    record('physical close-up '+id,d)
   }
   await page.getByRole('button',{name:'View selected body',exact:true}).click();await settle();record('explicit selected-body camera approach')
   await page.getByRole('button',{name:'Zoom Solar view out',exact:true}).click();assert.equal((await diag()).cameraView,'custom');await page.getByRole('button',{name:'Recenter view',exact:true}).click();await settle();assert.equal((await diag()).cameraView,'body');record('Recenter restores selected camera')
   await page.getByRole('button',{name:'All planets',exact:true}).click();await settle();await page.reload();await settle();assert.equal((await diag()).overviewScope,'full');assert.equal(Date.parse((await diag()).epoch),Date.parse(epoch));record('reload/time contract')
   run.status='PASS';console.log('PASS',width,height,epoch,run.checks.length)
  }finally{await context.close()}
 }
 proof.status='PASS'
}catch(error){proof.status='FAIL';proof.error=error.stack;process.exitCode=1}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');console.log(proof.status)}
