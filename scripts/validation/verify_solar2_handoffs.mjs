import {chromium} from '../../node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
const base=process.argv[2]||'http://solar2.localhost:4231',out=process.argv[3]||'output/playwright/solar2/handoffs',epoch='2026-10-27T04:00:00.000Z'
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:process.platform!=='win32',...(process.platform==='win32'?{executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader']}: {})})
const proof={base,platform:process.platform,runs:[]}
try{for(const [layout,width,height] of [['desktop',1440,900],['portrait',390,844],['landscape',844,390]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:layout!=='desktop'}),page=await context.newPage(),run={layout,errors:[],checks:[]};proof.runs.push(run)
 page.setDefaultTimeout(20000);page.on('pageerror',e=>run.errors.push(e.message))
 const mode=async value=>{await page.getByRole('button',{name:'Choose exploration mode',exact:true}).click();await page.getByRole('navigation',{name:'Exploration modes'}).getByRole('button',{name:value,exact:true}).click()}
 try{
  await page.goto(base+'/sky-engine?date='+epoch+'&lat=41.321903&lng=-79.585394&elev=457')
  await page.locator('[data-runtime-mode=sky][data-runtime-status=ready]').waitFor({timeout:90000})
  let sky=page.frames().find(f=>f.url().includes('/oras-sky-engine/'));const before=await sky.evaluate(()=>window.orasSkyAdapter.navigation());run.before=before
  await mode('Solar System');await page.locator('[data-solar-status=ready]').waitFor();await page.waitForFunction(()=>!document.querySelector('[aria-label="Play simulation"]').disabled)
  assert.equal(await page.locator('iframe').count(),0);await page.getByRole('button',{name:'Play simulation',exact:true}).click();await page.waitForTimeout(650);await page.getByRole('button',{name:'Pause simulation',exact:true}).click()
  const solar=await page.evaluate(()=>window.orasSolarDiagnostics());const intent=new URLSearchParams(await page.evaluate(()=>sessionStorage.getItem('oras.runtime.intent.v1')))
  assert.equal(intent.get('date'),solar.epoch);assert.ok(Date.parse(solar.epoch)>Date.parse(epoch));run.solarEpoch=solar.epoch
  await mode('Earth');await page.locator('[data-runtime-mode=earth][data-runtime-status=ready]').waitFor({timeout:90000});assert.equal(await page.locator('.solar-canvas canvas').count(),0);assert.equal(await page.locator('iframe').count(),1)
  run.earth=await page.frames().find(f=>f.url().includes('/earth-runtime/')).evaluate(()=>window.orasEarthDiagnostics());assert.equal(new URL(page.url()).searchParams.get('date'),solar.epoch);run.checks.push('Sky→running Solar→Earth preserves final time and releases the old renderer')
  await mode('Sky');await page.locator('[data-runtime-mode=sky][data-runtime-status=ready]').waitFor({timeout:90000});sky=page.frames().find(f=>f.url().includes('/oras-sky-engine/'));const after=await sky.evaluate(()=>window.orasSkyAdapter.navigation());run.after=after
  assert.ok(Math.abs(Date.parse(after.utc)-Date.parse(solar.epoch))<1000);assert.equal(await page.locator('iframe').count(),1)
  const finalIntent=new URLSearchParams(await page.evaluate(()=>sessionStorage.getItem('oras.runtime.intent.v1')))
  for(const field of ['lat','lng'])assert.ok(Math.abs(Number(finalIntent.get(field))-Number(intent.get(field)))<1e-5,field+' preserved within native pick tolerance');assert.equal(finalIntent.get('elev'),intent.get('elev'));run.checks.push('Native Sky return receives updated UTC and unchanged observer intent')
  await sky.getByRole('button',{name:'Observing tools',exact:true}).click();await sky.locator('[data-sky-control=atmosphere]').click();await sky.locator('[data-sky-control=atmosphere]').click();await sky.getByRole('button',{name:'Close Observing tools',exact:true}).click();run.checks.push('Native observing controls remain operable without Solar interference')
  if(layout==='desktop'){
   await mode('Earth');await page.locator('[data-runtime-mode=earth][data-runtime-status=ready]').waitFor({timeout:90000})
   await page.getByLabel('Search Earth',{exact:true}).fill('12, 23');await page.getByRole('button',{name:'Search Earth',exact:true}).click();await page.getByRole('list',{name:'Earth search results'}).getByRole('button').first().click();await page.getByRole('status').filter({hasText:'Approaching location…'}).waitFor({state:'hidden'})
   const moved=await page.frames().find(f=>f.url().includes('/earth-runtime/')).evaluate(()=>window.orasEarthDiagnostics().navigation)
   await mode('Solar System');await page.locator('[data-solar-status=ready]').waitFor();await mode('Sky');await page.locator('[data-runtime-mode=sky][data-runtime-status=ready]').waitFor({timeout:90000})
   const movedSky=await page.frames().find(f=>f.url().includes('/oras-sky-engine/')).evaluate(()=>window.orasSkyAdapter.navigation())
   for(const key of ['lat','lon'])assert.ok(Math.abs(movedSky.observer[key]-moved.observer[key])<1e-5)
   assert.equal(movedSky.observer.elevationM,moved.observer.elevationM)
   await mode('Solar System');await page.locator('[data-solar-status=ready]').waitFor();await mode('Earth');await page.locator('[data-runtime-mode=earth][data-runtime-status=ready]').waitFor({timeout:90000})
   const again=await page.frames().find(f=>f.url().includes('/earth-runtime/')).evaluate(()=>window.orasEarthDiagnostics().navigation)
   run.moved=moved;run.again=again;for(const key of ['lat','lon'])assert.ok(Math.abs(again.observer[key]-moved.observer[key])<1e-5,key+' repeat '+JSON.stringify({moved,again}))
   run.checks.push('Moved Earth search observer survives repeated Solar/Sky/Earth routes without stale search-history recenter')
   await page.goto(base+'/solar-system?date='+epoch+'&lat=12&lng=23&elev=456');await page.locator('[data-solar-status=ready]').waitFor();await mode('Earth');await page.locator('[data-runtime-mode=earth][data-runtime-status=ready]').waitFor({timeout:90000})
   const direct=await page.frames().find(f=>f.url().includes('/earth-runtime/')).evaluate(()=>window.orasEarthDiagnostics().navigation)
   assert.ok(Math.abs(direct.observer.lat-12)<1e-5);assert.ok(Math.abs(direct.observer.lon-23)<1e-5);assert.equal(direct.observer.elevationM,456);run.direct=direct;run.checks.push('Direct Solar bookmark uses validated observer/elevation intent for an accurately centered Earth arrival')
  }
  await page.screenshot({path:path.join(out,layout+'-sky-return.png')});assert.deepEqual(run.errors,[]);run.status='PASS';console.log(layout,'PASS')
 }catch(e){run.status='FAIL';run.error=String(e);run.url=page.url();console.log(layout,'FAIL',String(e));await page.screenshot({path:path.join(out,layout+'-failure.png')})}
 finally{await context.close();await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2))}
}}finally{await browser.close();await writeFile(path.join(out,'proof.json'),JSON.stringify(proof,null,2))}
if(proof.runs.some(r=>r.status!=='PASS'))process.exitCode=1
