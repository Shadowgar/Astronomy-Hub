import {chromium} from '../../node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
const base='http://172.26.23.204:4218',out=process.env.SOLAR_OUT||'output/solar-scientific-controls/camera-state'
await mkdir(out,{recursive:true});const proof={status:'RUNNING',base,runs:[]},browser=await chromium.launch()
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});page.setDefaultTimeout(15000)
 await page.goto(base+'/solar-system?date=2026-10-23T01:05:00.123Z');await page.waitForFunction(()=>window.orasSolarDiagnostics?.()?.texturesReady===2)
 await page.getByRole('button',{name:'Earth',exact:true}).click();await page.getByRole('button',{name:'Orbit camera right',exact:true}).click()
 const before=await page.evaluate(()=>window.orasSolarDiagnostics());assert.equal(before.cameraView,'custom');proof.runs.push({name:'before',state:before})
 await page.setViewportSize({width:390,height:900});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
 const after=await page.evaluate(()=>window.orasSolarDiagnostics());proof.runs.push({name:'after',state:after})
 assert.deepEqual(after.camera,before.camera,'Custom camera position retained across orientation breakpoint');assert.deepEqual(after.target,before.target);assert.deepEqual(after.cameraUp,before.cameraUp,'Custom camera up retained across orientation breakpoint');assert.deepEqual(after.cameraQuaternion,before.cameraQuaternion,'Custom orientation retained')
 await page.getByRole('button',{name:'Zoom Solar view out',exact:true}).click();const zoom=await page.evaluate(()=>window.orasSolarDiagnostics());proof.runs.push({name:'zoom',state:zoom});assert.ok(zoom.cameraQuaternion.every((v,i)=>Math.abs(v-after.cameraQuaternion[i])<1e-10),'First zoom after resize does not rotate the custom camera')
 proof.status='PASS'
}catch(error){proof.status='FAIL';proof.error=error.stack;process.exitCode=1}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');console.log(proof.status)}
