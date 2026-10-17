// PR74 cached-page fullscreen qualification against the real contained SWE runtime.
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'../../node_modules/playwright/index.mjs');
const base=process.env.PLAYWRIGHT_BASE_URL||'http://127.0.0.1:4201',out=process.env.R1B_EVIDENCE_DIR||'output/r1b-cached-fullscreen/browser';
await mkdir(out,{recursive:true});
const inputs=['runtimes/sky-adapter/plugin.js','runtimes/sky-adapter/entry.mjs','runtimes/sky-adapter/native-panels.mjs','frontend/public/runtime-versions.json','scripts/validation/verify_sky_cached_fullscreen.mjs'];
const hash=b=>createHash('sha256').update(b).digest('hex');
const sourceHashes=Object.fromEntries(await Promise.all(inputs.map(async p=>[p,hash(await readFile(p))])));
const proof={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHashes,base,started:new Date().toISOString(),status:'RUNNING',runs:[]};
let browser,page;
try{
 browser=await chromium.launch({channel:'chromium',headless:true,ignoreDefaultArgs:['--disable-back-forward-cache']});
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900}});page=await context.newPage();page.setDefaultTimeout(20000);
  const errors=[],cacheFailures=[];page.on('pageerror',error=>errors.push(error.message));
  const cdp=await context.newCDPSession(page);await cdp.send('Page.enable');cdp.on('Page.backForwardCacheNotUsed',event=>cacheFailures.push(event));
  await page.addInitScript(()=>{
   window.__cachedFullscreen={identity:crypto.randomUUID(),restored:0,hide:[]};
   addEventListener('pageshow',event=>{if(event.persisted)window.__cachedFullscreen.restored++});
   addEventListener('pagehide',event=>window.__cachedFullscreen.hide.push(event.persisted));
   const active=new Set(),add=document.addEventListener.bind(document),remove=document.removeEventListener.bind(document);
   document.addEventListener=(name,fn,...rest)=>{if(name==='fullscreenchange')active.add(fn);return add(name,fn,...rest)};
   document.removeEventListener=(name,fn,...rest)=>{if(name==='fullscreenchange')active.delete(fn);return remove(name,fn,...rest)};
   window.__fullscreenListeners=active;
  });
  const frame=()=>page.frames().find(f=>f.url().includes('/oras-sky-engine/'));
  const ready=()=>page.locator('[data-runtime-mode=sky][data-runtime-status=ready]').waitFor({timeout:90000});
  await page.goto(base+'/sky-engine?date=2026-10-13T02%3A10%3A00Z');await ready();
  const html=await (await page.request.get(base+'/')).text(),asset=html.match(/src="(\/assets\/[^" ]+\.js)"/);assert.ok(asset);
  assert.equal(hash(await (await page.request.get(base+asset[1])).body()),hash(await readFile('frontend/dist'+asset[1])));
  const marker=await (await page.request.get(base+'/oras-sky-engine/oras-runtime-build.json')).json();
  assert.equal(marker.artifact_sha256,JSON.parse(await readFile('frontend/public/oras-sky-engine/oras-runtime-build.json')).artifact_sha256);
  // Check the actual served native bundle, not only its identity marker.
  const skyHtml=await (await page.request.get(base+'/oras-sky-engine/')).text(),app=skyHtml.match(/src="([^" ]*\/app\.[^" ]+\.js)"/);assert.ok(app);
  const appUrl=new URL(app[1],base+'/oras-sky-engine/');
  assert.equal(hash(await (await page.request.get(appUrl.href)).body()),hash(await readFile('frontend/public'+appUrl.pathname)));
  const identity=await page.evaluate(()=>window.__cachedFullscreen.identity),nativeIdentity=await frame().evaluate(()=>window.__cachedFullscreen.identity);
  await frame().getByRole('button',{name:'Display',exact:true}).click();
  const state=async()=>({actual:await page.evaluate(()=>!!document.fullscreenElement),native:await frame().evaluate(()=>document.querySelector('#app').__vue__.$store.state.fullscreen),label:(await frame().locator('[data-sky-action=fullscreen]').innerText()).trim(),listeners:await page.evaluate(()=>window.__fullscreenListeners.size)});
  const expectState=async(enabled)=>{
   await page.waitForFunction(enabled=>!!document.fullscreenElement===enabled,enabled);
   await frame().waitForFunction(enabled=>document.querySelector('#app').__vue__.$store.state.fullscreen===enabled,enabled);
   const current=await state();assert.equal(current.label,(enabled?'Exit fullscreen':'Fullscreen')+'\n↗');assert.equal(current.listeners,1);return current;
  };
  const cycles=[];
  for(let i=0;i<3;i++){
   await expectState(false);await frame().locator('[data-sky-action=fullscreen]').click();const entered=await expectState(true);
   await page.goto(base+'/observe');await page.goBack({waitUntil:'commit'});await ready();
   const hostCache=await page.evaluate(()=>window.__cachedFullscreen),nativeCache=await frame().evaluate(()=>window.__cachedFullscreen);
   if(hostCache.identity!==identity||nativeCache.identity!==nativeIdentity||hostCache.restored!==i+1||nativeCache.restored!==i+1){
    proof.runs.push({width,status:'NOT_SUPPORTED',hostCache,nativeCache,cacheFailures});throw new Error('Actual cached-page restoration was not available; no synthetic cache proof accepted');
   }
   assert.equal(hostCache.hide.at(-1),true);assert.equal(nativeCache.hide.at(-1),true);
   // Chromium leaves fullscreen on document navigation. Resume must reflect that state.
   const resumed=await expectState(false);
   await frame().locator('[data-sky-action=fullscreen]').click();const reentered=await expectState(true);
   await frame().locator('[data-sky-action=fullscreen]').click();const exited=await expectState(false);
   cycles.push({cycle:i+1,entered,resumed,reentered,exited,hostCache,nativeCache});
  }
  await page.screenshot({path:`${out}/cached-fullscreen-${width}.png`});
  await frame().getByRole('button',{name:'Close Display',exact:true}).click();
  // Real active renderer disposal and recreation: parent listener ownership is released.
  await page.getByRole('button',{name:'Explore',exact:true}).click();await page.getByRole('button',{name:'Earth Explore our planet'}).click();
  await page.locator('[data-runtime-mode=earth][data-runtime-status=ready]').waitFor({timeout:90000});assert.equal(await page.evaluate(()=>window.__fullscreenListeners.size),0);
  await page.getByRole('tab',{name:'Sky',exact:true}).click();await ready();assert.equal(await page.evaluate(()=>window.__fullscreenListeners.size),1);
  assert.deepEqual(errors,[]);proof.runs.push({width,status:'PASS',artifact:marker.artifact_sha256,cycles,disposal:'zero parent listeners on Earth, exactly one after Sky recreation',pageErrors:errors,screenshot:`cached-fullscreen-${width}.png`});
  console.log(width,'PASS: three real cached returns, state/labels synchronized, one listener, disposal clean');await context.close();page=null;
 }
 for(const p of inputs)assert.equal(hash(await readFile(p)),sourceHashes[p],'source changed during qualification');proof.status='PASS';
}catch(error){proof.status=proof.runs.some(run=>run.status==='NOT_SUPPORTED')?'NOT_SUPPORTED':'FAIL';proof.error=error.stack;if(page)await page.screenshot({path:`${out}/failure.png`}).catch(()=>{});throw error}
finally{if(browser)await browser.close();proof.finished=new Date().toISOString();await writeFile(`${out}/proof.json`,JSON.stringify(proof,null,2)+'\n')}
