import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
assert.equal(process.platform,'win32')
const out=process.argv[2],base='http://localhost:4231',epoch='2026-10-27T04:00:00.000Z';await mkdir(out,{recursive:true})
const receipt={head:'fc1a7142b35ca791ffeddef810c93a244ad32769',epoch,status:'RUNNING',runs:[],errors:[],limits:['New Pluto/Charon/Ceres/TNO/comet destinations do not exist in the baseline; no fabricated before views.','Portrait/landscape use desktop Windows GPU, not physical iPhone.']}
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
try{receipt.browser=browser.version();for(const [width,height] of [[1440,900],[390,844],[844,390]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>receipt.errors.push(e.message))
 for(const scene of ['overview','outer','neptune','eros','asteroid-belt']){
  const body=['neptune','eros'].includes(scene)?scene:null
  await page.goto(`${base}/solar-system?date=${epoch}${body?'&solarBody='+body:''}`)
  await page.waitForFunction(id=>{const d=window.orasSolarDiagnostics?.();return d?.selected===id&&d.renderCount>0&&!d.animating&&d.texturesReady>=9&&!d.assets.requests&&!d.detail.pending&&d.earthOrientation.icrfToItrs},body,{timeout:60000})
  if(!body){await page.locator('.solar-framing summary').click();await page.getByRole('button',{name:scene==='outer'?'Outer planets':scene==='asteroid-belt'?'Inner planets':'All planets',exact:true}).click()}
  if(scene==='asteroid-belt'){await page.getByRole('button',{name:'Science, scale & sources',exact:true}).click();await page.getByLabel('Show 2,048 JPL asteroid orbits',{exact:true}).check();await page.keyboard.press('Escape')}
  await page.waitForFunction(()=>!window.orasSolarDiagnostics().animating);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
  const diagnostics=await page.evaluate(()=>window.orasSolarDiagnostics()),gpu=await page.evaluate(()=>{const gl=document.querySelector('.solar-canvas canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER)})
  assert.match(gpu,/NVIDIA.*RTX 3060/i);const file=`${width}x${height}-${scene}.png`;await page.screenshot({path:path.join(out,file)});receipt.runs.push({width,height,scene,file,gpu,diagnostics});console.log(file)
 }
 await context.close()
}assert.deepEqual(receipt.errors,[]);receipt.status='PASS'}catch(e){receipt.status='FAIL';receipt.failure=String(e);throw e}finally{await browser.close();await writeFile(path.join(out,'baseline.json'),JSON.stringify(receipt,null,2))}
