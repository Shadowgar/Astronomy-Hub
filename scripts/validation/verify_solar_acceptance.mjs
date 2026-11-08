import {chromium} from '../../node_modules/playwright/index.mjs'
import {mkdir,writeFile} from 'node:fs/promises'
const base=process.env.SOLAR_BASE||'http://127.0.0.1:4216',out=process.env.SOLAR_OUT||'output/cinematic-acceptance/solar',utc='2026-02-28T00:00:00Z'
await mkdir(out,{recursive:true})
const proof={status:'RUNNING',runs:[],failures:[],limitations:['Software Chromium rendering; no physical GPU/device or owner visual acceptance.']},browser=await chromium.launch()
try{
 for(const [width,height] of (process.env.SOLAR_SIZES||'1440x900,390x900,540x390,667x375,320x568').split(',').map(v=>v.split('x').map(Number))){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',hasTouch:true}),page=await context.newPage(),run={width,height,checks:[],errors:[],console:[],networkFailures:[],screens:[]};proof.runs.push(run)
  page.on('pageerror',e=>run.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')run.console.push({type:m.type(),text:m.text()})});page.on('requestfailed',r=>run.networkFailures.push({url:r.url(),failure:r.failure()}));page.on('response',r=>{if(r.status()>=400)run.networkFailures.push({url:r.url(),status:r.status()})});page.setDefaultTimeout(15000)
  const check=(ok,message,details)=>{run.checks.push({ok,message,details});if(!ok){proof.failures.push(`${width}x${height}: ${message}`);if(process.env.SOLAR_STOP_ON_FAILURE)throw Error(message)}}
  const clearsHud=(body,hud)=>{const[x,y]=body.screen,r=body.radius;return !hud.some(h=>x-r<h.right&&x+r>h.left&&y-r<h.bottom&&y+r>h.top)}
  const ready=async()=>{try{await page.waitForFunction(()=>{const d=window.orasSolarDiagnostics?.();return d?.texturesReady===2&&d.cloudsReady&&!d.animating});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))))}catch(error){run.readinessFailure=await page.evaluate(()=>({url:location.href,status:document.querySelector('[data-solar-status]')?.getAttribute('data-solar-status'),diagnostics:window.orasSolarDiagnostics?.(),canvases:[...document.querySelectorAll('canvas')].map(c=>({width:c.width,height:c.height,css:c.getBoundingClientRect().toJSON()})),frames:[...document.querySelectorAll('iframe')].map(f=>f.src),body:document.body.innerText,resources:performance.getEntriesByType('resource').map(r=>({name:r.name,duration:r.duration,bytes:r.transferSize}))}));await shot('readiness-failure');throw error}}
  const shot=async name=>{const file=`${width}x${height}-${name}.png`;await page.screenshot({path:out+'/'+file});run.screens.push(file)}
  const geometry=()=>page.evaluate(()=>{
   const d=window.orasSolarDiagnostics(),c=document.querySelector('canvas'),bounds=c.getBoundingClientRect(),distance=Math.hypot(...d.camera.map((v,i)=>v-d.target[i]))
   const box=e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom}}
   const hud=[...document.querySelectorAll('.solar-header,.solar-bodies,.solar-view-tools,.solar-context,.solar-camera,.solar-time-bar')].map(box)
   const bodies=d.bodies.map(b=>({...b,inFront:b.position.reduce((sum,v,i)=>sum+(v-d.camera[i])*(d.target[i]-d.camera[i]),0)>0,radius:b.screenRadius??bounds.height*b.glyphRadius*(b.id==='saturn'?2.27:1.03)/(2*Math.tan(21*Math.PI/180)*distance)}))
   const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top
   const labels=[...document.querySelectorAll('.solar-body-label:not([hidden])')].map(e=>({name:e.textContent,rect:box(e)}))
   return{d,bounds:box(c),hud,bodies,labels,labelHits:labels.filter(l=>hud.some(r=>overlap(l.rect,r))||bodies.some(b=>(b.visible??true)&&b.inFront&&overlap(l.rect,{left:b.screen[0]-b.radius,right:b.screen[0]+b.radius,top:b.screen[1]-b.radius,bottom:b.screen[1]+b.radius}))).map(l=>l.name)}
  })
  await page.goto(base+'/solar-system?date='+utc);await ready();await shot('inner')
  const timeText=await page.evaluate(()=>{const time=document.querySelector('.solar-time-bar time'),range=document.createRange();range.selectNodeContents(time);return{text:range.getBoundingClientRect().toJSON(),bar:document.querySelector('.solar-time-bar').getBoundingClientRect().toJSON()}})
  check(timeText.text.left>=timeText.bar.left&&timeText.text.right<=timeText.bar.right&&timeText.text.top>=timeText.bar.top&&timeText.text.bottom<=timeText.bar.bottom,'Date and UTC text remain inside time-bar glass',timeText)
  let g=await geometry();check(g.labelHits.length===0,'Inner labels clear HUD and body visual envelopes',g.labelHits);check(g.bodies.filter(b=>b.visible).every(b=>clearsHud(b,g.hud)),'Inner visible body envelopes clear HUD')
  await page.getByTitle('Full system overview',{exact:true}).click();await ready();await shot('full')
  g=await geometry();check(g.bodies.length===9&&g.bodies.every(b=>(b.visible??true)&&b.screen[0]-b.radius>=0&&b.screen[0]+b.radius<=width&&b.screen[1]-b.radius>=0&&b.screen[1]+b.radius<=height),'Full system keeps all nine visual envelopes inside canvas',g.bodies)
  check(g.bodies.every(b=>clearsHud(b,g.hud)),'Full system body envelopes clear HUD')
  const source=await(await page.request.get(base+'/api/v1/solar-system?epoch='+utc)).json()
  for(const name of ['Sun','Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune']){
   const button=page.getByRole('navigation',{name:'Select a celestial body'}).getByRole('button',{name,exact:true});await button.scrollIntoViewIfNeeded();await button.click();await ready()
   if(['Earth','Mars','Saturn'].includes(name))await shot(name.toLowerCase()+'-collapsed')
   for(const expanded of [false,true]){
    if(expanded){await page.getByRole('button',{name:'Expand body details'}).click();await ready()}
    g=await geometry();const body=g.bodies.find(b=>b.id===name.toLowerCase()),[x,y]=body.screen,r=body.radius
    const circle={left:x-r,right:x+r,top:y-r,bottom:y+r},hits=g.hud.filter(h=>circle.left<h.right&&circle.right>h.left&&circle.top<h.bottom&&circle.bottom>h.top)
    check(x-r>=0&&x+r<=width&&y-r>=0&&y+r<=height&&!hits.length,`${name} ${expanded?'expanded':'collapsed'} visual envelope clears canvas/HUD`,{circle,hits})
    check(g.labelHits.length===0,`${name} labels clear HUD and bodies`,g.labelHits)
    check(g.d.target.every((v,i)=>Math.abs(v-body.position[i])<1e-12)&&JSON.stringify(body.position)===JSON.stringify(source.bodies.find(b=>b.source_id===body.id).position_au),`${name} real source vectors and exact focus retained`)
    if(expanded){if(['Earth','Mars','Saturn'].includes(name))await shot(name.toLowerCase()+'-expanded');await page.getByRole('button',{name:'Collapse body details'}).click();await ready()}
   }
   await page.getByRole('button',{name:'Approach selected body'}).click();await ready();g=await geometry();const selected=g.bodies.find(b=>b.id===name.toLowerCase());check(selected.screen[0]-selected.radius>=0&&selected.screen[0]+selected.radius<=width&&selected.screen[1]-selected.radius>=0&&selected.screen[1]+selected.radius<=height&&clearsHud(selected,g.hud),`${name} approach visual envelope clears canvas and HUD`)
  }
  check(run.errors.length===0&&run.console.every(m=>m.type!=='error'),'No fatal browser or shader errors',{page:run.errors,console:run.console})
  run.graphics=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)})
  console.log(`${width}x${height}: ${run.checks.filter(c=>c.ok).length}/${run.checks.length}`)
  await context.close()
 }
 proof.status=proof.failures.length?'FAIL':'PASS';if(proof.failures.length)process.exitCode=1
}catch(error){proof.status=proof.failures.length?'FAIL':'ERROR';proof.error=error.stack;process.exitCode=1}finally{await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');console.log(proof.status,proof.failures)}
