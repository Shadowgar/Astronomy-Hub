import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
assert.equal(process.platform,'win32')
const out=process.argv[2];await mkdir(out,{recursive:true});const report={status:'RUNNING',errors:[],console:[],requests:[],captures:[]}
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
try{
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage()
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.console.push(e.text())});page.on('requestfailed',r=>report.requests.push({url:r.url(),error:r.failure()}))
 const started=Date.now();await page.goto('http://localhost:4231/missions/voyager1');await page.waitForFunction(()=>{const status=document.querySelector('.mission-shell')?.getAttribute('data-mission-status');return status&&status!=='loading'},null,{timeout:90000})
 const status=await page.locator('.mission-shell').getAttribute('data-mission-status');if(status!=='ready'){report.body=await page.locator('body').innerText();throw Error('Mission failed to reach ready: '+status)}
 await page.waitForFunction(()=>{const d=window.orasMissionDiagnostics?.();return d?.renderCount>0&&!d.assets.requests&&!d.animating},null,{timeout:60000});report.readyMs=Date.now()-started
 report.gpu=await page.evaluate(()=>{const gl=document.querySelector('.mission-canvas canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e.UNMASKED_RENDERER_WEBGL)});assert.match(report.gpu,/NVIDIA.*RTX 3060/i)
 const capture=async name=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:path.join(out,name+'.png')});report.captures.push({name,diagnostics:await page.evaluate(()=>window.orasMissionDiagnostics()),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)})}
 await capture('voyager1-jupiter-desktop');await page.getByRole('button',{name:'Inspect craft',exact:true}).click();await page.waitForFunction(()=>window.orasMissionDiagnostics()?.view==='inspection'&&!window.orasMissionDiagnostics()?.animating);await capture('voyager1-inspection-desktop')
 assert.equal(report.captures.at(-1).diagnostics.craft.modelReady,true);assert.ok(report.captures.at(-1).diagnostics.craft.modelMeshCount>1)
 await page.getByRole('button',{name:'Play mission playback',exact:true}).click();await page.waitForTimeout(1600);await page.getByRole('button',{name:'Pause mission playback',exact:true}).click();await capture('voyager1-inspection-follow')
 for(const [name,size] of [['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]){await page.setViewportSize(size);await page.waitForTimeout(300);await capture('voyager1-inspection-'+name)}
 await page.setViewportSize({width:1440,height:900});await page.getByRole('button',{name:'Trajectory',exact:true}).click();await page.waitForFunction(()=>window.orasMissionDiagnostics()?.view==='trajectory'&&!window.orasMissionDiagnostics()?.animating);await capture('voyager1-reconstructed-trajectories')
 assert.equal(report.errors.length,0);assert.ok(report.captures.every(c=>!c.overflow));report.status='PASS';console.log(JSON.stringify({status:report.status,gpu:report.gpu,readyMs:report.readyMs,captures:report.captures.length,console:report.console}))
}catch(e){report.status='FAIL';report.failure=String(e);console.error(e)}finally{await browser.close();await writeFile(path.join(out,'first-graphics.json'),JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1}
