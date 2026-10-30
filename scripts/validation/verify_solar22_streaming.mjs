// Actual Windows/Edge/NVIDIA application lifecycle. Network and decoded-image
// barriers make races deterministic; no mock renderer, texture or science data.
// Run only in the coordinated exclusive GPU window, after the candidate build.
import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'

assert.equal(process.platform,'win32','This receipt requires headed Windows Edge hardware; do not label emulation a pass.')
const base=process.argv[2]||'http://127.0.0.1:4231'
const out=process.argv[3]||'output/playwright/solar-system-2.2/streaming'
const epoch='2026-10-27T04:00:00.000Z'
const receipt={schema:'oras.solar22.texture-streaming-proof.v1',base,epoch,started:new Date().toISOString(),platform:process.platform,status:'RUNNING',runs:[],limits:['Controlled desktop Windows/NVIDIA lifecycle proof, not physical iPhone or owner acceptance.','Decode-retirement case defers delivery of an actual decoded ImageBitmap; it proves ownership/cancellation rather than native decoder timing.','Tracked texture admission includes conservative mip allowance; it is not total browser memory or hardware VRAM.']}
await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader'],args:['--host-resolver-rules=MAP solar22.localhost 127.0.0.1']})
receipt.browserVersion=browser.version()
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done});return{promise,resolve}}
const detailRequest=url=>/\/solar-assets\/v2\.2\/(?:jupiter|saturn|earth|mars|mercury|venus|neptune|uranus|eros)-\d+\.jpg(?:\?|$)/.test(url)&&!/-1024\.jpg(?:\?|$)/.test(url)

async function run(name,body){
 const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'reduce'})
 const page=await context.newPage(),run={name,status:'RUNNING',requests:[],responses:[],failures:[],console:[],pageErrors:[],expectedNetwork:[],checks:[]}
 receipt.runs.push(run);page.setDefaultTimeout(20000)
 let closing=false
 const expected=new Set(),releases=[]
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true})
 page.on('request',request=>{if(/solar-assets|earth-cloud|earth-blue|mars-nasa|\/assets\/solar\/takram-/.test(request.url()))run.requests.push({url:request.url(),at:Date.now(),closing})})
 page.on('response',response=>{if(/\/assets\/solar\/takram-/.test(response.url()))run.responses.push({url:response.url(),status:response.status(),bytes:Number(response.headers()['content-length']),closing})})
 page.on('requestfailed',request=>run.failures.push({url:request.url(),error:request.failure()?.errorText,expected:expected.has(new URL(request.url()).pathname),closing}))
 page.on('console',message=>{if(message.type()==='error'){const url=message.location().url;run.console.push({text:message.text(),url,expected:!!url&&expected.has(new URL(url,base).pathname),closing})}})
 page.on('pageerror',error=>run.pageErrors.push(error.stack||error.message))
 const diagnostics=()=>page.evaluate(()=>window.orasSolarDiagnostics())
 const wait=predicate=>page.waitForFunction(predicate,null,{timeout:90000})
 async function open(bodyId=''){
  const start=performance.now()
  await page.goto(base+'/solar-system?date='+epoch+(bodyId?'&solarBody='+bodyId:''))
  await page.locator('[data-solar-status=ready]').waitFor({timeout:90000})
  await wait(()=>!!window.orasSolarDiagnostics?.())
  const gpu=await page.evaluate(()=>{const gl=document.querySelector('.solar-canvas canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return{vendor:gl.getParameter(ext?ext.UNMASKED_VENDOR_WEBGL:gl.VENDOR),renderer:gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER),visible:document.visibilityState}})
  assert.match(gpu.renderer,/NVIDIA.*RTX 3060/i);assert.doesNotMatch(gpu.renderer,/SwiftShader|llvmpipe|Basic/i);assert.equal(gpu.visible,'visible');run.gpu=gpu
  run.sceneReadyMs=performance.now()-start
 }
 async function sourceReady(){await wait(()=>{const d=window.orasSolarDiagnostics?.();return d?.earthOrientation.frame==='ITRS'&&d.asteroids.available&&d.atmosphere.lookupBytes===8527872&&Number.isFinite(d.atmosphere.loadMilliseconds)&&d.atmosphere.loadMilliseconds>0&&!document.querySelector('[aria-label="Play simulation"]')?.disabled})}
 async function ready(){await wait(()=>{const d=window.orasSolarDiagnostics?.();return document.querySelector('[data-solar-status=ready]')&&d?.texturesReady===9&&d.cloudsReady&&!d.disposed&&!d.animating&&d.assets.requests===0});await sourceReady()}
 async function choose(label){
  await page.locator('.solar-destinations>summary').click()
  await page.getByLabel('Search Solar System',{exact:true}).fill(label)
  await page.locator('.solar-search-results').getByRole('button',{name:label,exact:true}).click()
  await wait(()=>!window.orasSolarDiagnostics().animating)
 }
 async function quality(value){
  await page.getByRole('button',{name:'Science, scale & sources',exact:true}).click()
  await page.getByLabel('Rendering quality',{exact:true}).selectOption(value)
  await page.getByRole('button',{name:'Close panel',exact:true}).click()
 }
 function sameScience(a,b,withCamera=true){
  assert.equal(a.epoch,b.epoch);assert.equal(a.instanceId,b.instanceId)
  assert.deepEqual(a.bodies.map(o=>[o.id,o.position]),b.bodies.map(o=>[o.id,o.position]))
  if(withCamera){assert.deepEqual(a.camera,b.camera);assert.deepEqual(a.target,b.target);assert.deepEqual(a.cameraUp,b.cameraUp)}
 }
 function bounded(d){assert(d.detail.textureBytes<=d.detail.textureBudget,'Shared texture admission exceeded');assert.equal(d.pipeline.toneMappingStages,1)}
 async function hold(pattern){
  const entered=deferred(),release=deferred();releases.push(release.resolve)
  await page.route('**'+pattern,async route=>{entered.resolve();await release.promise;try{await route.continue()}catch(error){if(!expected.has(pattern)&&!closing)throw error;run.expectedNetwork.push({url:route.request().url(),handler:String(error),closing})}})
  return{entered:entered.promise,release:release.resolve}
 }
 try{
  await body({context,page,run,expected,releases,diagnostics,wait,open,ready,sourceReady,choose,quality,sameScience,bounded,hold})
  run.final=await diagnostics();bounded(run.final)
  run.resourceTimings=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/solar-assets\/v2\.2/.test(r.name)).map(r=>({url:r.name,bytes:r.encodedBodySize,durationMs:r.duration})))
  // The existing LUT loader validates exact bytes/SHA, then cancels its stream
  // reader in finally. Edge may report that completed stream as ERR_ABORTED.
  // Admit only the exact table URL with matching HTTP size AND successful
  // loader completion; never suppress a failed/incomplete table or other abort.
  const tableBytes={'transmittance.bin':131072,'irradiance.bin':8192,'scattering.bin':8388608}
  for(const failure of run.failures){
   const url=new URL(failure.url),table=url.pathname.startsWith('/assets/solar/takram-0.19.1/')?url.pathname.split('/').at(-1):null
   if(failure.error==='net::ERR_ABORTED'&&tableBytes[table]&&run.responses.some(r=>r.url===failure.url&&r.status===200&&r.bytes===tableBytes[table])&&run.final.atmosphere.lookupBytes===8527872&&Number.isFinite(run.final.atmosphere.loadMilliseconds)&&run.final.atmosphere.loadMilliseconds>0){
    failure.expected=true;failure.reason='Exact-size, hash-validated LUT completed; existing loader reader.cancel after done.';run.expectedNetwork.push({...failure})
   }
  }
  assert.deepEqual(run.pageErrors,[])
  assert.deepEqual(run.console.filter(e=>!e.expected&&!e.closing),[])
  assert.deepEqual(run.failures.filter(e=>!e.expected&&!e.closing),[])
  run.status='PASS';console.log(name,'PASS')
 }catch(error){
  run.status='FAIL';run.error=error.stack||String(error);try{run.final=await diagnostics();await page.screenshot({path:path.join(out,name+'-failure.png')})}catch{}
  console.error(name,'FAIL',String(error))
 }finally{
  for(const release of releases)release()
  closing=true;await context.close();await writeFile(path.join(out,'streaming.json'),JSON.stringify(receipt,null,2)+'\n')
 }
}

try{
 await run('overview-and-first-promotion',async h=>{
  await h.open();await h.ready();const before=await h.diagnostics();h.run.initial=before
  assert.equal(before.selected,null);assert.equal(before.detail.current,null);assert.equal(before.detail.pending,null)
  assert.equal(h.run.requests.filter(r=>detailRequest(r.url)).length,0)
  assert(!h.run.requests.some(r=>/\/solar-assets\/v2\/(jupiter|saturn|mercury|venus|uranus|neptune)-nasa\.glb/.test(r.url)))
  const start=performance.now();await h.choose('Jupiter')
  await h.wait(()=>{const d=window.orasSolarDiagnostics();return d.detail.current?.id==='jupiter'&&d.bodies.find(b=>b.id==='jupiter').textureSize?.[0]===4096})
  const promoted=await h.diagnostics();h.run.firstPromotionReadyMs=performance.now()-start;h.run.promoted=promoted
  assert.deepEqual(promoted.bodies.find(b=>b.id==='jupiter').textureSize,[4096,3072]);h.sameScience(before,promoted,false);h.bounded(promoted)
  await h.page.locator('.solar-framing>summary').click();await h.page.getByRole('button',{name:'System overview',exact:true}).click()
  await h.wait(()=>{const d=window.orasSolarDiagnostics();return !d.selected&&!d.detail.current&&!d.detail.pending&&!d.animating})
  const returned=await h.diagnostics();assert.deepEqual(returned.bodies.find(b=>b.id==='jupiter').textureSize,[1024,768]);assert(returned.detail.textureBytes<promoted.detail.textureBytes)
  h.run.checks.push('No high-resolution startup request; source atlas promoted on selection; same scientific state and renderer; overview releases detail.')
 })

 await run('atlas-waits-for-original-uv',async h=>{
  const model=await h.hold('/solar-assets/v2.2/jupiter-overview.glb')
  await h.open();await model.entered
  await h.wait(()=>window.orasSolarDiagnostics().texturesReady===8)
  await h.sourceReady()
  await h.choose('Jupiter');await h.wait(()=>window.orasSolarDiagnostics().detail.current?.id==='jupiter')
  const held=await h.diagnostics(),body=held.bodies.find(b=>b.id==='jupiter');h.run.held=held
  assert.equal(body.overviewReady,false);assert.equal(body.textureSize,null)
  model.release();await h.ready();await h.wait(()=>window.orasSolarDiagnostics().bodies.find(b=>b.id==='jupiter').textureSize?.[0]===4096)
  const after=await h.diagnostics();assert.equal(after.bodies.find(b=>b.id==='jupiter').overviewReady,true);h.sameScience(held,after)
  h.run.checks.push('Actual 4k atlas arrives before delayed model, stays off generic sphere, then appears only after source UV geometry is installed without camera/time change.')
 })

 await run('rapid-selection-cancellation',async h=>{
  const url='/solar-assets/v2.2/saturn-4096.jpg';h.expected.add(url)
  const source=await h.hold(url);await h.open();await h.ready();await h.choose('Saturn');await source.entered
  const held=await h.diagnostics();await h.choose('Mars')
  await h.wait(()=>window.orasSolarDiagnostics().detail.current?.id==='mars')
  const switched=await h.diagnostics();source.release()
  await h.wait(()=>{const d=window.orasSolarDiagnostics();return d.detail.retiring.length===0&&!d.detail.pending})
  const settled=await h.diagnostics();assert.equal(settled.detail.current.id,'mars');assert(settled.detail.cancelled>held.detail.cancelled)
  assert.deepEqual(settled.bodies.find(b=>b.id==='saturn').textureSize,[1024,768]);h.sameScience(switched,settled)
  h.run.checks.push('Held Saturn request aborts on real Mars selection; late release cannot republish Saturn; camera and source remain unchanged after selection.')
 })

 await run('detail-error-keeps-overview',async h=>{
  const url='/solar-assets/v2.2/mars-4096.jpg';h.expected.add(url)
  await h.page.route('**'+url,route=>route.fulfill({status:503,body:'Controlled Solar detail unavailable regression'}))
  await h.open();await h.ready();await h.choose('Mars')
  await h.wait(()=>window.orasSolarDiagnostics().detail.errors===1)
  const d=await h.diagnostics();assert.equal(d.selected,'mars');assert.equal(d.detail.current,null);assert.deepEqual(d.bodies.find(b=>b.id==='mars').textureSize,[1024,512]);assert.equal(Date.parse(d.epoch),Date.parse(epoch));assert.equal(await h.page.locator('.solar-canvas canvas').count(),1)
  await h.page.getByText('mars detail unavailable; keeping overview imagery. Positions and navigation remain available.',{exact:true}).waitFor()
  h.run.checks.push('Injected 503 is explicitly expected; source-backed overview and navigation remain visible with a truthful failure notice.')
 })

 await run('earth-quality-and-decode-retirement',async h=>{
  await h.page.addInitScript(()=>{
   const original=window.createImageBitmap.bind(window)
   window.__solar22DecodeGate={enabled:false,blocked:false,closed:false,release:null}
   window.createImageBitmap=async(...args)=>{
    const bitmap=await original(...args),options=args.at(-1),gate=window.__solar22DecodeGate
    if(gate.enabled&&options?.resizeWidth===8192){
     gate.blocked=true;const close=bitmap.close.bind(bitmap);bitmap.close=()=>{gate.closed=true;close()}
     await new Promise(resolve=>{gate.release=resolve})
    }
    return bitmap
   }
  })
  await h.open('earth');await h.ready();await h.wait(()=>window.orasSolarDiagnostics().detail.current?.maxSize===4096)
  const initial=await h.diagnostics();await h.quality('detailed');await h.wait(()=>window.orasSolarDiagnostics().detail.current?.maxSize===8192)
  const detailed=await h.diagnostics();h.sameScience(initial,detailed);assert.deepEqual(detailed.bodies.find(b=>b.id==='earth').textureSize,[8192,4096]);h.bounded(detailed);h.run.detailed=detailed
  await h.quality('efficient');await h.wait(()=>window.orasSolarDiagnostics().detail.current?.maxSize===2048)
  const efficient=await h.diagnostics();h.sameScience(detailed,efficient);assert.equal(efficient.detail.textureBudget,64*1024*1024)
  await h.page.evaluate(()=>{window.__solar22DecodeGate.enabled=true});await h.quality('detailed')
  await h.wait(()=>window.__solar22DecodeGate.blocked)
  const decoding=await h.diagnostics();await h.quality('efficient')
  const retiring=await h.diagnostics();h.run.decodeHeld={decoding,retiring};assert.equal(retiring.detail.retiring.length,1);assert(retiring.detail.textureBytes>=Math.ceil(8192*4096*16/3));assert.equal(retiring.detail.pending,null)
  await h.page.evaluate(()=>window.__solar22DecodeGate.release())
  await h.wait(()=>{const d=window.orasSolarDiagnostics();return d.detail.current?.maxSize===2048&&d.detail.retiring.length===0})
  const after=await h.diagnostics();h.sameScience(efficient,after);assert.equal(after.detail.textureBudget,64*1024*1024);assert.equal(await h.page.evaluate(()=>window.__solar22DecodeGate.closed),true)
  assert.deepEqual(after.earthOrientation,initial.earthOrientation)
  h.run.checks.push('Actual 8k and 2k promotion preserves camera/UTC/Earth frame; real decoded bitmap held at delivery remains budgeted across cancellation and closes before Efficient replacement admission.')
 })

 await run('eros-disposal-and-context-retry',async h=>{
  await h.open();await h.ready();const start=h.run.requests.length;await h.choose('433 Eros')
  await h.wait(()=>{const d=window.orasSolarDiagnostics();return d.selected==='eros'&&d.asteroids.available&&!d.animating})
  const before=await h.diagnostics();assert.equal(before.detail.target,null);assert.equal(before.detail.errors,0);assert(!h.run.requests.slice(start).some(r=>detailRequest(r.url)))
  await h.page.evaluate(()=>{window.__solar22DisposedDiagnostics=window.orasSolarDiagnostics;document.querySelector('.solar-canvas canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()})
  await h.page.locator('[data-solar-status=error]').waitFor()
  const disposed=await h.page.evaluate(()=>window.__solar22DisposedDiagnostics());h.run.disposed=disposed
  assert.equal(disposed.disposed,true);assert.equal(disposed.assets.resources,0);assert.equal(disposed.assets.textureBytes,0);assert.equal(disposed.detail.textureBytes,0);assert.equal(await h.page.locator('.solar-canvas canvas').count(),0)
  await h.page.getByRole('button',{name:'Retry Solar System',exact:true}).click();await h.ready()
  const recovered=await h.diagnostics();assert.notEqual(recovered.instanceId,before.instanceId);assert.equal(recovered.epoch,before.epoch);assert.equal(recovered.selected,'eros');assert.equal(await h.page.locator('.solar-canvas canvas').count(),1)
  assert.deepEqual(recovered.camera,before.camera);assert.deepEqual(recovered.target,before.target)
  h.run.checks.push('Eros uses its preserved original model without detail shader errors; actual context loss disposes old texture ownership; real Retry restores epoch/camera with exactly one new canvas.')
 })
 receipt.status=receipt.runs.every(run=>run.status==='PASS')?'PASS':'FAIL'
}finally{await browser.close();receipt.finished=new Date().toISOString();await writeFile(path.join(out,'streaming.json'),JSON.stringify(receipt,null,2)+'\n')}
if(receipt.status!=='PASS')process.exitCode=1
