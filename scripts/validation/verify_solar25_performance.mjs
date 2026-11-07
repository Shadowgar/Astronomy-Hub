import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
assert.equal(process.platform,'win32','Hardware qualification requires Windows Edge')
const out=process.argv[2];await mkdir(out,{recursive:true});const report={status:'RUNNING',errors:[],measurements:[]}
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
try{
 for(const id of ['voyager1','voyager2','cassini','newhorizons']){
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message))
  await page.addInitScript(()=>{window.__missionColdFrames=[];window.__missionLongTasks=[];let last=0;const observe=t=>{if(last&&window.__missionColdFrames.length<2000)window.__missionColdFrames.push(t-last);last=t;requestAnimationFrame(observe)};requestAnimationFrame(observe);new PerformanceObserver(list=>{for(const e of list.getEntries())window.__missionLongTasks.push({start:e.startTime,duration:e.duration})}).observe({type:'longtask',buffered:true})})
  const start=performance.now();await page.goto('http://localhost:4231/missions/'+id);await page.locator('[data-mission-status="ready"]').waitFor({timeout:90000});await page.waitForFunction(()=>{const d=window.orasMissionDiagnostics?.();return d?.renderCount>0&&!d.assets.requests&&!d.animating})
  const readyMs=performance.now()-start;if(id==='newhorizons'){await page.getByLabel('Focus encounter target',{exact:true}).selectOption('pluto');await page.getByText('Black map areas are unobserved coverage, not dark terrain. Surface longitude is illustrative.',{exact:true}).waitFor();await page.waitForFunction(()=>!window.orasMissionDiagnostics?.().animating);await page.screenshot({path:path.join(out,'newhorizons-coverage-disclosure.png')})}await page.getByRole('button',{name:'Inspect craft',exact:true}).click();await page.waitForFunction(()=>{const d=window.orasMissionDiagnostics?.();return d?.view==='inspection'&&!d.animating&&d.craft.visible})
  const gpu=await page.evaluate(()=>{const gl=document.querySelector('.mission-canvas canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e.UNMASKED_RENDERER_WEBGL)});assert.match(gpu,/NVIDIA.*RTX 3060/i)
  const cold=await page.evaluate(()=>({frames:window.__missionColdFrames,longTasks:window.__missionLongTasks,resources:performance.getEntriesByType('resource').filter(e=>/mission-assets|\/solar\/missions/.test(e.name)).map(e=>({name:e.name,duration:e.duration,transferSize:e.transferSize,decodedBodySize:e.decodedBodySize})),diagnostics:window.orasMissionDiagnostics()}))
  for(const [size,viewport] of [['desktop',{width:1440,height:900}],['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]){
   await page.setViewportSize(viewport);await page.waitForTimeout(150)
   const frames=await page.evaluate(async()=>{const canvas=document.querySelector('.mission-canvas canvas'),values=[];let last=0;for(let i=0;i<270;i++){canvas.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));const now=await new Promise(resolve=>requestAnimationFrame(resolve));if(i>=70)values.push(now-last);last=now}return{values,diagnostics:window.orasMissionDiagnostics()}})
   assert.equal(frames.values.length,200);assert.equal(frames.diagnostics.shaderFailures,0);assert.equal(frames.diagnostics.craft.modelReady,true);assert.equal(frames.diagnostics.craft.selfShadow,true);assert.ok(frames.diagnostics.gpuMs.samples>=100);assert.equal(frames.diagnostics.independentAnimationLoops,1)
   const sorted=frames.values.toSorted((a,b)=>a-b),measurement={mission:id,size,gpu,readyMs,cold:size==='desktop'?cold:undefined,frames:{samples:200,median:sorted[100],p95:sorted[190],maximum:sorted.at(-1)},diagnostics:frames.diagnostics};report.measurements.push(measurement);console.log(id,size,JSON.stringify({gpu:frames.diagnostics.gpuMs,raf:measurement.frames}))
  }
  await context.close()
 }
 assert.deepEqual(report.errors,[]);report.status='PASS'
}catch(e){report.status='FAIL';report.failure=String(e);console.error(e)}finally{await browser.close();await writeFile(path.join(out,'performance.json'),JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1}
