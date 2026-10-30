import {chromium} from '../../node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
const base=process.env.SOLAR_BASE||'http://127.0.0.1:4217',out=process.env.SOLAR_OUT||'output/cinematic-acceptance/solar/performance',utc='2026-02-28T00:00:00Z'
await mkdir(out,{recursive:true})
const proof={status:'RUNNING',runs:[],limitations:['DOM button activations and double-requestAnimationFrame wall intervals measure this software browser only.','Render CPU samples exclude GPU execution. GPU timer output is reported as available, never inferred from wall intervals.','No physical-device, GPU-FPS or owner visual acceptance claim.']},browser=await chromium.launch()
try{
 for(const [width,height,dpr] of [[1440,900,1],[390,900,1],[390,900,3]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'reduce'}),page=await context.newPage(),run={width,height,dpr,errors:[],console:[]};proof.runs.push(run)
  page.on('pageerror',e=>run.errors.push(e.message));page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')run.console.push({type:m.type(),text:m.text()})})
  await page.goto(base+'/solar-system?date='+utc+'&solarBody=earth')
  try{await page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d?.texturesReady===2&&d.cloudsReady&&!d.animating},undefined,{timeout:15000})}catch(error){run.readinessFailure=await page.evaluate(()=>({url:location.href,diagnostics:window.orasSolarDiagnostics?.(),status:document.querySelector('[data-solar-status]')?.getAttribute('data-solar-status'),text:document.body.innerText}));throw error}
  run.measurement=await page.evaluate(async()=>{
   const diag=()=>window.orasSolarDiagnostics(),before=diag(),button=document.querySelector('button[aria-label="Orbit camera right"]'),steps=[]
   const settle=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))
   await settle()
   for(let i=0;i<24;i++){
    const prior=diag(),start=performance.now();button.click();await settle();const next=diag()
    steps.push({step:i+1,doubleRafWallMs:performance.now()-start,cameraChanged:next.camera.some((v,j)=>Math.abs(v-prior.camera[j])>1e-10),epoch:next.epoch,target:next.target})
   }
   const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl2'),debug=gl.getExtension('WEBGL_debug_renderer_info'),values=steps.map(s=>s.doubleRafWallMs).sort((a,b)=>a-b)
   return{before,after:diag(),steps,doubleRafWallMs:{median:(values[11]+values[12])/2,p95:values[Math.floor(values.length*.95)],max:values.at(-1)},canvas:{buffer:[canvas.width,canvas.height],css:canvas.getBoundingClientRect().toJSON()},graphics:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}
  })
  const m=run.measurement
  assert.equal(m.steps.length,24);assert.ok(m.steps.every(s=>s.cameraChanged&&Date.parse(s.epoch)===Date.parse(utc)),'Every actual orbit step changes camera and preserves UTC')
  assert.deepEqual(m.after.bodies.map(b=>b.position),m.before.bodies.map(b=>b.position),'Source positions remain unchanged')
  assert.ok(m.steps.every(s=>s.target.every((v,i)=>Math.abs(v-m.before.target[i])<1e-12)),'Camera orbit retains source target')
  assert.deepEqual(run.errors,[]);assert.ok(run.console.every(m=>m.type!=='error'))
  console.log(JSON.stringify({width,height,dpr,interval:m.doubleRafWallMs,renderCpuMs:m.after.renderCpuMs,gpuMs:m.after.gpuMs,buffer:m.canvas.buffer}))
  await context.close()
 }
 proof.status='MEASURED';
}catch(error){proof.status='FAIL';proof.error=error.stack;process.exitCode=1}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n')}
