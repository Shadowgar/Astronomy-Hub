import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import path from 'node:path'

assert.equal(process.platform,'win32','Baseline requires actual Windows graphics')
const base=process.argv[2]||'http://localhost:4231',out=process.argv[3]||'output/playwright/solar-system-2.3/before'
const epoch='2026-10-27T04:00:00.000Z',head='767ec130faa60606e689a889f7ed4c3c58ee74fc'
const systems={earth:['moon'],mars:['phobos','deimos'],jupiter:['io','europa','ganymede','callisto'],saturn:['titan','enceladus'],uranus:['miranda','titania'],neptune:['triton']}
await mkdir(out,{recursive:true})
const receipt={base,epoch,head,platform:process.platform,browser:null,runs:[],errors:[],sources:[],status:'RUNNING'}
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
const save=()=>writeFile(path.join(out,'baseline.json'),JSON.stringify(receipt,null,2))
try{
 receipt.browser=browser.version()
 for(const [width,height] of [[1440,900],[390,844],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,reducedMotion:'reduce'}),page=await context.newPage()
  page.on('pageerror',e=>receipt.errors.push({width,height,type:'page',message:e.message}))
  page.on('console',m=>{if(m.type()==='error')receipt.errors.push({width,height,type:'console',message:m.text()})})
  for(const [system,moons] of Object.entries(systems)){
   const targets=[null,...(width===1440?moons:moons.slice(0,1))]
   if(width===1440){const response=await context.request.get(`${base}/api/v1/planetary-systems/${system}?epoch=${encodeURIComponent(epoch)}`);assert.equal(response.status(),200);const body=await response.body();await writeFile(path.join(out,`${system}-source.json`),body);receipt.sources.push({system,sha256:createHash('sha256').update(body).digest('hex')})}
   for(const selected of targets){
    await page.goto(`${base}/planetary-system/${system}?date=${epoch}${selected?'&moon='+selected:''}`)
    await page.waitForFunction(({system,selected})=>{const d=window.orasSystemDiagnostics?.();return d?.system===system&&d.selected===selected&&!d.animating&&!d.contextLost&&d.bodies.every(b=>b.modelStatus!=='loading'&&b.textureStatus!=='loading')},{system,selected},{timeout:90000})
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))
    const diagnostics=await page.evaluate(()=>window.orasSystemDiagnostics())
    const gpu=await page.evaluate(()=>{const gl=document.querySelector('.system-canvas canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER)})
    assert.match(gpu,/NVIDIA.*RTX 3060/i);assert.equal(Date.parse(diagnostics.epoch),Date.parse(epoch))
    const file=`${width}x${height}-${system}-${selected||'overview'}.png`;await page.screenshot({path:path.join(out,file)})
    receipt.runs.push({width,height,system,selected,file,gpu,diagnostics});await save();console.log(file,'captured')
   }
  }
  const scripts=await page.locator('script[src]').evaluateAll(nodes=>nodes.map(n=>n.src))
  for(const url of scripts){const response=await context.request.get(url),data=await response.body();receipt.sources.push({url,sha256:createHash('sha256').update(data).digest('hex'),bytes:data.length})}
  await context.close()
 }
 assert.deepEqual(receipt.errors,[]);receipt.status='PASS'
}catch(error){receipt.status='FAIL';receipt.failure=String(error);throw error}
finally{await browser.close();await save()}
