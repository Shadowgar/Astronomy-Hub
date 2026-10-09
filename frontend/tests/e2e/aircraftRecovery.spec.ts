import {test,expect,type Page,type Frame} from '@playwright/test'

const directory=process.env.AIRCRAFT_EVIDENCE_DIR||'../output/playwright/aircraft-recovery'
async function fixture(page:Page,mode='valid'){
 const state={mode,requests:[] as {lat:number;lon:number;time:number}[],updates:0,clockOffset:0,replaceCohort:false,higherCohort:false,release:null as null|(()=>void)}
 await page.addInitScript(()=>sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site']})))
 await page.route('**/api/earth/aircraft?*',async route=>{
  const url=new URL(route.request().url()),lat=Number(url.searchParams.get('lat')),lon=Number(url.searchParams.get('lon'))
  state.requests.push({lat,lon,time:Date.now()});state.updates++
  if(state.mode==='delayed'&&state.updates===1)await new Promise<void>(resolve=>{state.release=resolve})
  if(state.mode==='503'||state.mode==='429'){await route.fulfill({status:Number(state.mode),json:{detail:'Declared provider outage'}});return}
  if(state.mode==='timeout'){await new Promise(r=>setTimeout(r,14000));await route.abort().catch(()=>{});return}
  if(state.mode==='malformed'){await route.fulfill({body:'{not JSON',contentType:'application/json'});return}
  const now=(Date.now()+state.clockOffset)/1000-(state.mode==='stale'?180:0)
  const ac=state.mode==='empty'?[]:state.mode==='dense'?Array.from({length:2000},(_,i)=>({hex:(state.higherCohort?0xdef000+i:state.replaceCohort&&i>=1900?i-1900:0xabc000+i).toString(16).padStart(6,'0'),flight:'DECLARED '+i,lat:lat+(i%40-20)*.035,lon:lon+(Math.floor(i/40)-25)*.028,alt_geom:30000,seen:0,seen_pos:0,gs:200,track:90})):[{hex:'abc123',flight:'DECLARED FIXTURE',lat:lat+.4,lon:lon+.7+(state.updates-1)*.005,alt_geom:state.mode==='unknown-altitude'?null:30000,alt_baro:state.mode==='unknown-altitude'?30000:undefined,seen:0,seen_pos:0,gs:200,track:90}]
  await route.fulfill({headers:{'X-Aircraft-Cache':'miss'},json:{now,ac}}).catch(()=>{})
 })
 await page.goto('/earth');await expect(page.locator('[data-runtime-mode=earth][data-runtime-status=ready]')).toBeVisible({timeout:90000})
 await page.getByRole('button',{name:'Layers',exact:true}).click()
 await page.getByRole('switch',{name:/Aircraft/}).click()
 return {state,earth:page.frames().find(f=>f.url().includes('/earth-runtime/'))!}
}
async function closePanel(page:Page,mobile=false){await page.getByRole('button',{name:mobile?'Close sheet':'Close panel',exact:true}).first().click()}
async function altitude(earth:Frame,target:number){
 for(let i=0;i<55;i++){
  const height=await earth.evaluate(()=>(window as any).orasEarthDiagnostics().cameraHeightM)
  if(height<=target*1.12&&height>=target*.85)return height
  await earth.locator('canvas').first().press(height>target?'+':'-');await earth.waitForTimeout(35)
 }
 throw Error('Camera did not reach qualified altitude')
}
async function markerPixels(earth:Frame){
 const canvas=earth.locator('canvas').first(),png=await canvas.screenshot()
 // Inspect the rendered canvas screenshot rather than equating entities with visibility.
 return earth.evaluate(async base64=>{
  const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode()
  const c=document.createElement('canvas');c.width=image.width;c.height=image.height
  const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data
  let count=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]>185&&pixels[i+1]>155&&pixels[i+2]<150)count++
  return count
 },png.toString('base64'))
}
for(const target of [500000,2000000,15621863])test(`valid aircraft has visible pixels at ${target} m, not merely an entity`,async({page})=>{
 test.setTimeout(120000);const {earth}=await fixture(page)
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft?.count)).toBe(1)
 await closePanel(page);const height=await altitude(earth,target);await earth.waitForTimeout(1000)
 const pixels=await markerPixels(earth)
 await page.screenshot({path:`${directory}/altitude-${target}.png`})
 console.log(JSON.stringify({target,height,pixels,diagnostics:await earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft)}))
 expect(pixels).toBeGreaterThan(2)
})
test('settled actual camera movement acquires a distinct region and maintains regional disclosure',async({page})=>{
 test.setTimeout(120000);const {state,earth}=await fixture(page)
 await expect.poll(()=>state.requests.length).toBe(1);await closePanel(page)
 for(let i=0;i<35;i++)await earth.locator('canvas').first().press('ArrowLeft')
 await expect.poll(()=>state.requests.length,{timeout:15000}).toBeGreaterThan(1)
 expect(Math.abs(state.requests.at(-1)!.lon-state.requests[0].lon)).toBeGreaterThan(10)
 await page.getByRole('button',{name:'Layers',exact:true}).click()
 await expect(page.locator('.ws-layer[data-layer-id=aircraft]')).toContainText('100 NM')
 console.log(JSON.stringify(state.requests));await page.screenshot({path:`${directory}/camera-region.png`})
})
for(const mode of ['503','429','timeout','malformed','stale','empty'])test(`controlled ${mode} feed preserves the Viewer and honest aircraft state`,async({page})=>{
 test.setTimeout(120000);const {earth}=await fixture(page,mode)
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft?.status),{timeout:20000}).toBe(mode==='empty'?'ready':'unavailable')
 const diag=await earth.evaluate(()=>(window as any).orasEarthDiagnostics())
 expect(diag.ready).toBe(true);expect(diag.viewerDestroyed).toBe(false);expect(diag.providers.aircraft.count||0).toBe(0)
 console.log(JSON.stringify({mode,provider:diag.providers.aircraft}));await page.screenshot({path:`${directory}/${mode}.png`})
})
test('unknown geometric altitude stays filtered through the actual pinned normalizer',async({page})=>{
 test.setTimeout(120000);const {earth}=await fixture(page,'unknown-altitude')
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft?.status)).toBe('ready')
 const diag=await earth.evaluate(()=>(window as any).orasEarthDiagnostics()),provider=diag.providers.aircraft
 expect(diag.ready).toBe(true);expect(diag.viewerDestroyed).toBe(false);expect(provider.count).toBe(0)
 expect(provider.counts).toMatchObject({fetched:1,parsed:1,valid:0,admitted:0,filtered:1,renderable:0,visible:0})
 expect(await earth.evaluate(()=>(window as any).orasEarthVisibleTargets().filter((row:any)=>row.kind==='aircraft'))).toEqual([])
 await expect(page.locator('.ws-layer[data-layer-id=aircraft]')).toContainText('positions filtered')
 console.log('UNKNOWN_GEOMETRIC_ALTITUDE',JSON.stringify(provider))
 await page.screenshot({path:`${directory}/unknown-altitude.png`})
})
for(const mobile of [false,true])test(`bounded dense regional glyph cohort and measured frame cadence ${mobile?'mobile':'desktop'}`,async({page})=>{
 test.setTimeout(180000);await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:900})
 const {earth}=await fixture(page,'dense');await closePanel(page,mobile);await altitude(earth,500000)
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft?.counts?.renderable)).toBe(mobile?100:1000)
 const metrics=await earth.evaluate(async()=>{const intervals:number[]=[],start=performance.now();let last=start;while(performance.now()-start<2000){await new Promise(requestAnimationFrame);const now=performance.now();intervals.push(now-last);last=now}return {rafFps:intervals.length/((performance.now()-start)/1000),memory:(performance as any).memory?.usedJSHeapSize}})
 const provider=await earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft)
 expect(provider.counts.fetched).toBe(2000);expect(provider.counts.admitted).toBe(2000);expect(provider.counts.capped).toBe(2000-(mobile?100:1000));expect(provider.counts.visible).toBeGreaterThan(0)
 console.log(JSON.stringify({mobile,metrics,provider}));await page.screenshot({path:`${directory}/dense-${mobile?'mobile':'desktop'}.png`})
 await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByRole('switch',{name:/Aircraft/}).click();await closePanel(page,mobile)
 const baseline=await earth.evaluate(async()=>{const start=performance.now();let frames=0;while(performance.now()-start<2000){await new Promise(requestAnimationFrame);frames++}return frames/((performance.now()-start)/1000)})
 console.log(JSON.stringify({mobile,disabledRafFps:baseline,enabledRafFps:metrics.rafFps,relative:metrics.rafFps/baseline}))
 if(!mobile){
  await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByRole('switch',{name:/Aircraft/}).click();await closePanel(page)
  await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft?.counts.renderable)).toBe(1000)
  await page.setViewportSize({width:390,height:844})
  await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft?.counts.renderable)).toBe(100)
  console.log('RESIZE_COHORT',JSON.stringify((await earth.evaluate(()=>(window as any).orasEarthDiagnostics())).providers.aircraft.counts))
 }
})
test('stable selection, Focus and one-aircraft follow survive three observations; failure stops follow',async({page})=>{
 test.setTimeout(300000);const {earth,state}=await fixture(page);await closePanel(page);await altitude(earth,500000)
 let target:any;await expect.poll(async()=>{target=await earth.evaluate(()=>(window as any).orasEarthVisibleTargets().find((r:any)=>r.kind==='aircraft'));return !!target}).toBe(true)
 await earth.locator('canvas').first().click({position:{x:target.x,y:target.y}})
 await expect(page.getByRole('region',{name:'Selected object'})).toContainText('DECLARED FIXTURE')
 await page.getByRole('button',{name:'Focus',exact:true}).click();await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().cameraHeightM)).toBeLessThan(50000)
 await page.getByRole('button',{name:'Track',exact:true}).click();await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().tracking)).toBe('aircraft:abc123')
 const beforeFollow=state.updates;await expect.poll(()=>state.updates,{timeout:110000}).toBeGreaterThanOrEqual(beforeFollow+3)
 expect((await earth.evaluate(()=>(window as any).orasEarthDiagnostics())).tracking).toBe('aircraft:abc123')
 await page.getByRole('button',{name:'Stop tracking',exact:true}).click();await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().tracking)).toBe(null)
 await page.getByRole('button',{name:'Track',exact:true}).click();state.mode='503'
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.status),{timeout:45000}).toBe('unavailable')
 expect((await earth.evaluate(()=>(window as any).orasEarthDiagnostics())).tracking).toBe(null)
 await page.screenshot({path:`${directory}/follow-outage.png`})
 console.log(JSON.stringify({beforeFollow,updates:state.updates,followStopped:true}))
})
test('rapid camera movement aborts obsolete feed; return uses regional cache; disable/departure reject late work',async({page})=>{
 test.setTimeout(200000);const {earth,state}=await fixture(page,'delayed');await closePanel(page)
 for(let i=0;i<12;i++)await earth.locator('canvas').first().press('ArrowLeft')
 await expect.poll(()=>state.requests.length,{timeout:15000}).toBeGreaterThan(1)
 // The old region can still be ready until Cesium delivers its final camera event.
 // Release the obsolete response only after deliberately settling the camera.
 await page.waitForTimeout(3000)
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft?.status)).toBe('ready')
 const center=await earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.coverage.center)
 expect(Math.abs(center.lon-state.requests[0].lon)).toBeGreaterThan(1);state.release?.();await page.waitForTimeout(500)
 expect((await earth.evaluate(()=>(window as any).orasEarthDiagnostics())).providers.aircraft.coverage.center.lon).toBe(center.lon)
 await earth.locator('#home').evaluate((node:any)=>node.click())
 // The initial request was deliberately aborted: it has no accepted cache entry.
 // Return must be covered by the qualified inner 50 NM region, not that aborted key.
 const {distanceM,AIRCRAFT_RADIUS_M}=await import('../../../runtimes/earth-runtime/layers/aircraftPolicy.mjs')
 await expect.poll(async()=>distanceM(await earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.coverage.center),state.requests[0])).toBeLessThan(AIRCRAFT_RADIUS_M/2)
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft?.status)).toBe('ready')
 // Prove reuse inside the actual cache TTL; a 30-second refresh is legitimate.
 await expect.poll(async()=>Date.now()-Date.parse((await earth.evaluate(()=>(window as any).orasEarthDiagnostics())).providers.aircraft.observedAt),{timeout:45000}).toBeLessThan(5000)
 const accepted=await earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft),returnedCenter=accepted.coverage.center
 expect(returnedCenter).toEqual({lat:state.requests.at(-1)!.lat,lon:state.requests.at(-1)!.lon});expect(accepted.coverage.radiusNM).toBe(100)
 const before=state.requests.length;await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByRole('switch',{name:/Aircraft/}).click();await page.waitForTimeout(1500)
 expect((await earth.evaluate(()=>(window as any).orasEarthVisibleTargets())).filter((r:any)=>r.kind==='aircraft')).toHaveLength(0)
 expect(state.requests.length).toBe(before)
 await page.getByRole('switch',{name:/Aircraft/}).click();await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft?.status)).toBe('ready')
 expect(state.requests.length).toBe(before)
 const reused=await earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft)
 expect(reused.cached).toBe(true);expect(reused.coverage.center).toEqual(returnedCenter);expect(reused.observedAt).toBe(accepted.observedAt)
 const enabled=state.requests.length;await closePanel(page);const frame=await page.locator('iframe').elementHandle();await page.getByRole('tab',{name:'Sky',exact:true}).click()
 await expect(page.locator('[data-runtime-mode=sky][data-runtime-status=ready]')).toBeVisible({timeout:90000});expect(await frame!.evaluate(n=>n.isConnected)).toBe(false)
 await page.waitForTimeout(31000);expect(state.requests.length).toBe(enabled)
 await page.getByRole('tab',{name:'Earth',exact:true}).click();await expect(page.locator('[data-runtime-mode=earth][data-runtime-status=ready]')).toBeVisible({timeout:90000})
 await page.screenshot({path:`${directory}/lifecycle-return.png`});console.log(JSON.stringify({lifecycleRequests:state.requests}))
})

test('aircraft follow yields to manual zoom and mode teardown without model acquisition',async({page})=>{
 test.setTimeout(180000);const models:string[]=[],disposals:any[]=[]
 page.on('request',r=>{if(/\.(?:glb|gltf)(?:[?#]|$)|\/models\//i.test(r.url()))models.push(r.url())})
 await page.exposeFunction('recordAircraftDisposal',(value:any)=>disposals.push(value))
 const {earth}=await fixture(page);await closePanel(page);await altitude(earth,500000)
 let target:any;await expect.poll(async()=>{target=await earth.evaluate(()=>(window as any).orasEarthVisibleTargets().find((r:any)=>r.kind==='aircraft'));return !!target}).toBe(true)
 await earth.locator('canvas').first().click({position:{x:target.x,y:target.y}})
 await page.getByRole('button',{name:'Focus',exact:true}).click()
 await page.getByRole('button',{name:'Track',exact:true}).click()
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().tracking)).toBe('aircraft:abc123')
 await earth.locator('canvas').first().press('+')
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().tracking)).toBe(null)
 await page.getByRole('button',{name:'Track',exact:true}).click()
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().tracking)).toBe('aircraft:abc123')
 await earth.evaluate(()=>{const observer=new MutationObserver(()=>{const value=(window as any).orasEarthDiagnostics();if(value.viewerDestroyed){observer.disconnect();void (window as any).recordAircraftDisposal(value)}});observer.observe(document.querySelector('#viewer')!,{childList:true,subtree:true})})
 const old=await page.locator('iframe').elementHandle();await page.getByRole('tab',{name:'Sky',exact:true}).click()
 await expect(page.locator('[data-runtime-mode=sky][data-runtime-status=ready]')).toBeVisible({timeout:90000})
 expect(await old!.evaluate(n=>n.isConnected)).toBe(false)
 await expect.poll(()=>disposals.length).toBe(1);expect(disposals[0].disposed&&disposals[0].viewerDestroyed).toBe(true)
 expect(models).toEqual([]);console.log(JSON.stringify({manualInputStopsFollow:true,trackedViewerDestroyed:true,modelsRequested:models.length}))
})

test('returning the actual camera to a fresh covered region reuses its acquisition center',async({page})=>{
 test.setTimeout(150000);const {earth,state}=await fixture(page);await closePanel(page)
 await expect.poll(async()=>Date.now()-Date.parse((await earth.evaluate(()=>(window as any).orasEarthDiagnostics())).providers.aircraft?.observedAt),{timeout:45000}).toBeLessThan(5000)
 const original={...state.requests[0]}
 for(let i=0;i<4;i++)await earth.locator('canvas').first().press('ArrowLeft')
 await page.waitForTimeout(3000)
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.status)).toBe('ready')
 const explored=await earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.coverage.center)
 expect(Math.abs(explored.lon-original.lon)).toBeGreaterThan(1)
 const before=state.requests.length
 await earth.locator('#home').evaluate((node:any)=>node.click())
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.coverage.center.lon)).toBe(original.lon)
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.status)).toBe('ready')
 const provider=await earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft)
 console.log(JSON.stringify({cameraCacheReturn:provider,requests:state.requests,before}))
 expect(provider.coverage.center).toEqual({lat:original.lat,lon:original.lon})
 expect(provider.cached).toBe(true);expect(state.requests.length).toBe(before)
})

test('enabling aircraft after camera exploration starts in the settled viewed region',async({page})=>{
 test.setTimeout(120000);const {earth,state}=await fixture(page);await closePanel(page)
 await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByRole('switch',{name:/Aircraft/}).click();await closePanel(page)
 for(let i=0;i<8;i++)await earth.locator('canvas').first().press('ArrowLeft')
 await page.waitForTimeout(3000);const before=state.requests.length
 await page.getByRole('button',{name:'Layers',exact:true}).click();await page.getByRole('switch',{name:/Aircraft/}).click()
 await expect.poll(()=>state.requests.length).toBeGreaterThan(before)
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.status)).toBe('ready')
 const provider=await earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft)
 console.log(JSON.stringify({enableAfterExploration:provider,requests:state.requests,before}))
 expect(Math.abs(provider.coverage.center.lon-state.requests[0].lon)).toBeGreaterThan(3)
 expect(state.requests.length).toBeGreaterThan(before)
})
test('a valid selected followed aircraft survives new lower-sorting IDs above the mobile cap',async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width:390,height:844})
 const {earth,state}=await fixture(page,'dense');await closePanel(page,true);await altitude(earth,500000)
 let target:any;await expect.poll(async()=>{target=await earth.evaluate(()=>(window as any).orasEarthVisibleTargets().find((r:any)=>r.kind==='aircraft'));return !!target}).toBe(true)
 await earth.locator('canvas').first().click({position:{x:target.x,y:target.y}})
 const selected=await earth.evaluate(()=>{const facts=(window as any).orasEarthDiagnostics().selection?.facts;const id=facts?.find((f:any)=>f.label==='Identity')?.value;return id?'aircraft:'+id:null});expect(selected).toMatch(/^aircraft:abc/)
 await page.getByRole('button',{name:'Track',exact:true}).click();await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().tracking)).toBe(selected)
 const before=state.updates;state.replaceCohort=true
 await expect.poll(()=>state.updates,{timeout:45000}).toBeGreaterThan(before)
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.status)).toBe('ready')
 const diag=await earth.evaluate(()=>(window as any).orasEarthDiagnostics())
 console.log(JSON.stringify({selected,cohortRefresh:diag.providers.aircraft,tracking:diag.tracking,selection:diag.selection?.facts?.find((f:any)=>f.label==='Identity')?.value}))
 expect(diag.selection?.facts?.find((f:any)=>f.label==='Identity')?.value).toBe(selected.slice(9));expect(diag.tracking).toBe(selected)
 expect(diag.providers.aircraft.counts.renderable).toBe(100);expect(diag.providers.aircraft.counts.capped).toBe(1900)
})


test('one successful snapshot omission preserves selected follow, held disclosure and same-ID return',async({page})=>{
 test.setTimeout(180000);const {earth,state}=await fixture(page);await closePanel(page);await altitude(earth,500000)
 let target:any;await expect.poll(async()=>{target=await earth.evaluate(()=>(window as any).orasEarthVisibleTargets().find((r:any)=>r.kind==='aircraft'));return !!target}).toBe(true)
 await earth.locator('canvas').first().click({position:{x:target.x,y:target.y}})
 await page.getByRole('button',{name:'Track',exact:true}).click();await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().tracking)).toBe('aircraft:abc123')
 const before=state.updates,fix=await earth.evaluate(()=>(window as any).orasEarthDiagnostics().selection.facts.find((f:any)=>f.label==='Position observed').value)
 state.mode='empty';await expect.poll(()=>state.updates,{timeout:45000}).toBeGreaterThan(before)
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.counts.retainedMissing)).toBe(1)
 let diag=await earth.evaluate(()=>(window as any).orasEarthDiagnostics());expect(diag.tracking).toBe('aircraft:abc123');expect(diag.providers.aircraft.count).toBe(0);expect(diag.providers.aircraft.counts.capped).toBe(0);expect(diag.providers.aircraft.counts.renderable).toBe(1)
 expect(diag.selection.facts.find((f:any)=>f.label==='Position observed').value).toBe(fix);await expect(page.getByRole('tabpanel',{name:'selection context'})).toContainText('Missing contact')
 await page.screenshot({path:`${directory}/omission-held.png`});console.log('OMISSION_HELD',JSON.stringify(diag.providers.aircraft))
 const omitted=state.updates;state.mode='valid';await expect.poll(()=>state.updates,{timeout:45000}).toBeGreaterThan(omitted)
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.counts.retainedMissing)).toBe(0)
 diag=await earth.evaluate(()=>(window as any).orasEarthDiagnostics());expect(diag.tracking).toBe('aircraft:abc123');expect(diag.selection.facts.find((f:any)=>f.label==='Identity').value).toBe('abc123')
 console.log('OMISSION_RETURN',JSON.stringify(diag.providers.aircraft));await page.screenshot({path:`${directory}/omission-return.png`})
})


test('five-minute outage hides selected position and recovers same identity without resuming follow',async({page})=>{
 test.setTimeout(180000);const {earth,state}=await fixture(page);await closePanel(page);await altitude(earth,500000)
 let target:any;await expect.poll(async()=>{target=await earth.evaluate(()=>(window as any).orasEarthVisibleTargets().find((r:any)=>r.kind==='aircraft'));return !!target}).toBe(true)
 await earth.locator('canvas').first().click({position:{x:target.x,y:target.y}});await page.getByRole('button',{name:'Track',exact:true}).click()
 state.mode='503';await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.status),{timeout:45000}).toBe('unavailable')
 let diag=await earth.evaluate(()=>(window as any).orasEarthDiagnostics());expect(diag.tracking).toBe(null);expect(diag.selection.available).toBe(false);expect(diag.providers.aircraft.counts.renderable).toBe(0)
 state.clockOffset=300000;await earth.evaluate(()=>{const real=Date.now;Date.now=()=>real()+300000});state.mode='valid'
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.status),{timeout:45000}).toBe('ready')
 diag=await earth.evaluate(()=>(window as any).orasEarthDiagnostics());expect(diag.tracking).toBe(null);expect(diag.selection.facts.find((f:any)=>f.label==='Identity').value).toBe('abc123');expect(diag.selection.available).not.toBe(false);expect(diag.providers.aircraft.counts.renderable).toBe(1)
 expect(Date.parse(diag.selection.facts.find((f:any)=>f.label==='Position observed').value)).toBeGreaterThan(Date.now()+270000)
 console.log('FIVE_MINUTE_RECOVERY',JSON.stringify(diag.providers.aircraft));await page.screenshot({path:`${directory}/five-minute-recovery.png`})
})

test('higher-sorting current observations fill the mobile cap before unselected missing contacts',async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width:390,height:844})
 const {earth,state}=await fixture(page,'dense');await closePanel(page,true);await altitude(earth,500000)
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.counts.renderable)).toBe(100)
 const prior=await earth.evaluate(()=>(window as any).orasEarthVisibleTargets().filter((row:any)=>row.kind==='aircraft'))
 expect(prior.length).toBeGreaterThan(0);expect(prior.every((row:any)=>row.id.startsWith('aircraft:abc'))).toBe(true)
 const requests=state.requests.length;state.higherCohort=true
 await expect.poll(()=>state.requests.length,{timeout:45000}).toBeGreaterThan(requests)
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.counts.retainedMissing)).toBe(0)
 let visible:any[]=[]
 await expect.poll(async()=>{visible=await earth.evaluate(()=>(window as any).orasEarthVisibleTargets().filter((row:any)=>row.kind==='aircraft'));return visible.length>0&&visible.every(row=>row.id.startsWith('aircraft:def'))}).toBe(true)
 const counts=await earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.counts)
 expect(counts).toMatchObject({fetched:2000,admitted:2000,renderable:100,capped:1900,retainedMissing:0})
 console.log('CURRENT_COHORT_PRIORITY',JSON.stringify({counts,visible}));await page.screenshot({path:`${directory}/current-cohort-priority-mobile.png`})
})

test('a missing selected contact expires through an outage and returns without restoring selection or follow',async({page})=>{
 test.setTimeout(180000);const {earth,state}=await fixture(page);await closePanel(page);await altitude(earth,500000)
 let target:any;await expect.poll(async()=>{target=await earth.evaluate(()=>(window as any).orasEarthVisibleTargets().find((r:any)=>r.kind==='aircraft'));return !!target}).toBe(true)
 await earth.locator('canvas').first().click({position:{x:target.x,y:target.y}});await page.getByRole('button',{name:'Track',exact:true}).click()
 state.mode='empty';await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.counts.retainedMissing),{timeout:45000}).toBe(1)
 state.mode='503';await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.status),{timeout:45000}).toBe('unavailable')
 expect((await earth.evaluate(()=>(window as any).orasEarthDiagnostics())).selection.available).toBe(false)
 state.clockOffset=300000;await earth.evaluate(()=>{const real=Date.now;Date.now=()=>real()+300000})
 await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().selection)).toBe(null)
 expect((await earth.evaluate(()=>(window as any).orasEarthDiagnostics())).tracking).toBe(null)
 expect(await earth.evaluate(()=>(window as any).orasEarthVisibleTargets().filter((row:any)=>row.kind==='aircraft'))).toEqual([])
 await page.screenshot({path:`${directory}/missing-expired-outage.png`})
 state.mode='valid';await expect.poll(()=>earth.evaluate(()=>(window as any).orasEarthDiagnostics().providers.aircraft.status),{timeout:45000}).toBe('ready')
 const diag=await earth.evaluate(()=>(window as any).orasEarthDiagnostics())
 expect(diag.providers.aircraft.counts).toMatchObject({retainedMissing:0,renderable:1,capped:0});expect(diag.selection).toBe(null);expect(diag.tracking).toBe(null)
 console.log('MISSING_OUTAGE_EXPIRY',JSON.stringify(diag.providers.aircraft));await page.screenshot({path:`${directory}/missing-expired-return.png`})
})
