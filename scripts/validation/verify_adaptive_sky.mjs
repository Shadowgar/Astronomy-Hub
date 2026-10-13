// Real-application qualification. No fixture scene, mocked network or simulated engine.
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'../../node_modules/playwright/index.mjs');
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4201',out=process.env.R1B_EVIDENCE_DIR||'output/r1b/browser';
await mkdir(out,{recursive:true});
const inputs=['frontend/src/features/workspace/WorkspaceShell.tsx','frontend/src/features/workspace/AdaptiveSkyChrome.tsx','frontend/src/features/workspace/adaptiveSky.css','runtimes/sky-adapter/plugin.js','runtimes/sky-adapter/entry.mjs','frontend/public/runtime-versions.json','scripts/validation/verify_adaptive_sky.mjs'];
const hash=b=>createHash('sha256').update(b).digest('hex');
const sourceHashes=Object.fromEntries(await Promise.all(inputs.map(async p=>[p,hash(await readFile(p))])));
const proof={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHashes,base,started:new Date().toISOString(),status:'RUNNING',runs:[]};
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[],missing=new Set();
  await page.addInitScript(()=>{const active=new Set(),add=document.addEventListener.bind(document),remove=document.removeEventListener.bind(document);document.addEventListener=(name,fn,...rest)=>{if(name==='fullscreenchange')active.add(fn);return add(name,fn,...rest)};document.removeEventListener=(name,fn,...rest)=>{if(name==='fullscreenchange')active.delete(fn);return remove(name,fn,...rest)};window.__r1bFullscreenListeners=active});
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.add(`${r.status()} ${r.url()}`)});
  page.setDefaultTimeout(20000);console.log(width,'opening');
  const start=Date.now();await page.goto(base+'/sky-engine?date=2026-10-13T02%3A10%3A00Z');await page.locator('[data-runtime-status=ready]').waitFor({timeout:90000});
  const readyMs=Date.now()-start,frame=page.frames().find(f=>f.url().includes('/oras-sky-engine/'));
  const marker=await (await page.request.get(base+'/oras-sky-engine/oras-runtime-build.json')).json();const local=JSON.parse(await readFile('frontend/public/oras-sky-engine/oras-runtime-build.json','utf8'));assert.equal(marker.artifact_sha256,local.artifact_sha256);
  const appHtml=await (await page.request.get(base+'/')).text();const asset=appHtml.match(/src="(\/assets\/[^" ]+\.js)"/);assert.ok(asset,'built app entry');assert.equal(hash(await (await page.request.get(base+asset[1])).body()),hash(await readFile('frontend/dist'+asset[1])));
  await page.waitForTimeout(3000);await page.screenshot({path:`${out}/sky-${width}.png`});
  const launcher=frame.getByRole('button',{name:'Observing tools',exact:true});await launcher.focus();await launcher.press('Enter');await frame.getByRole('button',{name:'Close Observing tools',exact:true}).press('Escape');assert.equal(await launcher.evaluate(el=>document.activeElement===el),true);
  const get=path=>frame.evaluate(path=>path.split('.').reduce((v,k)=>v[k],document.querySelector('#app').__vue__.$stel.core),path);
  const toggles=[['constellations','constellations','constellations.lines_visible'],['constellations','art','constellations.images_visible'],['observing','atmosphere','atmosphere.visible'],['observing','landscape','landscapes.visible'],['observing','azimuthal','lines.azimuthal.visible'],['observing','equatorial','lines.equatorial_jnow.visible'],['observing','dsos','dsos.visible'],['observing','j2000','lines.equatorial.visible']];
  let group=null;const panelName={constellations:'Constellations',observing:'Observing tools',display:'Display'},verified=[];
  for(const [panel,id,path] of toggles){
   if(group!==panel){if(group)await frame.getByRole('button',{name:'Close '+panelName[group],exact:true}).click();await frame.getByRole('button',{name:panelName[panel],exact:true}).click();group=panel}
   if(id==='j2000'){await frame.locator('summary').click();const b=await frame.locator('summary').boundingBox();assert.ok(b.height>=44)}
   const before=await get(path),control=frame.locator(`[data-sky-control=${id}]`);await control.click();await frame.waitForFunction(({path,before})=>path.split('.').reduce((v,k)=>v[k],document.querySelector('#app').__vue__.$stel.core)!==before,{path,before});
   assert.equal(await control.getAttribute('aria-pressed'),String(!before));if(id==='constellations')assert.equal(await get('constellations.labels_visible'),!before);await control.click();assert.equal(await get(path),before);verified.push(id);
  }
  console.log(width,'observing toggles verified');await page.screenshot({path:`${out}/observing-${width}.png`});
  await frame.getByRole('button',{name:'Close Observing tools',exact:true}).click();await frame.getByRole('button',{name:'Display',exact:true}).click();
  console.log(width,'night/fullscreen');const night=frame.locator('[data-sky-control=night]');await night.click();assert.equal(await frame.locator('#nightmode').evaluate(el=>getComputedStyle(el).visibility),'visible');await night.click();assert.equal(await frame.locator('#nightmode').evaluate(el=>getComputedStyle(el).visibility),'hidden');verified.push('night');
  await frame.locator('[data-sky-action=fullscreen]').click();await page.waitForFunction(()=>document.fullscreenElement===document.documentElement);assert.ok(await page.getByRole('button',{name:'Explore',exact:true}).isVisible());await frame.locator('[data-sky-action=fullscreen]').click();await page.waitForFunction(()=>!document.fullscreenElement);verified.push('fullscreen');await frame.getByRole('button',{name:'Close Display',exact:true}).click();
  // Actual native search -> canonical native selection -> existing Hub selection details.
  console.log(width,'native search');const search=frame.locator('.oras-workspace-search input');await search.fill('Vega');await frame.getByText('Vega',{exact:true}).first().waitFor({timeout:45000});await frame.getByText('Vega',{exact:true}).first().click();await frame.waitForFunction(()=>window.orasSkyAdapter.snapshot().selection?.name?.includes('Vega'),{timeout:30000});
  const selection=await frame.evaluate(()=>window.orasSkyAdapter.snapshot().selection);assert.ok(selection.catalog&&selection.source_id&&selection.model);await page.waitForTimeout(1200);await page.screenshot({path:`${out}/selection-${width}.png`});
  if(width===390){await page.getByRole('button',{name:'Close sheet',exact:true}).click()}
  console.log(width,'location/time');await page.getByRole('button',{name:'Observing location',exact:true}).click();await page.getByLabel('Latitude',{exact:true}).fill('42');await page.getByLabel('Longitude',{exact:true}).fill('-80');await page.getByLabel('Elevation (m)',{exact:true}).fill('400');await page.getByRole('button',{name:'Apply location',exact:true}).click();await page.locator('dialog').waitFor({state:'hidden'});assert.ok(Math.abs(await get('observer.latitude')*180/Math.PI-42)<1e-6);assert.equal(await get('observer.elevation'),400);
  await page.getByRole('button',{name:'Change time',exact:true}).click();const oldTime=await get('observer.utc');await page.getByRole('button',{name:'+1h',exact:true}).click();await frame.waitForFunction(old=>Math.abs(window.orasSkyAdapter.observer.utc-old-1/24)<1e-5,oldTime);await page.getByRole('button',{name:width===390?'Close sheet':'Close panel',exact:true}).click();
  const fov=await get('fov');await page.mouse.move(width/2,250);await page.mouse.wheel(0,240);await page.waitForTimeout(500);assert.notEqual(await get('fov'),fov);
  await page.getByRole('button',{name:'Explore',exact:true}).click();await page.getByRole('button',{name:'Close dialog',exact:true}).click();assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-label')),'Explore');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
  const renderer=await frame.evaluate(()=>{const gl=document.querySelector('#stel-canvas').getContext('webgl2')||document.querySelector('#stel-canvas').getContext('webgl');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return {renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unreported',fps:document.querySelector('#app').__vue__.$stel.core.fps}});
  // Existing route switch, NOT a continuous scale journey. Serial disposal must survive repeat returns.
  console.log(width,'lifecycle');for(let cycle=0;cycle<2;cycle++){
   await page.getByRole('button',{name:'Explore',exact:true}).click();await page.getByRole('button',{name:'Earth Explore our planet'}).click();await page.locator('[data-runtime-mode=earth][data-runtime-status=ready]').waitFor({timeout:90000});assert.equal(await page.locator('iframe').count(),1);assert.equal(await page.locator('.as-header').count(),0);assert.equal(await page.evaluate(()=>window.__r1bFullscreenListeners.size),0);await page.getByRole('tab',{name:'Sky',exact:true}).click();await page.locator('[data-runtime-mode=sky][data-runtime-status=ready]').waitFor({timeout:90000});assert.equal(await page.locator('iframe').count(),1);assert.equal(await page.evaluate(()=>window.__r1bFullscreenListeners.size),1);const restored=page.frames().find(f=>f.url().includes('/oras-sky-engine/'));await restored.waitForFunction(id=>window.orasSkyAdapter.snapshot().selection?.source_id===id,selection.source_id);
  }
  proof.runs.push({width,readyMs,renderer,verified,selection,missingResponses:[...missing],pageErrors:errors,screenshots:[`sky-${width}.png`,`observing-${width}.png`,`selection-${width}.png`]});await context.close();
 }
 for(const p of inputs)assert.equal(hash(await readFile(p)),sourceHashes[p],'source changed during qualification');
 proof.status='PASS';
}catch(error){proof.status='FAIL';proof.error=error.stack;throw error}
finally{await browser.close();proof.finished=new Date().toISOString();await writeFile(`${out}/proof.json`,JSON.stringify(proof,null,2)+'\n')}
