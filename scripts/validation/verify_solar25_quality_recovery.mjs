// Short independent final-build hardware check; no mission or scene fixtures.
import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import path from 'node:path'
import assert from 'node:assert/strict'
assert.equal(process.platform,'win32','Requires real headed Windows Edge')
const base=process.argv[2]||'http://localhost:4231',out=process.argv[3]
await mkdir(out,{recursive:true})
const report={status:'RUNNING',base,startedUtc:new Date().toISOString(),checks:[],quality:[],errors:[],consoleErrors:[],servedScripts:[]}
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:2,reducedMotion:'reduce'}),page=await context.newPage()
page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())})
const diag=()=>page.evaluate(()=>window.orasMissionDiagnostics?.())
const ready=async mission=>{await page.waitForFunction(mission=>{const d=window.orasMissionDiagnostics?.();return document.querySelector('.mission-shell')?.getAttribute('data-mission-status')==='ready'&&d?.mission===mission&&d.renderCount>0&&d.craft.modelReady&&!d.assets.requests&&!d.animating},mission,{timeout:60000});const d=await diag();assert.equal(d.shaderFailures,0);assert.equal(await page.locator('.mission-canvas canvas').count(),1);return d}
try{
 await page.goto(base+'/missions/voyager1');await ready('voyager1')
 for(const url of await page.locator('script[src]').evaluateAll(nodes=>nodes.map(node=>node.src))){const response=await context.request.get(url);report.servedScripts.push({url,sha256:createHash('sha256').update(await response.body()).digest('hex')})}
 report.release=(await (await context.request.get(base+'/api/v1/solar/missions')).json()).release_id
 report.gpu=await page.evaluate(()=>{const gl=document.querySelector('.mission-canvas canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)})
 assert.match(report.gpu,/NVIDIA.*RTX 3060/i)
 await page.getByRole('button',{name:'Inspect craft',exact:true}).click();await page.waitForFunction(()=>window.orasMissionDiagnostics?.()?.view==='inspection'&&!window.orasMissionDiagnostics()?.animating)
 const instance=(await diag()).instanceId
 for(const quality of ['efficient','balanced','detailed','balanced']){
  await page.getByRole('button',{name:'Mission display settings',exact:true}).click()
  await page.getByLabel('Mission graphics quality',{exact:true}).selectOption(quality)
  await page.getByRole('button',{name:'Close mission panel',exact:true}).click()
  await page.waitForFunction(quality=>window.orasMissionDiagnostics?.()?.quality===quality,quality)
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
  const d=await ready('voyager1'),buffer=await page.evaluate(()=>{const canvas=document.querySelector('.mission-canvas canvas'),gl=canvas.getContext('webgl2');return{width:gl.drawingBufferWidth,height:gl.drawingBufferHeight,cssWidth:canvas.clientWidth,cssHeight:canvas.clientHeight,dpr:devicePixelRatio}})
  assert.equal(d.instanceId,instance,'Quality changes do not replace the renderer')
  assert.equal(d.pixelRatio,quality==='efficient'?1:quality==='balanced'?1.5:2)
  assert.equal(buffer.width,Math.floor(buffer.cssWidth*d.pixelRatio));assert.equal(buffer.height,Math.floor(buffer.cssHeight*d.pixelRatio))
  assert.equal(d.pipeline.bloom,quality!=='efficient');assert.equal(d.pipeline.toneMappingStages,1)
  report.quality.push({quality,buffer,diagnostics:d})
  await page.screenshot({path:path.join(out,'voyager1-quality-'+quality+'.png')})
 }
 assert.equal(report.quality[1].diagnostics.geometries,report.quality[3].diagnostics.geometries)
 assert.equal(report.quality[1].diagnostics.textures,report.quality[3].diagnostics.textures)
 report.checks.push('Efficient/Balanced/Detailed change actual GPU buffer resolution and compositor policy on one renderer; returning to Balanced has stable geometry/texture counts')
 report.beforeLoss=await diag();await page.evaluate(()=>{window.__qualityOld=window.orasMissionDiagnostics;document.querySelector('.mission-canvas canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()})
 await page.getByRole('alert').waitFor({timeout:10000})
 assert.equal(await page.locator('.mission-canvas canvas').count(),0)
 assert.equal(await page.getByRole('button',{name:'Inspect craft',exact:true}).isDisabled(),true)
 report.lost=await page.evaluate(()=>window.__qualityOld());assert.equal(report.lost.disposed,true);assert.equal(report.lost.ownedResources,0)
 await page.screenshot({path:path.join(out,'voyager1-context-lost.png')})
 await page.getByRole('button',{name:'Retry mission',exact:true}).click();report.recovered=await ready('voyager1')
 assert.notEqual(report.recovered.instanceId,report.beforeLoss.instanceId)
 assert.equal(report.recovered.epoch,report.beforeLoss.epoch);assert.equal(report.recovered.quality,'balanced')
 assert.equal(await page.getByRole('alert').count(),0);assert.equal(report.recovered.contextLost,false)
 assert.equal(report.recovered.independentAnimationLoops,1)
 await page.screenshot({path:path.join(out,'voyager1-context-recovered.png')})
 report.checks.push('Visible Retry recovers from actual context loss with one new renderer, same mission/UTC/quality and a loaded physical model')
 const epoch=report.recovered.epoch;await page.reload();report.reloaded=await ready('voyager1')
 assert.equal(report.reloaded.epoch,epoch);assert.equal(await page.getByRole('alert').count(),0)
 report.checks.push('Full page reload after recovery retains the mission UTC and renders successfully')
 await page.goto(base+'/missions/newhorizons?date=2015-07-14T11%3A49%3A00.000Z');await ready('newhorizons')
 await page.getByLabel('Focus encounter target',{exact:true}).selectOption('pluto')
 await page.waitForFunction(()=>window.orasMissionDiagnostics?.()?.focus==='pluto'&&!window.orasMissionDiagnostics()?.animating)
 report.pluto={context:await page.locator('.mission-context').innerText(),diagnostics:await diag()}
 assert.match(report.pluto.context,/black.*unobserved/i)
 assert.match(report.pluto.context,/not dark terrain/i)
 assert.equal(report.pluto.diagnostics.craft.selfShadow,false)
 await page.screenshot({path:path.join(out,'pluto-source-coverage-disclosure.png')})
 await page.getByRole('button',{name:'Mission science & sources',exact:true}).click()
 // The warning is deliberately placed beside the selected target. The source
 // dialog is captured too, but need not duplicate an already visible warning.
 report.pluto.sourcePanel=await page.locator('dialog[open]').innerText()
 await page.screenshot({path:path.join(out,'pluto-source-panel.png')})
 report.checks.push('Pluto image gaps are explicitly disclosed as unobserved source coverage, not dark terrain; spacecraft self-shadow is inactive')
 assert.deepEqual(report.errors,[])
 report.finalServedScripts=[];for(const script of report.servedScripts){const response=await context.request.get(script.url);report.finalServedScripts.push({url:script.url,sha256:createHash('sha256').update(await response.body()).digest('hex')})}
 assert.deepEqual(report.finalServedScripts,report.servedScripts)
 report.status='PASS'
}catch(error){report.status='FAIL';report.failure=String(error);report.body=await page.locator('body').innerText().catch(()=>null);await page.screenshot({path:path.join(out,'failure.png')}).catch(()=>{});console.error(error)}
finally{await context.close();await browser.close();report.finishedUtc=new Date().toISOString();await writeFile(path.join(out,'quality-recovery.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks,errors:report.errors}));if(report.status!=='PASS')process.exitCode=1}
