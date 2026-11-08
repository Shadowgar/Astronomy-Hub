// Bounded actual-device qualification of the new scene's two heaviest views.
// Each view gets a fresh browser process; OS/driver caches are not flushed.
import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import path from 'node:path'
import assert from 'node:assert/strict'
assert.equal(process.platform,'win32','Requires actual Windows Edge graphics')
const out=process.argv[2],base=process.argv[3]||'http://localhost:4231'
await mkdir(out,{recursive:true})
const report={status:'RUNNING',startedUtc:new Date().toISOString(),base,errors:[],runs:[],notes:['Browser-process cold, not machine-cold: driver/backend caches are not forcibly flushed.','Geometry bytes measure admitted typed buffers, not total driver VRAM or HDR render targets.']}
try{
 for(const view of ['heliosphere','oort']){
  const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
  try{
   const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage(),run={view,measurements:[]};report.runs.push(run)
   page.on('pageerror',error=>report.errors.push({view,message:error.message}))
   await page.addInitScript(()=>{window.__beyondCold={frames:[],tasks:[]};let previous=0;const tick=now=>{if(previous&&window.__beyondCold.frames.length<2000)window.__beyondCold.frames.push(now-previous);previous=now;requestAnimationFrame(tick)};requestAnimationFrame(tick);new PerformanceObserver(list=>{for(const e of list.getEntries())window.__beyondCold.tasks.push({start:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true})})
   const started=performance.now();await page.goto(`${base}/beyond?date=2018-11-05T12%3A00%3A00.000Z&view=${view}`)
   await page.waitForFunction(()=>{const d=window.orasBeyondDiagnostics?.();return document.querySelector('.beyond-shell')?.getAttribute('data-beyond-status')==='ready'&&d?.renderCount>0&&!d.animating},null,{timeout:60000})
   run.readyMilliseconds=performance.now()-started;run.cold=await page.evaluate(()=>({...window.__beyondCold,diagnostics:window.orasBeyondDiagnostics(),resources:performance.getEntriesByType('resource').map(e=>({name:e.name,duration:e.duration,bytes:e.decodedBodySize}))}))
   assert.match(run.cold.diagnostics.renderer,/NVIDIA.*RTX 3060/i)
   run.servedScripts=[];for(const url of await page.locator('script[src]').evaluateAll(nodes=>nodes.map(node=>node.src))){const response=await context.request.get(url);run.servedScripts.push({url,sha256:createHash('sha256').update(await response.body()).digest('hex')})}
   for(const [size,viewport] of [['desktop',{width:1440,height:900}],['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]){
    await page.setViewportSize(viewport);await page.waitForTimeout(150)
    const measured=await page.evaluate(async()=>{const canvas=document.querySelector('.beyond-canvas canvas'),frames=[];let last=0;for(let i=0;i<270;i++){canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));const now=await new Promise(resolve=>requestAnimationFrame(resolve));if(i>=70)frames.push(now-last);last=now}return{frames,diagnostics:window.orasBeyondDiagnostics()}})
    const d=measured.diagnostics,sorted=measured.frames.toSorted((a,b)=>a-b)
    assert.equal(measured.frames.length,200);assert.equal(d.shaderFailures,0);assert.equal(d.independentAnimationLoops,1);assert.equal(d.disposed,false);assert.ok(d.gpuMs.samples>=100);assert.ok(d.geometryBufferBytes>0&&d.geometryBufferBytes<=64*1024*1024)
    const measurement={size,frames:{samples:200,median:sorted[100],p95:sorted[190],maximum:sorted.at(-1)},diagnostics:d};run.measurements.push(measurement)
    await page.screenshot({path:path.join(out,`${view}-${size}.png`)})
    console.log(JSON.stringify({view,size,gpu:d.gpuMs,frames:measurement.frames,cpu:d.renderCpuMs,geometryBufferBytes:d.geometryBufferBytes}))
   }
  }finally{await browser.close()}
 }
 assert.deepEqual(report.errors,[]);report.status='PASS'
}catch(error){report.status='FAIL';report.failure=String(error);console.error(error)}finally{report.finishedUtc=new Date().toISOString();await writeFile(path.join(out,'beyond-performance.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,runs:report.runs.map(r=>({view:r.view,readyMilliseconds:r.readyMilliseconds,coldFrameMaximum:Math.max(...(r.cold?.frames||[0])),longTasks:r.cold?.tasks,measurements:r.measurements.length}))}));if(report.status!=='PASS')process.exitCode=1}
