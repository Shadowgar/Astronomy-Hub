import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
const base=process.argv[2]||'http://127.0.0.1:4231',out=process.argv[3]||'output/playwright/solar-system-2.1/failures'
await mkdir(out,{recursive:true})
const receipt={base,platform:process.platform,checks:[],errors:[]},browser=await chromium.launch({headless:process.platform!=='win32',...(process.platform==='win32'?{executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader']}: {})})
try{
 for(const failure of ['lookup-503','frame-503','normal']){
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>receipt.errors.push(e.message))
  if(failure==='lookup-503')await page.route('**/assets/solar/takram-0.19.1/scattering.bin',route=>route.fulfill({status:503,body:'Controlled atmosphere failure regression'}))
  if(failure==='frame-503')await page.route('**/api/v1/solar-system/motion?*',route=>route.fulfill({status:503,body:'Controlled frame failure regression'}))
  await page.goto(base+'/solar-system?solarBody=earth&date=2026-10-27T04:00:00Z');await page.locator('[data-solar-status=ready]').waitFor({timeout:90000});await page.waitForFunction(()=>window.orasSolarDiagnostics?.().texturesReady===9)
  if(failure!=='normal'){await page.waitForFunction(()=>window.orasSolarDiagnostics().atmosphere.state==='fallback');const d=await page.evaluate(()=>window.orasSolarDiagnostics());assert(!d.atmosphere.active);assert.equal(d.bodies.find(b=>b.id==='earth').visible,true);receipt.checks.push({failure,diagnostics:d})}
  else{
   await page.waitForFunction(()=>window.orasSolarDiagnostics().atmosphere.active);const before=await page.evaluate(()=>window.orasSolarDiagnostics())
   await page.getByRole('button',{name:'Play simulation',exact:true}).click();await page.waitForFunction(epoch=>Date.parse(window.orasSolarDiagnostics().epoch)>epoch+3600000,Date.parse(before.epoch));await page.getByRole('button',{name:'Pause simulation',exact:true}).click();const after=await page.evaluate(()=>window.orasSolarDiagnostics());assert.notDeepEqual(after.earthOrientation.icrfToItrs,before.earthOrientation.icrfToItrs);assert.notDeepEqual(after.bodies.find(b=>b.id==='earth').position,before.bodies.find(b=>b.id==='earth').position);assert(after.atmosphere.active);assert.equal(before.instanceId,after.instanceId)
   for(let i=0;i<25;i++)await page.getByRole('button',{name:'Zoom Solar view in',exact:true}).click();const close=await page.evaluate(()=>window.orasSolarDiagnostics());assert(close.atmosphere.altitudeM>=999&&close.atmosphere.altitudeM<2000);assert(close.atmosphere.active)
   await page.getByRole('button',{name:'Science, scale & sources',exact:true}).click();await page.getByLabel('Rendering quality',{exact:true}).selectOption('efficient');await page.getByRole('button',{name:'Close panel',exact:true}).click();assert.equal((await page.evaluate(()=>window.orasSolarDiagnostics())).atmosphere.active,false)
   receipt.checks.push({failure,timeFollowsEarth:true,realZoomAltitudeM:close.atmosphere.altitudeM,before,after,close,efficientFallback:true})
  }
  await context.close()
 }
 assert.deepEqual(receipt.errors,[]);receipt.status='PASS'
}finally{await browser.close();await writeFile(path.join(out,'failures.json'),JSON.stringify(receipt,null,2))}
