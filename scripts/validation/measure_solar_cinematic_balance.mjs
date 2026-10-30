import{chromium}from'../../node_modules/playwright/index.mjs'
import{writeFile,mkdir}from'node:fs/promises'
import assert from'node:assert/strict'
const base='http://172.26.23.204:4218',out='output/solar-cinematic-balance/performance-final',proof={status:'RUNNING',runs:[],limitations:['Controlled software Chromium, not physical GPU or owner-browser qualification.','Actual served candidate and real Docker API/original assets.','Earlier retained-build route-interception comparison failed to fetch API data and is retained separately; no matched before/after frame-rate claim.','Old renderCpuMs excluded label layout; current includes it, so that diagnostic is not used for before/after comparison.']},browser=await chromium.launch()
await mkdir(out,{recursive:true})
const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)]
try{
 for(const[name,mode]of[['physical-all','new'],['cinematic-inner','cinematic'],['earth-closeup','selected']]){
  const p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});p.setDefaultTimeout(15000)
  await p.goto(base+'/solar-system?date=2026-02-28T00:00:00Z');await p.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d?.texturesReady===2&&d.cloudsReady&&!d.animating})
  if(mode==='new'){
   await p.getByRole('button',{name:'Science, scale & sources',exact:true}).click();await p.getByRole('combobox',{name:'Rendering quality',exact:true}).selectOption('efficient')
   await p.getByRole('combobox',{name:'Body size display',exact:true}).selectOption('physical')
   if(await p.evaluate(()=>window.orasSolarDiagnostics().effectsVisible))await p.getByRole('button',{name:'Show cinematic effects',exact:true}).click()
   await p.getByRole('button',{name:'Close panel',exact:true}).click();await p.getByRole('button',{name:'All planets',exact:true}).click();await p.waitForFunction(()=>!window.orasSolarDiagnostics().animating)
  }
  if(mode==='selected'){await p.getByRole('button',{name:'Earth',exact:true}).click();await p.waitForFunction(()=>!window.orasSolarDiagnostics().animating)}
  const cdp=await p.context().newCDPSession(p);await cdp.send('Performance.enable');const before=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]))
  const row=await p.evaluate(async()=>{const sync=[],wall=[],start=window.orasSolarDiagnostics();for(let i=0;i<36;i++){const t=performance.now();document.querySelector('button[aria-label="Orbit camera right"]').click();sync.push(performance.now()-t);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));wall.push(performance.now()-t)}const gl=document.querySelector('.solar-canvas canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return{sync,wall,start,end:window.orasSolarDiagnostics(),graphics:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)}})
  const after=Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m=>[m.name,m.value]));row.name=name;row.metricDelta=Object.fromEntries(['LayoutCount','RecalcStyleCount','LayoutDuration','RecalcStyleDuration','ScriptDuration','TaskDuration'].map(k=>[k,after[k]-before[k]]));row.syncMedianMs=median(row.sync);row.wallMedianMs=median(row.wall);row.wallP95Ms=[...row.wall].sort((a,b)=>a-b)[34]
  assert.deepEqual(row.end.bodies.map(b=>b.position),row.start.bodies.map(b=>b.position));assert.equal(row.end.epoch,row.start.epoch);assert.ok(row.end.target.every((v,i)=>Math.abs(v-row.start.target[i])<1e-12),'Camera target retained within AU floating-point tolerance');proof.runs.push(row);console.log(JSON.stringify({name,...row.metricDelta,syncMedianMs:row.syncMedianMs,wallMedianMs:row.wallMedianMs,wallP95Ms:row.wallP95Ms,graphics:row.graphics}));await p.close()
 }
 proof.status='MEASURED'
}catch(e){proof.status='FAIL';proof.error=e.stack;proof.failurePages=await Promise.all(browser.contexts().flatMap(c=>c.pages()).map(p=>p.evaluate(()=>({text:document.body.innerText,diagnostics:window.orasSolarDiagnostics?.(),url:location.href}))));process.exitCode=1}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n')}
