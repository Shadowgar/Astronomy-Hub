import {sourceIdentity} from './r4_evidence.mjs';
import {chromium} from '../../node_modules/playwright/index.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=process.env.R4_OUT||'output/r4-a/recovery',base=process.env.R4_URL||'http://127.0.0.1:4222',epoch='2026-10-23T01:05:00Z';await mkdir(out,{recursive:true});
const proof={status:'RUNNING',checks:[],limitations:['Fault injection is explicitly negative controlled-browser evidence, not a real provider outage.','Software Chromium, not owner physical GPU/device acceptance.']},b=await chromium.launch();
proof.source_sha256=await sourceIdentity();
try{
 const c=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),p=await c.newPage();p.setDefaultTimeout(15000);
 const moon=()=>p.locator('[data-planet-status=ready]').waitFor({timeout:30000}),solar=()=>p.locator('[data-solar-status=ready]').waitFor({timeout:60000}),f=()=>p.frames().find(f=>f.url().includes('/planet-runtime/'));
 const enter=async()=>{await p.getByRole('button',{name:'Moon',exact:true}).click();await p.getByRole('button',{name:'Approach Moon',exact:true}).click();await moon();};
 const fault=async text=>{await p.getByRole('alert').filter({hasText:text}).waitFor();assert.equal(await p.locator('iframe').count(),0);};
 await p.goto(base+'/planet-view/mars?date='+epoch);await fault(/no qualified|not qualified|unsupported|not found/i);proof.checks.push('Real unsupported-body API404: controlled error, no native globe');
 await p.goto(base+'/planet-view/moon?date=garbage');await fault(/Invalid astronomical epoch/);proof.checks.push('Invalid epoch rejected before renderer creation');
 await p.route('**/api/v1/planet-view/moon?*',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({detail:'Controlled test: lunar source unavailable'})}));
 await p.goto(base+'/planet-view/moon?date='+epoch);await fault(/unavailable/);await p.screenshot({path:out+'/controlled-api503.png'});await p.unroute('**/api/v1/planet-view/moon?*');await p.getByRole('button',{name:'Retry Planet View',exact:true}).click();await moon();proof.checks.push('Controlled API503 has no substitute globe; retry uses real qualified API and image');
 await p.route('**/planet-data/moon-wac.png',r=>r.abort('failed'));await p.reload();await fault(/Failed|load|image|unavailable/i);await p.screenshot({path:out+'/controlled-image-failure.png'});await p.unroute('**/planet-data/moon-wac.png');await p.getByRole('button',{name:'Retry Planet View',exact:true}).click();await moon();proof.checks.push('Controlled imagery load failure destroys frame; source restoration/retry renders the real Moon');
 await p.getByLabel('Lunar latitude',{exact:true}).fill('7');await p.getByLabel('Lunar longitude',{exact:true}).fill('23');await p.getByLabel('Height above lunar reference sphere',{exact:true}).fill('2000000');await p.getByRole('button',{name:'Go',exact:true}).click();await f().waitForFunction(()=>Math.abs(window.orasPlanetDiagnostics().camera.longitudeDeg-23)<1e-6);await p.waitForFunction(()=>Math.abs(Number(new URLSearchParams(location.search).get('lon'))-23)<1e-6);
 const lost=await f().evaluate(()=>{const canvas=document.querySelector('canvas'),gl=canvas.getContext('webgl2')||canvas.getContext('webgl'),ext=gl?.getExtension('WEBGL_lose_context');if(!ext)return false;ext.loseContext();return true});assert.equal(lost,true);await fault(/Graphics context lost|renderer stopped/);await p.screenshot({path:out+'/actual-webgl-loss.png'});await p.getByRole('button',{name:'Retry Planet View',exact:true}).click();await moon();assert.ok(Math.abs((await f().evaluate(()=>window.orasPlanetDiagnostics().camera)).longitudeDeg-23)<1e-6,'retry retains latest camera');proof.checks.push('Actual WEBGL_lose_context extension: owned frame removed, controlled recovery recreates native Moon');
 await p.getByRole('button',{name:'Return to Solar',exact:true}).click();await solar();
 // An unfinished API request must not publish into a departed workspace.
 let held,release;const gate=new Promise(r=>release=r),arrived=new Promise(r=>held=r);
 await p.route('**/api/v1/planet-view/moon?*',async r=>{held();await gate;try{await r.continue()}catch{/* Browser aborted this departed request. */}});
 await p.goto(base+'/planet-view/moon?date='+epoch);await arrived;await p.getByRole('button',{name:'Return to Solar',exact:true}).click();release();await solar();await p.unroute('**/api/v1/planet-view/moon?*');assert.equal(await p.locator('iframe').count(),0);proof.checks.push('Cancel during pending science request retains Solar; late response cannot create a globe');
 let imageArrived,imageRelease;const imageGate=new Promise(r=>imageRelease=r),imageSeen=new Promise(r=>imageArrived=r);
 await p.route('**/planet-data/moon-wac.png',async r=>{imageArrived();await imageGate;try{await r.continue()}catch{}});
 await p.goto(base+'/planet-view/moon?date='+epoch);await imageSeen;await p.getByRole('button',{name:'Return to Solar',exact:true}).click();imageRelease();await solar();await p.unroute('**/planet-data/moon-wac.png');assert.equal(await p.locator('iframe').count(),0);proof.checks.push('Cancel during pending native image load detaches its renderer and returns to Solar');
 for(const mode of (process.env.R4_RECOVERY_MODES||'sky,earth').split(',')){
  const path=mode==='sky'?'/sky-engine':'/earth';await p.goto(base+path+'?date='+epoch);
  const ready=()=>p.locator(`[data-runtime-mode=${mode}][data-runtime-status=ready]`).waitFor({timeout:90000});await ready();
  const nativeFrame=()=>p.frames().find(f=>f.url().includes(mode==='sky'?'/oras-sky-engine/':'/earth-runtime/'));
  const state=()=>nativeFrame().evaluate(mode=>mode==='sky'?window.orasSkyAdapter.navigation():window.orasEarthDiagnostics().navigation,mode);
  if(mode==='sky'){await nativeFrame().locator('#stel-canvas').click();await p.keyboard.press('PageUp');}
  else {await p.getByLabel('Search Earth',{exact:true}).fill('48.8584, 2.2945');await p.getByRole('button',{name:'Search Earth',exact:true}).click();await p.getByRole('list',{name:'Earth search results'}).getByRole('button').first().click();await nativeFrame().waitForFunction(()=>Math.abs(window.orasEarthDiagnostics().navigation.observer.lat-48.8584)<1e-4);await p.getByRole('button',{name:'Dismiss search results'}).click();}
  const original=await state();await p.getByRole('button',{name:'Choose exploration mode',exact:true}).click();await p.getByRole('navigation',{name:'Exploration modes'}).getByRole('button',{name:'Solar System',exact:true}).click();await solar();await enter();assert.equal(await p.locator('iframe').count(),1);
  await p.getByRole('button',{name:'Choose exploration mode',exact:true}).click();await p.getByRole('navigation',{name:'Exploration modes'}).getByRole('button',{name:mode==='sky'?'Sky':'Earth',exact:true}).click();await ready();const returned=await state();
  assert.equal(Date.parse(returned.utc),Date.parse(original.utc));for(const k of ['lat','lon'])assert.ok(Math.abs(returned.observer[k]-original.observer[k])<1e-5,k+' retained');
  if(mode==='sky')assert.ok(Math.abs(returned.camera.fovRad-original.camera.fovRad)<1e-5);else assert.ok(Math.abs(returned.camera.heightM-original.camera.heightM)<1);
  proof[mode]={before:original,after:returned};await p.screenshot({path:out+'/'+mode+'-direct-return.png'});proof.checks.push(mode+' → Solar → Moon → direct '+mode+' retains observer, native camera and UTC, serial native renderer');
 }
 await c.close();proof.status='PASS';console.log('PASS',proof.checks.length,'recovery/preservation groups');
}catch(e){proof.status='FAIL';proof.error=e.stack;console.error(e.stack);process.exitCode=1}finally{await b.close();assert.deepEqual(await sourceIdentity(),proof.source_sha256,'Source changed during browser qualification');await writeFile(out+'/proof.json',JSON.stringify(proof,null,2));}
