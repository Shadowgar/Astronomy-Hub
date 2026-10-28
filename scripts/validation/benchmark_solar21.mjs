import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import path from 'node:path'
import os from 'node:os'
assert.equal(process.platform,'win32','Windows hardware qualification required')
const base=process.argv[2]||'http://solar21.localhost:4231',out=process.argv[3]||'docs/validation/solar-system-2.1/performance.json'
const receipt={base,started:new Date().toISOString(),epoch:'2026-10-27T04:00:00.000Z',platform:process.platform,cpu:os.cpus()[0]?.model,runs:[],errors:[],method:'Same fixed Earth approach, paused UTC.40warm-up+200real camera-input RAF frames; no screenshot/video/concurrent browser during measurements. CPU/GPUrolling180samples distinct from RAF200intervals. Mobile dimensions emulate desktopGPU, not physicaldevices.'}
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader'],args:['--host-resolver-rules=MAP solar21.localhost 127.0.0.1']})
await mkdir(path.dirname(out),{recursive:true})
try{
 receipt.browserVersion=browser.version()
 for(const [layout,width,height] of [['desktop',1440,900],['portrait',390,844],['landscape',844,390]])for(const quality of ['balanced','efficient'])for(const method of ['custom','takram']){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce'}),page=await context.newPage(),run={layout,width,height,quality,method};receipt.runs.push(run)
  page.on('pageerror',e=>receipt.errors.push(e.message));const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true})
  const start=performance.now();await page.goto(base+'/solar-system?solarBody=earth&date='+receipt.epoch);await page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d?.texturesReady===9&&d.atmosphere.active&&!d.animating},null,{timeout:90000});run.navigationToReadyMs=performance.now()-start
  await page.getByRole('button',{name:'Science, scale & sources',exact:true}).click();await page.getByLabel('Earth atmosphere method',{exact:true}).selectOption(method);await page.getByLabel('Rendering quality',{exact:true}).selectOption(quality);await page.getByRole('button',{name:'Close panel',exact:true}).click();await page.bringToFront()
  run.measurement=await page.evaluate(async()=>{
   const d=()=>window.orasSolarDiagnostics(),button=document.querySelector('button[aria-label="Orbit camera right"]'),gl=document.querySelector('.solar-canvas canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info'),renderer=gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER)
   if(!/NVIDIA.*RTX 3060/i.test(renderer)||/SwiftShader|llvmpipe|Basic/i.test(renderer))throw Error('UnqualifiedGPU '+renderer)
   if(document.visibilityState!=='visible')throw Error('Background measurement')
   const next=()=>new Promise(resolve=>requestAnimationFrame(resolve)),stats=a=>{const s=[...a].sort((a,b)=>a-b);return{samples:s.length,median:s[Math.floor(s.length*.5)],p95:s[Math.ceil(s.length*.95)-1],min:s[0],max:s.at(-1)}}
   const initial=d();for(let i=0;i<40;i++){button.click();await next()}
   const before=d(),intervals=[],input=[];let previous=await next()
   for(let i=0;i<200;i++){const start=performance.now();button.click();input.push(performance.now()-start);const now=await next();intervals.push(now-previous);previous=now}
   await next();await next();const after=d()
   return{renderer,initial,before,after,rafMs:stats(intervals),inputCpuMs:stats(input),measuredDraws:after.renderCount-before.renderCount,sourcePositionsUnchanged:JSON.stringify(before.bodies.map(b=>b.position))===JSON.stringify(after.bodies.map(b=>b.position)),resources:performance.getEntriesByType('resource').filter(r=>/takram|SolarWorkspace|SolarScene/.test(r.name)).map(r=>({url:r.name,bytes:r.encodedBodySize,durationMs:r.duration}))}
  })
  const m=run.measurement;assert.equal(m.sourcePositionsUnchanged,true);assert(m.measuredDraws>=200);assert.equal(m.after.pipeline.toneMappingStages,1);assert.equal(m.after.atmosphere.active,quality==='balanced'&&method==='takram');assert(m.after.gpuMs.samples>0)
  run.status='PASS';await context.close();await writeFile(out,JSON.stringify(receipt,null,2));console.log(layout,quality,method,'PASS')
 }
 assert.deepEqual(receipt.errors,[]);receipt.status='PASS'
}finally{await browser.close();await writeFile(out,JSON.stringify(receipt,null,2))}
