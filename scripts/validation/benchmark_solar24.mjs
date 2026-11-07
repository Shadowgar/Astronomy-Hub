import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import path from 'node:path'
assert.equal(process.platform,'win32')
const base=process.argv[2]||'http://localhost:4231',out=process.argv[3],epoch='2026-10-27T04:00:00.000Z'
const cases=[]
for(const body of ['pluto','ceres','67p','belt','kuiper'])for(const quality of ['efficient','balanced','detailed'])cases.push({body,quality,width:1440,height:900})
for(const [width,height] of [[390,844],[844,390]])for(const body of ['pluto','kuiper'])cases.push({body,quality:'balanced',width,height})
await mkdir(out,{recursive:true})
const receipt={status:'RUNNING',cases:cases.length,runs:[],method:'Exclusive headed Windows/NVIDIA; HTTP cache disabled, browser/driver shader cache not forcibly cleared. No video/screenshots/tracing during timings. Cold RAF observes startup, then 70 warm-up and 200 actual orbit-control frames. WebGL native-call timings are CPU submission/blocking only, not asynchronous compiler completion. Resource reservations exclude render targets/driver VRAM. GPU uploaded counts may rise when an already-owned offscreen body becomes visible; Source asset ownership and texture reservations must remain stable; population uses at most one draw call and one worker.'},browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
const save=()=>writeFile(path.join(out,'performance.json'),JSON.stringify(receipt,null,2))
try{
 receipt.browser=browser.version();const session=await browser.newBrowserCDPSession();receipt.system=await session.send('SystemInfo.getInfo')
 for(const item of cases){
  const context=await browser.newContext({viewport:{width:item.width,height:item.height},hasTouch:item.width<1000,reducedMotion:'reduce'}),page=await context.newPage(),run={...item,status:'RUNNING',errors:[]};receipt.runs.push(run)
  page.on('pageerror',e=>run.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')run.errors.push(m.text())})
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true})
  await page.addInitScript(()=>{
   const calls=[],longTasks=[],frames=[];let last=0,raf=0,active=true
   function tick(now){if(last)frames.push({at:now,ms:now-last});last=now;if(active)raf=requestAnimationFrame(tick)}raf=requestAnimationFrame(tick)
   new PerformanceObserver(list=>{for(const e of list.getEntries())longTasks.push({at:e.startTime,ms:e.duration})}).observe({type:'longtask',buffered:true})
   for(const name of ['compileShader','linkProgram','getProgramParameter','getProgramInfoLog','getShaderInfoLog','texImage2D','texSubImage2D']){const original=WebGL2RenderingContext.prototype[name];WebGL2RenderingContext.prototype[name]=function(...args){const at=performance.now();try{return Reflect.apply(original,this,args)}finally{if(calls.length<10000)calls.push({name,at,ms:performance.now()-at})}}}
   window.__cold24={stop(){active=false;cancelAnimationFrame(raf);return{calls,longTasks,frames}}}
  })
  const start=performance.now();const preset=['belt','kuiper'].includes(item.body)
  await page.goto(`${base}/solar-system?date=${epoch}${preset?'':'&solarBody='+item.body}`)
  const ready=()=>page.waitForFunction(body=>{const d=window.orasSolarDiagnostics?.();return d?.renderCount>0&&d.shaderPreparation?.state==='ready'&&!d.animating&&!d.destinations.pendingFocus&&d.assets.requests===0&&!d.detail.pending&&!d.detail.retiring.length&&(['belt','kuiper'].includes(body)?d.population.drawnCount>0:d.selected===body&&d.bodies.find(b=>b.id===body)?.overviewReady)},item.body,{timeout:60000})
  if(preset){await page.locator('.solar-framing summary').click();await page.getByRole('button',{name:item.body==='belt'?'Asteroid belt':'Kuiper Belt',exact:true}).click()}
  await ready();run.startupMs=performance.now()-start;run.cold=await page.evaluate(()=>window.__cold24.stop())
  if(item.quality!=='balanced'){const qstart=performance.now();await page.getByRole('button',{name:'Science, scale & sources',exact:true}).click();await page.getByLabel('Rendering quality',{exact:true}).selectOption(item.quality);await page.getByRole('button',{name:'Close panel',exact:true}).click();await ready();run.qualitySwitchMs=performance.now()-qstart}
  run.measurement=await page.evaluate(async()=>{
   const canvas=document.querySelector('.solar-canvas canvas'),gl=canvas.getContext('webgl2'),extension=gl.getExtension('WEBGL_debug_renderer_info'),gpu=gl.getParameter(extension?extension.UNMASKED_RENDERER_WEBGL:gl.RENDERER)
   if(!/NVIDIA.*RTX 3060/i.test(gpu)||document.visibilityState!=='visible')throw Error('Unqualified graphics/visibility')
   const next=()=>new Promise(r=>requestAnimationFrame(r)),stats=a=>{const b=[...a].sort((x,y)=>x-y);return{samples:b.length,median:b[Math.floor(b.length*.5)],p95:b[Math.ceil(b.length*.95)-1],max:b.at(-1)}}
   const act=()=>document.querySelector('[aria-label="Orbit camera right"]').click();const initial=window.orasSolarDiagnostics();let previous=await next()
   for(let i=0;i<70;i++){act();await next()}
   const before=window.orasSolarDiagnostics(),frames=[];previous=await next()
   for(let i=0;i<200;i++){if(document.visibilityState!=='visible')throw Error('Background sample');act();const now=await next();frames.push(now-previous);previous=now}
   await next();await next();const after=window.orasSolarDiagnostics()
   return{gpu,raf:stats(frames),frames,initial,before,after}
  })
  const m=run.measurement;assert.equal(m.after.quality,item.quality);assert.ok(m.after.renderCount-m.before.renderCount>=200);assert.equal(m.after.instanceId,m.before.instanceId);assert.equal(m.after.epoch,m.before.epoch);assert.deepEqual(m.after.bodies.map(b=>b.position),m.before.bodies.map(b=>b.position));assert.ok(m.after.gpuMs.samples>0);assert.equal(m.after.pipeline.toneMappingStages,1);assert.ok(m.after.detail.textureBytes<=m.after.detail.textureBudget);assert.deepEqual(run.errors,[])
  assert.equal(m.after.assets.resources,m.before.assets.resources);assert.equal(m.after.assets.textureAllocations,m.before.assets.textureAllocations);assert.equal(m.after.detail.textureBytes,m.before.detail.textureBytes);assert.equal(m.after.population.pendingCatalogRequests,0);assert.equal(m.after.population.workerActive,true);assert.ok(m.after.population.drawCalls<=1)
  run.status='PASS';console.log(item.body,item.quality,item.width,'RAF',m.raf.p95,'GPU',JSON.stringify(m.after.gpuMs),'cold max',Math.max(...run.cold.frames.map(x=>x.ms)))
  await context.close();await save()
 }
 receipt.status='MEASURED'
}catch(e){receipt.status='FAIL';receipt.failure=String(e);throw e}
finally{await browser.close();await save()}
