import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import path from 'node:path'
assert.equal(process.platform,'win32')
const base=process.argv[2]||'http://localhost:4231',out=process.argv[3],epoch='2026-10-27T04:00:00.000Z'
const cases=[]
for(const [system,body] of [['jupiter','jupiter'],['saturn','saturn'],['jupiter','io'],['saturn','titan'],['earth','earth'],['mars','phobos']])for(const quality of ['efficient','balanced','detailed'])cases.push({system,body,quality,width:1440,height:900})
for(const [width,height] of [[390,844],[844,390]])for(const [system,body] of [['jupiter','jupiter'],['saturn','saturn'],['jupiter','io'],['saturn','titan']])cases.push({system,body,quality:'balanced',width,height})
for(const [system,body] of [['uranus','titania'],['neptune','triton']])cases.push({system,body,quality:'balanced',width:1440,height:900})
await mkdir(out,{recursive:true})
const receipt={status:'RUNNING',cases:cases.length,runs:[],method:'Exclusive headed Windows/NVIDIA; HTTP cache disabled, browser/driver shader cache not forcibly cleared. No video/screenshots/tracing during timings. Cold RAF observes startup, then 70 warm-up and 200 actual keyboard orbit frames. WebGL native-call timings are CPU submission/blocking only, not asynchronous compiler completion. Resource reservations exclude render targets/driver VRAM. GPU uploaded counts may rise when an already-owned offscreen body becomes visible; CPU ownership/reservations must remain stable and uploaded geometries remain bounded by scene ownership plus compositor quads.'},browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
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
   window.__cold23={stop(){active=false;cancelAnimationFrame(raf);return{calls,longTasks,frames}}}
  })
  const start=performance.now();await page.goto(`${base}/planetary-system/${item.system}?date=${epoch}&moon=${item.body}`)
  const ready=()=>page.waitForFunction(body=>{const d=window.orasSystemDiagnostics?.();return d?.selected===body&&d.renderCount>0&&d.shaderPreparation?.state==='ready'&&!d.animating&&d.assets.requests===0&&!d.detail.pending&&!d.detail.retiring.length&&d.bodies.every(b=>b.overviewReady)},item.body,{timeout:60000})
  await ready();run.startupMs=performance.now()-start;run.cold=await page.evaluate(()=>window.__cold23.stop())
  if(item.quality!=='balanced'){const qstart=performance.now();await page.getByRole('button',{name:'System science and display',exact:true}).click();await page.getByLabel('System graphics quality',{exact:true}).selectOption(item.quality);await page.getByRole('button',{name:'Close system panel',exact:true}).click();await ready();run.qualitySwitchMs=performance.now()-qstart}
  run.measurement=await page.evaluate(async()=>{
   const canvas=document.querySelector('.system-canvas canvas'),gl=canvas.getContext('webgl2'),extension=gl.getExtension('WEBGL_debug_renderer_info'),gpu=gl.getParameter(extension?extension.UNMASKED_RENDERER_WEBGL:gl.RENDERER)
   if(!/NVIDIA.*RTX 3060/i.test(gpu)||document.visibilityState!=='visible')throw Error('Unqualified graphics/visibility')
   const next=()=>new Promise(r=>requestAnimationFrame(r)),stats=a=>{const b=[...a].sort((x,y)=>x-y);return{samples:b.length,median:b[Math.floor(b.length*.5)],p95:b[Math.ceil(b.length*.95)-1],max:b.at(-1)}}
   const act=()=>canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',code:'ArrowRight',bubbles:true}));const initial=window.orasSystemDiagnostics();let previous=await next()
   for(let i=0;i<70;i++){act();await next()}
   const before=window.orasSystemDiagnostics(),frames=[];previous=await next()
   for(let i=0;i<200;i++){if(document.visibilityState!=='visible')throw Error('Background sample');act();const now=await next();frames.push(now-previous);previous=now}
   await next();await next();const after=window.orasSystemDiagnostics()
   return{gpu,raf:stats(frames),frames,initial,before,after}
  })
  const m=run.measurement;assert.equal(m.after.quality,item.quality);assert.ok(m.after.renderCount-m.before.renderCount>=200);assert.equal(m.after.instanceId,m.before.instanceId);assert.equal(m.after.epoch,m.before.epoch);assert.deepEqual(m.after.bodies.map(b=>b.position),m.before.bodies.map(b=>b.position));assert.ok(m.after.gpuMs.samples>0);assert.equal(m.after.pipeline.toneMappingStages,1);assert.ok(m.after.detail.textureBytes<=m.after.detail.textureBudget);assert.deepEqual(run.errors,[])
  assert.equal(m.after.ownedResources,m.before.ownedResources);assert.equal(m.after.assets.resources,m.before.assets.resources);assert.equal(m.after.assets.textureAllocations,m.before.assets.textureAllocations);assert.equal(m.after.detail.textureBytes,m.before.detail.textureBytes);assert.ok(m.after.geometries<=m.after.ownedGeometries+3,'GPU geometries bounded by owned scene plus compositor quads');assert.equal(m.after.loading.shaderFailures,0)
  run.status='PASS';console.log(item.system,item.body,item.quality,item.width,'RAF',m.raf.p95,'GPU',JSON.stringify(m.after.gpuMs),'cold max',Math.max(...run.cold.frames.map(x=>x.ms)))
  await context.close();await save()
 }
 receipt.status='MEASURED'
}catch(e){receipt.status='FAIL';receipt.failure=String(e);throw e}
finally{await browser.close();await save()}
