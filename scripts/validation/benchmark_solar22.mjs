import {chromium} from '../../node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import path from 'node:path'
import os from 'node:os'

// Execute only after the coordinated browser/GPU owner releases the machine.
// No screenshots, recording, tracing, concurrent tests or other browser run.
const cases=[]
for(const body of ['earth','saturn','sun'])for(const quality of ['balanced','efficient','detailed'])for(const variant of ['baseline','candidate'])cases.push({variant,body,quality,layout:'desktop',width:1440,height:900})
for(const [layout,width,height] of [['portrait',390,844],['landscape',844,390]])for(const quality of ['balanced','efficient','detailed'])cases.push({variant:'candidate',body:'earth',quality,layout,width,height})
const instrumentShaderCalls=!process.argv.includes('--no-shader-calls')
if(process.argv.includes('--list')){console.log(JSON.stringify({caseCount:cases.length,warmupFrames:40,measuredFrames:200,instrumentShaderCalls,cases},null,2));process.exit(0)}
assert.equal(process.platform,'win32','Windows Node and headed Edge on the owner NVIDIA GPU are required')
const positional=process.argv.slice(2).filter(arg=>!['--shader-calls','--no-shader-calls'].includes(arg))
const baseline=positional[0]||'http://solar211.localhost:4231',candidate=positional[1]||'http://localhost:4231'
const output=positional[2]||'docs/validation/solar-system-2.2/performance.json'
const epoch='2026-10-27T04:00:00.000Z',warmupFrames=40,measuredFrames=200
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const receipt={schema:'oras.solar22-performance.v1',status:'RUNNING',started:new Date().toISOString(),baseline,candidate,epoch,warmupFrames,measuredFrames,
 environment:{platform:process.platform,osRelease:os.release(),cpu:os.cpus()[0]?.model,memoryBytes:os.totalmem(),headed:true},
 harnessSha256:hash(await readFile(new URL(import.meta.url))),
 method:{
  cases:'18 desktop cases: baseline/candidate Earth, Saturn and Sun in three qualities; six candidate Earth cases across portrait/landscape and three qualities.',
  input:'One Orbit camera right control activation per RAF:40 warm-up then200 measured frames. Real renderer/camera path; no synthetic science or frame-rate extrapolation from GPU time.',
  camera:'Paired desktop candidate restores its baseline initial camera/target/up through the existing r4SolarView contract. Mobile cases use native candidate framing.',
  startup:'Fresh context per case, HTTP cache disabled. Initial Balanced asset/detail readiness measured separately from requested-quality readiness.',
  samples:'GPU/CPU diagnostics retain180 rolling samples; independent measured RAF/input series has200. Warm-up40 latencies and >50ms counts are stutter/compilation proxies, not measured shader-program count or compiler time.',
  shaderCalls:{enabled:instrumentShaderCalls,scope:'Identical pre-navigation WebGL2 compileShader/linkProgram wrappers in both builds. Native-call counts and performance.now CPU wall times only; NOT asynchronous GPU compiler completion, program count or compile-success qualification. No status queries, additional shaders/programs or GPU blocking. Browser process is shared and driver shader caches are not forcibly cleared. Disable consistently with --no-shader-calls.',sampleLimitPerMethod:4096},
  memory:'Source texture reservations include base+detail GPU mip allowance, not render targets, driver overhead or total VRAM. Canvas allocations/counts are reported separately.',
  restrictions:'No screenshots/video/tracing/concurrent browser or tests during measurements. Portrait/landscape emulate desktop GPU; no physical-phone qualification.'
 },runs:[],bundleHashes:{}}
await mkdir(path.dirname(output),{recursive:true})
const save=()=>writeFile(output,JSON.stringify(receipt,null,2)+'\n')
const baselineViews=new Map()
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader'],args:['--no-first-run','--no-default-browser-check','--host-resolver-rules=MAP solar211.localhost 127.0.0.1']})
async function bounded(promise,milliseconds,label){
 let timer
 try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' exceeded '+milliseconds+'ms')),milliseconds)})])}
 finally{clearTimeout(timer)}
}
try{
 receipt.environment.browserVersion=browser.version()
 const session=await browser.newBrowserCDPSession(),system=await session.send('SystemInfo.getInfo')
 receipt.environment.gpuDevices=system.gpu.devices;receipt.environment.gpuFeatureStatus=system.gpu.featureStatus
 for(const item of cases){
  const base=item.variant==='baseline'?baseline:candidate,run={...item,base,status:'RUNNING',errors:[],networkFailures:[],warnings:[]}
  receipt.runs.push(run)
  const context=await browser.newContext({viewport:{width:item.width,height:item.height},deviceScaleFactor:1,hasTouch:item.layout!=='desktop',reducedMotion:'reduce'})
  const page=await context.newPage();page.setDefaultTimeout(15000)
  page.on('pageerror',error=>run.errors.push(error.message))
  page.on('console',message=>{if(message.type()==='error')run.errors.push(message.text());else if(message.type()==='warning')run.warnings.push(message.text())})
  page.on('response',response=>{if(response.status()>=400)run.networkFailures.push({url:response.url(),status:response.status()})})
  const key=item.body+':'+item.quality
  try{
   const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true})
   if(instrumentShaderCalls)await page.addInitScript(()=>{
    const sampleLimit=4096,methods={compileShader:{count:0,sumMs:0,thrown:0,samples:[]},linkProgram:{count:0,sumMs:0,thrown:0,samples:[]}}
    const telemetry={supported:typeof WebGL2RenderingContext!=='undefined',sampleLimit,
     mark:()=>Object.fromEntries(Object.entries(methods).map(([name,state])=>[name,{count:state.count,sumMs:state.sumMs,thrown:state.thrown}])),
     since:(mark={})=>({enabled:true,supported:telemetry.supported,nativeCallCpuWallTimeOnly:true,asyncGpuCompilerCompletionMeasured:false,
      methods:Object.fromEntries(Object.entries(methods).map(([name,state])=>{
       const before=mark[name]??{count:0,sumMs:0,thrown:0},samples=state.samples.filter(sample=>sample.index>before.count).map(sample=>sample.durationMs).sort((a,b)=>a-b)
       return[name,{calls:state.count-before.count,sumMs:state.sumMs-before.sumMs,thrown:state.thrown-before.thrown,sampledCalls:samples.length,p95Ms:samples.length?samples[Math.ceil(samples.length*.95)-1]:null,maxMs:samples.at(-1)??null,samplesTruncated:state.count-before.count>samples.length}]
      }))})}
    window.__solar22ShaderCalls=telemetry
    if(!telemetry.supported)return
    for(const name of Object.keys(methods)){
     const prototype=WebGL2RenderingContext.prototype,descriptor=Object.getOwnPropertyDescriptor(prototype,name)??{configurable:true,writable:true,enumerable:true},original=prototype[name],state=methods[name]
     Object.defineProperty(prototype,name,{...descriptor,value:function(...args){
      const start=performance.now();let thrown=true
      try{const result=Reflect.apply(original,this,args);thrown=false;return result}
      finally{const durationMs=performance.now()-start;state.count++;state.sumMs+=durationMs;if(thrown)state.thrown++;if(state.samples.length<sampleLimit)state.samples.push({index:state.count,durationMs})}
     }})
    }
   })
   const saved=item.variant==='candidate'&&item.layout==='desktop'?baselineViews.get(key):null
   if(item.variant==='candidate'&&item.layout==='desktop')assert(saved,'Paired baseline camera is unavailable')
   if(saved)await context.addInitScript(view=>{if(location.pathname==='/solar-system')history.replaceState({...history.state,usr:{...history.state?.usr,r4SolarView:view}},'')},saved)
   const start=performance.now()
   await page.goto(base+'/solar-system?solarBody='+item.body+'&date='+encodeURIComponent(epoch),{waitUntil:'domcontentloaded',timeout:45000})
   const ready=quality=>page.waitForFunction(({quality,candidate,body})=>{
    const d=window.orasSolarDiagnostics?.()
    return !!d&&document.querySelector('[data-solar-status=ready]')&&d.texturesReady>=9&&d.cloudsReady&&!d.animating&&d.quality===quality&&d.selected===body&&d.assets.requests===0&&
     d.earthOrientation.frame==='ITRS'&&d.asteroids.available&&d.bodies.some(b=>b.id==='eros'&&Array.isArray(b.position)&&b.position.every(Number.isFinite))&&
     d.atmosphere.lookupBytes===8527872&&Number.isFinite(d.atmosphere.loadMilliseconds)&&
     (!candidate||(!!d.detail&&!d.detail.pending&&!d.detail.retiring.length&&d.detail.errors===0&&(body==='sun'||d.detail.current?.id===body)))&&
     (body!=='earth'||(quality==='efficient'?!d.atmosphere.active:d.atmosphere.active))
   },{quality,candidate:item.variant==='candidate',body:item.body},{timeout:45000,polling:'raf'})
   await ready('balanced')
   const initial=await page.evaluate(()=>window.orasSolarDiagnostics())
   run.startup={automationNavigationToReadyMs:performance.now()-start,...await page.evaluate(()=>({navigationToReadyMs:performance.now(),shaderCalls:window.__solar22ShaderCalls?.since()??{enabled:false},navigation:performance.getEntriesByType('navigation').map(n=>({responseStart:n.responseStart,domContentLoaded:n.domContentLoadedEventEnd,load:n.loadEventEnd}))}))}
   if(item.variant==='baseline')baselineViews.set(key,{schema:'oras.solar-return.v1',epoch,camera:initial.camera,target:initial.target,cameraUp:initial.cameraUp,cameraView:'custom',closeView:initial.closeView,near:initial.near,preferences:{overview:initial.overviewScope,quality:'balanced',sizeMode:initial.sizeMode,orbits:initial.orbitsVisible,effects:initial.effectsVisible,belt:initial.belt.visible,beltDensity:initial.belt.requestedDensity,navigation:'orbit',asteroids:false,rate:86400}})
   if(saved){for(const field of ['camera','target','cameraUp'])for(let i=0;i<3;i++)assert(Math.abs(initial[field][i]-saved[field][i])<1e-12,'Matched '+field+' restoration');run.matchedView=saved}
   if(item.quality!=='balanced'){
    const switchStart=performance.now()
    await page.getByRole('button',{name:'Science, scale & sources',exact:true}).click()
    await page.getByLabel('Rendering quality',{exact:true}).selectOption(item.quality)
    await page.getByRole('button',{name:'Close panel',exact:true}).click()
    await ready(item.quality);run.qualitySwitchToReadyMs=performance.now()-switchStart
   }else run.qualitySwitchToReadyMs=0
   await page.bringToFront()
   run.measurement=await bounded(page.evaluate(async({warmupFrames,measuredFrames})=>{
    const diagnostic=()=>window.orasSolarDiagnostics(),button=document.querySelector('button[aria-label="Orbit camera right"]'),canvas=document.querySelector('.solar-canvas canvas')
    if(!button||button.disabled||!canvas)throw Error('Real camera orbit control/canvas unavailable')
    const gl=canvas.getContext('webgl2'),extension=gl.getExtension('WEBGL_debug_renderer_info'),renderer=gl.getParameter(extension?extension.UNMASKED_RENDERER_WEBGL:gl.RENDERER)
    if(!/NVIDIA.*RTX 3060/i.test(renderer)||/SwiftShader|llvmpipe|Microsoft Basic/i.test(renderer))throw Error('Unqualified GPU '+renderer)
    if(document.visibilityState!=='visible')throw Error('Background measurement')
    const next=()=>new Promise(resolve=>requestAnimationFrame(resolve)),stats=values=>{const sorted=[...values].sort((a,b)=>a-b);return{samples:sorted.length,median:sorted.length%2?sorted[Math.floor(sorted.length/2)]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2,p95:sorted[Math.ceil(sorted.length*.95)-1],min:sorted[0],max:sorted.at(-1)}}
    const summarize=d=>({epoch:d.epoch,selected:d.selected,camera:d.camera,target:d.target,cameraUp:d.cameraUp,renderCount:d.renderCount,quality:d.quality,closeView:d.closeView,overviewScope:d.overviewScope,sizeMode:d.sizeMode,drawCalls:d.drawCalls,geometries:d.geometries,textures:d.textures,pixelRatio:d.pixelRatio,texturesReady:d.texturesReady,cloudsReady:d.cloudsReady,effectsVisible:d.effectsVisible,orbitsVisible:d.orbitsVisible,renderCpuMs:d.renderCpuMs,gpuMs:d.gpuMs,assets:d.assets,detail:d.detail??null,pipeline:d.pipeline,atmosphere:d.atmosphere,bodies:d.bodies.map(b=>({id:b.id,position:b.position,screenRadius:b.screenRadius,textureSize:b.textureSize??null}))})
    const shaderTelemetry=window.__solar22ShaderCalls,shaderBeforeWarmup=shaderTelemetry?.since()??{enabled:false},shaderWarmupMark=shaderTelemetry?.mark()
    const initial=diagnostic(),warmIntervals=[],warmInputs=[];let previous=await next()
    for(let i=0;i<warmupFrames;i++){
     if(document.visibilityState!=='visible')throw Error('Page became hidden during warm-up')
     const start=performance.now();button.click();warmInputs.push(performance.now()-start)
     const now=await next();warmIntervals.push(now-previous);previous=now
    }
    const before=diagnostic(),shaderWarmup=shaderTelemetry?.since(shaderWarmupMark)??{enabled:false},shaderMeasuredMark=shaderTelemetry?.mark(),intervals=[],inputs=[];previous=await next()
    for(let i=0;i<measuredFrames;i++){
     if(document.visibilityState!=='visible')throw Error('Page became hidden during measurement')
     const start=performance.now();button.click();inputs.push(performance.now()-start)
     const now=await next();intervals.push(now-previous);previous=now
    }
    await next();await next();const after=diagnostic(),rect=canvas.getBoundingClientRect()
    return{initial:summarize(initial),before:summarize(before),after:summarize(after),
     warmup:{frames:warmupFrames,draws:before.renderCount-initial.renderCount,rafMs:stats(warmIntervals),inputCpuMs:stats(warmInputs),rafIntervalsMs:warmIntervals,framesOver50Ms:warmIntervals.filter(v=>v>50).length,inputOver50Ms:warmInputs.filter(v=>v>50).length,shaderCalls:shaderWarmup},
     shaderCalls:{beforeWarmup:shaderBeforeWarmup,measured:shaderTelemetry?.since(shaderMeasuredMark)??{enabled:false},total:shaderTelemetry?.since()??{enabled:false}},
     rafMs:stats(intervals),rafIntervalsMs:intervals,inputCpuMs:stats(inputs),measuredDraws:after.renderCount-before.renderCount,
     sourcePositionsUnchanged:JSON.stringify(before.bodies.map(b=>[b.id,b.position]))===JSON.stringify(after.bodies.map(b=>[b.id,b.position])),
     visibility:document.visibilityState,graphics:{renderer,webglVersion:gl.getParameter(gl.VERSION),timerQueryAvailable:!!gl.getExtension('EXT_disjoint_timer_query_webgl2')},
     canvas:{cssWidth:rect.width,cssHeight:rect.height,width:canvas.width,height:canvas.height,devicePixelRatio},
     resources:performance.getEntriesByType('resource').map(r=>({url:r.name,durationMs:r.duration,transferBytes:r.transferSize,encodedBytes:r.encodedBodySize,decodedBytes:r.decodedBodySize,initiator:r.initiatorType}))}
   },{warmupFrames,measuredFrames}),30000,'Warm-up and measured camera frames')
   const m=run.measurement
   assert.equal(m.rafMs.samples,measuredFrames);assert(m.measuredDraws>=measuredFrames,'Every frame must cause an actual camera draw')
   assert.notDeepEqual(m.before.camera,m.after.camera,'Camera moved');assert.deepEqual(m.before.target,m.after.target,'Orbit target preserved')
   assert.equal(m.sourcePositionsUnchanged,true);assert.equal(Date.parse(m.after.epoch),Date.parse(epoch));assert.equal(m.after.quality,item.quality)
   assert.equal(m.after.pipeline.toneMappingStages,1);assert(m.after.gpuMs.samples>0,'GPU timer samples required')
   if(instrumentShaderCalls){assert.equal(m.shaderCalls.total.supported,true);assert(m.shaderCalls.total.methods.compileShader.calls>0);assert(m.shaderCalls.total.methods.linkProgram.calls>0);for(const method of Object.values(m.shaderCalls.total.methods)){assert.equal(method.thrown,0);assert.equal(method.samplesTruncated,false,'Shader call timing sample cap reached')}}
   assert.equal(m.after.geometries,m.before.geometries);assert.equal(m.after.textures,m.before.textures)
   if(item.variant==='candidate'){assert.equal(m.after.pipeline.mode,'linear-hdr');assert.equal(m.after.detail.pending,null);assert.deepEqual(m.after.detail.retiring,[]);assert(m.after.detail.textureBytes<=m.after.detail.textureBudget)}
   assert.deepEqual(run.errors,[]);assert.deepEqual(run.networkFailures,[])
   for(const resource of m.resources.filter(r=>/\.js(?:\?|$)/.test(r.url))){
    if(receipt.bundleHashes[resource.url])continue
    // APIRequestContext does not share Edge's *.localhost resolver rules.
    // Preserve nginx's virtual-host identity while connecting to loopback.
    const original=new URL(resource.url),requestUrl=new URL(resource.url)
    if(original.hostname==='solar211.localhost')requestUrl.hostname='127.0.0.1'
    const response=await page.request.get(requestUrl.href,{headers:{Host:original.host}});assert(response.ok());const bytes=await response.body()
    receipt.bundleHashes[resource.url]={sha256:hash(bytes),bytes:bytes.length}
   }
   run.status='PASS';console.log(JSON.stringify({variant:item.variant,body:item.body,layout:item.layout,quality:item.quality,raf:m.rafMs,cpu:m.after.renderCpuMs,gpu:m.after.gpuMs,baseBytes:m.after.assets.textureBytes,detailBytes:m.after.detail?.current?.textureBytes??0,draws:m.after.drawCalls,textures:m.after.textures}))
  }catch(error){
   run.status='FAIL';run.error=error.stack||String(error)
   try{run.failureState=await bounded(page.evaluate(()=>({url:location.href,visibility:document.visibilityState,status:document.querySelector('[data-solar-status]')?.dataset.solarStatus,diagnostics:window.orasSolarDiagnostics?.()})),5000,'Failure diagnostics')}catch{}
   console.error(item.variant,item.body,item.layout,item.quality,run.error)
  }
  finally{await context.close();await save()}
  // Preserve partial evidence and stop on the first failed mandatory condition.
  if(run.status==='FAIL')break
 }
 receipt.status=receipt.runs.length===cases.length&&receipt.runs.every(r=>r.status==='PASS')?'MEASURED':'FAIL'
}catch(error){receipt.status='FAIL';receipt.error=error.stack||String(error)}
finally{await browser.close();receipt.finished=new Date().toISOString();await save()}
if(receipt.status!=='MEASURED')process.exitCode=1
