import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile,readFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import path from 'node:path'
assert.equal(process.platform,'win32','Actual Windows hardware required')
const base=process.argv[2]||'http://localhost:4231',out=process.argv[3]||'output/playwright/solar-system-2.2/visuals',epoch='2026-10-27T04:00:00.000Z'
const baseline=JSON.parse(await readFile(process.argv[4]||'output/playwright/solar-system-2.2/preview/browser.json','utf8'))
await mkdir(out,{recursive:true})
const receipt={base,epoch,platform:process.platform,runs:[],errors:[]},browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
try{
 receipt.browser=browser.version()
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,reducedMotion:'reduce'}),page=await context.newPage()
  page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGLProgram|GL_INVALID/.test(m.text()))receipt.errors.push(m.text())})
  const ready=()=>page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d&&d.texturesReady>=9&&!d.animating&&!d.detail.pending&&d.earthOrientation.frame==='ITRS'},null,{timeout:90000})
  const shot=async(name)=>{
   const diagnostics=await page.evaluate(()=>window.orasSolarDiagnostics()),gpu=await page.evaluate(()=>{const gl=document.querySelector('.solar-canvas canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER)})
   assert.match(gpu,/NVIDIA.*RTX 3060/i);assert.equal(Date.parse(diagnostics.epoch),Date.parse(epoch));assert.equal(diagnostics.pipeline.toneMappingStages,1);assert.equal(diagnostics.detail.errors,0)
   const file=`${width}x${height}-${name}.png`;await page.screenshot({path:path.join(out,file)});receipt.runs.push({width,height,name,file,gpu,diagnostics});await writeFile(path.join(out,'visuals.json'),JSON.stringify(receipt,null,2));console.log(width,height,name,'PASS')
  }
  for(const body of ['overview','jupiter','saturn','earth','mars','sun']){
   await page.goto(base+'/solar-system?date='+epoch+(body==='overview'?'':'&solarBody='+body));await ready();await shot(body)
   if(['earth','jupiter','mars','saturn','sun'].includes(body)){
    await page.getByRole('button',{name:'View selected body',exact:true}).click();await ready();await shot(body+'-close')
   }
   if(body==='saturn'){
    for(let i=0;i<3;i++)await page.getByRole('button',{name:'Orbit camera right',exact:true}).click();await shot('saturn-oblique')
    for(let i=0;i<8;i++)await page.getByRole('button',{name:'Orbit camera right',exact:true}).click();await shot('saturn-backlit')
   }
   if(body==='earth'&&width===1440){
    await page.getByRole('button',{name:'Science, scale & sources',exact:true}).click();await page.getByLabel('Rendering quality',{exact:true}).selectOption('detailed');await page.getByRole('button',{name:'Close panel',exact:true}).click();await ready();await shot('earth-close-detailed')
   }
   const prior=baseline.runs.find(r=>r.width===width&&r.height===height&&r.body===body)?.diagnostics
   if(prior){
    const saved={schema:'oras.solar-return.v1',epoch,camera:prior.camera,target:prior.target,cameraUp:prior.cameraUp,cameraView:'custom',closeView:prior.closeView,near:prior.near,preferences:{overview:prior.overviewScope,quality:'balanced',sizeMode:prior.sizeMode,orbits:prior.orbitsVisible,effects:prior.effectsVisible,belt:false,beltDensity:2400,navigation:'orbit',asteroids:false,rate:86400}}
    await page.evaluate(view=>history.replaceState({...history.state,usr:{...history.state?.usr,r4SolarView:view}},''),saved);await page.reload();await ready();await shot(body+'-matched')
    const actual=receipt.runs.at(-1).diagnostics;for(const key of ['camera','target','cameraUp'])for(let i=0;i<3;i++)assert(Math.abs(actual[key][i]-prior[key][i])<1e-12,'Matched camera float64 tolerance')
   }
  }
  await context.close()
 }
 assert.deepEqual(receipt.errors,[]);receipt.status='PASS'
}catch(e){receipt.status='FAIL';receipt.error=String(e);throw e}finally{await browser.close();await writeFile(path.join(out,'visuals.json'),JSON.stringify(receipt,null,2))}
