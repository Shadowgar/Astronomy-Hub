import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
import path from 'node:path'
assert.equal(process.platform,'win32')
const base=process.argv[2]||'http://localhost:4231',out=process.argv[3]||'output/playwright/solar-system-2.2/travel',epoch='2026-10-27T04:00:00.000Z'
await mkdir(out,{recursive:true})
const receipt={base,epoch,runs:[],errors:[]},browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
try{for(const[name,width,height]of[['desktop',1440,900],['portrait',390,844],['landscape',844,390]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:name!=='desktop',reducedMotion:'no-preference',recordVideo:{dir:path.join(out,'video'),size:{width,height}}}),page=await context.newPage(),run={name,width,height,steps:[]};receipt.runs.push(run)
 page.on('pageerror',e=>receipt.errors.push(e.message));const d=()=>page.evaluate(()=>window.orasSolarDiagnostics())
 const ready=()=>page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d&&d.texturesReady>=9&&d.earthOrientation.frame==='ITRS'&&!d.animating&&!d.detail.pending},null,{timeout:90000})
 const activate=locator=>name==='desktop'?locator.click():locator.tap()
 const choose=async id=>{await activate(page.locator('.solar-destinations>summary'));await activate(page.getByRole('navigation',{name:'Select a celestial body'}).getByRole('button',{name:id,exact:true}))}
 const record=async label=>{const state=await d();assert.equal(Date.parse(state.epoch),Date.parse(epoch));run.steps.push({label,diagnostics:state,atBrowserMs:await page.evaluate(()=>performance.now())});await page.screenshot({path:path.join(out,name+'-'+label+'.png')})}
 await page.goto(base+'/solar-system?date='+epoch);await ready()
 run.gpu=await page.evaluate(()=>{const gl=document.querySelector('.solar-canvas canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER)});assert.match(run.gpu,/NVIDIA.*RTX 3060/i)
 await record('overview');const initial=await d()
 // Monitor actual renderer frames during travel, separately from steady GPU benchmarks.
 await page.evaluate(()=>{window.solarTravelFrames=[];let previous=0;const tick=now=>{const d=window.orasSolarDiagnostics?.();if(!d||d.disposed)return;if(previous&&d.animating)window.solarTravelFrames.push(now-previous);previous=now;window.solarTravelMonitor=requestAnimationFrame(tick)};window.solarTravelMonitor=requestAnimationFrame(tick)})
 for(const id of ['Jupiter','Saturn']){await choose(id);await page.waitForFunction(()=>window.orasSolarDiagnostics().animating);await ready();await record(id.toLowerCase());await page.waitForTimeout(400)}
 await activate(page.getByRole('button',{name:'View selected body',exact:true}));await ready();for(let i=0;i<3;i++)await activate(page.getByRole('button',{name:'Orbit camera right',exact:true}));await record('rings')
 await activate(page.locator('.solar-framing>summary'));await activate(page.getByRole('button',{name:'System overview',exact:true}));await ready();await record('return')
 assert.equal((await d()).selected,null);assert.equal((await d()).instanceId,initial.instanceId);assert.equal((await d()).detail.current,null)
 await choose('Jupiter');await page.waitForFunction(()=>window.orasSolarDiagnostics().animating)
 const canvas=page.locator('.solar-canvas canvas'),box=await canvas.boundingBox(),x=box.x+box.width*.5,y=box.y+box.height*.48
 if(name==='desktop'){await page.mouse.move(x,y);await page.mouse.wheel(0,90)}else{
  const cdp=await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]})
  for(let i=1;i<=6;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+5*i,y:y+2*i}]})
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach()
 }
 await page.waitForFunction(()=>!window.orasSolarDiagnostics().animating);assert.equal((await d()).cameraView,'custom');await record('interrupted')
 await activate(page.getByRole('button',{name:'Focus selected',exact:true}));await ready();await record('recentered')
 await page.emulateMedia({reducedMotion:'reduce'});await choose('Earth');await ready();assert.equal((await d()).animating,false);await record('reduced-motion')
 run.motion=await page.evaluate(()=>{cancelAnimationFrame(window.solarTravelMonitor);const a=window.solarTravelFrames.sort((a,b)=>a-b);return{samples:a.length,medianMs:a[Math.floor(a.length*.5)],p95Ms:a[Math.ceil(a.length*.95)-1],maxMs:a.at(-1),over50ms:a.filter(v=>v>50).length,videoCaptureOverhead:true}})
 assert.deepEqual((await d()).bodies.map(b=>b.position),initial.bodies.map(b=>b.position));run.video=path.basename(await page.video().path());run.status='PASS';await context.close();await writeFile(path.join(out,'travel.json'),JSON.stringify(receipt,null,2));console.log(name,'PASS')
}assert.deepEqual(receipt.errors,[]);receipt.status='PASS'}catch(e){receipt.status='FAIL';receipt.error=String(e);throw e}finally{await browser.close();await writeFile(path.join(out,'travel.json'),JSON.stringify(receipt,null,2))}
