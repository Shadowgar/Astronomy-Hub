// Real Docker-served native rendering proof. No scene mocks or CSS corrections.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from '../../node_modules/playwright/index.mjs';
const out=process.env.N1_EVIDENCE_DIR||'output/n1/native-horizon/visual';
const baseline=process.env.N1_HORIZON_BASELINE==='1',base='http://127.0.0.1:4202';
await mkdir(out,{recursive:true});
const inputs=['runtimes/sky-adapter/plugin.js','integrations/sky-patches/0001-configurable-zero-horizon.patch','integrations/renderers.lock.json','frontend/public/runtime-versions.json','scripts/validation/verify_n1_horizon.mjs','scripts/runtime/attest_sky_horizon.py','scripts/runtime/build_sky_horizon.sh','scripts/runtime/record_sky_workspace.py'];
const sourceHashes={};for(const name of inputs)try{sourceHashes[name]=createHash('sha256').update(await readFile(name)).digest('hex')}catch{sourceHashes[name]=null}
const proof={status:'RUNNING',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHashes,baseline,runs:[],started:new Date().toISOString()};
const fill=[.035,.04,.05,1],border=[.10,.12,.14,1],originalFill=[.1,.15,.1,1],originalBorder=[.2,.4,.1,1];
const browser=await chromium.launch({headless:true});
let page;
try{
 for(const width of (process.env.N1_WIDTHS||'1440,390').split(',').map(Number)){
  const context=await browser.newContext({viewport:{width,height:width<768?844:900},isMobile:width<768,hasTouch:width<768});page=await context.newPage();
  const run={width,pageErrors:[],consoleSummary:{},resourceFailures:[],scenes:[]};proof.runs.push(run);
  page.on('pageerror',e=>run.pageErrors.push(e.message));page.on('response',r=>{if(r.status()>=400)run.resourceFailures.push({status:r.status(),url:r.url()})});page.on('console',m=>{if(m.type()==='error'){const key=m.text().slice(0,160);run.consoleSummary[key]=(run.consoleSummary[key]||0)+1}});
  const frame=()=>page.frames().find(f=>f.url().includes('/oras-sky-engine/'));
  const state=()=>frame().evaluate(()=>{const s=window.__ORAS_STEL,c=s.core,l=c.landscapes.current;return {landscape:c.landscapes.current_id,visible:c.landscapes.visible,atmosphere:c.atmosphere.visible,night:window.orasSkyAdapter.nightMode(),fill:l.horizon_color,border:l.horizon_border_color,view:window.orasSkyAdapter.navigation()}});
  const setup=async()=>{await page.locator('[data-runtime-mode=sky][data-runtime-status=ready]').waitFor({timeout:90000});await frame().evaluate(()=>{const a=window.orasSkyAdapter;a.restoreView({...a.navigation().camera,fovRad:Math.PI/2,yawRad:0,pitchRad:0,landscapeVisible:true})});await page.waitForTimeout(2500)};
  const sample=async(file,stars)=>page.evaluate(async ({bytes,stars})=>{const bitmap=await createImageBitmap(new Blob([Uint8Array.from(atob(bytes),c=>c.charCodeAt(0))],{type:'image/png'}));const canvas=new OffscreenCanvas(bitmap.width,bitmap.height),ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);const w=bitmap.width,h=bitmap.height;bitmap.close();const at=(x,y)=>[...ctx.getImageData(Math.round(x),Math.round(y),1,1).data];let skyBrightPixels=[];let groundBrightPixels=0;if(stars){const img=ctx.getImageData(0,0,w,h).data;for(let y=Math.round(h*.2);y<h*.8;y++)for(let x=Math.round(w*.15);x<w*.65;x++){const i=(y*w+x)*4;if(img[i]>180&&img[i+1]>180&&img[i+2]>180){if(y<h*.45)skyBrightPixels.push(y*w+x);else if(y>h*.6)groundBrightPixels++;}}}return {skyBrightPixels,groundBrightPixels,ground:at(w*.35,h*.70),horizonColumn:Array.from({length:17},(_,i)=>at(w*.35,h/2-8+i)),above:at(w*.35,h*.30)}},{bytes:(await readFile(file)).toString('base64'),stars});
  const shot=async(name)=>{const file=`${out}/${name}-${width}.png`;await page.screenshot({path:file});const row={name,state:await state(),pixels:await sample(file,['night-off','native-default-color-probe'].includes(name))};run.scenes.push(row);return row};
  const rgbNear=(actual,expected)=>expected.forEach((value,i)=>assert.ok(Math.abs(actual[i]-Math.round(value*255))<=2,`${actual} vs ${expected}`));
  await page.goto(base+'/sky-engine?date=2026-10-14T02%3A10%3A00.000Z');await setup();
  const first=await shot(baseline?'before-green':'embedded-dark');
  assert.deepEqual(first.state.fill,fill,'embedded native horizon fill is configurable and charcoal');assert.deepEqual(first.state.border,border);rgbNear(first.pixels.ground,fill);
  if(baseline)continue;
  // Real controls, not direct replacement state.
  const toggle=async(id)=>{await frame().getByRole('button',{name:id==='landscape'||id==='atmosphere'?'Observing tools':'Display',exact:true}).click();await frame().locator(`[data-sky-control=${id}]`).click();await frame().getByRole('button',{name:id==='landscape'||id==='atmosphere'?'Close Observing tools':'Close Display',exact:true}).click();await page.waitForTimeout(1200)};
  await toggle('landscape');const off=await shot('landscape-off');assert.equal(off.state.visible,false);assert.notDeepEqual(off.pixels.ground,first.pixels.ground);
  await toggle('landscape');const on=await shot('landscape-on');assert.equal(on.state.visible,true);rgbNear(on.pixels.ground,fill);
  await toggle('atmosphere');const airOff=await shot('atmosphere-off');assert.equal(airOff.state.atmosphere,false);rgbNear(airOff.pixels.ground,fill);
  await toggle('atmosphere');assert.equal((await state()).atmosphere,true);
  await toggle('night');const night=await shot('night-on');assert.equal(night.state.night,true);
  await toggle('night');const normal=await shot('night-off');assert.equal(normal.state.night,false);rgbNear(normal.pixels.ground,fill);
  // Same real native circle; property changes must change native rendered fill/border.
  const stable=await state();await frame().evaluate(()=>{const l=window.__ORAS_STEL.core.landscapes.current;l.horizon_color=[.1,.15,.1,1];l.horizon_border_color=[.2,.4,.1,1]});await page.waitForTimeout(1200);
  const nativeDefaults=await shot('native-default-color-probe');rgbNear(nativeDefaults.pixels.ground,originalFill);assert.deepEqual(nativeDefaults.state.view,stable.view);assert.notDeepEqual(nativeDefaults.pixels.horizonColumn,normal.pixels.horizonColumn);
  const bright=new Set(normal.pixels.skyBrightPixels),other=new Set(nativeDefaults.pixels.skyBrightPixels),matched=[...bright].filter(p=>other.has(p)).length;
  assert.ok(bright.size>20,'native stars above horizon are visible');assert.ok(matched/bright.size>.98,'above-horizon bright star pixels unaffected by native horizon color');assert.equal(normal.pixels.groundBrightPixels,0);assert.equal(nativeDefaults.pixels.groundBrightPixels,0);
  run.pixelOcclusion={aboveBrightPixels:bright.size,matchedBrightPixels:matched,belowBrightPixels:normal.pixels.groundBrightPixels};
  await frame().evaluate(()=>{const l=window.__ORAS_STEL.core.landscapes.current;l.horizon_color=[.035,.04,.05,1];l.horizon_border_color=[.10,.12,.14,1]});
  // Releasing embedded policy restores captured native zero values, including when zero was the prior native choice.
  await frame().evaluate(()=>window.orasSkyAdapter.presentation(false));await page.waitForTimeout(1000);
  run.releasedLandscape=(await state()).landscape;
  await frame().evaluate(()=>{window.__ORAS_STEL.core.landscapes.current_id='zero'});await page.waitForTimeout(1000);
  const released=await state();assert.deepEqual(released.fill,originalFill);assert.deepEqual(released.border,originalBorder);
  await frame().evaluate(()=>window.orasSkyAdapter.presentation(true));await page.waitForTimeout(1000);assert.deepEqual((await state()).fill,fill);
  await frame().evaluate(()=>window.orasSkyAdapter.presentation(false));assert.deepEqual((await state()).fill,originalFill);
  await frame().evaluate(()=>window.orasSkyAdapter.presentation(true));
  run.releaseRace=await frame().evaluate(()=>{const c=window.__ORAS_STEL.core;c.landscapes.current_id='guereins';const selected=c.landscapes.current_id;window.orasSkyAdapter.presentation(false);return {selected,zeroFill:c.landscapes.zero.horizon_color,zeroBorder:c.landscapes.zero.horizon_border_color}});
  assert.equal(run.releaseRace.selected,'guereins');assert.deepEqual(run.releaseRace.zeroFill,originalFill);assert.deepEqual(run.releaseRace.zeroBorder,originalBorder);
  await page.goto(base+'/sky-engine?lat=-33.8688&lng=151.2093&elev=0&date=2026-10-14T02%3A10%3A00.000Z');await setup();
  const day=await shot('sydney-day');assert.ok(Math.abs(day.state.view.observer.lat+33.8688)<1e-6);assert.ok(Math.abs(day.state.view.observer.lon-151.2093)<1e-6);rgbNear(day.pixels.ground,fill);
  await page.goto(base+'/sky-engine?date=2026-10-14T17%3A00%3A00.000Z');await setup();const orasDay=await shot('oras-day');rgbNear(orasDay.pixels.ground,fill);
  await page.goto(base+'/oras-sky-engine/?date=2026-10-14T02%3A10%3A00.000Z');await page.waitForFunction(()=>!!window.orasSkyAdapter,{timeout:90000});await page.waitForTimeout(2500);
  const native=await page.evaluate(()=>({id:window.__ORAS_STEL.core.landscapes.current_id,visible:window.__ORAS_STEL.core.landscapes.visible}));assert.notEqual(native.id,'zero');await page.screenshot({path:`${out}/standalone-native-${width}.png`});
  const zero=await page.evaluate(()=>{const c=window.__ORAS_STEL.core;c.landscapes.addDataSource({url:'',key:'zero'});c.landscapes.current_id='zero';return {fill:c.landscapes.current.horizon_color,border:c.landscapes.current.horizon_border_color}});assert.deepEqual(zero.fill,originalFill);assert.deepEqual(zero.border,originalBorder);
  await page.evaluate(()=>{const c=window.__ORAS_STEL.core;c.landscapes.visible=false;c.landscapes.visible=true});run.standalone={native,zero};
  assert.deepEqual(run.pageErrors,[]);run.status='PASS';await context.close();console.log(width,'native horizon matrix PASS');
 }
 for(const [name,digest] of Object.entries(sourceHashes))assert.equal(createHash('sha256').update(await readFile(name)).digest('hex'),digest,'input changed during native visual qualification: '+name);
 proof.status='PASS';
}catch(error){proof.status='FAIL';proof.error=error.stack;throw error}
finally{await browser.close();proof.finished=new Date().toISOString();await writeFile(`${out}/proof.json`,JSON.stringify(proof,null,2)+'\n')}
