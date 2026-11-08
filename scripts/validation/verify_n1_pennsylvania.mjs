// Actual Docker-served Stellarium panorama; no scene mocks or CSS replacements.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {chromium} from '../../node_modules/playwright/index.mjs';
const out=process.env.N1_EVIDENCE_DIR||'output/n1/pennsylvania/visual',base='http://127.0.0.1:4202';
await mkdir(out,{recursive:true});
const id='pennsylvania-woodland-v1',asset=`runtimes/sky-adapter/assets/${id}`;
const inputs=['runtimes/sky-adapter/plugin.js',`${asset}/manifest.json`,'integrations/renderers.lock.json','frontend/public/runtime-versions.json','scripts/validation/verify_n1_pennsylvania.mjs'];
const sha=b=>createHash('sha256').update(b).digest('hex'),sourceHashes={};
for(const name of inputs)sourceHashes[name]=sha(await readFile(name));
const proof={status:'RUNNING',head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHashes,runs:[],assetResponses:[],limitations:['Chromium desktop and emulated mobile/touch, software rendering; no physical-device or owner visual acceptance.','Illustrative scenery; artistic ridges are never measured scientific horizon data.'],started:new Date().toISOString()};
const manifest=JSON.parse(await readFile(`${asset}/manifest.json`));
const browser=await chromium.launch({headless:true});
try {
 for(const file of manifest.files){const response=await fetch(`${base}/oras-sky-engine/landscapes/${id}/${file.path}`);assert.equal(response.status,200);const digest=sha(Buffer.from(await response.arrayBuffer()));assert.equal(digest,file.sha256);proof.assetResponses.push({path:file.path,status:response.status,sha256:digest})}
 for(const width of (process.env.N1_WIDTHS||'1440,390').split(',').map(Number)){
  const context=await browser.newContext({viewport:{width,height:width<768?844:900},isMobile:width<768,hasTouch:width<768});const page=await context.newPage();
  const run={width,status:'RUNNING',pageErrors:[],landscapeFailures:[],scenes:[]};proof.runs.push(run);
  page.on('pageerror',e=>run.pageErrors.push(e.message));page.on('response',r=>{if(r.status()>=400&&r.url().includes('/landscapes/'))run.landscapeFailures.push({status:r.status(),url:r.url()})});page.on('requestfailed',r=>{if(r.url().includes('/landscapes/'))run.landscapeFailures.push({error:r.failure()?.errorText,url:r.url()})});
  const frame=()=>page.frames().find(f=>f.url().includes('/oras-sky-engine/'));
  const state=()=>frame().evaluate(()=>{const c=window.__ORAS_STEL.core;return {id:c.landscapes.current_id,active:c.landscapes.current.active,zeroExists:!!c.landscapes.zero,zeroActive:c.landscapes.zero?.active??false,visible:c.landscapes.visible,atmosphere:c.atmosphere.visible,night:window.orasSkyAdapter.nightMode(),view:window.orasSkyAdapter.navigation()}});
  const setup=async(date)=>{await page.goto(`${base}/sky-engine?date=${encodeURIComponent(date)}`);await page.locator('[data-runtime-mode=sky][data-runtime-status=ready]').waitFor({timeout:90000});await frame().evaluate(()=>{const a=window.orasSkyAdapter;a.restoreView({...a.navigation().camera,fovRad:Math.PI/2,yawRad:0,pitchRad:0,landscapeVisible:true})});await page.waitForTimeout(3500);const s=await state();assert.equal(s.id,id);assert.equal(s.active,true);assert.equal(s.zeroActive,false);assert.equal(s.view.utc,date);return s};
  const shot=async(name)=>{const file=`${name}-${width}.png`;await page.screenshot({path:`${out}/${file}`});const s=await state();run.scenes.push({name,file,state:s});return s};
  const rotate=async(degrees)=>{await frame().evaluate(degrees=>{const a=window.orasSkyAdapter;a.restoreView({...a.navigation().camera,yawRad:degrees*Math.PI/180})},degrees);await page.waitForTimeout(1000)};
  const toggle=async(id)=>{const panel=id==='night'?'Display':'Observing tools';await frame().getByRole('button',{name:panel,exact:true}).click();await frame().locator(`[data-sky-control=${id}]`).click();await frame().getByRole('button',{name:'Close '+panel,exact:true}).click();await page.waitForTimeout(1300)};
  const day=await setup('2026-10-14T17:00:00.000Z');
  for(const yaw of [0,90,180,270,359,0,1,360]){await rotate(yaw);const s=await shot(`day-yaw-${yaw}${yaw===0&&run.scenes.length?'b':''}`);assert.equal(s.zeroActive,false);assert.deepEqual(s.view.observer,day.view.observer);assert.equal(s.view.utc,day.view.utc)}
  // Inspect actual native framebuffer crop, excluding product chrome: textured ground,
  // rather than the previous uniform circle. Qualitative naturalness uses screenshots.
  const file=`${out}/day-yaw-0-${width}.png`;
  run.dayGround=await page.evaluate(async b64=>{const b=await createImageBitmap(new Blob([Uint8Array.from(atob(b64),c=>c.charCodeAt(0))],{type:'image/png'}));const c=new OffscreenCanvas(b.width,b.height),ctx=c.getContext('2d');ctx.drawImage(b,0,0);const colors=new Set(),means=[];for(let y=Math.round(b.height*.6);y<b.height*.75;y+=5)for(let x=Math.round(b.width*.15);x<b.width*.75;x+=5){const p=ctx.getImageData(x,y,1,1).data;colors.add([...p].join(','));means.push((p[0]+p[1]+p[2])/3)}return{uniqueColors:colors.size,min:Math.min(...means),max:Math.max(...means)}},(await readFile(file)).toString('base64'));
  assert.ok(run.dayGround.uniqueColors>100);assert.ok(run.dayGround.max-run.dayGround.min>15);
  await toggle('landscape');assert.equal((await shot('day-landscape-off')).visible,false);await toggle('landscape');assert.equal((await shot('day-landscape-on')).visible,true);
  await toggle('atmosphere');assert.equal((await shot('day-atmosphere-off')).atmosphere,false);await toggle('atmosphere');assert.equal((await state()).atmosphere,true);
  await toggle('night');assert.equal((await shot('day-night-mode-on')).night,true);await toggle('night');assert.equal((await state()).night,false);
  await setup('2026-10-14T02:10:00.000Z');for(const yaw of [0,90,180,270]){await rotate(yaw);await shot(`night-yaw-${yaw}`)}
  await toggle('landscape');assert.equal((await shot('night-landscape-off')).visible,false);await toggle('landscape');assert.equal((await shot('night-landscape-on')).visible,true);
  await toggle('atmosphere');assert.equal((await shot('night-atmosphere-off')).atmosphere,false);await toggle('atmosphere');await toggle('night');assert.equal((await shot('night-mode-on')).night,true);await toggle('night');assert.equal((await shot('night-mode-off')).night,false);
  const before=await state();await frame().evaluate(()=>{window.orasSkyAdapter.presentation(false);window.__ORAS_STEL.core.landscapes.current_id='guereins'});await page.waitForTimeout(1600);run.released=await state();assert.equal(run.released.id,'guereins');await frame().evaluate(()=>window.orasSkyAdapter.presentation(true));await page.waitForTimeout(1600);const after=await shot('embedded-restored');assert.equal(after.id,id);assert.deepEqual(after.view,before.view);assert.equal(after.zeroActive,false);
  await page.goto(`${base}/oras-sky-engine/?date=2026-10-14T17%3A00%3A00.000Z`);await page.waitForFunction(()=>!!window.orasSkyAdapter,{timeout:90000});await page.waitForTimeout(3500);
  run.standalone=await page.evaluate(()=>({id:window.__ORAS_STEL.core.landscapes.current_id,visible:window.__ORAS_STEL.core.landscapes.visible}));assert.equal(run.standalone.id,'guereins');await page.screenshot({path:`${out}/standalone-guereins-${width}.png`});
  assert.deepEqual(run.pageErrors,[]);assert.deepEqual(run.landscapeFailures,[]);run.status='PASS';await context.close();console.log(width,'native Pennsylvania visual matrix PASS');
 }
 for(const name of inputs)assert.equal(sha(await readFile(name)),sourceHashes[name],'input changed during qualification: '+name);
 proof.status='PASS';
}catch(error){proof.status='FAIL';proof.error=error.stack;throw error}
finally{await browser.close();proof.finished=new Date().toISOString();await writeFile(`${out}/proof.json`,JSON.stringify(proof,null,2)+'\n')}
