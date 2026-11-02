import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import path from 'node:path'
assert.equal(process.platform,'win32')
const base=process.argv[2]||'http://localhost:4231',out=process.argv[3],epoch='2026-10-27T04:00:00.000Z'
await mkdir(out,{recursive:true})
const receipt={status:'RUNNING',runs:[],errors:[]},browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
const save=()=>writeFile(path.join(out,'journeys.json'),JSON.stringify(receipt,null,2))
async function settled(page,system,selected){
 await page.waitForFunction(({system,selected})=>{const d=window.orasSystemDiagnostics?.();return d?.system===system&&d.selected===selected&&d.renderCount>0&&d.shaderPreparation?.state==='ready'&&!d.animating&&d.assets.requests===0&&!d.detail.pending&&!d.detail.retiring.length&&d.bodies.every(b=>b.overviewReady||b.errors.length)},{system,selected},{timeout:60000})
 const d=await page.evaluate(()=>window.orasSystemDiagnostics());assert.deepEqual(d.bodies.flatMap(b=>b.errors),[]);assert.equal(d.detail.errors,0);assert.equal(d.loading.shaderFailures,0);return d
}
async function pick(page,name,id,system){await page.getByRole('button',{name:/^Moons/}).click();await page.locator('.system-moon-list').getByRole('button',{name:new RegExp('^'+name+'\\b')}).click();return settled(page,system,id)}
async function setting(page,label,value){await page.getByRole('button',{name:'System science and display',exact:true}).click();await page.getByLabel(label,{exact:true}).selectOption(value);await page.getByRole('button',{name:'Close system panel',exact:true}).click()}
try{
 for(const [width,height] of [[1440,900],[390,844],[844,390]].filter(([w])=>!process.argv[4]||w===Number(process.argv[4]))){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,reducedMotion:'no-preference',recordVideo:{dir:path.join(out,'video'),size:{width,height}}}),page=await context.newPage(),run={width,height,checks:[],samples:[]};receipt.runs.push(run)
  page.on('pageerror',e=>receipt.errors.push({width,height,error:e.message}));page.on('console',m=>{if(m.type()==='error')receipt.errors.push({width,height,error:m.text()})})
  await page.goto(`${base}/solar-system?date=${epoch}&solarBody=jupiter`)
  await page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d?.selected==='jupiter'&&!d.animating&&!d.detail.pending&&d.bodies.find(b=>b.id==='jupiter')?.overviewReady},{},{timeout:60000})
  const solarBefore=await page.evaluate(()=>window.orasSolarDiagnostics());await page.evaluate(()=>{window.__oldSolar=window.orasSolarDiagnostics})
  await page.getByRole('button',{name:/Explore Jupiter & moons/}).click();let d=await settled(page,'jupiter',null)
  assert.equal(await page.evaluate(()=>window.__oldSolar().disposed),true);assert.equal(await page.locator('.solar-canvas canvas').count(),0);run.checks.push('Solar→Jupiter; Solar renderer disposed')
  const instance=d.instanceId
  await page.getByRole('button',{name:'Focus Jupiter',exact:true}).click();d=await settled(page,'jupiter','jupiter');assert.equal(d.effectiveScale,'physical');run.checks.push('parent focus remains selected')
  for(const [name,id] of [['Io','io'],['Europa','europa'],['Ganymede','ganymede'],['Callisto','callisto']]){d=await pick(page,name,id,'jupiter');assert.equal(d.instanceId,instance);assert.equal(d.effectiveScale,'physical');run.samples.push({view:id,diagnostics:d});await page.screenshot({path:path.join(out,`${width}-${id}.png`)})}
  await setting(page,'System camera mode','free');assert.equal((await page.evaluate(()=>window.orasSystemDiagnostics())).navigation,'free')
  await page.getByRole('button',{name:'Focus Callisto',exact:true}).click();await settled(page,'jupiter','callisto');assert.equal((await page.evaluate(()=>window.orasSystemDiagnostics())).navigation,'orbit')
  await page.getByRole('button',{name:'System science and display',exact:true}).click();assert.equal(await page.getByLabel('System camera mode',{exact:true}).inputValue(),'orbit');await page.getByRole('button',{name:'Close system panel',exact:true}).click();run.checks.push('Free→Focus synchronizes UI and controller')
  await setting(page,'System camera mode','follow')
  const before=await page.evaluate(()=>window.orasSystemDiagnostics()),offset=before.camera.map((n,i)=>n-before.bodies.find(b=>b.id==='callisto').position[i])
  await page.getByLabel('Simulation speed',{exact:true}).selectOption('86400');await page.getByRole('button',{name:'Resume orbital motion',exact:true}).click()
  await page.waitForFunction(({start,instance})=>{const d=window.orasSystemDiagnostics?.();return d?.instanceId===instance&&d.playing&&Date.parse(d.epoch)>start+3*86400000&&d.sampledCoverage.start!=='2026-10-25T04:00:00.000000Z'},{start:Date.parse(before.epoch),instance},{timeout:30000})
  await page.getByRole('button',{name:'Pause orbital motion',exact:true}).click();d=await page.evaluate(()=>window.orasSystemDiagnostics());assert.equal(d.instanceId,instance)
  const afterOffset=d.camera.map((n,i)=>n-d.bodies.find(b=>b.id==='callisto').position[i]);assert.ok(Math.hypot(...offset.map((n,i)=>n-afterOffset[i]))<.01,'follow offset preserved across source refresh');run.checks.push('forward playback crosses checked source windows without renderer replacement');run.samples.push({view:'forward-window',diagnostics:d})
  const forwardEpoch=Date.parse(d.epoch);await page.getByLabel('Simulation speed',{exact:true}).selectOption('-86400');await page.getByRole('button',{name:'Resume orbital motion',exact:true}).click();await page.waitForFunction(t=>Date.parse(window.orasSystemDiagnostics().epoch)<t-86400000,forwardEpoch);await page.getByRole('button',{name:'Pause orbital motion',exact:true}).click();d=await page.evaluate(()=>window.orasSystemDiagnostics());run.checks.push('reverse source motion')
  await page.evaluate(()=>{window.__oldSystem=window.orasSystemDiagnostics});const returnEpoch=d.epoch
  await page.getByRole('button',{name:'← Solar System',exact:true}).click();await page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d?.selected==='jupiter'&&!d.animating&&!d.detail.pending},{},{timeout:60000})
  const solarAfter=await page.evaluate(()=>window.orasSolarDiagnostics()),old=await page.evaluate(()=>window.__oldSystem())
  assert.equal(old.disposed,true);assert.equal(old.detail.textureBytes,0);assert.equal(old.assets.shared.textureBytes,0);assert.equal(Date.parse(solarAfter.epoch),Date.parse(returnEpoch))
  const oldAnchor=solarBefore.bodies.find(b=>b.id==='jupiter').position,newAnchor=solarAfter.bodies.find(b=>b.id==='jupiter').position
  assert.ok(Math.hypot(...solarBefore.camera.map((n,i)=>(n-oldAnchor[i])-(solarAfter.camera[i]-newAnchor[i])))<1e-8,'Solar camera offset restored at advanced epoch');run.checks.push('advanced-epoch Solar return preserves selected-body offset; system assets retired')
  await page.goto(`${base}/planetary-system/saturn?date=${epoch}`);await settled(page,'saturn',null)
  await page.getByRole('button',{name:'Focus Saturn',exact:true}).click();d=await settled(page,'saturn','saturn');assert.equal(d.bodies.find(b=>b.id==='saturn').rings[0].radialMap,true);run.samples.push({view:'saturn',diagnostics:d});await page.screenshot({path:path.join(out,`${width}-saturn.png`)})
  for(const [name,id] of [['Titan','titan'],['Enceladus','enceladus']]){d=await pick(page,name,id,'saturn');run.samples.push({view:id,diagnostics:d});await page.screenshot({path:path.join(out,`${width}-${id}.png`)})}
  const lostInstance=d.instanceId;await page.evaluate(()=>document.querySelector('.system-canvas canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await page.getByRole('button',{name:'Retry system',exact:true}).click();d=await settled(page,'saturn','enceladus');assert.notEqual(d.instanceId,lostInstance);assert.equal(await page.locator('.system-canvas canvas').count(),1);run.checks.push('context loss retry creates exactly one replacement renderer')
  await page.goto(`${base}/planetary-system/earth?date=${epoch}&moon=moon`);await settled(page,'earth','moon');await setting(page,'System graphics quality','efficient');await setting(page,'System camera mode','follow');const moonBefore=await page.evaluate(()=>window.orasSystemDiagnostics());await page.evaluate(()=>{window.__oldMoonSystem=window.orasSystemDiagnostics})
  await page.getByRole('button',{name:'Approach Moon',exact:true}).click();await page.waitForURL(/\/planet-view\/moon/);await page.locator('[data-planet-status=ready]').waitFor({timeout:60000});await page.getByRole('button',{name:'Return to Earth System',exact:true}).waitFor({timeout:60000});await page.getByRole('button',{name:'Return to Earth System',exact:true}).click();d=await settled(page,'earth','moon')
  assert.equal(d.quality,'efficient');assert.equal(d.navigation,'follow');assert.equal(Date.parse(d.epoch),Date.parse(moonBefore.epoch));assert.ok(Math.hypot(...d.camera.map((n,i)=>n-moonBefore.camera[i]))<.01);assert.equal(await page.locator('iframe').count(),0);run.checks.push('native Moon roundtrip restores camera/time/quality/navigation')
  await page.locator('.system-canvas canvas').focus();await page.keyboard.press('Home');await settled(page,'earth',null);await page.keyboard.press('ArrowLeft');await page.keyboard.press('+');run.checks.push('keyboard overview/orbit/zoom')
  await context.close();run.status='PASS';await save()
 }
 assert.deepEqual(receipt.errors,[]);receipt.status='PASS'
}catch(e){receipt.status='FAIL';receipt.failure=String(e);throw e}
finally{await browser.close();await save()}
