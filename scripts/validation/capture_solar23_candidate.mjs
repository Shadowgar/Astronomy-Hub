import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import path from 'node:path'
assert.equal(process.platform,'win32','Requires actual Windows graphics')
const base=process.argv[2]||'http://localhost:4231',out=process.argv[3]
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
const receipt={status:'RUNNING',browser:browser.version(),runs:[],errors:[]}
try{
 for(const [width,height] of (process.argv[4]==='saturn-mobile'?[[390,844],[844,390]]:[[1440,900],[390,844],[844,390]])){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,reducedMotion:'reduce'}),page=await context.newPage()
  page.on('pageerror',e=>receipt.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')receipt.errors.push(m.text())})
  for(const [system,moons] of Object.entries({earth:['earth','moon'],mars:['mars','phobos','deimos'],jupiter:['jupiter','io','europa','ganymede','callisto'],saturn:['saturn','titan','enceladus'],uranus:['uranus','miranda','ariel','umbriel','titania','oberon'],neptune:['neptune','triton']})){
   if(process.argv[4]==='saturn-mobile'&&system!=='saturn')continue
   for(const selected of (process.argv[4]==='saturn-mobile'?['saturn','titan']:[null,...(width===1440||system==='saturn'?moons:moons.slice(-1))])){
    await page.goto(`${base}/planetary-system/${system}?date=2026-10-27T04:00:00.000Z${selected?'&moon='+selected:''}`)
    await page.waitForFunction(({system,selected})=>{const d=window.orasSystemDiagnostics?.();return d?.system===system&&d.selected===selected&&d.renderCount>0&&d.shaderPreparation?.state==='ready'&&!d.animating&&d.assets.requests===0&&!d.detail.pending&&!d.detail.retiring.length&&d.bodies.every(b=>b.overviewReady||b.errors.length)},{system,selected},{timeout:60000})
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
    const diagnostics=await page.evaluate(()=>window.orasSystemDiagnostics()),gpu=await page.evaluate(()=>{const gl=document.querySelector('.system-canvas canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER)})
    assert.match(gpu,/NVIDIA.*RTX 3060/i);assert.deepEqual(diagnostics.bodies.flatMap(b=>b.errors),[]);assert.equal(diagnostics.detail.errors,0);assert.equal(diagnostics.loading.shaderFailures,0)
    const file=`${width}x${height}-${system}-${selected||'overview'}.png`;await page.screenshot({path:path.join(out,file)})
    receipt.runs.push({width,height,system,selected,file,gpu,diagnostics});await writeFile(path.join(out,'candidate.json'),JSON.stringify(receipt,null,2));console.log(file)
   }
  }
  await context.close()
 }
 assert.deepEqual(receipt.errors,[]);receipt.status='PASS'
}catch(e){receipt.status='FAIL';receipt.failure=String(e);throw e}
finally{await browser.close();await writeFile(path.join(out,'candidate.json'),JSON.stringify(receipt,null,2))}
