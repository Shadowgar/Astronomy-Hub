import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
const minimumAssets=Number(process.argv[4]||2)
const base=process.argv[2]||'http://localhost:4231',out=process.argv[3]||'output/playwright/solar2/captures'
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:process.platform!=='win32',...(process.platform==='win32'?{executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader']}: {})})
const proof={base,epoch:'2026-10-27T04:00:00Z',platform:process.platform,runs:[]}
try{
 for(const [layout,width,height] of [['desktop',1440,900],['portrait',390,844],['landscape',844,390]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:layout!=='desktop',reducedMotion:'reduce'}),page=await context.newPage()
  const run={layout,width,height,errors:[],captures:[]};proof.runs.push(run)
  page.on('pageerror',e=>run.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGLProgram|GL_INVALID/.test(m.text()))run.errors.push(m.text())})
  for(const [name,body] of [['overview',''],['saturn','saturn'],['earth','earth'],['mars','mars']]){
   const start=Date.now();await page.goto(base+'/solar-system?date='+proof.epoch+(body?'&solarBody='+body:''))
   await page.locator('[data-solar-status=ready]').waitFor({timeout:90000})
   await page.waitForFunction(minimumAssets=>window.orasSolarDiagnostics?.().texturesReady>=minimumAssets,minimumAssets,{timeout:60000})
   await page.waitForTimeout(1200)
   const state=await page.evaluate(()=>window.orasSolarDiagnostics()),webgl=await page.evaluate(()=>{const c=document.querySelector('.solar-canvas canvas'),g=c.getContext('webgl2'),d=g.getExtension('WEBGL_debug_renderer_info');return{vendor:g.getParameter(d?d.UNMASKED_VENDOR_WEBGL:g.VENDOR),renderer:g.getParameter(d?d.UNMASKED_RENDERER_WEBGL:g.RENDERER)}})
   await page.screenshot({path:path.join(out,layout+'-'+name+'.png')});run.captures.push({name,entryModules:await page.locator('script[src]').evaluateAll(elements=>elements.map(e=>e.src)),readyMs:Date.now()-start,state,webgl})
  }
  await context.close();await writeFile(path.join(out,'captures.json'),JSON.stringify(proof,null,2));console.log(layout,run.errors.length?'ERRORS':'PASS')
 }
}finally{await browser.close();await writeFile(path.join(out,'captures.json'),JSON.stringify(proof,null,2))}
if(proof.runs.some(r=>r.errors.length))process.exitCode=1
