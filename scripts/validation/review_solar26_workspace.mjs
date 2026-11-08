// Independent Workspace/observation UI reproducers. Scene author does not review
// their own scientific rendering through this receipt.
import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import path from 'node:path'
import assert from 'node:assert/strict'
assert.equal(process.platform,'win32')
const out=process.argv[2],base=process.argv[3]||'http://localhost:4231'
await mkdir(out,{recursive:true})
const report={status:'RUNNING',checks:[],errors:[],captures:[]}
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
try{
 {
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message))
  await page.goto(base+'/beyond?date=2018-11-05T12%3A00%3A00.000Z&view=imap')
  await page.locator('[data-testid="imap-observation"]').waitFor({timeout:60000})
  await page.waitForFunction(()=>window.orasBeyondDiagnostics?.()?.renderCount>0)
  report.servedScripts=[];for(const url of await page.locator('script[src]').evaluateAll(elements=>elements.map(element=>element.src))){const response=await context.request.get(url);report.servedScripts.push({url,status:response.status(),sha256:createHash('sha256').update(await response.body()).digest('hex')})}
  report.gpu=await page.evaluate(()=>{const gl=document.querySelector('.beyond-canvas canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)});assert.match(report.gpu,/NVIDIA.*RTX 3060/i)
  const pointer=await page.locator('[data-testid="imap-observation"] svg').evaluate(svg=>{const p=svg.createSVGPoint();p.x=55;p.y=180;const screen=p.matrixTransform(svg.getScreenCTM()),r=svg.getBoundingClientRect();return{x:screen.x,y:screen.y,box:{x:r.x,y:r.y,width:r.width,height:r.height},ctm:svg.getScreenCTM().toString()}})
  await page.mouse.move(pointer.x,pointer.y);await page.waitForTimeout(100)
  report.pointer={...pointer,index:await page.getByLabel('Observation minute',{exact:true}).inputValue(),readout:await page.locator('.beyond-observation-readout').innerText()}
  report.checks.push({name:'IMAP pointer at actual plot start selects first UTC bin',pass:report.pointer.index==='0'})
  await page.screenshot({path:path.join(out,'imap-pointer-start.png')})
  for(const view of ['outer','heliosphere','oort']){
   await page.goto(base+`/beyond?date=2018-11-05T12%3A00%3A00.000Z&view=${view}`);await page.locator('[data-beyond-status="ready"]').waitFor({timeout:60000});await page.waitForFunction(()=>{const d=window.orasBeyondDiagnostics?.();return d?.renderCount>0&&!d.animating})
   await page.screenshot({path:path.join(out,view+'-desktop.png')});report.captures.push({view,diagnostics:await page.evaluate(()=>window.orasBeyondDiagnostics())})
  }
  await context.close()
 }
 {
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message))
  await page.addInitScript(()=>{const native=WebGL2RenderingContext.prototype.getProgramParameter;window.__restoreBeyondCompileQuery=()=>{WebGL2RenderingContext.prototype.getProgramParameter=native};WebGL2RenderingContext.prototype.getProgramParameter=function(program,pname){if(pname===37297)return false;return Reflect.apply(native,this,[program,pname])}})
  await page.goto(base+'/beyond?date=2018-11-05T12%3A00%3A00.000Z&view=outer',{waitUntil:'domcontentloaded'})
  await page.locator('.beyond-canvas canvas').waitFor({timeout:60000})
  report.beforeLoss=await page.evaluate(()=>window.orasBeyondDiagnostics?.())
  await page.evaluate(()=>document.querySelector('.beyond-canvas canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext())
  await page.getByRole('alert').waitFor({timeout:10000});await page.waitForTimeout(300)
  report.afterLoss={canvasCount:await page.locator('.beyond-canvas canvas').count(),presetDisabled:await page.getByRole('button',{name:'Planets',exact:true}).isDisabled(),zoomDisabled:await page.getByRole('button',{name:'Zoom beyond in',exact:true}).isDisabled(),status:await page.locator('.beyond-shell').getAttribute('data-beyond-status')}
  report.checks.push({name:'Context loss during pending shader preparation cannot re-enable retired renderer controls',pass:report.afterLoss.canvasCount===0&&report.afterLoss.presetDisabled&&report.afterLoss.zoomDisabled})
  await page.screenshot({path:path.join(out,'pending-prepare-context-loss.png')})
  await page.evaluate(()=>window.__restoreBeyondCompileQuery())
  await page.getByRole('button',{name:'Retry Beyond',exact:true}).click()
  await page.waitForFunction(()=>{const d=window.orasBeyondDiagnostics?.();return document.querySelector('.beyond-shell')?.getAttribute('data-beyond-status')==='ready'&&d?.ready&&d.renderCount>0&&!d.animating},null,{timeout:60000})
  report.recovered={canvasCount:await page.locator('.beyond-canvas canvas').count(),presetDisabled:await page.getByRole('button',{name:'Planets',exact:true}).isDisabled(),alertCount:await page.getByRole('alert').count(),diagnostics:await page.evaluate(()=>window.orasBeyondDiagnostics())}
  const recovered=report.recovered,retired=recovered.diagnostics.retired
  report.checks.push({name:'Retry after pending preparation context loss creates one ready renderer and releases retired resources',pass:recovered.canvasCount===1&&!recovered.presetDisabled&&recovered.alertCount===0&&recovered.diagnostics.instanceId!==report.beforeLoss.instanceId&&recovered.diagnostics.disposed===false&&recovered.diagnostics.independentAnimationLoops===1&&retired?.disposed===true&&retired?.ownedResources===0&&retired?.independentAnimationLoops===0})
  await page.screenshot({path:path.join(out,'pending-prepare-recovered.png')});await context.close()
 }
 report.status=report.checks.every(c=>c.pass)&&!report.errors.length?'PASS':'FAIL'
}catch(error){report.status='FAIL';report.failure=String(error)}finally{await browser.close();await writeFile(path.join(out,'workspace-review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.checks,pointer:report.pointer,afterLoss:report.afterLoss,failure:report.failure}));if(report.status!=='PASS')process.exitCode=1}
