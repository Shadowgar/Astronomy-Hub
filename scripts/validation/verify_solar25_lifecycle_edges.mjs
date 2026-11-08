// Independent real-preview lifecycle reproducers; no source or scene substitutes.
import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
assert.equal(process.platform,'win32')
const base=process.argv[2]||'http://localhost:4231',out=process.argv[3]
await mkdir(out,{recursive:true})
const report={checks:[],errors:[],requests:[],status:'RUNNING'}
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
try{
 {
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage()
  page.on('pageerror',e=>report.errors.push(e.message))
  page.on('requestfailed',r=>report.requests.push({url:r.url(),error:r.failure()}))
  let release,intercept;const held=new Promise(resolve=>{release=resolve}),started=new Promise(resolve=>{intercept=resolve});let intercepted=false
  await page.route('**/mission-assets/v2.5/*.glb',async route=>{intercepted=true;intercept();await held;await route.continue().catch(()=>{})})
  try{
   await page.goto(base+'/missions/voyager1',{waitUntil:'domcontentloaded'})
   await page.waitForFunction(()=>window.orasMissionDiagnostics?.()?.assets.requests>0&&document.querySelector('.mission-canvas canvas'),null,{timeout:30000})
   await Promise.race([started,new Promise((_,reject)=>setTimeout(()=>reject(Error('No GLB request reached the independent hold')),10000))])
   assert.equal(intercepted,true)
   report.pendingBefore=await page.evaluate(()=>window.orasMissionDiagnostics())
   await page.evaluate(()=>document.querySelector('.mission-canvas canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext())
   await page.getByRole('alert').waitFor({timeout:10000});release();await page.waitForTimeout(1200)
   report.pendingAfter={status:await page.locator('.mission-shell').getAttribute('data-mission-status'),inspectDisabled:await page.getByRole('button',{name:'Inspect craft',exact:true}).isDisabled(),playDisabled:await page.getByRole('button',{name:'Play mission playback',exact:true}).isDisabled(),canvasCount:await page.locator('.mission-canvas canvas').count(),diagnostics:await page.evaluate(()=>window.orasMissionDiagnostics?.())}
   await page.screenshot({path:path.join(out,'pending-model-context-loss.png')})
   report.checks.push({name:'pending-model context loss keeps disposed renderer controls disabled',pass:report.pendingAfter.inspectDisabled&&report.pendingAfter.playDisabled&&report.pendingAfter.canvasCount===0})
  }finally{release();await context.close()}
 }
 {
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage()
  page.on('pageerror',e=>report.errors.push(e.message))
  page.on('requestfailed',r=>report.requests.push({url:r.url(),error:r.failure()}))
  try{
   report.stage='trajectory entry'
   await page.goto(base+'/missions/voyager1')
   await page.waitForFunction(()=>{const d=window.orasMissionDiagnostics?.();return document.querySelector('.mission-shell')?.getAttribute('data-mission-status')==='ready'&&d?.renderCount&&!d.assets.requests&&!d.animating},null,{timeout:60000})
   // First action on a raw default URL must not cancel itself when its epoch
   // is persisted to canonical URL syntax.
   await page.getByRole('button',{name:'Trajectory',exact:true}).click()
   const direct=await page.waitForFunction(()=>window.orasMissionDiagnostics?.()?.view==='trajectory'&&!window.orasMissionDiagnostics()?.animating,null,{timeout:10000}).then(()=>true,()=>false)
   report.checks.push({name:'first direct Trajectory completes from catalog default epoch',pass:direct})
   if(!direct){await page.getByRole('button',{name:'Inspect craft',exact:true}).click();await page.waitForFunction(()=>window.orasMissionDiagnostics?.()?.view==='inspection'&&!window.orasMissionDiagnostics()?.animating)}
   report.stage='full trajectory request'
   if(!direct)await page.getByRole('button',{name:'Trajectory',exact:true}).click()
   await page.waitForFunction(()=>{const d=window.orasMissionDiagnostics?.();return d?.view==='trajectory'&&!d.animating},null,{timeout:30000})
   report.trajectoryBefore=await page.evaluate(()=>window.orasMissionDiagnostics())
   await page.screenshot({path:path.join(out,'full-trajectory-before-return.png')})
   await page.getByRole('button',{name:'← Solar System',exact:true}).click()
   report.stage='Solar return'
   await page.waitForFunction(()=>window.orasSolarDiagnostics?.()?.renderCount>0,null,{timeout:60000})
   await page.goBack()
   report.stage='browser Back'
   await page.waitForFunction(()=>{const d=window.orasMissionDiagnostics?.();return document.querySelector('.mission-shell')?.getAttribute('data-mission-status')==='ready'&&d?.view==='trajectory'&&!d.animating&&!d.assets.requests},null,{timeout:60000})
   report.trajectoryAfter=await page.evaluate(()=>window.orasMissionDiagnostics())
   await page.screenshot({path:path.join(out,'full-trajectory-after-back.png')})
   report.checks.push({name:'browser Back restores trajectory data with trajectory camera',pass:JSON.stringify(report.trajectoryBefore.trackSegments)===JSON.stringify(report.trajectoryAfter.trackSegments)})

   report.stage='selected trajectory interval'
   await page.getByRole('button',{name:'Mission display settings',exact:true}).click()
   const range={start:'1979-03-05T11:00',end:'1979-03-05T13:00'}
   await page.getByLabel('Trajectory start UTC',{exact:true}).fill(range.start)
   await page.getByLabel('Trajectory end UTC',{exact:true}).fill(range.end)
   const selectedResponse=page.waitForResponse(r=>r.url().includes('/trajectory?'))
   await page.getByRole('button',{name:'Show selected trajectory interval',exact:true}).click()
   const response=await selectedResponse;assert.equal(response.status(),200)
   const sourceBefore=await response.json();report.selectedRequestBefore=response.url()
   await page.waitForFunction(()=>!document.querySelector('dialog[open]')&&!window.orasMissionDiagnostics()?.animating)
   report.selectedBefore=await page.evaluate(()=>window.orasMissionDiagnostics())
   await page.screenshot({path:path.join(out,'selected-trajectory-before-return.png')})
   await page.getByRole('button',{name:'← Solar System',exact:true}).click()
   await page.waitForFunction(()=>window.orasSolarDiagnostics?.()?.renderCount>0,null,{timeout:60000})
   const restoredResponse=page.waitForResponse(r=>r.url().includes('/trajectory?'),{timeout:15000}).catch(()=>null)
   await page.goBack()
   await page.waitForFunction(()=>{const d=window.orasMissionDiagnostics?.();return document.querySelector('.mission-shell')?.getAttribute('data-mission-status')==='ready'&&d?.view==='trajectory'&&!d.animating&&!d.assets.requests},null,{timeout:60000})
   const restored=await restoredResponse
   const sourceAfter=restored?await restored.json():null;report.selectedRequestAfter=restored?.url()||null
   report.selectedAfter=await page.evaluate(()=>window.orasMissionDiagnostics())
   await page.screenshot({path:path.join(out,'selected-trajectory-after-back.png')})
   report.checks.push({name:'browser Back refetches identical selected interval and source points',pass:!!restored&&restored.status()===200&&response.url()===restored.url()&&JSON.stringify(sourceBefore)===JSON.stringify(sourceAfter)&&JSON.stringify(report.selectedBefore.trackSegments)===JSON.stringify(report.selectedAfter.trackSegments)})
  }catch(error){report.body=await page.locator('body').innerText();await page.screenshot({path:path.join(out,'trajectory-failure.png')});throw error}finally{await context.close()}
 }
 report.status=report.checks.every(check=>check.pass)&&!report.errors.length?'PASS':'FAIL'
}catch(error){report.status='FAIL';report.failure=String(error)}finally{await browser.close();await writeFile(path.join(out,'lifecycle-edges.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks,failure:report.failure}));if(report.status!=='PASS')process.exitCode=1}
