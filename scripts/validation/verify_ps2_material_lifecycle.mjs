import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'

const base=process.env.PS_URL||'http://127.0.0.1:4224',out=process.env.PS_MATERIAL_OUT||'output/planetary-systems/ps2/material-lifecycle'
const epoch='2026-10-23T01:05:00Z',marsUrl=base+'/planetary-system/mars?date='+epoch,glb='**/assets/mars-nasa-*.glb'
await mkdir(out,{recursive:true})
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const files=['scripts/validation/verify_ps2_material_lifecycle.mjs','frontend/src/features/solar/assets/mars-nasa.glb','frontend/src/features/solar/assets/provenance.json',...(await readdir('frontend/src/features/systems')).map(n=>'frontend/src/features/systems/'+n)]
const identity=async()=>Object.fromEntries(await Promise.all(files.sort().map(async file=>[file,hash(await readFile(file))])))
const html=await(await fetch(base)).text(),servedAssets=await Promise.all([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(async m=>({path:m[1],sha256:hash(Buffer.from(await(await fetch(new URL(m[1],base))).arrayBuffer()))})))
const proof={base,epoch,source_sha256:await identity(),served_index_sha256:hash(html),served_assets:servedAssets,checks:[],limitations:['Actual Chromium WebGL using requested ANGLE SwiftShader; not a physical GPU/device benchmark.','503 and delayed-GLB responses are controlled browser fixtures; original source files and services are unchanged.','Renderer diagnostics establish exposed disposal counters and frame behavior, not driver-level memory reclamation.','Sun and moon vectors match the admitted API sample interpolation; direct API comparisons use the stated 0.1km qualification threshold, not the measured-checkpoint maximum as an all-times bound. Browser Date truncates sample UTC microseconds to milliseconds.','Desktop 1440x900 only; broad responsive/system qualification is separate.']}
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const diag=p=>p.evaluate(()=>window.orasSystemDiagnostics())
const ready=(p,system='mars')=>p.waitForFunction(system=>document.querySelector(`[data-system="${system}"][data-system-status="ready"]`)&&window.orasSystemDiagnostics?.().renderCount>0,system,{timeout:30000})
const modelReady=p=>p.waitForFunction(()=>window.orasSystemDiagnostics?.().bodies.find(b=>b.id==='mars')?.modelReady,null,{timeout:30000})
async function check(name,fn){
 if(process.env.PS_MATERIAL_CHECK&&process.env.PS_MATERIAL_CHECK!==name)return
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),p=await context.newPage(),record={name,status:'RUNNING',page_errors:[]};proof.checks.push(record);p.setDefaultTimeout(12000);p.on('pageerror',e=>record.page_errors.push(e.message))
 try{await fn(p,record);assert.deepEqual(record.page_errors,[]);record.status='PASS';await p.screenshot({path:out+'/'+name+'.png',timeout:10000})}catch(error){record.status='FAIL';record.error=error.stack;record.url=p.url();record.body=await p.locator('body').innerText().catch(()=>null);await p.screenshot({path:out+'/'+name+'-failure.png',timeout:10000}).catch(()=>{})}finally{await context.close();console.log(name,record.status,record.error?.split('\n')[0]||'');await writeFile(out+'/proof.json',JSON.stringify(proof,null,2))}
}
function near(actual,expected,tolerance=1e-6){assert.equal(actual.length,expected.length);actual.forEach((v,i)=>assert.ok(Math.abs(v-expected[i])<=tolerance,`${v} vs ${expected[i]} exceeds ${tolerance} km`))}
// Independent contract evaluator checks transport to the actual scene light. Source science
// qualification remains separate; this does not turn interpolation into fresh observations.
function sampled(track,epoch){const now=Date.parse(epoch),right=track.samples.findIndex(s=>Date.parse(s.epoch)>=now);assert.ok(right>=0);if(right===0)return track.samples[0].position_km
 const a=track.samples[right-1],b=track.samples[right],t=(now-Date.parse(a.epoch))/(Date.parse(b.epoch)-Date.parse(a.epoch)),dt=(b.jd_tdb-a.jd_tdb)*86400
 return a.position_km.map((v,i)=>(2*t**3-3*t*t+1)*v+(t**3-2*t*t+t)*dt*a.velocity_km_s[i]+(-2*t**3+3*t*t)*b.position_km[i]+(t**3-t*t)*dt*b.velocity_km_s[i])}

await check('mars-original-model-source-light-idle',async(p,r)=>{
 const responses=[];p.on('response',response=>{if(/mars-nasa-.*\.glb$/.test(response.url()))responses.push({url:response.url(),status:response.status()})})
 await p.goto(marsUrl);await ready(p);await modelReady(p)
 r.renderer=await p.evaluate(()=>{const gl=document.querySelector('.system-canvas canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return{renderer:gl.getParameter(ext?.UNMASKED_RENDERER_WEBGL||gl.RENDERER),version:gl.getParameter(gl.VERSION)}})
 assert.match(r.renderer.renderer,/SwiftShader/i)
 const api=await(await p.request.get(base+'/api/v1/planetary-systems/mars?epoch='+epoch)).json();await writeFile(out+'/mars-api.json',JSON.stringify(api,null,2));r.initial=await diag(p)
 const mars=r.initial.bodies.find(b=>b.id==='mars');assert.equal(mars.appearance,'nasa-original-model');assert.equal(mars.modelStatus,'ready');assert.equal(mars.textureStatus,'ready');assert.equal(mars.assetError,null);assert.equal(r.initial.origin,'Mars center (499)');near(mars.position,[0,0,0]);near(r.initial.standardLightPositionKm,sampled(api.sun_track,epoch));near(r.initial.standardLightPositionKm,api.state.sun.position_km,.1)
 r.initial_sun_direct_residual_km=r.initial.standardLightPositionKm.map((v,i)=>v-api.state.sun.position_km[i])
 for(const moon of r.initial.bodies.filter(b=>b.id!=='mars')){assert.equal(moon.appearance,'neutral-reference-sphere');assert.equal(moon.textureStatus,'not-requested');near(moon.position,sampled(api.tracks.find(t=>t.id===moon.id),epoch));near(moon.position,api.state[moon.id].position_km,.1)}
 assert.equal(responses.length,1);assert.equal(responses[0].status,200);r.glb_responses=responses
 const bytes=await(await p.request.get(responses[0].url)).body();r.served_glb_sha256=hash(bytes);assert.equal(r.served_glb_sha256,proof.source_sha256['frontend/src/features/solar/assets/mars-nasa.glb'])
 await p.waitForTimeout(350);r.idle_before=await diag(p);await p.waitForTimeout(900);r.idle_after=await diag(p);assert.equal(r.idle_after.renderCount,r.idle_before.renderCount);assert.equal(r.idle_after.playing,false)
 await p.getByRole('button',{name:'Resume orbital motion'}).click();await p.waitForFunction(initial=>window.orasSystemDiagnostics().epoch!==initial,r.initial.epoch);await p.getByRole('button',{name:'Pause orbital motion'}).click();r.progressed=await diag(p)
 assert.notDeepEqual(r.progressed.standardLightPositionKm,r.initial.standardLightPositionKm)
 const progressedApi=await(await p.request.get(base+'/api/v1/planetary-systems/mars?epoch='+encodeURIComponent(r.progressed.epoch))).json();near(r.progressed.standardLightPositionKm,sampled(api.sun_track,r.progressed.epoch));near(r.progressed.standardLightPositionKm,progressedApi.state.sun.position_km,.1)
 r.progressed_api_sun=progressedApi.state.sun.position_km;r.light_direct_tolerance_km=.1
})

await check('mars-glb-unavailable-neutral-fallback',async(p,r)=>{
 await p.route(glb,route=>route.fulfill({status:503,contentType:'text/plain',body:'Controlled unavailable-model test fixture'}));await p.goto(marsUrl);await ready(p);await p.waitForFunction(()=>window.orasSystemDiagnostics().bodies.find(b=>b.id==='mars').modelStatus==='error')
 r.actual=await diag(p);const mars=r.actual.bodies.find(b=>b.id==='mars');assert.equal(mars.appearance,'neutral-reference-sphere');assert.equal(mars.modelReady,false);assert.equal(mars.textureReady,false);assert.equal(mars.textureStatus,'error');assert.match(mars.assetError,/unavailable/);assert.ok(await p.getByRole('status').filter({hasText:'Mars model imagery unavailable'}).count());assert.equal(await p.locator('.system-canvas canvas').count(),1);near(mars.position,[0,0,0])
})

await check('delayed-mars-model-after-parent-switch',async(p,r)=>{
 let release,arrivedResolve;const arrived=new Promise(resolve=>{arrivedResolve=resolve}),gate=new Promise(resolve=>{release=resolve})
 await p.route(glb,async route=>{const response=await route.fetch();r.retained_response_status=response.status();arrivedResolve();await gate;try{await route.fulfill({response})}catch(error){r.delivery_after_cancel=String(error)}})
 try{await p.goto(marsUrl);await ready(p);await Promise.race([arrived,new Promise((_,reject)=>setTimeout(()=>reject(Error('GLB did not reach controlled delay gate')),12000))]);r.before=await diag(p);assert.equal(r.before.bodies.find(b=>b.id==='mars').modelStatus,'loading');assert.equal(r.before.texturesReady,0)
  await p.evaluate(()=>{window.ps2OldDiagnostics=window.orasSystemDiagnostics})
  await p.getByRole('button',{name:'System science and display'}).click();await p.getByLabel('Planetary system',{exact:true}).selectOption('jupiter');await ready(p,'jupiter');r.old_before_release=await p.evaluate(()=>window.ps2OldDiagnostics());assert.equal(r.old_before_release.disposed,true)
  release();await p.waitForTimeout(700);r.old_after_release=await p.evaluate(()=>window.ps2OldDiagnostics());r.active=await diag(p)
  assert.equal(r.old_after_release.disposed,true);assert.equal(r.old_after_release.renderCount,r.old_before_release.renderCount);assert.equal(r.old_after_release.texturesReady,0);assert.equal(r.old_after_release.geometries,0);assert.equal(r.old_after_release.textures,0);assert.equal(r.active.system,'jupiter');assert.equal(await p.locator('canvas').count(),1);assert.equal(await p.locator('.system-canvas canvas').count(),1)
 }finally{release()}
})

await check('mars-webgl-loss-retry',async(p,r)=>{
 await p.goto(marsUrl);await ready(p);await modelReady(p);r.before=await diag(p)
 await p.evaluate(()=>{window.ps2OldDiagnostics=window.orasSystemDiagnostics;const gl=document.querySelector('.system-canvas canvas').getContext('webgl2'),extension=gl.getExtension('WEBGL_lose_context');if(!extension)throw Error('Context-loss extension unavailable');extension.loseContext()})
 await p.locator('[data-system="mars"][data-system-status="error"]').waitFor();assert.equal(await p.locator('.system-canvas canvas').count(),0);r.disposed=await p.evaluate(()=>window.ps2OldDiagnostics());assert.equal(r.disposed.disposed,true);assert.equal(r.disposed.geometries,0);assert.equal(r.disposed.textures,0)
 await p.getByRole('button',{name:'Retry system',exact:true}).click();await ready(p);await modelReady(p);r.retried=await diag(p);assert.equal(r.retried.disposed,false);assert.equal(r.retried.contextLost,false);assert.equal(r.retried.epoch,r.before.epoch);assert.equal(r.retried.system,'mars');assert.equal(await p.locator('.system-canvas canvas').count(),1)
})

await check('focused-path-visibility-restores-preference',async(p,r)=>{
 const selectPhobos=async()=>{await p.getByRole('button',{name:'Moons · 2',exact:true}).click();await p.getByRole('region',{name:'Mars moons'}).getByRole('button',{name:/Phobos/}).click();await p.waitForFunction(()=>window.orasSystemDiagnostics().selected==='phobos'&&!window.orasSystemDiagnostics().animating)}
 const overview=async()=>{await p.getByRole('button',{name:'Planetary system overview'}).click();await p.waitForFunction(()=>window.orasSystemDiagnostics().selected===null&&!window.orasSystemDiagnostics().animating)}
 await p.goto(marsUrl);await ready(p);await modelReady(p);r.overview_enabled=await diag(p);assert.equal(r.overview_enabled.orbitsVisible,true)
 await selectPhobos();r.focused_enabled=await diag(p);assert.equal(r.focused_enabled.orbitsVisible,false);assert.equal(r.focused_enabled.orbitsRequested,true);await p.screenshot({path:out+'/phobos-focused-paths-hidden.png'})
 await p.waitForTimeout(350);await p.reload();await ready(p);r.reloaded_focus=await diag(p);assert.equal(r.reloaded_focus.selected,'phobos');assert.equal(r.reloaded_focus.orbitsVisible,false);assert.equal(r.reloaded_focus.orbitsRequested,true)
 await overview();r.overview_restored=await diag(p);assert.equal(r.overview_restored.orbitsVisible,true);assert.equal(r.overview_restored.orbitsRequested,true)
 await p.getByRole('button',{name:'System science and display'}).click();await p.getByRole('button',{name:'Hide sampled orbital paths'}).click();await p.getByRole('button',{name:'Close system panel'}).click()
 r.disabled=await diag(p);assert.equal(r.disabled.orbitsRequested,false);assert.equal(r.disabled.orbitsVisible,false)
 await selectPhobos();r.focused_disabled=await diag(p);assert.equal(r.focused_disabled.orbitsRequested,false);assert.equal(r.focused_disabled.orbitsVisible,false)
 await overview();r.overview_disabled=await diag(p);assert.equal(r.overview_disabled.orbitsRequested,false);assert.equal(r.overview_disabled.orbitsVisible,false)
 assert.equal(r.overview_disabled.epoch,r.overview_enabled.epoch);assert.deepEqual(r.overview_disabled.bodies.map(b=>({id:b.id,position:b.position})),r.overview_enabled.bodies.map(b=>({id:b.id,position:b.position})))
 for(const focus of ['mars',null]){await p.goto(marsUrl+'&camera='+encodeURIComponent(JSON.stringify({...r.overview_enabled.cameraState,focus})));await ready(p);const restored=await diag(p);assert.equal(restored.selected,focus);assert.equal(restored.orbitsRequested,true);assert.equal(restored.orbitsVisible,true);r[focus===null?'restored_null':'restored_parent']=restored}
})

await browser.close();proof.served_index_sha256_after=hash(await(await fetch(base)).text());proof.served_unchanged=proof.served_index_sha256_after===proof.served_index_sha256;proof.source_unchanged=JSON.stringify(await identity())===JSON.stringify(proof.source_sha256);proof.status=proof.checks.every(r=>r.status==='PASS')&&proof.served_unchanged&&proof.source_unchanged?'PASS':'FAIL';await writeFile(out+'/proof.json',JSON.stringify(proof,null,2));if(proof.status!=='PASS')process.exitCode=1
