import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import path from 'node:path'
assert.equal(process.platform,'win32');const out=process.argv[2],base='http://localhost:4231',epoch='2026-10-27T04:00:00.000Z'
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']}),receipt={status:'RUNNING',checks:[],errors:[]}
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage()
 page.on('pageerror',e=>receipt.errors.push(e.message))
 await page.addInitScript(()=>{window.__shaderGate={hold:true,throwOnce:false};const get=WebGL2RenderingContext.prototype.getProgramParameter;WebGL2RenderingContext.prototype.getProgramParameter=function(p,n){if(n===0x91B1&&window.__shaderGate.hold)return false;return Reflect.apply(get,this,[p,n])}})
 await page.goto(`${base}/planetary-system/jupiter?date=${epoch}`);await page.waitForFunction(()=>window.orasSystemDiagnostics?.().shaderPreparation.state==='preparing')
 assert.equal(await page.getByRole('button',{name:'Resume orbital motion',exact:true}).isDisabled(),true)
 await page.evaluate(()=>{window.__departed=window.orasSystemDiagnostics})
 await page.getByRole('button',{name:'← Solar System',exact:true}).click();await page.evaluate(()=>{window.__shaderGate.hold=false})
 await page.waitForFunction(()=>window.orasSolarDiagnostics?.().renderCount>0,{},{timeout:60000})
 const departed=await page.evaluate(()=>window.__departed());assert.equal(departed.disposed,true);assert.equal(departed.assets.shared.textureBytes,0);assert.equal(await page.locator('.system-canvas canvas').count(),0);receipt.checks.push('Delayed parallel preparation disables playback; SPA departure aborts polling and retires assets before Solar renders')
 await context.close()
 const solarContext=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),solar=await solarContext.newPage();solar.on('pageerror',e=>receipt.errors.push(e.message))
 await solar.addInitScript(()=>{window.__holdSolar=true;const get=WebGL2RenderingContext.prototype.getProgramParameter;WebGL2RenderingContext.prototype.getProgramParameter=function(p,n){if(n===0x91B1&&window.__holdSolar)return false;return Reflect.apply(get,this,[p,n])}})
 await solar.goto(`${base}/solar-system?date=${epoch}&body=jupiter`);await solar.waitForFunction(()=>window.orasSolarDiagnostics?.().shaderPreparation.state==='preparing')
 await solar.evaluate(()=>{window.__lostSolar=window.orasSolarDiagnostics;document.querySelector('.solar-canvas canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()})
 await solar.locator('[data-solar-status=error]').waitFor();await solar.evaluate(()=>{window.__holdSolar=false});await solar.waitForFunction(()=>window.__lostSolar().shaderPreparation.state==='aborted')
 assert.equal(await solar.locator('.solar-canvas canvas').count(),0);assert.equal(await solar.getByRole('button',{name:'Play simulation',exact:true}).isDisabled(),true)
 await solar.getByRole('button',{name:'Retry Solar System',exact:true}).click();await solar.waitForFunction(()=>window.orasSolarDiagnostics?.().renderCount>0,{},{timeout:60000});assert.equal(await solar.locator('.solar-canvas canvas').count(),1)
 receipt.checks.push('Solar context loss during held parallel compilation cannot revive stale readiness/playback; retry owns one fresh renderer');await solarContext.close()
 const second=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),p=await second.newPage();p.on('pageerror',e=>receipt.errors.push(e.message))
 await p.addInitScript(()=>{let first=true;const create=WebGL2RenderingContext.prototype.createProgram;WebGL2RenderingContext.prototype.createProgram=function(...args){if(first){first=false;throw Error('Controlled shader creation failure')}return Reflect.apply(create,this,args)}})
 await p.goto(`${base}/planetary-system/jupiter?date=${epoch}`);await p.locator('[data-system-status=error]').waitFor({timeout:60000});assert.equal(await p.locator('.system-canvas canvas').count(),0)
 await p.getByRole('button',{name:'Retry system',exact:true}).click();await p.waitForFunction(()=>window.orasSystemDiagnostics?.().renderCount>0,{},{timeout:60000});assert.equal(await p.locator('.system-canvas canvas').count(),1);receipt.checks.push('Synchronous compile failure rejects through owner cleanup; retry creates one renderer')
 await second.close()
 const third=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'}),m=await third.newPage();m.on('pageerror',e=>receipt.errors.push(e.message))
 await m.goto(`${base}/planetary-system/earth?date=${epoch}&moon=moon`);await m.waitForFunction(()=>{const d=window.orasSystemDiagnostics?.();return d?.selected==='moon'&&d.renderCount>0&&!d.detail.pending})
 const before=await m.evaluate(()=>window.orasSystemDiagnostics());await m.getByRole('button',{name:'Approach Moon',exact:true}).click();await m.locator('[data-planet-status=ready]').waitFor({timeout:60000});assert.equal(await m.locator('.system-canvas canvas').count(),0)
 await m.getByRole('button',{name:'Apollo 17 terrain',exact:true}).click();await m.locator('[data-terrain-status=ready]').waitFor({timeout:60000});await m.screenshot({path:path.join(out,'native-apollo17.png')})
 await m.getByRole('button',{name:'Return to Moon',exact:true}).click();await m.locator('[data-planet-status=ready]').waitFor({timeout:60000});await m.getByRole('button',{name:'Return to Earth System',exact:true}).click();await m.waitForFunction(()=>{const d=window.orasSystemDiagnostics?.();return d?.selected==='moon'&&d.renderCount>0&&!d.detail.pending},{},{timeout:60000})
 const after=await m.evaluate(()=>window.orasSystemDiagnostics());assert.equal(Date.parse(after.epoch),Date.parse(before.epoch));assert.ok(Math.hypot(...before.camera.map((n,i)=>n-after.camera[i]))<.01);assert.equal(await m.locator('iframe').count(),0);receipt.checks.push('System→ready native Moon→ready Apollo17→ready Moon→System preserves UTC and system camera, retires native frames')
 await third.close();assert.deepEqual(receipt.errors,[]);receipt.status='PASS'
}catch(e){receipt.status='FAIL';receipt.failure=String(e);throw e}finally{await browser.close();await writeFile(path.join(out,'lifecycle.json'),JSON.stringify(receipt,null,2))}
