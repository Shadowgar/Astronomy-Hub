import {test,expect,type Page} from '@playwright/test'
import {mkdirSync,writeFileSync} from 'node:fs'
test.use({screenshot:'only-on-failure',channel:'chromium',launchOptions:{ignoreDefaultArgs:['--disable-back-forward-cache']}})
const proof='../output/playwright/earth-hd-mapping'
const ready=(page:Page)=>expect(page.locator('[data-runtime-mode=earth][data-runtime-status=ready]')).toBeVisible({timeout:90000})
async function setup(page:Page,mobile:boolean){
 await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:900});await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site']})));
 mkdirSync(proof,{recursive:true});
}
async function home(page:Page,mobile:boolean){if(mobile)await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByRole('button',{name:'Return to ORAS',exact:true}).click();if(mobile)await page.getByRole('button',{name:'Close sheet',exact:true}).click()}
async function sources(page:Page){await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByRole('button',{name:'Sources & display quality',exact:true}).click()}
for(const mobile of [false,true])test(`HD live imagery, local detail and renderer lifetime ${mobile?'mobile':'desktop'}`,async({page})=>{
 test.skip(process.env.ORAS_LIVE_EARTH!=='1','live provider opt-in required');test.setTimeout(180000);await setup(page,mobile);
 const errors:string[]=[],tiles:any[]=[];let bytes=0;page.on('pageerror',e=>errors.push(e.message));
 page.on('response',async response=>{const url=new URL(response.url());if(url.origin==='https://basemap.nationalmap.gov'&&url.pathname.startsWith('/arcgis/rest/services/USGSImageryOnly/MapServer/tile/')){const size=Number(response.headers()['content-length']||0);bytes+=size;tiles.push({url:response.url(),status:response.status(),bytes:size});}});
 const start=Date.now();await page.goto('/earth?date=2026-10-04T17%3A00%3A00Z');await ready(page);const shellMs=Date.now()-start;
 const earth=page.frames().find(f=>f.url().includes('/earth-runtime/'))!;
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().imagery.usgs?.state),{timeout:35000}).toBe('standby');expect(tiles).toHaveLength(0);
 await page.screenshot({path:`${proof}/${mobile?'mobile':'desktop'}-global.png`});
 await home(page,mobile);
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().cameraHeightM)).toBeLessThan(50000);
 const localStart=Date.now();const canvas=earth.locator('canvas').first();await canvas.focus();for(let i=0;i<24;i++)await canvas.press('+');
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().cameraHeightM)).toBeLessThan(2000);
 await expect.poll(()=>tiles.filter(t=>t.status===200&&/\/tile\/16\//.test(t.url)).length,{timeout:60000}).toBeGreaterThan(0);
 const localDetailMs=Date.now()-localStart;
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().imagery.usgs.active),{timeout:30000}).toBe(0);
 const diag=await earth.evaluate(()=>(window as any).orasEarthDiagnostics());expect(diag.imagery.usgs.peak).toBeLessThanOrEqual(4);expect(diag.imagery.usgs.failed).toBe(0);expect(diag.quality.terrain).toContain('ellipsoid');expect(diag.site.lat).toBe(41.321903);
 await page.screenshot({path:`${proof}/${mobile?'mobile':'desktop'}-local.png`});
 await expect(earth.locator('#attributions')).toContainText('USDA/NAIP');await expect(earth.locator('#attributions')).toContainText('USGS National Geospatial Program');
 await sources(page);await expect(page.getByText('Aerial detail covers the contiguous United States.',{exact:false})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:`${proof}/${mobile?'mobile':'desktop'}-sources.png`});
 const settledCount=tiles.length;await page.waitForTimeout(2000);expect(tiles.length).toBe(settledCount);
 await page.keyboard.press('Escape');if(await page.getByRole('button',{name:'Close sheet',exact:true}).isVisible())await page.getByRole('button',{name:'Close sheet',exact:true}).click();
 await page.getByRole('tab',{name:'Sky',exact:true}).click();await expect(page.locator('[data-runtime-mode=sky][data-runtime-status=ready]')).toBeVisible({timeout:90000});expect(page.frames().filter(f=>f.url().includes('/earth-runtime/')).length).toBe(0);
 const departedCount=tiles.length;await page.waitForTimeout(1500);expect(tiles.length).toBe(departedCount);expect(errors).toEqual([]);
 writeFileSync(`${proof}/${mobile?'mobile':'desktop'}-metrics.json`,JSON.stringify({shellMs,localDetailMs,totalMs:Date.now()-start,tileCount:tiles.length,headerBytes:bytes,diag,tiles,errors},null,2));
})
for(const mobile of [false,true])test(`HD outage stops requests, keeps local globe and explicitly retries ${mobile?'mobile':'desktop'}`,async({page})=>{
 test.setTimeout(150000);await setup(page,mobile);let attempts=0;
 await page.route('https://basemap.nationalmap.gov/**',route=>{attempts++;return route.fulfill({status:503,body:'Qualification outage'})});
 await page.route('https://gibs.earthdata.nasa.gov/**',route=>route.fulfill({status:503,body:'Qualification outage'}));
 await page.goto('/earth');await ready(page);const earth=page.frames().find(f=>f.url().includes('/earth-runtime/'))!;
 await home(page,mobile);
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().quality.imagery),{timeout:30000}).toContain('USGS unavailable · Standard imagery');
 const count=attempts;await page.waitForTimeout(2500);expect(attempts).toBe(count);expect(attempts).toBeLessThanOrEqual(4);
 await sources(page);await expect(page.getByRole('button',{name:'Retry imagery',exact:true})).toBeVisible();await page.screenshot({path:`${proof}/${mobile?'mobile':'desktop'}-outage.png`});
 // Recovery uses real USGS imagery; this is separately labeled from failure fixtures.
 test.skip(process.env.ORAS_LIVE_EARTH!=='1','recovery needs live provider opt-in');
 await page.unroute('https://basemap.nationalmap.gov/**');await page.getByRole('button',{name:'Retry imagery',exact:true}).click();
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().imagery.usgs?.state),{timeout:35000}).toBe('ready');await ready(page);await expect(page.locator('iframe')).toHaveCount(1);
})

test.describe('HD cached navigation',()=>{
 test('actual Earth bfcache preserves the same imagery runtime and usable bridge',async({page})=>{
  test.skip(process.env.ORAS_LIVE_EARTH!=='1','live provider opt-in required');test.setTimeout(150000);await setup(page,false);
  await page.addInitScript(()=>{(window as any).hdCache={identity:crypto.randomUUID(),restored:0};addEventListener('pageshow',event=>{if((event as PageTransitionEvent).persisted)(window as any).hdCache.restored++})});
  await page.goto('/earth');await ready(page);await home(page,false);
  let earth=page.frames().find(f=>f.url().includes('/earth-runtime/'))!;
  await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().imagery.usgs?.state),{timeout:35000}).toBe('ready');
  await page.getByRole('button',{name:'Navigation',exact:true}).click();await page.getByRole('button',{name:'Global view',exact:true}).click();await page.getByRole('button',{name:'Close navigation',exact:true}).click();
  await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().imagery.usgs.active),{timeout:30000}).toBe(0);await page.waitForTimeout(1500);
  const identity=await earth.evaluate(()=>(window as any).hdCache.identity);
  await page.goto('/observe');await page.goBack({waitUntil:'commit'});await ready(page);
  await expect.poll(()=>page.evaluate(()=>(window as any).hdCache.restored)).toBe(1);
  // Chromium can restore the child document before Playwright reattaches its Frame.
  // Read the actual same-origin document, as the existing Sky bfcache proof does.
  const iframe=page.locator('iframe');
  expect(await iframe.evaluate((node:HTMLIFrameElement)=>(node.contentWindow as any).hdCache.identity)).toBe(identity);
  expect(await iframe.evaluate((node:HTMLIFrameElement)=>(node.contentWindow as any).orasEarthDiagnostics().disposed)).toBe(false);
  await home(page,false);await expect.poll(()=>iframe.evaluate((node:HTMLIFrameElement)=>(node.contentWindow as any).orasEarthDiagnostics().cameraHeightM)).toBeLessThan(50000);
  await expect.poll(()=>iframe.evaluate((node:HTMLIFrameElement)=>(node.contentWindow as any).orasEarthDiagnostics().imagery.usgs?.state),{timeout:35000}).toBe('ready');
 })
})

test('stalled HD tiles time out once and retain fallback without a retry storm',async({page})=>{
 test.setTimeout(90000);await setup(page,false);let attempts=0;const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://basemap.nationalmap.gov/**',()=>{attempts++});
 await page.goto('/earth');await ready(page);await home(page,false);const earth=page.frames().find(f=>f.url().includes('/earth-runtime/'))!;
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().imagery.usgs?.state),{timeout:22000}).toBe('failed');
 const count=attempts;await page.waitForTimeout(2500);expect(attempts).toBe(count);expect(attempts).toBeLessThanOrEqual(4);
 const diag=await earth.evaluate(()=>(window as any).orasEarthDiagnostics());expect(diag.imagery.usgs.active).toBe(0);expect(diag.imagery.usgs.failed).toBe(1);expect(diag.quality.imagery).toContain('USGS unavailable');expect(errors).toEqual([]);await ready(page);
 writeFileSync(`${proof}/timeout-metrics.json`,JSON.stringify({attempts,imagery:diag.imagery,errors},null,2));
})

test('configured global fallback remains available at the same local camera scale',async({page})=>{
 test.skip(process.env.ORAS_LIVE_EARTH!=='1','live provider opt-in required');test.setTimeout(120000);await setup(page,false);
 await page.route('**/earth-runtime/display-config.json',route=>route.fulfill({json:{schema:1,qualified:false,publicImagery:'blue-marble'}}));
 await page.goto('/earth?date=2026-10-04T17%3A00%3A00Z');await ready(page);await home(page,false);const earth=page.frames().find(f=>f.url().includes('/earth-runtime/'))!;
 const canvas=earth.locator('canvas').first();await canvas.focus();for(let i=0;i<24;i++)await canvas.press('+');
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().imagery.gibs?.state),{timeout:35000}).toBe('ready');
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().imagery.gibs.active),{timeout:25000}).toBe(0);await page.waitForTimeout(1500);
 const diag=await earth.evaluate(()=>(window as any).orasEarthDiagnostics());expect(diag.imagery.usgs).toBeUndefined();expect(diag.cameraHeightM).toBeLessThan(2000);await page.screenshot({path:`${proof}/desktop-global-source-local-zoom.png`});
})

test('close zoom outside CONUS keeps global source status and restores HD on return',async({page})=>{
 test.skip(process.env.ORAS_LIVE_EARTH!=='1','live provider opt-in required');test.setTimeout(120000);await setup(page,false);
 const usgs:string[]=[];page.on('request',request=>{if(new URL(request.url()).origin==='https://basemap.nationalmap.gov')usgs.push(request.url())});
 const stamp=new Date().toISOString();await page.route('**/api/earth/earthquakes',route=>route.fulfill({json:{schemaVersion:1,kind:'earthquakes',temporalMode:'EVENT_FEED',source:'U.S. Geological Survey',observedAt:stamp,fetchedAt:stamp,limited:false,records:[{id:'coverage-fixture',name:'Declared Paris coverage fixture',lat:48.85,lon:2.35,occurredAt:stamp,updatedAt:stamp,magnitude:5.2,depthKm:10,acres:null,containedPct:null,polygons:null}]}}));
 await page.goto('/earth');await ready(page);const earth=page.frames().find(f=>f.url().includes('/earth-runtime/'))!;
 // A declared event fixture supplies a camera target; all imagery remains live.
 await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByRole('switch',{name:'Earthquakes · M2.5+ · past day',exact:true}).click();await expect(page.locator('.ws-layer[data-layer-id=earthquakes]')).toContainText('Recent event feed');await page.getByRole('region',{name:'Earth layers'}).getByRole('button',{name:'Close panel',exact:true}).click();
 let target:any;await expect.poll(async()=>{target=await earth.evaluate(()=>(window as any).orasEarthVisibleTargets().find((row:any)=>row.kind==='earthquakes'));return !!target}).toBe(true);await earth.locator('canvas').first().click({position:{x:target.x,y:target.y}});await page.getByRole('button',{name:'Focus',exact:true}).click();
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().cameraHeightM)).toBeLessThan(100000);
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().imagery.gibs?.state),{timeout:35000}).toBe('ready');
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().imagery.usgs?.state)).toBe('standby');
 expect(usgs).toHaveLength(0);const outside=await earth.evaluate(()=>(window as any).orasEarthDiagnostics());expect(outside.quality.imagery).toContain('Blue Marble');expect(outside.quality.imagery).not.toContain('USGS aerial loading');
 await page.screenshot({path:`${proof}/outside-conus.png`});await home(page,false);
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().imagery.usgs?.state),{timeout:35000}).toBe('ready');expect(usgs.length).toBeGreaterThan(0);
})
