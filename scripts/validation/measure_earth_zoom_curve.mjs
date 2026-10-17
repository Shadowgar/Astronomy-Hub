// Actual Chromium input; records every delivered wheel packet after native zoom.
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'../../node_modules/playwright/index.mjs');
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4202',out=process.env.N1_EVIDENCE_DIR||'output/n1/zoom-curve-before',qualify=process.env.N1_ZOOM_QUALIFY==='1';
await mkdir(out,{recursive:true});const hash=b=>createHash('sha256').update(b).digest('hex');
const cameraSource=await readFile('runtimes/earth-runtime/core/CameraController.mjs');
const proof={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),cameraSourceSha256:hash(cameraSource),base,started:new Date().toISOString(),status:'RUNNING',runs:[],pageErrors:[],limitations:['Representative real Chromium wheel input with software rendering; exact owner ChatGPT browser and physical hardware cannot be automated.']};
const browser=await chromium.launch({headless:true}),context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),cdp=await context.newCDPSession(page);
page.on('pageerror',e=>proof.pageErrors.push(e.message));page.setDefaultTimeout(25000);
const frame=()=>page.frames().find(f=>/\/(earth-runtime|oras-sky-engine)\//.test(f.url()));
const state=()=>frame().evaluate(()=>window.orasEarthDiagnostics?.()||window.orasSkyAdapter.navigation());
const ready=async mode=>{await page.locator(`[data-runtime-mode=${mode}][data-runtime-status=ready]`).waitFor({timeout:90000});await page.locator('.ws-handoff').waitFor({state:'hidden',timeout:90000});assert.equal(await page.locator('iframe').count(),1);};
const explore=async()=>{if(await page.locator('.ws-reveal').isVisible())await page.locator('.ws-reveal').click();await page.getByRole('button',{name:'Explore',exact:true}).click();};
const point=async()=>{const b=await frame().locator('canvas').first().boundingBox();const p={x:b.x+b.width/2,y:b.y+b.height/2};await page.mouse.move(p.x,p.y);return p;};
const instrument=()=>frame().evaluate(()=>{window.__zoom=[];document.querySelector('canvas').addEventListener('wheel',e=>window.__zoom.push({deltaY:e.deltaY,stamp:e.timeStamp,heightM:window.orasEarthDiagnostics().cameraHeightM}),{passive:true});});
const burst=async(deltas,interval)=>{const p=await point(),epoch=Date.now()/1000;await Promise.all(deltas.map((deltaY,i)=>new Promise(r=>setTimeout(r,i*interval)).then(()=>cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',...p,deltaX:0,deltaY,timestamp:epoch+i*interval/1000}))));await page.waitForTimeout(250);};
const NY={lat:40.7829,lon:-73.9654},UTC='2026-10-14T02:10:00.000Z';
const location=async()=>{await explore();await page.getByLabel('Latitude',{exact:true}).fill(String(NY.lat));await page.getByLabel('Longitude',{exact:true}).fill(String(NY.lon));await page.getByRole('button',{name:'Explore location',exact:true}).click();await page.locator('dialog').waitFor({state:'hidden'});await page.waitForTimeout(1300);assert.ok(Math.abs((await state()).cameraHeightM-40000)<1);};
const record=async(name,send,stop,max)=>{const start=Date.now(),initial=await state(),samples=[];for(let i=0;i<max;i++){await send(i);const s=await state();assert.equal(s.owner,'Astronomy Hub');samples.push({step:i+1,heightM:s.cameraHeightM,observer:s.navigation.observer,camera:s.navigation.camera});if(stop(s))break;}const row={name,initialHeightM:initial.cameraHeightM,elapsedMs:Date.now()-start,samples};proof.runs.push(row);console.log(name,samples.length,samples.at(-1).heightM);return row;};
try{
 await page.goto(base+'/sky-engine?date='+encodeURIComponent(UTC));await ready('sky');await explore();await page.getByRole('button',{name:'Earth Explore our planet',exact:true}).click();await ready('earth');await instrument();await page.waitForTimeout(1100);await point();
 const ordinary=async delta=>{await point();await page.mouse.wheel(0,delta);await page.waitForTimeout(350);};
 const orbit=await record('orbit to regional',()=>ordinary(-120),s=>s.cameraHeightM<=40000,12);assert.ok(orbit.samples.at(-1).heightM<=40000);if(qualify)assert.ok(orbit.samples.length<=9);
 await location();const down=await record('40 km ordinary inward notches',()=>ordinary(-120),s=>s.cameraHeightM<=1500,30);assert.ok(down.samples.at(-1).heightM<=1500);if(qualify)assert.ok(down.samples.length>=12&&down.samples.length<=18);
 for(const row of down.samples){assert.ok(Math.abs(row.observer.lat-NY.lat)<1e-5);assert.ok(Math.abs(row.observer.lon-NY.lon)<1e-5);assert.equal(row.observer.elevationM,0);const c=row.camera,b=down.samples[0].camera;assert.ok(Math.abs(c.pitchRad-b.pitchRad)<1e-4);assert.ok(Math.abs(c.rollRad-b.rollRad)<1e-4);assert.ok(Math.abs(Math.sin(c.headingRad-b.headingRad))<1e-4);}
 await page.screenshot({path:out+'/near-surface.png'});
 const up=await record('ordinary outward reverse',()=>ordinary(120),s=>s.cameraHeightM>=40000,30);assert.ok(up.samples.at(-1).heightM>=40000);if(qualify)assert.ok(up.samples.length<=21);
 await location();const trackpad=await record('trackpad ten 12 px events per sample',()=>burst(Array(10).fill(-12),20),s=>s.cameraHeightM<=1500,30);assert.ok(trackpad.samples.at(-1).heightM<=1500);
 await location();const rapidStart=await state();await burst(Array(12).fill(-120),45);const rapid=await state();assert.equal(rapid.owner,'Astronomy Hub');proof.runs.push({name:'rapid twelve 120 px events at 45 ms',initialHeightM:rapidStart.cameraHeightM,finalHeightM:rapid.cameraHeightM});
 const packets=await frame().evaluate(()=>window.__zoom);assert.ok(packets.length>10);proof.deliveredPackets=packets;
 await location();await record('final approach for deliberate Sky entry',()=>ordinary(-120),s=>s.cameraHeightM<=1500,30);await burst(Array(10).fill(-120),180);await ready('sky');const sky=await state();assert.ok(Math.abs(sky.observer.lat-NY.lat)<1e-5);assert.ok(Math.abs(sky.observer.lon-NY.lon)<1e-5);assert.equal(sky.utc,UTC);assert.equal(sky.live,false);assert.equal(sky.observer.elevationM,0);proof.skyEntry=sky;
 await explore();await page.getByRole('button',{name:'Earth Explore our planet',exact:true}).click();await ready('earth');const returned=await state();assert.ok(Math.abs(returned.navigation.observer.lat-NY.lat)<1e-5);assert.ok(Math.abs(returned.navigation.observer.lon-NY.lon)<1e-5);proof.returnedEarth=returned.navigation;assert.deepEqual(proof.pageErrors,[]);
 const served=await(await page.request.get(base+'/earth-runtime/release.json')).json(),local=JSON.parse(await readFile('output/n1/earth/release.json'));assert.equal(served.artifact_sha256,local.artifact_sha256);proof.earthArtifact=served.artifact_sha256;assert.equal(hash(await readFile('runtimes/earth-runtime/core/CameraController.mjs')),proof.cameraSourceSha256);proof.status='PASS';
}catch(e){proof.status='FAIL';proof.error=e.stack;await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{proof.finished=new Date().toISOString();await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');await browser.close();}
