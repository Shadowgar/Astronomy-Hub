import {chromium}from'../../node_modules/playwright/index.mjs'
import assert from'node:assert/strict'
import{mkdir,writeFile}from'node:fs/promises'
const base='http://172.26.23.204:4218',out=process.env.SOLAR_OUT||'output/solar-scientific-controls/transition-limits';await mkdir(out,{recursive:true});const proof={status:'RUNNING',runs:[]},browser=await chromium.launch()
try{
 const p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});p.setDefaultTimeout(15000)
 await p.goto(base+'/solar-system?date=2026-10-23T01:05:00.123Z');await p.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d&&d.texturesReady===2&&!d.animating})
 for(const name of ['Sun','Jupiter']){
  await p.getByRole('button',{name:'Mercury',exact:true}).click();await p.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d?.selected==='mercury'&&!d.animating})
  const run=await p.evaluate(async name=>{const before=window.orasSolarDiagnostics(),distance=d=>Math.hypot(...d.camera.map((v,i)=>v-d.target[i])),start=performance.now(),samples=[];document.querySelector('.solar-bodies button[aria-label="'+name+'"]').click();while(performance.now()-start<1100){await new Promise(r=>requestAnimationFrame(r));const d=window.orasSolarDiagnostics();samples.push({elapsed:performance.now()-start,distance:distance(d),animating:d.animating,epoch:d.epoch})}return{name,before,startDistance:distance(before),samples,after:window.orasSolarDiagnostics()}},name)
  proof.runs.push(run);const early=run.samples.filter(s=>s.animating&&s.elapsed>=25&&s.elapsed<200);assert.ok(early.length,'Early normal-motion samples are captured');for(const sample of early)assert.ok(sample.distance/run.startDistance<3,'Destination clamp must not jump camera away from the previous body; ratio='+sample.distance/run.startDistance)
  assert.ok(run.samples.some(s=>s.elapsed>=500&&s.animating));assert.equal(run.after.animating,false);assert.equal(run.after.selected,name.toLowerCase());const source=run.after.bodies.find(b=>b.id===name.toLowerCase());assert.ok(run.after.target.every((v,i)=>Math.abs(v-source.position[i])<1e-12));assert.equal(Date.parse(run.after.epoch),Date.parse('2026-10-23T01:05:00.123Z'));run.status='PASS'
 }
 // Actual input interrupts an approach without a later scheduled tick restoring it.
 await p.getByRole('button',{name:'Mercury',exact:true}).click();await p.waitForFunction(()=>window.orasSolarDiagnostics().animating);await p.getByRole('button',{name:'Zoom Solar view out',exact:true}).click();const stopped=await p.evaluate(()=>window.orasSolarDiagnostics());await p.waitForTimeout(1000);const idle=await p.evaluate(()=>window.orasSolarDiagnostics());assert.equal(stopped.animating,false);assert.equal(idle.animating,false);assert.equal(idle.cameraView,'custom');assert.deepEqual(idle.camera,stopped.camera);proof.interrupted='PASS';proof.status='PASS'
}catch(e){proof.status='FAIL';proof.error=e.stack;process.exitCode=1}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');console.log(proof.status)}
