import {chromium} from '../../node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
const base=process.env.SOLAR_BASE||'http://172.26.23.204:4218',out=process.env.SOLAR_OUT||'output/cinematic-acceptance/current-time-contract/browser-green',clock='2026-10-23T01:05:00.123Z'
await mkdir(out,{recursive:true})
const proof={status:'RUNNING',base,clock,clockMeaning:'Controlled client wall clock; actual Docker ephemeris API, no mocked responses',runs:[]},browser=await chromium.launch()
try{
 for(const width of [1440,390])for(const [name,query,expected] of [['default-current','',clock],['explicit-milliseconds','?date='+clock,clock],['whole-second','?date=2026-02-28T00:00:00Z','2026-02-28T00:00:00Z'],['live-current','',null]]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'})
  if(name!=='live-current')await context.addInitScript(iso=>{const OriginalDate=Date;window.Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[iso]))}static now(){return OriginalDate.parse(iso)}}},clock)
  const page=await context.newPage(),run={width,name,expected};proof.runs.push(run)
  try{
   const responsePromise=page.waitForResponse(r=>r.url().includes('/api/v1/solar-system?'),{timeout:15000});responsePromise.catch(()=>{})
   await page.goto(base+'/solar-system'+query)
   const response=await responsePromise,raw=await response.json();run.expected=expected||new URL(response.url()).searchParams.get('epoch');run.api={status:response.status(),epoch:raw.epoch,source:raw.source,frame:raw.frame,bodyIds:raw.bodies?.map(b=>b.source_id)}
   await page.waitForFunction(()=>{const status=document.querySelector('[data-solar-status]')?.getAttribute('data-solar-status');return status&&status!=='loading'},{},{timeout:15000})
   run.status=await page.locator('[data-solar-status]').getAttribute('data-solar-status')
   run.error=run.status==='error'?await page.locator('body').innerText():null
   await page.screenshot({path:out+'/'+width+'-'+name+'.png'})
   assert.equal(run.status,'ready','Actual Solar entry must render: '+await page.locator('body').innerText())
   await page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d?.texturesReady===2&&d.cloudsReady},{},{timeout:15000})
   const d=await page.evaluate(()=>window.orasSolarDiagnostics?.());run.epoch=d.epoch;run.texturesReady=d.texturesReady;run.cloudsReady=d.cloudsReady;run.renderCount=d.renderCount
   if(name==='live-current')assert.ok(Math.abs(Date.parse(d.epoch)-Date.now())<60000,'Uncontrolled live entry uses real current UTC')
   assert.equal(Date.parse(d.epoch),Date.parse(run.expected));assert.equal(raw.bodies.length,9)
   assert.equal(d.bodies.length,9);assert.equal(d.epoch.includes('.123000Z'),false,'Hub state must stay millisecond-compatible')
   assert.equal(Date.parse(d.epoch),Date.parse(raw.epoch),'Normalization preserves the scientific instant')
   await page.getByRole('button',{name:'Earth',exact:true}).click()
   await page.waitForFunction(()=>window.orasSolarDiagnostics?.().selected==='earth')
   const selected=await page.evaluate(()=>window.orasSolarDiagnostics());run.selected=selected.selected
   const earth=raw.bodies.find(b=>b.source_id==='earth');assert.ok(selected.target.every((v,i)=>Math.abs(v-earth.position_au[i])<1e-12),'Actual camera retains native source vector')
   await page.reload();await page.waitForFunction(()=>document.querySelector('[data-solar-status]')?.getAttribute('data-solar-status')==='ready',{},{timeout:15000})
   assert.equal(Date.parse(await page.evaluate(()=>window.orasSolarDiagnostics().epoch)),Date.parse(run.expected),'Selection/reload retains epoch')
   await page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d?.texturesReady===2&&d.cloudsReady},{},{timeout:15000})
   await page.screenshot({path:out+'/'+width+'-'+name+'-earth.png'});run.status='PASS';console.log('PASS',width,name)
  }finally{await context.close()}
 }
 proof.status='PASS'
}catch(error){proof.status='FAIL';proof.error=error.stack;process.exitCode=1}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');console.log(proof.status,proof.runs.map(r=>[r.width,r.name,r.status]))}
