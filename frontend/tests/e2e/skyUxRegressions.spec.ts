import {test,expect,type Page,type Frame} from '@playwright/test'
import {execFileSync} from 'node:child_process'
import {resolve} from 'node:path'
test.use({channel:'chrome',launchOptions:{ignoreDefaultArgs:['--disable-back-forward-cache']}})
const pin=()=>sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site']}))
const ready=async(page:Page)=>{await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:90000});return page.frames().find(f=>f.url().includes('/oras-sky-engine/'))!}
const fov=(frame:Frame)=>frame.evaluate(()=>(document.querySelector('#app') as any).__vue__.$stel.core.fov)
const centeringError=(frame:Frame)=>frame.evaluate(()=>{
 const stel=(document.querySelector('#app') as any).__vue__.$stel
 const observed=stel.convertFrame(stel.core.observer,'ICRF','OBSERVED',stel.core.selection.getInfo('radec'))
 const angles=stel.c2s(observed);let yaw=stel.core.observer.yaw-angles[0]
 while(yaw<=-Math.PI)yaw+=2*Math.PI
 while(yaw>Math.PI)yaw-=2*Math.PI
 return Math.max(Math.abs(yaw),Math.abs(stel.core.observer.pitch-angles[1]))
})
const centered=async(frame:Frame)=>{await expect.poll(()=>centeringError(frame),{timeout:15000}).toBeLessThan(.02);console.log('native centering radians',await centeringError(frame))}
async function wheel(page:Page,frame:Frame){
 const box=await frame.locator('#stel-canvas').boundingBox();expect(box).not.toBeNull()
 await page.mouse.move(box!.x+box!.width*.5,box!.y+box!.height*.45)
 const before=await fov(frame);await page.mouse.wheel(0,-480);await expect.poll(()=>fov(frame)).toBeLessThan(before);const inward=await fov(frame)
 await page.mouse.wheel(0,480);await expect.poll(()=>fov(frame)).toBeGreaterThan(inward)
 expect(await page.evaluate(()=>scrollY)).toBe(0);expect(await frame.evaluate(()=>scrollY)).toBe(0)
 console.log('native wheel',JSON.stringify({before,inward,outward:await fov(frame)}))
}
for(const path of ['/sky-engine','/oras-sky-engine/'])test(`real canvas wheel changes native FOV in both directions ${path}`,async({page})=>{
 test.setTimeout(120000);await page.addInitScript(pin);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(path)
 const frame=path==='/sky-engine'?await ready(page):page.mainFrame();await frame.waitForFunction(()=>Boolean((window as any).orasSkyAdapter),{timeout:90000});await wheel(page,frame)
 const box=await frame.locator('#stel-canvas').boundingBox();await page.mouse.move(box!.x+box!.width*.5,box!.y+box!.height*.45)
 for(let i=0;i<14;i++)await page.mouse.wheel(0,1e6)
 // Qualified stereographic native max_ui_fov is 185 degrees; native minimum is 1 arcsecond.
 expect(await fov(frame)).toBeLessThanOrEqual(185*Math.PI/180+1e-9);expect(await fov(frame)).toBeGreaterThanOrEqual(Math.PI/(180*3600))
 await wheel(page,frame);expect(errors).toEqual([])
})
test('embedded native ORAS search selects canonical object and agrees with Hub details',async({page})=>{
 test.setTimeout(150000);await page.addInitScript(pin);const errors:string[]=[],obsolete:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/noctua/i.test(r.url()))obsolete.push(r.url())})
 await page.goto('/sky-engine');const frame=await ready(page);const search=frame.getByLabel('Search...');await expect(search).toBeVisible();await search.fill('M31');const result=frame.locator('.oras-workspace-search .v-list-item').filter({hasText:/Andromeda|M31/}).first();await expect(result).toBeVisible({timeout:65000});await result.click()
 await expect.poll(()=>frame.evaluate(()=>(window as any).orasSkyAdapter.snapshot().selection?.source_id),{timeout:30000}).toMatch(/M31|NGC0224/)
 const selection=await frame.evaluate(()=>(window as any).orasSkyAdapter.snapshot().selection);await expect(page.getByRole('region',{name:'Selected object',exact:true})).toContainText(selection.name)
 expect(new URL(page.url()).pathname).toBe('/sky-engine');await page.getByRole('button',{name:'Focus',exact:true}).click();await centered(frame);await page.screenshot({path:'../output/playwright/sky-ux/search-selected.png'});await wheel(page,frame)
 await page.getByRole('button',{name:'Observe',exact:true}).click();await expect(page.locator('.ws-target').first()).toBeVisible({timeout:65000});await wheel(page,frame)
 await page.getByRole('tab',{name:'Earth',exact:true}).click();await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:90000});await expect(page.locator('iframe')).toHaveCount(1)
 await page.getByRole('tab',{name:'Sky',exact:true}).click();const restored=await ready(page);await expect(page.locator('iframe')).toHaveCount(1);await expect.poll(()=>restored.evaluate(()=>(window as any).orasSkyAdapter.snapshot().selection?.source_id),{timeout:30000}).toBe(selection.source_id);await wheel(page,restored);expect(errors).toEqual([]);expect(obsolete).toEqual([])
})
test('Home opportunity component opens unified Sky using real Docker Tonight data',async({page,request})=>{
 test.setTimeout(120000);await page.addInitScript(pin)
 const response=await request.get('/api/tonight?date=2026-10-02'),payload=await response.json();expect(response.ok()).toBe(true)
 // HomePage is retained but no longer mounted at /. Exercise its actual opportunity component.
 const html=execFileSync(resolve('node_modules/.bin/tsx'),[resolve('tests/e2e/helpers/renderHomeOpportunity.ts')],{input:JSON.stringify(payload),encoding:'utf8'})
 await page.route('**/__sky-ux-home-proof',r=>r.fulfill({contentType:'text/html',body:html}));await page.goto('/__sky-ux-home-proof')
 const link=page.getByRole('link',{name:'Open in Sky',exact:false}).first(),target=new URL((await link.getAttribute('href'))!,page.url());expect(target.pathname).toBe('/sky-engine')
 await link.click();const frame=await ready(page);await expect(page.locator('iframe')).toHaveCount(1)
 await expect.poll(()=>frame.evaluate(()=>(window as any).orasSkyAdapter.snapshot().selection?.source_id),{timeout:30000}).toBe(target.searchParams.get('source_id'))
 await expect.poll(()=>frame.evaluate(()=>Boolean((document.querySelector('#app') as any).__vue__.$stel.core.lock))).toBe(true)
 expect(await frame.evaluate(()=>(window as any).orasSkyAdapter.snapshot().selection.catalog)).toBe(target.searchParams.get('catalog'))
 await centered(frame);await page.screenshot({path:'../output/playwright/sky-ux/home-open-in-sky.png'});await wheel(page,frame)
})
test('exact standalone object link retains native selection, focus and wheel zoom',async({page})=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto('/oras-sky-engine/skysource/M31?catalog=Messier+%28local%29&source_id=M31&model=dso&date=2026-10-03T02%3A00%3A00Z&lat=42&lng=-80&elev=365.76')
 const frame=page.mainFrame();await frame.waitForFunction(()=>Boolean((window as any).orasSkyAdapter),{timeout:90000})
 await expect.poll(()=>frame.evaluate(()=>(window as any).orasSkyAdapter.snapshot().selection?.source_id),{timeout:30000}).toBe('M31')
 await centered(frame);await wheel(page,frame);expect(new URL(page.url()).pathname).toBe('/oras-sky-engine/skysource/M31');expect(errors).toEqual([])
 await page.screenshot({path:'../output/playwright/sky-ux/standalone-exact-link.png'})
})
for(const width of [1440,390])test(`embedded toolbar and time have usable independent geometry ${width}`,async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width,height:width===390?844:900});await page.addInitScript(pin);await page.goto('/sky-engine');const frame=await ready(page),controls=frame.locator('.oras-workspace-bottom');await expect(controls).toBeVisible()
 const before=await frame.evaluate(()=>(document.querySelector('#app') as any).__vue__.$stel.core.constellations.lines_visible);await frame.getByRole('button',{name:'Constellations',exact:true}).click();await expect.poll(()=>frame.evaluate(()=>(document.querySelector('#app') as any).__vue__.$stel.core.constellations.lines_visible)).toBe(!before)
 const toolbar=await controls.boundingBox(),time=await page.locator('.ws-time').boundingBox();expect(toolbar!.y).toBeGreaterThanOrEqual(time!.y+time!.height)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 const target=await frame.getByRole('button',{name:'Constellations',exact:true}).boundingBox();expect(target!.width).toBeGreaterThanOrEqual(44);expect(target!.height).toBeGreaterThanOrEqual(44)
 await page.screenshot({path:`../output/playwright/sky-ux/toolbar-${width}.png`});await page.getByRole('button',{name:'Change time',exact:true}).click();await page.getByRole('button',{name:'+1h',exact:true}).click()
 if(width===390){await expect(controls).toBeVisible();await page.screenshot({path:'../output/playwright/sky-ux/mobile-time-sheet.png'});await page.getByRole('button',{name:'Close sheet',exact:true}).click()}
 await expect(page.locator('.ws-badge')).toHaveText('Set time')
})
for(const source of ['observe','tonight'])test(`${source} Open in Sky stays in Hub and preserves canonical scene intent`,async({page})=>{
 test.setTimeout(150000);await page.addInitScript(pin);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(source==='observe'?'/observe?lat=42&lon=-80&elevation_ft=1200&at=2026-10-03T02%3A00%3A00Z':'/tonight?date=2026-10-02')
 const link=page.getByRole('link',{name:'Open in Sky',exact:false}).first();await expect(link).toBeVisible({timeout:65000});const target=new URL((await link.getAttribute('href'))!,page.url());expect(target.pathname).toBe('/sky-engine')
 await link.click();const frame=await ready(page);expect(new URL(page.url()).pathname).toBe('/sky-engine');await expect(page.locator('iframe')).toHaveCount(1)
 await expect.poll(()=>frame.evaluate(()=>(window as any).orasSkyAdapter.snapshot().selection?.source_id),{timeout:30000}).toBe(target.searchParams.get('source_id'))
 const state=await frame.evaluate(()=>{const a=(document.querySelector('#app') as any).__vue__.$stel;return {selection:(window as any).orasSkyAdapter.snapshot().selection,utc:a.core.observer.utc,lat:a.core.observer.latitude*180/Math.PI,lng:a.core.observer.longitude*180/Math.PI,elev:a.core.observer.elevation}})
 expect(state.selection.catalog).toBe(target.searchParams.get('catalog'));expect(state.selection.model).toBe(target.searchParams.get('model'));await expect.poll(()=>frame.evaluate(()=>Boolean((document.querySelector('#app') as any).__vue__.$stel.core.lock))).toBe(true)
 if(target.searchParams.has('date'))expect(Math.abs(state.utc-(Date.parse(target.searchParams.get('date')!)/86400000+40587))*86400000).toBeLessThan(1000)
 for(const key of ['lat','lng','elev'] as const)if(target.searchParams.has(key))expect(state[key]).toBeCloseTo(Number(target.searchParams.get(key)),4)
 await centered(frame);await page.screenshot({path:`../output/playwright/sky-ux/${source}-open-in-sky.png`});await wheel(page,frame);expect(errors).toEqual([]);console.log(source,'canonical native state',JSON.stringify(state))
})
