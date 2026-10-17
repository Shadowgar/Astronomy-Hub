// Sample the real Docker application; all navigation input uses Chromium's input pipeline.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const {chromium}=await import('../../node_modules/playwright/index.mjs');
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4202',out=process.env.N1_EVIDENCE_DIR||'output/n1/smooth-camera/before',qualify=process.env.N1_MOTION_QUALIFY==='1';
await mkdir(out,{recursive:true});
const hash=b=>createHash('sha256').update(b).digest('hex');
const proof={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),cameraSourceSha256:hash(await readFile('runtimes/earth-runtime/core/CameraController.mjs')),base,started:new Date().toISOString(),status:'RUNNING',runs:[],pageErrors:[],consoleErrors:[],limitations:['Headless Chromium with software rendering; representative browser mouse/trackpad input, not physical-device or owner acceptance.','rAF diagnostics include center picking/serialization overhead; frame intervals describe this instrumented browser only.']};
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir:out,size:{width:1280,height:800}}}),page=await context.newPage(),cdp=await context.newCDPSession(page);
const frame=()=>page.frames().find(f=>f.url().includes('/earth-runtime/'));
page.on('pageerror',e=>proof.pageErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')proof.consoleErrors.push(m.text())});page.setDefaultTimeout(30000);
const ready=async()=>{await page.locator('[data-runtime-mode=earth][data-runtime-status=ready]').waitFor({timeout:90000});await page.locator('.ws-handoff').waitFor({state:'hidden'});};
const state=()=>frame().evaluate(()=>window.orasEarthDiagnostics());
const explore=async()=>{if(await page.locator('.ws-reveal').isVisible())await page.locator('.ws-reveal').click();await page.getByRole('button',{name:'Explore',exact:true}).press('Enter');};
const location=async()=>{await explore();await page.getByLabel('Latitude',{exact:true}).fill('40.7829');await page.getByLabel('Longitude',{exact:true}).fill('-73.9654');await page.getByRole('button',{name:'Explore location',exact:true}).click();await page.locator('dialog').waitFor({state:'hidden'});await page.waitForTimeout(1300);assert.ok(Math.abs((await state()).cameraHeightM-40000)<1)};
const point=async()=>{const b=await frame().locator('canvas').first().boundingBox(),p={x:b.x+b.width/2,y:b.y+b.height/2};await page.mouse.move(p.x,p.y);return p;};
const burst=async(deltas,interval,modifiers=0)=>{const p=await point(),epoch=Date.now()/1000;await Promise.all(deltas.map((deltaY,i)=>new Promise(r=>setTimeout(r,i*interval)).then(()=>cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',...p,modifiers,deltaX:0,deltaY,timestamp:epoch+i*interval/1000}))));};
const sample=async(name,input)=>{
 await point();
 await frame().evaluate(()=>{window.__motion={samples:[],packets:[],start:performance.now(),stop:false};const m=window.__motion;
  const read=()=>{const s=window.orasEarthDiagnostics();return {heightM:s.cameraHeightM,camera:s.navigation?.camera,observer:s.navigation?.observer,motion:s.cameraMotion}};
  const canvas=document.querySelector('canvas');const wheel=e=>m.packets.push({at:performance.now()-m.start,deltaY:e.deltaY,deltaMode:e.deltaMode,...read()});canvas.addEventListener('wheel',wheel,{passive:true});
  const tick=t=>{if(m.stop){canvas.removeEventListener('wheel',wheel);return}m.samples.push({at:performance.now()-m.start,frameTime:t,...read()});requestAnimationFrame(tick)};tick(performance.now());
 });
 await input();await page.waitForTimeout(1700);
 const row=await frame().evaluate(()=>{window.__motion.stop=true;return window.__motion});row.name=name;
 const s=row.samples;row.changes=s.slice(1).filter((v,i)=>Math.abs(v.heightM-s[i].heightM)>1e-5).length;
 row.frameTimesMs=s.slice(1).map((v,i)=>v.frameTime-s[i].frameTime);
 row.velocitiesMps=s.slice(1).map((v,i)=>(v.heightM-s[i].heightM)/((v.at-s[i].at)/1000));
 const times=[...row.frameTimesMs].sort((a,b)=>a-b);row.frameDistributionMs={count:times.length,p50:times[Math.floor(times.length*.5)],p95:times[Math.floor(times.length*.95)],max:times.at(-1)};
 proof.runs.push(row);console.log(name,JSON.stringify({packets:row.packets.length,intermediateChanges:row.changes,first:s[0]?.heightM,last:s.at(-1)?.heightM,frames:row.frameDistributionMs}));
 return row;
};
try{
 await page.goto(base+'/earth?date=2026-10-14T02%3A10%3A00.000Z');await ready();await location();
 const gl=await frame().evaluate(()=>{const c=document.querySelector('canvas'),g=c.getContext('webgl2')||c.getContext('webgl'),e=g.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,renderer:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):null}});proof.browser=gl;
 if(process.env.N1_MOTION_EDGES==='1'){
  const p=await point();await page.mouse.down({button:'middle'});for(let i=1;i<=10;i++){await page.mouse.move(p.x,p.y-i*15);await page.waitForTimeout(50);}await page.mouse.up({button:'middle'});await page.waitForTimeout(600);
  const before=await state();proof.obliqueSetup=before.navigation;assert.ok(Math.abs(before.navigation.camera.pitchRad+Math.PI/2)>.01,'actual native tilt required');
  const oblique=await sample('oblique target stability',()=>page.mouse.wheel(0,-120));
  const direction=c=>{const {latitudeRad:a,longitudeRad:b,headingRad:h,pitchRad:p}=c,e=[-Math.sin(b),Math.cos(b),0],n=[-Math.sin(a)*Math.cos(b),-Math.sin(a)*Math.sin(b),Math.cos(a)],u=[Math.cos(a)*Math.cos(b),Math.cos(a)*Math.sin(b),Math.sin(a)];return n.map((v,i)=>v*Math.cos(p)*Math.cos(h)+e[i]*Math.cos(p)*Math.sin(h)+u[i]*Math.sin(p))};const fixed=direction(before.navigation.camera);
  for(const s of oblique.samples){assert.ok(Math.abs(s.observer.lat-before.navigation.observer.lat)<1e-6);assert.ok(Math.abs(s.observer.lon-before.navigation.observer.lon)<1e-6);assert.ok(Math.hypot(...direction(s.camera).map((v,i)=>v-fixed[i]))<1e-5,'world orientation stays within ten microradians')}
  await page.screenshot({path:out+'/oblique.png'});
  // Bounded test setup through the real history/view-restore contract. The
  // application/renderer performs its normal setNavigationView; no camera result
  // or astronomy data is replaced. All measured movement is real browser input.
  const seed=async heightM=>{const nav=(await state()).navigation;nav.camera={...nav.camera,heightM,pitchRad:-Math.PI/2,rollRad:0};await page.evaluate(nav=>history.replaceState({...history.state,usr:{...history.state?.usr,n1View:nav,n1Center:false}},''),nav);await page.reload();await ready();assert.ok(Math.abs((await state()).cameraHeightM-heightM)<.01)};
  proof.boundsSetup='Real application history/view-restore contract seeds 120 m and 29,500,000 m. Measured zoom uses Chromium input; no engine responses mocked.';
  await seed(120);const near=await sample('near minimum altitude',()=>burst(Array(12).fill(-120),70,2));assert.ok(near.samples.every(s=>s.heightM>=100-.001));assert.ok(Math.abs(near.samples.at(-1).heightM-100)<.001);assert.ok(page.url().includes('/earth'));
  await page.screenshot({path:out+'/near-minimum.png'});
  await seed(29500000);const high=await sample('maximum altitude clamp',()=>page.mouse.wheel(0,120));assert.ok(high.samples.every(s=>s.heightM<=30000000+.001));assert.ok(Math.abs(high.samples.at(-1).heightM-30000000)<.01);
 }else{
 const single=await sample('single wheel',()=>page.mouse.wheel(0,-120));
 if(qualify){assert.ok(single.changes>=3,'one wheel must produce several intermediate camera positions');assert.ok(single.samples.slice(1).every((s,i)=>s.heightM<=single.samples[i].heightM+.01),'inward motion is monotonic');assert.ok(Math.abs(single.packets[0].heightM-40000)<.01,'wheel callback must not move camera');assert.ok(single.samples.at(-1).motion?.active===false,'motion settles');}
 await page.screenshot({path:out+'/regional.png'});
 await location();const rapid=await sample('rapid wheel accumulation',()=>burst(Array(12).fill(-120),45));
 if(qualify)assert.ok(rapid.samples.at(-1).heightM<single.samples.at(-1).heightM);
 await location();await sample('high frequency trackpad',()=>burst(Array.from({length:50},(_,i)=>[12,8,10,14,9][i%5]*-1),20));
 await location();const reverse=await sample('direction reversal',async()=>{await page.mouse.wheel(0,-120);await page.waitForTimeout(70);await page.mouse.wheel(0,120)});
 if(qualify){const packet=reverse.packets[1],next=reverse.samples.find(s=>s.at>packet.at);assert.ok(next.heightM>=packet.heightM,'opposite input reverses the next observed frame');}
 await location();const cancel=await sample('pointer cancellation',async()=>{await page.mouse.wheel(0,-120);await page.waitForTimeout(60);await page.mouse.down();await page.waitForTimeout(40);await page.mouse.up()});
 if(qualify){const tail=cancel.samples.slice(-4);assert.ok(tail.every(s=>Math.abs(s.heightM-tail[0].heightM)<.01),'pointer cancellation leaves no residual updates');}
 }
 assert.equal(await page.locator('iframe').count(),1);assert.deepEqual(proof.pageErrors,[]);proof.earthArtifact=(await(await page.request.get(base+'/earth-runtime/release.json')).json()).artifact_sha256;proof.status='PASS';
}catch(e){proof.status='FAIL';proof.error=e.stack;await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e}
finally{proof.finished=new Date().toISOString();proof.video=await page.video().path();await context.close();await browser.close();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n')}
