import {test,expect} from '@playwright/test'
const checksum=(s:string)=>{const padded=s.padEnd(68,' ');return padded+[...padded].reduce((sum,c)=>sum+(/\d/.test(c)?Number(c):c==='-'?1:0),0)%10}
const days=(date:Date)=>Math.floor((date.getTime()-Date.UTC(date.getUTCFullYear(),0,0))/86400000)
const epoch=`${String(new Date().getUTCFullYear()).slice(-2)}${String(days(new Date())).padStart(3,'0')}.50000000`
const tle=['QUALIFICATION FIXTURE',checksum(`1 25544U 98067A   ${epoch}  .00016717  00000-0  30122-3 0  999`),checksum('2 25544  51.6434 208.5775 0007417  88.2575  28.5079 15.5038153244978')].join('\n')
async function providers(page:any){
 await page.route('**/api/earth/aircraft?*',(route:any)=>route.fulfill({json:{now:Date.now(),ac:[{hex:'abc123',flight:'QUALIFICATION',lat:41.35,lon:-79.55,alt_geom:10000,seen:0,seen_pos:0}]}}))
 await page.route('https://celestrak.org/**',(route:any)=>route.fulfill({contentType:'text/plain',body:tle}))
 await page.route('https://api.open-meteo.com/**',(route:any)=>route.fulfill({json:{current:{temperature_2m:12,cloud_cover:50,weather_code:3,time:new Date().toISOString().slice(0,16)}}}))
}
for(const [label,width,height] of [['desktop',1440,900],['mobile',390,844]] as const){
 test(`owned Earth core and selective adapters fixture ${label}`,async({page})=>{
  test.setTimeout(120000);await page.setViewportSize({width,height});await providers(page);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/earth');
  await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:90000});const earth=page.frames().find(f=>f.url().includes('/earth-runtime/'))!;
  const diagnostics=await earth.evaluate(()=> (window as any).orasEarthDiagnostics());expect(diagnostics.owner).toBe('Astronomy Hub');expect(diagnostics.site).toEqual({lat:41.321903,lon:-79.585394,elevationM:432.816});expect(diagnostics.layers).toHaveLength(4);
  await expect(earth.locator('#attributions')).toContainText('Natural Earth');await expect(earth.locator('#attributions')).toContainText('God’s Eye MIT');await expect(earth.locator('#app-header,#data-panel,#control-panel-toggle')).toHaveCount(0);
  const canvas=earth.locator('canvas').first(),box=await canvas.boundingBox();await canvas.click({position:{x:box!.width/2,y:box!.height/2}});await expect(earth.locator('#selected-name')).toContainText('Oil Region');
  await earth.getByRole('button',{name:'Track',exact:true}).click();expect((await earth.evaluate(()=> (window as any).orasEarthDiagnostics())).tracking).toBe('oras-site');await earth.getByRole('button',{name:'Stop tracking'}).click();await earth.getByRole('button',{name:'Focus',exact:true}).click();await earth.getByRole('button',{name:'Return to ORAS'}).click();
  for(const [id,title] of [['aircraft','Aircraft near ORAS'],['satellites','Satellites · stations'],['weather','Weather at ORAS']]){
   await earth.getByRole('checkbox',{name:title,exact:true}).check();const row=earth.locator(`[data-layer-id=${id}]`);await expect(row.locator('[data-provider-status=ready]')).toBeVisible({timeout:20000});await expect(row).toContainText('LIVE_ONLY');await expect(earth.locator('#attributions')).toContainText(id==='aircraft'?'ODbL':id==='weather'?'Open-Meteo':'CelesTrak');
   await earth.getByRole('checkbox',{name:title,exact:true}).uncheck();await expect(row).toHaveAttribute('data-layer-status','disabled');
  }
  // Each provider failure is distinct from runtime readiness and retryable.
  await page.unroute('**/api/earth/aircraft?*');await page.route('**/api/earth/aircraft?*',r=>r.fulfill({status:503,json:{detail:'fixture unavailable'}}));await earth.getByRole('checkbox',{name:'Aircraft near ORAS'}).check();await expect(earth.locator('[data-layer-id=aircraft] [data-provider-status=unavailable]')).toBeVisible();await expect(page.locator('[data-runtime-status=ready]')).toBeVisible();await page.unroute('**/api/earth/aircraft?*');await providers(page);await earth.getByRole('button',{name:'Retry Aircraft near ORAS'}).click();await expect(earth.locator('[data-layer-id=aircraft] [data-provider-status=ready]')).toBeVisible();
  await page.screenshot({path:`../output/playwright/owned-earth-${label}.png`});console.log(`EARTH_TIMINGS ${label}`,JSON.stringify((await earth.evaluate(()=> (window as any).orasEarthDiagnostics())).timings));expect(errors).toEqual([]);
 })
 test(`all adapters unavailable without blocking Viewer ${label}`,async({page})=>{
  test.setTimeout(90000);await page.setViewportSize({width,height});
  for(const url of ['**/api/earth/aircraft?*','https://celestrak.org/**','https://api.open-meteo.com/**'])await page.route(url,r=>r.fulfill({status:503,body:'Qualification unavailable'}));
  await page.goto('/earth');await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:60000});const earth=page.frames().find(f=>f.url().includes('/earth-runtime/'))!;
  for(const [id,title] of [['aircraft','Aircraft near ORAS'],['satellites','Satellites · stations'],['weather','Weather at ORAS']]){
   await earth.getByRole('checkbox',{name:title,exact:true}).check();await expect(earth.locator(`[data-layer-id=${id}] [data-provider-status=unavailable]`)).toBeVisible({timeout:20000});await earth.getByRole('checkbox',{name:title,exact:true}).uncheck();
  }
  await expect(page.locator('[data-runtime-status=ready]')).toBeVisible();
 })
 test(`serial five-switch loop and teardown ${label}`,async({page})=>{
  test.setTimeout(240000);await page.setViewportSize({width,height});await page.goto('/sky-engine?date=2020-01-01T00%3A00%3A00Z');const oldFrames:any[]=[],disposals:any[]=[];let priorEarth=0;await page.exposeFunction('recordEarthDisposal',(value:any)=>disposals.push(value));
  for(const mode of ['sky','earth','sky','earth','sky']){
   if((mode==='earth')!==page.url().includes('/earth')){
    await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:mode==='earth'?'Earth':'Sky',exact:true}).click();
   }
   await expect(page.locator(`[data-runtime-mode=${mode}][data-runtime-status=ready]`)).toBeVisible({timeout:90000});await expect(page.locator('iframe')).toHaveCount(1);
   for(const handle of oldFrames)expect(await handle.evaluate((node:HTMLIFrameElement)=>node.isConnected)).toBe(false);
   expect(disposals.length).toBe(priorEarth);for(const value of disposals)expect(value.disposed&&value.viewerDestroyed).toBe(true);
   const frame=page.frames().find(f=>f.url().includes(mode==='earth'?'/earth-runtime/':'/oras-sky-engine/'))!;
   if(mode==='earth'){
    expect(await page.evaluate(()=>sessionStorage.getItem('oras.runtime.intent.v1'))).toContain('2020-01-01');
    // Observe graceful disposal before parent removes the document.
    await frame.evaluate(()=>{const original=(window as any).orasEarthDiagnostics;const observer=new MutationObserver(()=>{const value=original();if(value.viewerDestroyed){observer.disconnect();void (window as any).recordEarthDisposal(value)}});observer.observe(document.querySelector('#viewer')!,{childList:true,subtree:true})});priorEarth++;
   }
   await page.evaluate(()=>window.postMessage({type:'ready',runtime:'sky',nonce:'b'.repeat(32),generation:1,protocol:{major:1,minor:0},version:'stale',capabilities:[]},location.origin));await expect(page.locator('[data-runtime-status=ready]')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   oldFrames.push(await page.locator('iframe').elementHandle());await page.screenshot({path:`../output/playwright/owned-loop-${label}-${oldFrames.length}-${mode}.png`});
  }
 })
 test(`direct reload history retry and artifact rejection ${label}`,async({page})=>{
  test.setTimeout(150000);await page.setViewportSize({width,height});await page.route('**/earth-runtime/release.json',r=>r.fulfill({status:503,json:{error:'fixture'}}));await page.goto('/earth');await expect(page.locator('[data-runtime-status=error]')).toBeVisible();await expect(page.locator('iframe')).toHaveCount(0);await page.unroute('**/earth-runtime/release.json');await page.getByRole('button',{name:'Retry Earth',exact:true}).click();await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:90000});await page.reload();await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:90000});await page.getByRole('navigation').getByRole('link',{name:'Home',exact:true}).click();await page.goBack();await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:90000});await page.goForward();await expect(page.getByRole('heading',{name:'The sky over the ORAS observatory'})).toBeVisible();
  await page.route('**/earth-runtime/release.json',r=>r.fulfill({json:{owner:'Unqualified',upstream_sha:'wrong',artifact_sha256:'wrong'}}));await page.goto('/earth');await expect(page.locator('[data-runtime-status=error]')).toContainText('does not match');await expect(page.locator('iframe')).toHaveCount(0);
 })
 test(`standalone Sky and owned Earth ${label}`,async({page})=>{
  test.setTimeout(150000);await page.setViewportSize({width,height});for(const url of ['/oras-sky-engine/','/earth-runtime/']){await page.goto(url);await expect(page.locator('canvas').first()).toBeVisible({timeout:90000});await page.reload();await expect(page.locator('canvas').first()).toBeVisible({timeout:90000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
 })
}
