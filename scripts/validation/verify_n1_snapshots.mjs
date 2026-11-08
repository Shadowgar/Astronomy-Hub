// Actual owned Cesium renderer/bridge. Historical provider fixture is explicitly
// separated from the live-provider attempt; no synthetic positions are injected.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {chromium} from '../../node_modules/playwright/index.mjs';
const require=createRequire(import.meta.url),sat=require('/var/tmp/oras-cesium/gods-eye/node_modules/satellite.js');
const out=process.env.N1_EVIDENCE_DIR||'output/n1/remediation/snapshots',base='http://127.0.0.1:4202',utc='2026-06-05T02:10:00.000Z';await mkdir(out,{recursive:true});
const dataPath='/home/rocco/Astronomy-Hub/frontend/public/oras-sky-engine/skydata/tle_satellite.jsonl.gz',bytes=await readFile(dataPath);let data=bytes;while(data[0]===31&&data[1]===139)data=gunzipSync(data);
const source=data.toString().trim().split('\n').map(JSON.parse).find(r=>r.model_data.norad_number===25544);assert.ok(source);
const tle=source.model_data.tle,body=(source.short_name||source.names[0].replace(/^NAME /,''))+'\n'+tle.join('\n')+'\n',record=sat.twoline2satrec(...tle),date=new Date(utc),position=sat.propagate(record,date);assert.ok(position.position&&!record.error);
const geo=sat.eciToGeodetic(position.position,sat.gstime(date)),ground={lat:sat.degreesLat(geo.latitude),lon:sat.degreesLong(geo.longitude)};
const hash=b=>createHash('sha256').update(b).digest('hex'),inputs=['scripts/validation/verify_n1_snapshots.mjs','runtimes/earth-runtime/core/RuntimeBridge.mjs','runtimes/earth-runtime/core/CameraController.mjs','runtimes/earth-runtime/core/EarthRuntime.mjs','frontend/src/features/workspace/useViewNavigation.ts','integrations/renderers.lock.json','frontend/public/runtime-versions.json'],sourceHashes={};for(const name of inputs)sourceHashes[name]=hash(await readFile(name));
const proof={status:'RUNNING',sourceHashes,liveProviderAttempt:null,historicalSourceBackedFixture:{utc,tleSha256:hash(body),mountedAssetSha256:hash(bytes),norad:'25544',ground,description:'Unchanged historical TLE lines from the mounted catalog, real production satellite.js propagation/renderer, controlled browser Date. This is not live-provider qualification.'},runs:[],started:new Date().toISOString()},browser=await chromium.launch({headless:true});
let activePage;
function helpers(page){
 activePage=page;
 const frame=()=>page.frames().find(f=>f.url().includes('/earth-runtime/')||f.url().includes('/oras-sky-engine/'));
 const diag=()=>frame().evaluate(()=>window.orasEarthDiagnostics());
 const ready=async mode=>{await page.locator(`[data-runtime-mode=${mode}][data-runtime-status=ready]`).waitFor({timeout:90000});await page.locator('.ws-handoff').waitFor({state:'hidden',timeout:90000});assert.equal(await page.locator('iframe').count(),1)};
 const reveal=async()=>{await page.keyboard.press('Tab');const r=page.locator('.ws-reveal');if(await r.isVisible())await r.click()};
 const explore=async()=>{await reveal();await page.getByRole('button',{name:'Explore',exact:true}).click();await page.locator('dialog[open]').waitFor();if(frame().url().includes('/earth-runtime/'))await page.waitForFunction(()=>Boolean(document.querySelector('dialog[open] input')?.value.trim()))};
 const alt=async mode=>{await explore();await page.getByRole('button',{name:mode==='earth'?'Earth Explore our planet':'Enter Sky here',exact:true}).press('Enter');await ready(mode)};
 const enableSatellites=async()=>{await reveal();const button=page.getByRole('button',{name:'Layers',exact:true});await button.waitFor({state:'visible'});await button.press('Enter');const toggle=page.getByRole('switch',{name:'Satellites · stations',exact:true});if(await toggle.getAttribute('aria-checked')!=='true')await toggle.press('Enter');await page.getByRole('button',{name:page.viewportSize().width<768?'Close sheet':'Close panel',exact:true}).press('Enter')};
 return{frame,diag,ready,reveal,explore,alt,enableSatellites};
}
async function trackingChecks(page,width,label){
 const h=helpers(page),rows=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
 const points=await h.frame().evaluate(()=>window.orasEarthVisibleTargets());const target=points.find(p=>p.id.startsWith('satellites:'));assert.ok(target,'source-backed satellite is visible in the real renderer');
 const canvas=await h.frame().locator('canvas').first().boundingBox();
 for(const dx of [0,3,-3,5]){if(width<768)await page.touchscreen.tap(canvas.x+target.x+dx,canvas.y+target.y);else await page.mouse.click(canvas.x+target.x+dx,canvas.y+target.y,{delay:150});await page.waitForTimeout(250);if((await h.diag()).selection?.layerId==='satellites')break;}
 assert.equal((await h.diag()).selection?.layerId,'satellites');
 if(width<768&&!await page.getByRole('button',{name:'Track',exact:true}).isVisible())await page.getByRole('button',{name:'Selected object',exact:true}).click();await page.getByRole('button',{name:'Track',exact:true}).click();await page.waitForTimeout(900);assert.equal((await h.diag()).tracking,target.id);
 if(width<768)await page.getByRole('button',{name:'Close sheet',exact:true}).click();
 await h.frame().evaluate(()=>{const original=MessagePort.prototype.postMessage;window.__n1OriginalPost=original;window.__n1HeldSnapshots=[];MessagePort.prototype.postMessage=function(message,...args){if(window.__n1HoldSnapshot&&message?.type==='result'&&message.command==='getNavigationState'){const send=()=>original.call(this,message,...args);send.id=message.id;window.__n1HeldSnapshots.push(send);return;}return original.call(this,message,...args)}});
 for(let cycle=0;cycle<4;cycle++){
  const before=await h.diag();await h.explore();assert.equal((await h.diag()).tracking,target.id);await page.keyboard.press('Escape');await h.ready('earth');assert.equal((await h.diag()).tracking,target.id);
  await h.explore();assert.equal(await h.frame().evaluate(()=>window.__n1HeldSnapshots.length),0);await h.frame().evaluate(()=>window.__n1HoldSnapshot=true);await page.getByRole('button',{name:'Enter Sky here',exact:true}).press('Enter');await page.locator('.ws-handoff').waitFor();await h.frame().waitForFunction(()=>window.__n1HeldSnapshots.length===1);assert.equal((await h.diag()).tracking,target.id);
  await page.keyboard.press('Escape');await h.frame().evaluate(()=>{window.__n1HoldSnapshot=false;window.__n1HeldSnapshots.splice(0).forEach(send=>send())});await h.ready('earth');await page.waitForTimeout(300);const after=await h.diag();assert.equal(after.tracking,target.id);assert.equal(await h.frame().evaluate(()=>window.__n1HeldSnapshots.length),0);assert.equal(after.disposed,false);await page.screenshot({path:`${out}/${label}-cancelled-${cycle}-${width}.png`});rows.push({cycle,before,after});
 }
 await h.frame().evaluate(()=>{MessagePort.prototype.postMessage=window.__n1OriginalPost;delete window.__n1OriginalPost});await h.alt('sky');const removals=await page.evaluate(()=>window.__n1Removals);assert.ok(removals.some(r=>r.earth?.disposed===true&&r.earth.viewerDestroyed===true));await h.alt('earth');assert.equal((await h.diag()).tracking,null);assert.equal(await page.evaluate(()=>window.__n1Peak),1);assert.deepEqual(errors,[]);
 return{status:'PASS',target:target.id,cancellations:rows,pageErrors:errors,removals,peakRenderers:1};
}
const instrument=()=>{if(window!==window.parent)return;window.__n1Removals=[];window.__n1Peak=0;const remove=HTMLIFrameElement.prototype.remove;HTMLIFrameElement.prototype.remove=function(){window.__n1Removals.push({url:this.src,earth:this.contentWindow?.orasEarthDiagnostics?.()??null});return remove.call(this)};new MutationObserver(()=>window.__n1Peak=Math.max(window.__n1Peak,document.querySelectorAll('iframe').length)).observe(document,{childList:true,subtree:true})};
try{
 // Genuine live-source attempt. Failure/loading is reported, never replaced by a
 // fixture and then relabelled live. The controlled scenario uses another context.
 const liveContext=await browser.newContext({viewport:{width:1440,height:900}});await liveContext.addInitScript(instrument);const live=await liveContext.newPage(),lh=helpers(live);await live.goto(base+'/earth');await lh.ready('earth');await lh.enableSatellites();
 await lh.frame().waitForFunction(()=>['ready','unavailable'].includes(window.orasEarthDiagnostics().providers.satellites?.status),null,{timeout:15000}).catch(()=>{});const observed=await lh.diag(),visible=await lh.frame().evaluate(()=>window.orasEarthVisibleTargets().filter(p=>p.id.startsWith('satellites:')));proof.liveProviderAttempt={provider:observed.providers.satellites,visibleCount:visible.length,qualified:false};
 if(observed.providers.satellites?.status==='ready'&&visible.length){proof.liveProviderAttempt.tracking=await trackingChecks(live,1440,'live');proof.liveProviderAttempt.qualified=true}else await live.screenshot({path:`${out}/live-provider-limitation.png`});await liveContext.close();
 for(const width of (process.env.N1_WIDTHS||'1440,390').split(',').map(Number)){
  const context=await browser.newContext({viewport:{width,height:width<768?844:900},isMobile:width<768,hasTouch:width<768});await context.addInitScript(({utc})=>{const fixed=Date.parse(utc),Native=Date;window.Date=new Proxy(Native,{construct(target,args){return Reflect.construct(target,args.length?args:[fixed])},apply(){return new Native(fixed).toString()},get(target,key){return key==='now'?()=>fixed:Reflect.get(target,key)}})},{utc});await context.addInitScript(instrument);const page=await context.newPage(),h=helpers(page);
  await page.route('https://celestrak.org/NORAD/elements/**',route=>route.fulfill({status:200,contentType:'text/plain',headers:{'access-control-allow-origin':'*'},body}));await page.goto(`${base}/sky-engine?lat=${ground.lat}&lng=${ground.lon}&elev=0&elevationSource=unavailable-zero&date=${encodeURIComponent(utc)}`);await h.ready('sky');await h.alt('earth');await h.enableSatellites();await h.frame().waitForFunction(()=>window.orasEarthDiagnostics().providers.satellites?.status==='ready',null,{timeout:30000});
  const result=await trackingChecks(page,width,'historical-fixture');proof.runs.push({width,evidenceClass:'historical-source-backed-provider-fixture-real-Cesium',...result});await context.close();console.log(width,'snapshot inspection / tracked source / repeated cancellation / committed cleanup PASS');
 }
 for(const name of inputs)assert.equal(hash(await readFile(name)),sourceHashes[name],'source changed during qualification: '+name);assert.equal(hash(await readFile(dataPath)),hash(bytes));proof.status='PASS';
}catch(error){proof.status='FAIL';proof.error=error.stack;if(activePage&&!activePage.isClosed()){await activePage.screenshot({path:`${out}/failure.png`}).catch(()=>{});proof.failureDOM=await activePage.evaluate(()=>({root:document.querySelector('.ws-shell')?.outerHTML.slice(0,450),text:document.body.innerText})).catch(()=>null);const earth=activePage.frames().find(f=>f.url().includes('/earth-runtime/'));if(earth)proof.failureTransport=await earth.evaluate(()=>({held:window.__n1HeldSnapshots?.length,ids:window.__n1HeldSnapshots?.map(send=>send.id),state:window.orasEarthDiagnostics()})).catch(()=>null)}throw error}
finally{await browser.close();proof.finished=new Date().toISOString();await writeFile(`${out}/proof.json`,JSON.stringify(proof,null,2)+'\n')}
