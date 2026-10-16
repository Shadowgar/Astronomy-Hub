import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from '../../node_modules/playwright/index.mjs';
const out=process.env.N1_EVIDENCE_DIR||'output/n1/remediation/elevation',base='http://127.0.0.1:4202',utc='2026-06-05T02:10:00.000Z';await mkdir(out,{recursive:true});
const inputs=['scripts/validation/verify_n1_elevation.mjs','packages/runtime-protocol/observer-elevation.mjs','packages/runtime-protocol/index.mjs','runtimes/sky-adapter/plugin.js','runtimes/sky-adapter/entry.mjs','runtimes/earth-runtime/core/navigationObserver.mjs','runtimes/earth-runtime/core/EarthRuntime.mjs','frontend/src/features/workspace/useViewNavigation.ts','frontend/src/features/workspace/observerProvenance.ts','frontend/src/features/sky-engine/RuntimeHost.tsx','integrations/renderers.lock.json','frontend/public/runtime-versions.json'];
const hash=b=>createHash('sha256').update(b).digest('hex'),sourceHashes={};for(const name of inputs)sourceHashes[name]=hash(await readFile(name));
const site=JSON.parse(await readFile('frontend/src/config/orasSite.json'));
const ny={lat:40.7829,lon:-73.9654};
const cases=[
 {name:'qualified-oras',lat:site.latitude,lon:site.longitude,elev:site.elevationMeters,claim:'oras-site',source:'oras-site'},
 {name:'provided-new-york',...ny,elev:123,claim:'provided',source:'provided'},
 {name:'false-oras',...ny,elev:123,claim:'oras-site',source:'provided'},
 {name:'false-zero',...ny,elev:123,claim:'unavailable-zero',source:'provided'},
 {name:'genuine-zero-fallback',...ny,claim:'unavailable-zero',source:'unavailable-zero'},
 {name:'malformed-source',...ny,elev:123,claim:'invalid',source:'provided'},
 {name:'missing-source',...ny,elev:123,source:'provided'},
 {name:'explicit-provided-zero',...ny,elev:0,claim:'provided',source:'provided'},
 {name:'provided-height-at-oras',lat:site.latitude,lon:site.longitude,elev:123,claim:'oras-site',source:'provided'}
];
const proof={status:'RUNNING',sourceHashes,runs:[],limitations:['Real Chromium with emulated mobile; no physical-device qualification.'],started:new Date().toISOString()},browser=await chromium.launch({headless:true});
try{
 for(const width of (process.env.N1_WIDTHS||'1440,390').split(',').map(Number)){
  const context=await browser.newContext({viewport:{width,height:width<768?844:900},isMobile:width<768,hasTouch:width<768}),page=await context.newPage(),run={width,status:'RUNNING',pageErrors:[],cases:[]};proof.runs.push(run);page.on('pageerror',e=>run.pageErrors.push(e.message));
  const frame=()=>page.frames().find(f=>f.url().includes('/oras-sky-engine/')||f.url().includes('/earth-runtime/'));
  const ready=async mode=>{await page.locator(`[data-runtime-mode=${mode}][data-runtime-status=ready]`).waitFor({timeout:90000});await page.locator('.ws-handoff').waitFor({state:'hidden',timeout:90000});assert.equal(await page.locator('iframe').count(),1)};
  const state=()=>frame().evaluate(()=>window.orasSkyAdapter?.navigation()||window.orasEarthDiagnostics().navigation);
  const explore=async()=>{const reveal=page.locator('.ws-reveal');if(await reveal.isVisible())await reveal.click();await page.getByRole('button',{name:'Explore',exact:true}).click();await page.locator('dialog[open]').waitFor()};
  const alt=async mode=>{await explore();await page.getByRole('button',{name:mode==='earth'?'Earth Explore our planet':'Enter Sky here',exact:true}).press('Enter');await ready(mode)};
  const check=async c=>{const s=await state();assert.ok(Math.abs(s.observer.lat-c.lat)<1e-5);assert.ok(Math.abs(s.observer.lon-c.lon)<1e-5);assert.equal(s.observer.elevationM,c.elev??0);assert.equal(s.elevationSource,c.source);assert.equal(s.utc,utc);assert.equal(s.live,false);return s};
  for(const c of cases){
   const p=new URLSearchParams({lat:String(c.lat),lng:String(c.lon),date:utc});if(c.elev!==undefined)p.set('elev',String(c.elev));if(c.claim)p.set('elevationSource',c.claim);
   await page.goto(`${base}/sky-engine?${p}`);await ready('sky');const row={name:c.name,originalURL:page.url(),sky:await check(c)};
   assert.equal(await page.getByText('Elevation unavailable · 0 m fallback',{exact:true}).isVisible(),c.source==='unavailable-zero');
   await page.screenshot({path:`${out}/${c.name}-initial-${width}.png`});
   await alt('earth');row.earth=await check(c);await alt('sky');row.returned=await check(c);
   await page.goBack();await ready('earth');row.back=await check(c);await page.goForward();await ready('sky');row.forward=await check(c);
   await page.reload();await ready('sky');row.reloaded=await check(c);await page.screenshot({path:`${out}/${c.name}-returned-${width}.png`});run.cases.push(row);console.log(width,c.name,'round trip / reload / Back / Forward PASS');
  }
  // A restored explicitly supplied zero is not an absent URL measurement.
  const restored={name:'restored-provided-zero-bare-url',...ny,elev:0,source:'provided'};
  await page.goto(`${base}/sky-engine?lat=${ny.lat}&lng=${ny.lon}&elev=0&elevationSource=provided&date=${encodeURIComponent(utc)}`);await ready('sky');await check(restored);
  await page.goto(`${base}/sky-engine?date=${encodeURIComponent(utc)}`);await ready('sky');const restoredRow={name:restored.name,sky:await check(restored)};assert.equal(await page.getByText('Elevation unavailable · 0 m fallback',{exact:true}).isVisible(),false);
  await page.goto(`${base}/sky-engine?date=${encodeURIComponent(utc)}&elevationSource=unavailable-zero`);await ready('sky');restoredRow.unboundClaim=await check(restored);
  await alt('earth');restoredRow.earth=await check(restored);await alt('sky');restoredRow.returned=await check(restored);await page.reload();await ready('sky');restoredRow.reloaded=await check(restored);run.cases.push(restoredRow);await page.screenshot({path:`${out}/restored-provided-zero-${width}.png`});console.log(width,restored.name,'PASS');
  await page.goto(`${base}/sky-engine?lat=${ny.lat}&lng=${ny.lon}&elev=123&elevationSource=provided`);await ready('sky');run.live=[];
  for(const mode of ['sky','earth','sky']){if(mode!==(await state()).mode)await alt(mode);const s=await state();assert.equal(s.live,true);assert.equal(s.observer.elevationM,123);assert.equal(s.elevationSource,'provided');assert.ok(Math.abs(Date.parse(s.utc)-Date.now())<30000);run.live.push(s)}
  assert.deepEqual(run.pageErrors,[]);run.status='PASS';await context.close();console.log(width,'live-time provenance PASS');
 }
 for(const name of inputs)assert.equal(hash(await readFile(name)),sourceHashes[name],'input changed during qualification: '+name);proof.status='PASS';
}catch(error){proof.status='FAIL';proof.error=error.stack;throw error}
finally{await browser.close();proof.finished=new Date().toISOString();await writeFile(`${out}/proof.json`,JSON.stringify(proof,null,2)+'\n')}
