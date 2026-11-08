import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
assert.equal(process.platform,'win32')
const out=process.argv[2];await mkdir(out,{recursive:true})
const receipt={status:'RUNNING',checks:[],errors:[]},browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
async function ready(p,id){await p.waitForFunction(id=>{const d=window.orasSolarDiagnostics?.();return d?.selected===id&&!d.disposed&&d.renderCount>0&&!d.destinations.pendingFocus&&!d.animating&&!d.assets.requests&&!d.detail.pending},id,{timeout:60000})}
try{
 const c=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>receipt.errors.push(e.message))
 await p.route('**/api/v1/solar-system/destinations?*',r=>r.fulfill({status:503,contentType:'application/json',body:'{"detail":"Controlled missing optional pack"}'}))
 await p.route('**/api/v1/solar-populations*',r=>r.fulfill({status:503,contentType:'application/json',body:'{"detail":"Controlled missing optional catalog"}'}))
 await p.goto('http://localhost:4231/solar-system?date=2026-10-27T04:00:00Z&solarBody=jupiter');await ready(p,'jupiter')
 await p.waitForFunction(()=>!document.querySelector('[aria-label="Play simulation"]').disabled);assert.equal(await p.getByRole('button',{name:'Play simulation',exact:true}).isEnabled(),true);assert.equal((await p.evaluate(()=>window.orasSolarDiagnostics())).bodies.filter(b=>b.sourceIdentity?.origin).length>=9,true)
 receipt.checks.push('Optional destination/catalog HTTP 503 retains original Jupiter and base-planet playback')
 await p.evaluate(()=>{window.__departed24=window.orasSolarDiagnostics});await p.getByRole('button',{name:'Explore Jupiter & moons →',exact:true}).click();await p.locator('[data-system-status=ready]').waitFor({timeout:60000});const retired=await p.evaluate(()=>window.__departed24());assert.equal(retired.disposed,true);assert.equal(retired.population.workerActive,false);assert.equal(retired.population.pendingCatalogRequests,0);assert.equal(retired.assets.shared.textureBytes,0);receipt.checks.push('SPA departure retires optional worker, pending queries and source assets')
 await c.close()
 const d=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),q=await d.newPage();q.on('pageerror',e=>receipt.errors.push(e.message))
 await q.goto('http://localhost:4231/solar-system?date=2028-06-01T00:00:00Z&solarBody=eros');await ready(q,'eros');await q.waitForFunction(()=>window.orasSolarDiagnostics()?.destinations.available.includes('eros'))
 assert.doesNotMatch(await q.locator('.solar-scale-note').innerText(),/unavailable|Awaiting source/i);assert.match(await q.getByRole('region',{name:'Selected destination details'}).innerText(),/Eros/);await q.screenshot({path:path.join(out,'eros-2028.png')});receipt.checks.push('Precise Eros in 2028 remains available beyond legacy 2026 catalog window')
 const before=await q.evaluate(()=>window.orasSolarDiagnostics());await q.evaluate(()=>{window.__lost24=window.orasSolarDiagnostics;document.querySelector('.solar-canvas canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()});await q.locator('[data-solar-status=error]').waitFor();assert.equal((await q.evaluate(()=>window.__lost24())).population.workerActive,false)
 await q.getByRole('button',{name:'Retry Solar System',exact:true}).click();await ready(q,'eros');const after=await q.evaluate(()=>window.orasSolarDiagnostics());assert.notEqual(before.instanceId,after.instanceId);assert.equal(Date.parse(before.epoch),Date.parse(after.epoch));assert.equal(await q.locator('canvas').count(),1);receipt.checks.push('Context loss retires worker and retry restores one renderer at the same precise epoch')
 await d.close();assert.deepEqual(receipt.errors,[]);receipt.status='PASS'
}catch(e){receipt.status='FAIL';receipt.failure=String(e);throw e}finally{await browser.close();await writeFile(path.join(out,'failures.json'),JSON.stringify(receipt,null,2))}
