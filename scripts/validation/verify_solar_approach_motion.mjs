import {chromium} from '../../node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
const base=process.env.SOLAR_BASE||'http://127.0.0.1:4217',out=process.env.SOLAR_OUT||'output/cinematic-acceptance/solar/approach-motion',utc='2026-02-28T00:00:00Z'
await mkdir(out,{recursive:true})
const proof={status:'RUNNING',base,runs:[]},browser=await chromium.launch()
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});page.setDefaultTimeout(15000)
 await page.goto(base+'/solar-system?date='+utc)
 await page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d?.texturesReady===2&&d.cloudsReady&&!d.animating})
 for(const [name,expand] of [['Earth',false],['Mars',true]]){
  const run=await page.evaluate(async({name,expand})=>{
   const diag=()=>window.orasSolarDiagnostics(),before=diag(),samples=[],id=name.toLowerCase(),source=before.bodies.find(b=>b.id===id).position
   const button=[...document.querySelectorAll('.solar-bodies button')].find(b=>b.getAttribute('aria-label')===name),start=performance.now();button.click()
   let expanded=false
   while(performance.now()-start<1150){await new Promise(resolve=>requestAnimationFrame(resolve));const elapsed=performance.now()-start
    if(expand&&!expanded&&elapsed>=200){document.querySelector('button[aria-label="Expand body details"]')?.click();expanded=true}
    const d=diag();samples.push({elapsed,animating:d.animating,selected:d.selected,camera:d.camera,target:d.target,epoch:d.epoch})
   }
   return{name,expand,reduced:matchMedia('(prefers-reduced-motion:reduce)').matches,before,source,samples,after:diag()}
  },{name,expand});proof.runs.push(run)
  await page.screenshot({path:out+'/'+name.toLowerCase()+'.png'})
  const active=run.samples.filter(s=>s.animating);run.activeIntervalMs=active.length?[active[0].elapsed,active.at(-1).elapsed]:null
  assert.equal(run.reduced,false)
  assert.ok(run.samples.some(s=>s.elapsed>=200&&s.elapsed<=700&&s.animating),'Normal-motion '+name+' remains animated at200–700ms'+(expand?' across details reflow':' after card insertion'))
  assert.ok(active.at(-1)?.elapsed>=700,'Normal approach retains its intended clock through at least700ms')
  await page.waitForFunction(()=>!window.orasSolarDiagnostics().animating)
  const final=await page.evaluate(()=>window.orasSolarDiagnostics())
  assert.ok(final.target.every((v,i)=>Math.abs(v-run.source[i])<1e-12),'Completed approach reaches exact real source target')
  assert.equal(Date.parse(final.epoch),Date.parse(utc))
  run.status='PASS';console.log(name,'normal900ms approach active during measured interval; source target/UTC retained')
 }
 proof.status='PASS'
}catch(error){proof.status='FAIL';proof.error=error.stack;process.exitCode=1}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');console.log(proof.status)}
