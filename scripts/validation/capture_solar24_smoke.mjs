import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
assert.equal(process.platform,'win32')
const out=process.argv[2],epoch='2026-10-27T04:00:00.000Z';await mkdir(out,{recursive:true})
const result={status:'RUNNING',epoch,errors:[],cases:[]},browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text())})
try{
 for(const id of ['pluto','ceres','vesta','eros','67p','halley','eris']){
  await page.goto('http://localhost:4231/solar-system?'+new URLSearchParams({date:epoch,solarBody:id}))
  await page.waitForFunction(id=>{const d=window.orasSolarDiagnostics?.(),b=d?.bodies.find(b=>b.id===id);return d?.selected===id&&d.renderCount>0&&!d.animating&&!d.destinations.pendingFocus&&b?.overviewReady&&b?.visible&&!d.assets.requests&&!d.detail.pending},id,{timeout:60000})
  const d=await page.evaluate(()=>window.orasSolarDiagnostics());const gpu=await page.evaluate(()=>{const gl=document.querySelector('.solar-canvas canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER)})
  assert.match(gpu,/NVIDIA.*RTX 3060/i);await page.screenshot({path:path.join(out,id+'.png')});result.cases.push({id,gpu,diagnostics:d});console.log(id,'PASS')
 }
 await page.goto('http://localhost:4231/solar-system?'+new URLSearchParams({date:epoch,solarBody:'pluto'}));await page.getByRole('button',{name:'Explore Pluto & Charon →',exact:true}).click()
 await page.waitForFunction(()=>{const d=window.orasSystemDiagnostics?.();return d?.system==='pluto'&&d.renderCount>0&&!d.animating&&!d.assets.requests},{},{timeout:60000});await page.screenshot({path:path.join(out,'pluto-system.png')});result.cases.push({id:'pluto-system',diagnostics:await page.evaluate(()=>window.orasSystemDiagnostics())})
 await page.getByRole('button',{name:/^Moons/}).click();await page.locator('#system-moon-list').getByRole('button',{name:/Charon/}).click();await page.waitForFunction(()=>{const d=window.orasSystemDiagnostics?.();return d?.selected==='charon'&&!d.animating&&!d.assets.requests&&!d.detail.pending});await page.screenshot({path:path.join(out,'charon.png')});result.cases.push({id:'charon',diagnostics:await page.evaluate(()=>window.orasSystemDiagnostics())});console.log('charon PASS')
 await page.getByRole('button',{name:'← Solar System',exact:true}).click();await page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d?.selected==='pluto'&&d.destinations.available.includes('pluto')&&d.renderCount>0&&!d.animating});const returned=await page.evaluate(()=>window.orasSolarDiagnostics());assert.equal(Date.parse(returned.epoch),Date.parse(epoch));result.cases.push({id:'return',diagnostics:returned});assert.deepEqual(result.errors,[]);result.status='PASS'
}catch(e){result.status='FAIL';result.failure=String(e);result.text=await page.locator('body').innerText();result.last=await page.evaluate(()=>window.orasSolarDiagnostics?.()??window.orasSystemDiagnostics?.());await page.screenshot({path:path.join(out,'failure.png')});throw e}finally{await browser.close();await writeFile(path.join(out,'smoke.json'),JSON.stringify(result,null,2))}
