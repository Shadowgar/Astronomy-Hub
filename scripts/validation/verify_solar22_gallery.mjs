import {chromium} from '../../node_modules/playwright/index.mjs'
import assert from 'node:assert/strict'
import {mkdir,readFile,writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'

assert.equal(process.platform,'win32','This receipt requires actual Windows Edge')
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..')
const base=process.argv[2]||'http://localhost:4231',out=path.join(root,'output/solar2.2/gallery')
const epoch='2026-10-27T04:00:00.000Z',gallery='/owner-review/solar-system-2.2/'
const galleryOnly=process.argv.includes('--gallery-only')
const travel=JSON.parse(await readFile(path.join(root,'output/playwright/solar-system-2.2/travel/travel.json'),'utf8'))
await mkdir(out,{recursive:true})
const receipt={base,epoch,started:new Date().toISOString(),platform:process.platform,galleryOnly,gallery:[],routes:[],frames:[],errors:[],consoleErrors:[],failedResponses:[]}
if(galleryOnly)receipt.priorEvidence={file:'receipt-before-gallery-wrap-fix.json',scope:'Five routes, NVIDIA identity, video frames passed before the gallery-only wrap correction. Initial overflow guard missed the Windows scrollbar; final guard uses actual clientWidth.'}
const browser=await chromium.launch({headless:false,executablePath:'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',chromiumSandbox:true,ignoreDefaultArgs:['--enable-unsafe-swiftshader']})
const monitor=page=>{
 page.on('pageerror',e=>receipt.errors.push({url:page.url(),message:e.message}))
 page.on('console',m=>{if(m.type()==='error')receipt.consoleErrors.push({url:page.url(),message:m.text()})})
 page.on('response',r=>{if(r.status()>=400)receipt.failedResponses.push({url:r.url(),status:r.status()})})
}
async function seek(video,time){
 return video.evaluate(async(v,t)=>{
  v.pause()
  const wanted=Math.min(t,Math.max(0,v.duration-.15))
  if(Math.abs(v.currentTime-wanted)>.001)await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('Video seek timeout')),15000)
   v.addEventListener('seeked',()=>{clearTimeout(timeout);resolve()},{once:true})
   v.addEventListener('error',()=>{clearTimeout(timeout);reject(Error('Video decode error'))},{once:true})
   v.currentTime=wanted
  })
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))
  return{requested:t,currentTime:v.currentTime,duration:v.duration,width:v.videoWidth,height:v.videoHeight,readyState:v.readyState,error:v.error?.message??null,decodedFrames:v.getVideoPlaybackQuality?.().totalVideoFrames}
 },time)
}
try{
 receipt.browser=browser.version()
 for(const[name,width,height]of[['desktop',1440,900],['portrait',390,844]]){
  const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();monitor(page)
  const response=await page.goto(base+gallery);assert.equal(response.status(),200)
  await page.locator('img').evaluateAll(images=>images.forEach(img=>img.loading='eager'))
  await page.waitForFunction(()=>document.images.length===40&&[...document.images].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:60000})
  await page.waitForFunction(()=>[...document.querySelectorAll('video')].length===3&&[...document.querySelectorAll('video')].every(v=>Number.isFinite(v.duration)&&v.videoWidth>0),null,{timeout:60000})
  const run=await page.evaluate(()=>({heading:document.querySelector('h1').textContent,source:document.querySelector('code').textContent,viewport:innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth),images:[...document.images].map(i=>({src:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight})),videos:[...document.querySelectorAll('video')].map(v=>({src:v.currentSrc,duration:v.duration,width:v.videoWidth,height:v.videoHeight}))}))
  Object.assign(run,{name,width,height,seeks:[]});receipt.gallery.push(run)
  assert.equal(run.source,'39f73b2ff0162d491fcf65b41a0bc038dd608b65');assert.ok(run.scrollWidth<=run.clientWidth,'Gallery horizontal overflow')
  await page.screenshot({path:path.join(out,name+'-gallery-top.png')})
  for(let i=0;i<3;i++){
   const video=page.locator('video').nth(i);await video.scrollIntoViewIfNeeded()
   for(const t of[1,Math.min(8,run.videos[i].duration/2)]){const frame=await seek(video,t);assert.ok(frame.readyState>=2&&frame.decodedFrames>0);assert.equal(frame.error,null);run.seeks.push({video:i,...frame})}
   await video.screenshot({path:path.join(out,name+'-gallery-video-'+i+'.png')})
  }
  run.status='PASS';console.log(name,'gallery 40 images / 3 videos / no overflow PASS');await context.close()
 }
 if(!galleryOnly){
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();monitor(page)
 for(const route of['/solar-system','/solar-system?solarBody=earth','/solar-system?solarBody=saturn','/planet-terrain/apollo17-nac-v1','/owner-review/solar-system-2.1.1/']){
  const url=base+route+(route.startsWith('/solar-system')?(route.includes('?')?'&':'?')+'date='+epoch:'')
  const response=await page.goto(url);assert.equal(response.status(),200)
  let details
  if(route.startsWith('/solar-system')){
   await page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d&&d.texturesReady>=9&&!d.animating&&!d.detail.pending&&d.earthOrientation.frame==='ITRS'},null,{timeout:90000})
   details=await page.evaluate(()=>{const d=window.orasSolarDiagnostics(),gl=document.querySelector('.solar-canvas canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return{gpu:gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER),selected:d.selected,epoch:d.epoch,frame:d.frame,renderCount:d.renderCount,texturesReady:d.texturesReady,detail:d.detail,pipeline:d.pipeline,notices:[...document.querySelectorAll('.solar-notice')].map(n=>n.textContent),scripts:[...document.scripts].map(s=>s.src).filter(Boolean)}})
   assert.match(details.gpu,/NVIDIA.*RTX 3060/i);assert.equal(Date.parse(details.epoch),Date.parse(epoch));assert.deepEqual(details.notices,[]);assert.equal(details.selected,route.includes('earth')?'earth':route.includes('saturn')?'saturn':null)
   if(!receipt.appBundle){const r=await page.request.get(details.scripts[0]),bytes=await r.body();receipt.appBundle={url:details.scripts[0],sha256:createHash('sha256').update(bytes).digest('hex'),httpStatus:r.status()}}
  }else if(route.startsWith('/planet-terrain')){
   await page.waitForFunction(()=>window.orasTerrainDiagnostics?.().stats.visible>0,null,{timeout:90000});details=await page.evaluate(()=>window.orasTerrainDiagnostics())
  }else{
   await page.locator('img').evaluateAll(images=>images.forEach(img=>img.loading='eager'))
   await page.waitForFunction(()=>document.images.length===22&&[...document.images].every(i=>i.complete&&i.naturalWidth>0),null,{timeout:60000})
   details=await page.evaluate(()=>({heading:document.querySelector('h1')?.textContent,images:[...document.images].map(i=>({src:i.currentSrc,width:i.naturalWidth,height:i.naturalHeight}))}))
  }
  const index=receipt.routes.length;await page.screenshot({path:path.join(out,'route-'+index+'.png')});receipt.routes.push({route,status:response.status(),details});console.log(route,'PASS')
 }
 const desktop=travel.runs.find(r=>r.name==='desktop')
 receipt.recordingSteps=desktop.steps.map(s=>({label:s.label,atBrowserSeconds:s.atBrowserMs/1000}))
 receipt.videoTimeLimit='Recorded page performance.now timestamps do not include any initial recorder offset; frames are labeled by actual media currentTime.'
 await page.goto(base+gallery+'video/desktop.webm');const video=page.locator('video')
 await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&Number.isFinite(v.duration)&&v.videoWidth>0},null,{timeout:30000})
 await video.evaluate(v=>{v.pause();v.style.width='100vw';v.style.height='100vh';v.style.margin='0';v.style.objectFit='contain';document.body.style.margin='0'})
 const returnTime=desktop.steps.find(s=>s.label==='return').atBrowserMs/1000
 const times=[4,5,6,8,9,10,11,12,16,17,18,returnTime,20,21,22,24]
 for(const t of times){const frame=await seek(video,t);assert.ok(frame.readyState>=2&&frame.decodedFrames>0);const file='desktop-travel-'+t.toFixed(3).replace('.','_')+'s.png';await page.screenshot({path:path.join(out,file)});receipt.frames.push({...frame,file})}
 await context.close();console.log('Five routes, prior gallery, decoded native video frames PASS')
 }
 assert.deepEqual(receipt.errors,[]);assert.deepEqual(receipt.consoleErrors,[]);assert.deepEqual(receipt.failedResponses,[])
 receipt.status='PASS'
}catch(e){receipt.status='FAIL';receipt.failure=e.stack||String(e);console.error(e);process.exitCode=1}
finally{await browser.close();receipt.finished=new Date().toISOString();await writeFile(path.join(out,'receipt.json'),JSON.stringify(receipt,null,2))}
