import {chromium} from '../../node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import {mkdir, writeFile, readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import os from 'node:os'
import path from 'node:path'

// Controlled owner-host evidence only. No screenshots/video or second browser
// run during the measured interval. No mock responses or application edits.
assert.equal(process.platform, 'win32', 'Run with Windows Node and headed Edge on the qualified owner GPU')
const baseline = process.argv[2] || 'http://localhost:4231'
const candidate = process.argv[3] || 'http://solar2.localhost:4231'
const output = process.argv[4] || 'docs/validation/solar-system-2/performance.json'
const epoch = '2026-10-27T04:00:00.000Z', warmupFrames = 40, measuredFrames = 200
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const cases = []
for (const [layout, width, height] of [['desktop',1440,900], ['portrait',390,844], ['landscape',844,390]]) {
  for (const variant of ['baseline','candidate']) cases.push({variant,layout,width,height,quality:'balanced'})
}
for (const quality of ['efficient','detailed']) cases.push({variant:'candidate',layout:'desktop',width:1440,height:900,quality})
const receipt = {
  schema:'oras.solar2-performance.v1', status:'RUNNING', capturedAt:new Date().toISOString(),
  baseline,candidate,epoch,warmupFrames,measuredFrames,
  environment:{platform:process.platform,osRelease:os.release(),cpu:os.cpus()[0]?.model,memoryBytes:os.totalmem(),headed:true},
  harnessSha256:hash(await readFile(new URL(import.meta.url))),
  method:{
    scene:'Initial inner-system overview, cinematic size, paused scientific time, effects and orbit paths on, asteroid layers off',
    input:'One real Orbit camera right button activation per requestAnimationFrame; 40 warm-up then 200 measured intervals',
    startup:'Fresh browser context, CDP HTTP cache disabled. Navigation to ready status plus complete initial imagery and clouds; initial balanced profile for every case. Alternate quality is then selected through real UI before warm-up.',
    cpuGpu:'Existing renderer diagnostics use rolling last 180 draw/query samples; independent RAF interval uses exactly 200 moving frames. These clocks measure different work.',
    dpr:'Identical deviceScaleFactor=1 for both builds and all viewports; phone-size desktop browser, not physical mobile.',
    restrictions:'No FPS claim from inverse GPU/CPU duration; no idle RAF measurement; no hardware VRAM total inferred from tracked texture budget.'
  }, runs:[],bundleHashes:{}
}
await mkdir(path.dirname(output),{recursive:true})
const save = () => writeFile(output,JSON.stringify(receipt,null,2)+'\n')
const browser = await chromium.launch({
  headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader'],
  args:['--no-first-run','--no-default-browser-check']
})
try {
  receipt.environment.browserVersion = browser.version()
  const browserSession = await browser.newBrowserCDPSession()
  const systemInfo = await browserSession.send('SystemInfo.getInfo')
  receipt.environment.gpuDevices = systemInfo.gpu.devices
  receipt.environment.gpuFeatureStatus = systemInfo.gpu.featureStatus
  for (const item of cases) {
    const base=item.variant==='candidate'?candidate:baseline
    const run={...item,base,status:'RUNNING',errors:[],networkFailures:[],consoleWarnings:[]}
    receipt.runs.push(run)
    const context=await browser.newContext({viewport:{width:item.width,height:item.height},deviceScaleFactor:1,hasTouch:item.layout!=='desktop',reducedMotion:'reduce'})
    const page=await context.newPage()
    page.setDefaultTimeout(30000)
    const cdp=await context.newCDPSession(page)
    await cdp.send('Network.enable')
    await cdp.send('Network.setCacheDisabled',{cacheDisabled:true})
    page.on('pageerror',error=>run.errors.push(error.message))
    page.on('console',message=>{
      if(message.type()==='error')run.errors.push(message.text())
      else if(message.type()==='warning')run.consoleWarnings.push(message.text())
    })
    page.on('response',response=>{if(response.status()>=400)run.networkFailures.push({status:response.status(),url:response.url()})})
    try {
      const wallStart=performance.now()
      await page.goto(base+'/solar-system?date='+encodeURIComponent(epoch),{waitUntil:'domcontentloaded'})
      await page.waitForFunction(expected=>{
        const d=window.orasSolarDiagnostics?.()
        return document.querySelector('[data-solar-status=ready]')&&d?.texturesReady===expected&&d.cloudsReady&&!d.animating&&(!d.assets||d.assets.requests===0)
      },item.variant==='candidate'?9:2,{timeout:120000,polling:'raf'})
      run.startup=await page.evaluate(()=>({navigationToAssetsReadyMs:performance.now(),initialProfile:window.orasSolarDiagnostics().quality,navigation:performance.getEntriesByType('navigation').map(n=>({responseStart:n.responseStart,domContentLoaded:n.domContentLoadedEventEnd,load:n.loadEventEnd}))}))
      run.startup.automationWallToAssetsReadyMs=performance.now()-wallStart
      if(item.quality!=='balanced'){
        const changeStart=performance.now()
        await page.getByRole('button',{name:'Science, scale & sources',exact:true}).click()
        await page.getByLabel('Rendering quality',{exact:true}).selectOption(item.quality)
        await page.getByRole('button',{name:'Close panel',exact:true}).click()
        run.qualitySwitchAutomationMs=performance.now()-changeStart
      }
      await page.bringToFront()
      run.measurement=await page.evaluate(async ({warmupFrames,measuredFrames})=>{
        const diagnostic=()=>window.orasSolarDiagnostics()
        const button=document.querySelector('button[aria-label="Orbit camera right"]')
        if(!button||button.disabled)throw Error('Real camera orbit control unavailable')
        const canvas=document.querySelector('.solar-canvas canvas'),gl=canvas.getContext('webgl2'),extension=gl.getExtension('WEBGL_debug_renderer_info')
        const renderer=gl.getParameter(extension?extension.UNMASKED_RENDERER_WEBGL:gl.RENDERER)
        if(!/NVIDIA.*RTX 3060/i.test(renderer)||/SwiftShader|llvmpipe|Microsoft Basic/i.test(renderer))throw Error('Expected hardware NVIDIA RTX3060, observed '+renderer)
        if(document.visibilityState!=='visible')throw Error('Page must be foreground visible')
        const nextFrame=()=>new Promise(resolve=>requestAnimationFrame(resolve))
        const stats=values=>{const v=[...values].sort((a,b)=>a-b);return{samples:v.length,median:v.length%2?v[Math.floor(v.length/2)]:(v[v.length/2-1]+v[v.length/2])/2,p95:v[Math.ceil(v.length*.95)-1],min:v[0],max:v.at(-1)}}
        const initial=diagnostic()
        for(let i=0;i<warmupFrames;i++){button.click();await nextFrame()}
        const before=diagnostic(),intervals=[],inputCpu=[]
        // Establish the first timestamp after diagnostic allocations, then keep
        // the measured loop free of diagnostics, CDP calls and frame captures.
        let previous=await nextFrame()
        for(let i=0;i<measuredFrames;i++){
          const start=performance.now();button.click();inputCpu.push(performance.now()-start)
          const now=await nextFrame();intervals.push(now-previous);previous=now
        }
        // Permit the final queued draw and asynchronous GPU queries to retire.
        await nextFrame();await nextFrame()
        const after=diagnostic(),rect=canvas.getBoundingClientRect()
        const summarize=d=>({epoch:d.epoch,selected:d.selected,camera:d.camera,target:d.target,renderCount:d.renderCount,quality:d.quality,overviewScope:d.overviewScope,sizeMode:d.sizeMode,drawCalls:d.drawCalls,geometries:d.geometries,textures:d.textures,texturesReady:d.texturesReady,cloudsReady:d.cloudsReady,pixelRatio:d.pixelRatio,starCount:d.starCount,orbitsVisible:d.orbitsVisible,effectsVisible:d.effectsVisible,belt:d.belt,asteroids:d.asteroids?{visible:d.asteroids.visible,count:d.asteroids.count}:undefined,renderCpuMs:d.renderCpuMs,gpuMs:d.gpuMs,assets:d.assets,pipeline:d.pipeline})
        return{
          initial:summarize(initial),before:summarize(before),after:summarize(after),
          rafIntervalMs:stats(intervals),rafIntervalsMs:intervals,inputHandlerCpuMs:stats(inputCpu),
          measuredDraws:after.renderCount-before.renderCount,
          sourcePositionsUnchanged:JSON.stringify(before.bodies.map(b=>[b.id,b.position]))===JSON.stringify(after.bodies.map(b=>[b.id,b.position])),
          canvas:{cssWidth:rect.width,cssHeight:rect.height,bufferWidth:canvas.width,bufferHeight:canvas.height,devicePixelRatio},
          graphics:{renderer,webglVersion:gl.getParameter(gl.VERSION),timerQueryAvailable:!!gl.getExtension('EXT_disjoint_timer_query_webgl2')},
          visibility:document.visibilityState,
          resources:performance.getEntriesByType('resource').map(r=>({url:r.name,durationMs:r.duration,transferBytes:r.transferSize,encodedBytes:r.encodedBodySize,decodedBytes:r.decodedBodySize,initiator:r.initiatorType})),
          scripts:Array.from(document.querySelectorAll('script[src]')).map(s=>s.src)
        }
      },{warmupFrames,measuredFrames})
      const m=run.measurement
      assert.equal(m.rafIntervalMs.samples,measuredFrames)
      assert.ok(m.measuredDraws>=measuredFrames,'Every measured interval must cause an actual camera draw')
      assert.notDeepEqual(m.before.camera,m.after.camera,'Camera really moved')
      assert.deepEqual(m.before.target,m.after.target,'Orbit target preserved')
      assert.equal(Date.parse(m.after.epoch),Date.parse(epoch),'Scientific time paused at requested epoch')
      assert.equal(m.sourcePositionsUnchanged,true)
      assert.equal(m.after.quality,item.quality)
      assert.equal(m.after.geometries,m.before.geometries,'No geometry growth during motion')
      assert.equal(m.after.textures,m.before.textures,'No texture growth during motion')
      assert.deepEqual(run.errors,[])
      assert.deepEqual(run.networkFailures,[])
      for(const url of m.scripts){
        if(!receipt.bundleHashes[url]){
          const response=await page.request.get(url)
          assert.equal(response.ok(),true)
          const bytes=await response.body()
          receipt.bundleHashes[url]={sha256:hash(bytes),bytes:bytes.length}
        }
      }
      run.status='PASS'
      console.log(JSON.stringify({variant:item.variant,layout:item.layout,quality:item.quality,startupMs:Math.round(run.startup.navigationToAssetsReadyMs),raf:m.rafIntervalMs,cpu:m.after.renderCpuMs,gpu:m.after.gpuMs,draws:m.measuredDraws,textures:m.after.textures}))
    }catch(error){
      run.status='FAIL';run.error=error.stack||String(error)
      try{run.failureState=await page.evaluate(()=>({url:location.href,status:document.querySelector('[data-solar-status]')?.dataset.solarStatus,diagnostics:window.orasSolarDiagnostics?.(),visibleText:document.body.innerText.slice(0,2000)}))}catch{}
      console.error(item.variant,item.layout,item.quality,run.error)
    }
    finally{await context.close();await save()}
  }
  receipt.status=receipt.runs.every(r=>r.status==='PASS')?'MEASURED':'FAIL'
}catch(error){receipt.status='FAIL';receipt.error=error.stack||String(error)}
finally{await browser.close();await save()}
if(receipt.status!=='MEASURED')process.exitCode=1
