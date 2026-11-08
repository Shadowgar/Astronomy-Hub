// Actual Windows/RTX cold-entry attribution. Instrumented traces are diagnostic,
// never substituted for the plain uninstrumented timing runs.
import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import path from 'node:path'
import assert from 'node:assert/strict'

assert.equal(process.platform,'win32','Requires the owner Windows Edge hardware path')
const out=process.argv[2],base=process.argv[3]||'http://localhost:4231',mode=process.argv[4]||'plain',mission=process.argv[5]||'voyager1'
assert.ok(out,'Usage: node profile_solar26_cold.mjs OUTPUT [BASE] [plain|trace] [MISSION]')
assert.ok(['plain','trace'].includes(mode))
await mkdir(out,{recursive:true})
const result={status:'RUNNING',mode,mission,base,startedUtc:new Date().toISOString(),errors:[],consoleErrors:[],notes:['Fresh browser process and context. Driver and backend caches are not forcibly flushed.','Trace mode instruments WebGL calls and V8 sampling; its timings are attribution evidence, not the plain timing benchmark.']}
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage(),cdp=await context.newCDPSession(page)
let tracing=false,profiling=false
page.on('pageerror',error=>result.errors.push(error.message))
page.on('console',message=>{if(message.type()==='error')result.consoleErrors.push(message.text())})
await page.addInitScript(({instrument})=>{
 const r=window.__coldEvidence={frames:[],tasks:[],animationTasks:[],calls:[],milestones:[],callTotals:{},programs:[]}
 let previous=0
 const frame=now=>{if(previous&&r.frames.length<2400)r.frames.push({start:previous,duration:now-previous});previous=now;requestAnimationFrame(frame)}
 requestAnimationFrame(frame)
 new PerformanceObserver(list=>{for(const entry of list.getEntries())r.tasks.push({start:entry.startTime,duration:entry.duration,name:entry.name})}).observe({type:'longtask',buffered:true})
 if(PerformanceObserver.supportedEntryTypes.includes('long-animation-frame'))new PerformanceObserver(list=>{for(const e of list.getEntries())r.animationTasks.push({start:e.startTime,duration:e.duration,blockingDuration:e.blockingDuration,renderStart:e.renderStart,styleAndLayoutStart:e.styleAndLayoutStart,scripts:e.scripts.map(s=>({duration:s.duration,executionStart:s.executionStart,invoker:s.invoker,invokerType:s.invokerType,sourceURL:s.sourceURL,sourceFunctionName:s.sourceFunctionName,sourceCharPosition:s.sourceCharPosition,forcedStyleAndLayoutDuration:s.forcedStyleAndLayoutDuration}))})}).observe({type:'long-animation-frame',buffered:true})
 if(!instrument)return
 const shaders=new WeakMap(),programs=new WeakMap();let nextProgram=1
 const program=object=>{if(!programs.has(object)){const p={id:nextProgram++,shaders:[],polls:[]};programs.set(object,p);r.programs.push(p)}return programs.get(object)}
 const wrap=(owner,name)=>{
  const original=owner[name]
  if(typeof original!=='function')return
  owner[name]=function(...args){const started=performance.now();if(name==='shaderSource')shaders.set(args[0],args[1].split('\n').filter(line=>line.startsWith('#define ')).slice(0,100));if(name==='attachShader')program(args[0]).shaders.push(shaders.get(args[1]));if(name==='linkProgram')program(args[0]).linkedAt=started;if(name==='getProgramInfoLog')program(args[0]).firstUseAt??=started;try{const value=Reflect.apply(original,this,args);if(name==='getProgramParameter'&&args[1]===37297)program(args[0]).polls.push({time:started,ready:value});return value}finally{const duration=performance.now()-started;r.callTotals[name]??={count:0,milliseconds:0,maximum:0};const sum=r.callTotals[name];sum.count++;sum.milliseconds+=duration;sum.maximum=Math.max(sum.maximum,duration);if(duration>=1&&r.calls.length<2000)r.calls.push({name,start:started,duration,parameter:name==='getProgramParameter'?args[1]:name==='getExtension'?args[0]:undefined,program:name==='getProgramInfoLog'?program(args[0]).id:undefined,context:name==='getContext'?args[0]:undefined})}}
 }
 wrap(HTMLCanvasElement.prototype,'getContext')
 for(const proto of [WebGLRenderingContext.prototype,WebGL2RenderingContext.prototype])for(const name of ['shaderSource','attachShader','getExtension','compileShader','linkProgram','getProgramParameter','getProgramInfoLog','getShaderInfoLog','getUniformLocation','getActiveUniform','getAttribLocation','getActiveAttrib','texImage2D','texSubImage2D','texStorage2D','generateMipmap','bufferData','bufferSubData','drawElements','drawArrays','finish','readPixels'])wrap(proto,name)
},{instrument:mode==='trace'})

try{
 if(mode==='trace'){
  await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});await cdp.send('Profiler.start');profiling=true
  await cdp.send('Tracing.start',{categories:'devtools.timeline,v8,blink.user_timing,disabled-by-default-devtools.timeline',transferMode:'ReturnAsStream'});tracing=true
 }
 const started=performance.now()
 await page.goto(`${base}/missions/${mission}`,{waitUntil:'domcontentloaded'})
 await page.locator('.mission-shell').waitFor()
 await page.evaluate(()=>window.__coldEvidence.milestones.push({name:'shell-observed',time:performance.now()}))
 await page.locator('[data-mission-status="ready"]').waitFor({timeout:90000})
 await page.waitForFunction(()=>{const d=window.orasMissionDiagnostics?.();return d&&d.renderCount>0&&!d.assets.requests&&!d.animating})
 result.readyMilliseconds=performance.now()-started
 await page.evaluate(()=>window.__coldEvidence.milestones.push({name:'ready-observed',time:performance.now()}))
 result.readyDiagnostics=await page.evaluate(()=>window.orasMissionDiagnostics())
 await page.getByRole('button',{name:'Inspect craft',exact:true}).click()
 await page.waitForFunction(()=>{const d=window.orasMissionDiagnostics?.();return d?.view==='inspection'&&!d.animating&&d.craft.visible})
 result.inspectionMilliseconds=performance.now()-started
 await page.evaluate(()=>window.__coldEvidence.milestones.push({name:'inspection-observed',time:performance.now()}))
 for(let n=0;n<12;n++)await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)))
 result.gpu=await page.evaluate(()=>{const gl=document.querySelector('.mission-canvas canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)})
 assert.match(result.gpu,/NVIDIA.*RTX 3060/i)
 result.cold=await page.evaluate(()=>({...window.__coldEvidence,diagnostics:window.orasMissionDiagnostics(),resources:performance.getEntriesByType('resource').map(e=>({name:e.name,start:e.startTime,duration:e.duration,transferSize:e.transferSize,decodedBodySize:e.decodedBodySize})),navigation:performance.getEntriesByType('navigation').map(e=>e.toJSON())}))
 await page.screenshot({path:path.join(out,'actual-inspection.png')})
 result.servedScripts=[]
 for(const url of await page.locator('script[src]').evaluateAll(elements=>elements.map(e=>e.src))){const r=await context.request.get(url);result.servedScripts.push({url,status:r.status(),sha256:createHash('sha256').update(await r.body()).digest('hex')})}
 assert.equal(result.cold.diagnostics.shaderFailures,0)
 assert.equal(result.cold.diagnostics.craft.modelReady,true)
 assert.equal(result.cold.diagnostics.craft.selfShadow,true)
 assert.deepEqual(result.errors,[])
 result.status='PASS'
}catch(error){result.status='FAIL';result.failure=String(error);console.error(error)}finally{
 if(profiling){const p=await cdp.send('Profiler.stop');await writeFile(path.join(out,'cpu-profile.json'),JSON.stringify(p.profile));const weights=new Map();for(let n=0;n<(p.profile.samples?.length||0);n++)weights.set(p.profile.samples[n],(weights.get(p.profile.samples[n])||0)+(p.profile.timeDeltas[n]||0));result.cpuTop=p.profile.nodes.map(n=>({...n.callFrame,selfMilliseconds:(weights.get(n.id)||0)/1000})).sort((a,b)=>b.selfMilliseconds-a.selfMilliseconds).slice(0,35)}
 if(tracing){const completed=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');const {stream}=await completed;let trace='';while(true){const part=await cdp.send('IO.read',{handle:stream});trace+=part.data;if(trace.length>64*1024*1024)throw Error('Diagnostic trace exceeds64MiB bound');if(part.eof)break}await cdp.send('IO.close',{handle:stream});await writeFile(path.join(out,'trace.json'),trace);const parsed=JSON.parse(trace);result.traceLongEvents=parsed.traceEvents.filter(e=>e.ph==='X'&&e.dur>=10000).map(e=>({name:e.name,category:e.cat,milliseconds:e.dur/1000,ts:e.ts,pid:e.pid,tid:e.tid,args:e.args})).sort((a,b)=>b.milliseconds-a.milliseconds).slice(0,100)}
 result.finishedUtc=new Date().toISOString();await browser.close();await writeFile(path.join(out,'cold.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({status:result.status,mode,readyMilliseconds:result.readyMilliseconds,frameMaximum:Math.max(...(result.cold?.frames.map(e=>e.duration)||[0])),longTasks:result.cold?.tasks,calls:result.cold?.calls?.sort((a,b)=>b.duration-a.duration).slice(0,12)}));if(result.status!=='PASS')process.exitCode=1
}
