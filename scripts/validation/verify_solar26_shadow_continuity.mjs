// Actual mission renderer regression for the stable shadow shader configuration.
import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'

assert.equal(process.platform,'win32','Requires the owner Windows Edge hardware path')
const out=process.argv[2],base=process.argv[3]||'http://localhost:4231'
assert.ok(out,'Usage: node verify_solar26_shadow_continuity.mjs OUTPUT [BASE]')
await mkdir(out,{recursive:true})
const report={status:'RUNNING',base,startedUtc:new Date().toISOString(),missions:[],errors:[]}
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
try{
 for(const mission of ['voyager1','voyager2','cassini','newhorizons']){
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage(),run={mission,cycles:[],captures:[]}
  report.missions.push(run);page.on('pageerror',error=>report.errors.push({mission,message:error.message}))
  const settle=async view=>{
   await page.waitForFunction(view=>{const d=window.orasMissionDiagnostics?.();return document.querySelector('.mission-shell')?.getAttribute('data-mission-status')==='ready'&&d?.view===view&&d.renderCount&&!d.assets.requests&&!d.animating},view,{timeout:60000})
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))
   const d=await page.evaluate(()=>window.orasMissionDiagnostics());assert.equal(d.shaderFailures,0);assert.equal(d.independentAnimationLoops,1);assert.equal(d.craft.modelReady,true);assert.equal(d.craft.shadowConfigured,true)
   assert.equal(d.craft.shadowUpdates,d.craft.visible);assert.equal(d.craft.selfShadow,d.craft.visible)
   return d
  }
  try{
   await page.goto(`${base}/missions/${mission}`);run.initial=await settle('encounter');assert.equal(run.initial.craft.visible,false)
   run.gpu=await page.evaluate(()=>{const gl=document.querySelector('.mission-canvas canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)});assert.match(run.gpu,/NVIDIA.*RTX 3060/i)
   for(let cycle=0;cycle<3;cycle++){
    await page.getByRole('button',{name:'Inspect craft',exact:true}).click();const inspection=await settle('inspection');assert.equal(inspection.craft.selfShadow,true);assert.equal(inspection.instanceId,run.initial.instanceId)
    await page.getByRole('button',{name:'Encounter',exact:true}).click();const encounter=await settle('encounter');assert.equal(encounter.craft.visible,false);assert.equal(encounter.craft.shadowUpdates,false);assert.equal(encounter.instanceId,run.initial.instanceId)
    if(cycle){assert.equal(inspection.geometries,run.cycles[0].inspection.geometries);assert.equal(inspection.textures,run.cycles[0].inspection.textures);assert.equal(inspection.craft.modelMeshCount,run.cycles[0].inspection.craft.modelMeshCount)}
    run.cycles.push({inspection,encounter})
   }
   await page.getByRole('button',{name:'Inspect craft',exact:true}).click();await settle('inspection')
   for(const [size,viewport] of [['desktop',{width:1440,height:900}],['portrait',{width:390,height:844}],['landscape',{width:844,height:390}]]){
    await page.setViewportSize(viewport);const diagnostics=await settle('inspection');assert.equal(diagnostics.craft.selfShadow,true);const file=`${mission}-${size}.png`;await page.screenshot({path:path.join(out,file)});run.captures.push({size,file,diagnostics})
   }
   await page.evaluate(()=>{window.__retiredShadowScene=window.orasMissionDiagnostics});await page.getByRole('button',{name:'← Solar System',exact:true}).click()
   await page.waitForFunction(()=>window.orasSolarDiagnostics?.()?.renderCount>0,null,{timeout:60000})
   run.retired=await page.evaluate(()=>window.__retiredShadowScene());assert.equal(run.retired.disposed,true);assert.equal(run.retired.ownedResources,0);assert.equal(run.retired.independentAnimationLoops,0);assert.equal(await page.locator('.mission-canvas canvas').count(),0)
   console.log(JSON.stringify({mission,status:'PASS',cycles:run.cycles.length,captures:run.captures.length}))
  }finally{await context.close()}
 }
 assert.deepEqual(report.errors,[]);report.status='PASS'
}catch(error){report.status='FAIL';report.failure=String(error);console.error(error)}finally{await browser.close();report.finishedUtc=new Date().toISOString();await writeFile(path.join(out,'shadow-continuity.json'),JSON.stringify(report,null,2));if(report.status!=='PASS')process.exitCode=1}
