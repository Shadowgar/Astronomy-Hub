// Design-reference browser proof only; imports an already installed Playwright.
// PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node .../verify.mjs
import assert from 'node:assert/strict';
import {mkdir, writeFile, readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.dirname(fileURLToPath(import.meta.url));
const evidence=path.join(root,'evidence'); await mkdir(evidence,{recursive:true});
const base=(process.env.DESIGN_PREVIEW_URL || 'http://127.0.0.1:4200').replace(/\/$/,'');
const sourceNames=['explorer.html','reference.css','reference.js','index.html','gallery.css','system.html','review.html'];
const sourceBytes=new Map(await Promise.all(sourceNames.map(async name=>[name,await readFile(path.join(root,name))])));
const sourceHashes=Object.fromEntries([...sourceBytes].map(([name,bytes])=>[name,createHash('sha256').update(bytes).digest('hex')]));
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
// Disable the browser HTTP cache so every loaded source response is inspectable.
await context.route('**/*',route=>route.continue());
const page=await context.newPage();
const failures=[],checks=[],errors=[],requests=new Set();
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>requests.add(r.url()));
const sourceResponses=[],sourceErrors=[],servedSources=new Set();
page.on('response',response=>{
 const url=response.url();
 if(!url.startsWith(base+'/'))return;
 const relative=decodeURIComponent(new URL(url).pathname.slice(new URL(base+'/').pathname.length));
 if(!sourceBytes.has(relative))return;
 sourceResponses.push((async()=>{
  try {
   assert.equal(response.status(),200,`served status: ${relative}`);
   const digest=createHash('sha256').update(await response.body()).digest('hex');
   assert.equal(digest,sourceHashes[relative],`served source mismatch: ${relative}`);
   servedSources.add(relative);
  } catch(error) { sourceErrors.push(error.message); }
 })());
});
const check=async(name,fn)=>{try{await fn();checks.push(name);console.log('PASS:',name);}catch(e){failures.push({name,error:e.message});console.error('FAIL:',name,e.message);}};
await check('Preview preflight: all seven served visual sources match the local snapshot',async()=>{
 for(const name of sourceNames){
  const response=await context.request.get(`${base}/${name}`);
  assert.equal(response.status(),200,`preview status: ${name}`);
  assert.equal(createHash('sha256').update(await response.body()).digest('hex'),sourceHashes[name],`preview source mismatch: ${name}`);
 }
});
// A mismatched preview must not overwrite any screenshot or success ledger.
if(failures.length){await browser.close();process.exit(1);}
const open=async(query)=>{await page.goto(`${base}/explorer.html?${query}`);await page.evaluate(()=>document.fonts.ready);};
const shot=async(name)=>page.screenshot({path:path.join(evidence,`${name}.png`),fullPage:true});
const tools={sky:['Constellations','Observing tools','Display'],solar:['Orbits','Simulation time','Display'],earth:['Layers','Weather','Aircraft','Satellites'],moon:['Landmarks','Scientific layers','Terrain & navigation','About the Moon']};
const modes=Object.keys(tools);
for(const [size,viewport] of Object.entries({desktop:{width:1440,height:900},mobile:{width:390,height:844}})){
 await page.setViewportSize(viewport);
 for(const mode of modes){
  await check(`${mode} ${size}: isolated tools, visible controls, no overflow`,async()=>{
   await open(`mode=${mode}`);
   const labels=await page.locator('.toolrail button').evaluateAll(els=>els.map(e=>e.getAttribute('aria-label')));
   assert.deepEqual(labels,tools[mode]);
   assert.equal(await page.locator('.panel').count(),0);
   assert.equal(await page.locator('.review-ribbon').innerText().then(s=>s.includes('PENDING OWNER VISUAL ACCEPTANCE')),true);
   assert(await page.getByRole('button',{name:'Explore',exact:true}).isVisible());
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   const blocked=await page.locator('.topbar button,.toolrail button,.bottom-context,.time-control button,.nav-control button,.source-link').evaluateAll(els=>els.filter(e=>e.getBoundingClientRect().width && getComputedStyle(e).visibility!=='hidden').filter(e=>{const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !e.contains(hit);}).map(e=>e.getAttribute('aria-label')||e.textContent));
   assert.deepEqual(blocked,[],'controls occluded');
   await shot(`${mode}-${size}`);
  });
 }
}
await page.setViewportSize({width:1440,height:900});
await check('Earth search: place, address, coordinate, ambiguity, invalid, empty and failure states',async()=>{
 await open('mode=earth'); await page.getByRole('button',{name:'Search address, place or coordinates'}).click();
 const q=page.locator('#query');
 for(const value of ['Pittsburgh','1 Allegheny Ave','40.44, -80.00','Springfield']){
  await q.fill(value); const count=await page.locator('[data-result]').count(); assert.equal(count,value==='Springfield'?2:value==='Pittsburgh'?2:1);
 }
 await q.fill('91, 0'); assert.match(await page.locator('#results').innerText(),/−90 to 90/);
 await q.fill('9999, 9999');assert.equal(await page.locator('[data-result]').count(),0);
 await q.fill('unlisted place');assert.match(await page.locator('#results').innerText(),/No matching sample/);
 await q.fill('offline');assert.match(await page.locator('#results').innerText(),/temporarily unavailable/);
 await q.fill('40.44, -80.00');await page.locator('[data-result]').click();assert.match(await page.locator('.panel').innerText(),/40.44, -80.00/);
 await page.getByRole('button',{name:'Dismiss panel'}).click();assert(await page.locator('[data-search]').evaluate(e=>document.activeElement===e));
});
await check('Keyboard: slash search, modal focus confinement, Escape restores trigger',async()=>{
 await open('mode=sky');await page.keyboard.press('/');assert(await page.locator('#query').evaluate(e=>document.activeElement===e));
 for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert(await page.locator('#modal').evaluate(e=>e.contains(document.activeElement)));}
 for(let i=0;i<12;i++){await page.keyboard.press('Shift+Tab');assert(await page.locator('#modal').evaluate(e=>e.contains(document.activeElement)));}
 await page.keyboard.press('Escape');assert.equal(await page.locator('#modal').evaluate(e=>e.open),false);assert(await page.locator('[data-search]').evaluate(e=>document.activeElement===e));
});
await check('Context panels: one owner, toggle state, nested sources and dismissal focus',async()=>{
 await open('mode=earth');const layers=page.getByRole('button',{name:'Layers',exact:true});await layers.click();
 await page.getByRole('button',{name:'Place labels Names without visual clutter'}).click();assert.equal(await page.locator('[data-toggle]').first().getAttribute('aria-pressed'),'false');
 await page.getByRole('button',{name:'Imagery & sources Credits, coverage and detail status'}).click();assert.equal(await page.locator('.panel').count(),1);
 await page.keyboard.press('Escape');assert(await layers.evaluate(e=>e===document.activeElement));
});
await check('Explore: cancel, change context, browser Back, body approach and unsupported surface',async()=>{
 await open('mode=sky');await page.getByRole('button',{name:'Explore',exact:true}).click();await page.locator('[data-destination="earth"]').click();await page.getByRole('button',{name:'Stay here'}).click();assert.equal(await page.locator('.explorer').getAttribute('data-mode'),'sky');
 await page.getByRole('button',{name:'Explore',exact:true}).click();await page.locator('[data-destination="solar"]').click();await page.getByRole('button',{name:'Open Solar System'}).click();assert.equal(await page.locator('.explorer').getAttribute('data-mode'),'solar');
 await page.getByRole('button',{name:'Moon',exact:true}).click();await page.getByRole('button',{name:'Approach',exact:true}).click();await page.getByRole('button',{name:'Open Moon'}).click();assert.equal(await page.locator('.explorer').getAttribute('data-mode'),'moon');
 await page.goBack();assert.equal(await page.locator('.explorer').getAttribute('data-mode'),'solar');await page.getByRole('button',{name:'Mars',exact:true}).click();await page.getByRole('button',{name:'Approach',exact:true}).click();assert.match(await page.locator('dialog').innerText(),/Mars surface is unavailable/);await page.getByRole('button',{name:'Try again',exact:true}).click();assert.match(await page.locator('dialog').innerText(),/No network request was sent/);
});
await check('Reduced motion and transparency: explicit preferences and OS motion preference',async()=>{
 await open('mode=sky&state=settings');await page.locator('[data-solid]').click();await page.locator('[data-motion]').click();
 assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('solid')&&e.classList.contains('no-motion')),true);
 assert.equal(await page.locator('.glass').first().evaluate(e=>getComputedStyle(e).backdropFilter),'blur(0px)');
 await page.emulateMedia({reducedMotion:'reduce'});await open('mode=sky');assert(await page.locator('body').evaluate(e=>e.classList.contains('no-motion')));await page.emulateMedia({reducedMotion:'no-preference'});
});
await check('320px and short mobile: default layouts and bottom sheets stay within viewport',async()=>{
 for(const [width,height] of [[320,740],[390,667]]){
  await page.setViewportSize({width,height});
  for(const mode of modes){await open(`mode=${mode}&state=selected`);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);const b=await page.locator('.panel').boundingBox();assert(b.x>=0 && b.x+b.width<=width && b.y>=32 && b.y+b.height<=height);await page.getByRole('button',{name:'Dismiss panel'}).click();}
 }
});
const captures=[
 ['sky-tools','sky','constellation'],['solar-selected','solar','selected'],['earth-search','earth','search'],['earth-layers','earth','layers'],['moon-layers','moon','layers'],['explore','sky','explore'],['loading','earth','loading'],['unavailable','earth','unavailable'],['contrast-bright','earth','layers','surface=bright'],['contrast-reduced','sky','settings','surface=dark&transparency=reduced&motion=reduced']
];
await page.setViewportSize({width:1440,height:900});
for(const [name,mode,state,extra=''] of captures){await open(`mode=${mode}&state=${state}&${extra}`);await page.mouse.move(700,850);await shot(name);}
await page.setViewportSize({width:390,height:844});await open('mode=earth&state=selected');await shot('earth-selected-mobile');
await page.setViewportSize({width:1440,height:1000});
await check('Gallery, token reference and mobile review open without missing local assets',async()=>{
 for(const file of ['index.html','system.html','review.html?mode=earth']){
  const response=await page.goto(`${base}/${file}`);assert.equal(response.status(),200);await page.evaluate(()=>document.fonts.ready);
  assert.deepEqual(await page.locator('img').evaluateAll(els=>els.filter(e=>!e.complete||e.naturalWidth===0).map(e=>e.src)),[]);
  if(file==='system.html') await shot('shared-system');
 }
});
await check('URL modes: invalid and inherited keys cannot enter HTML on load or history restoration',async()=>{
 for(const value of ['constructor','__proto__','toString','<img src=x onerror=alert(1)>']) {
  await open(`mode=${encodeURIComponent(value)}`);
  assert.equal(await page.evaluate(()=>document.querySelector('.explorer')?.dataset.mode),'sky');
  await open('mode=earth');
  await page.evaluate(v=>{history.pushState({},'',`?mode=${encodeURIComponent(v)}`);dispatchEvent(new PopStateEvent('popstate'));},value);
  assert.equal(await page.locator('.explorer').getAttribute('data-mode'),'sky');
  assert.equal(await page.locator('img').count(),0);
 }
});
await check('No script errors or external network/provider requests',async()=>{assert.deepEqual(errors,[]);assert.deepEqual([...requests].filter(u=>!u.startsWith(base+'/')),[]);});
await Promise.all(sourceResponses);
await check('Proof binding: every loaded source matched and local files stayed unchanged',async()=>{
 assert.deepEqual(sourceErrors,[]);
 assert.deepEqual([...servedSources].sort(),[...sourceNames].sort());
 for(const name of sourceNames)assert.equal(createHash('sha256').update(await readFile(path.join(root,name))).digest('hex'),sourceHashes[name],`local source changed: ${name}`);
});
if(failures.length){await browser.close();console.error(`${checks.length} passed; ${failures.length} failed; success ledger not written`);process.exit(1);}
const hashes=sourceHashes;
const report={revision:'R1-A/01',acceptance:'PENDING OWNER VISUAL ACCEPTANCE',evidenceClass:'Local Chromium headless design reference; no renderer or physical-device qualification',browser:browser.version(),capturedAt:new Date().toISOString(),viewports:{desktop:[1440,900],mobile:[390,844],additional:[[320,740],[390,667]]},checks,failures,errors,externalRequests:[...requests].filter(u=>!u.startsWith(base+'/')),sourceSha256:hashes,servedSourceSha256:hashes,previewUrl:base,proofBinding:'Preflight and every browser-loaded visual source matched the local snapshot; local sources rechecked before ledger write'};
await writeFile(path.join(evidence,'browser-proof.json'),JSON.stringify(report,null,2)+'\n');
await browser.close();
console.log(`${checks.length} passed; ${failures.length} failed`);
if(failures.length)process.exitCode=1;
