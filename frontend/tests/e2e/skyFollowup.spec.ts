import {test,expect,type Frame,type Page} from '@playwright/test'
import {mkdirSync,writeFileSync} from 'node:fs'
test.use({channel:'chrome'})
const out='../output/playwright/sky-followup'
mkdirSync(out,{recursive:true})
const pin=()=>sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site']}))
async function ready(page:Page,unified=true):Promise<Frame>{
 if(unified)await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:90000})
 const frame=unified?page.frames().find((f:Frame)=>f.url().includes('/oras-sky-engine/'))!:page.mainFrame()
 await frame.waitForFunction(()=>Boolean((window as any).orasSkyAdapter),{timeout:90000})
 return frame
}
const controls=[
 ['Constellations','constellations.lines_visible'],['Constellations Art','constellations.images_visible'],
 ['Atmosphere','atmosphere.visible'],['Landscape','landscapes.visible'],
 ['Azimuthal Grid','lines.azimuthal.visible'],['Equatorial Grid','lines.equatorial_jnow.visible'],
 ['Deep Sky Objects','dsos.visible'],['Night Mode','nightmode'],
]
async function state(frame:Frame,path:string){return frame.evaluate(path=>{
 const app=(document.querySelector('#app') as any).__vue__
 return !!(path==='nightmode'?app.$store.state.nightmode:path.split('.').reduce((v:any,k:string)=>v[k],app.$stel.core))
},path)}
for(const width of [1440,390])test(`ORAS graphics retain all native controls and keyboard state ${width}`,async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width,height:width===390?844:900});await page.addInitScript(pin)
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/sky-engine');const frame=await ready(page)
 const dock=frame.getByRole('toolbar',{name:'Sky view controls',exact:true});await expect(dock).toBeVisible()
 await expect(dock.locator('button')).toHaveCount(8)
 const rows=[]
 for(const [label,path] of controls){
  const button=dock.getByRole('button',{name:label,exact:true});await expect(button.locator('svg.oras-control-icon')).toHaveCount(1)
  await expect(button.locator('img')).toHaveCount(0);await button.scrollIntoViewIfNeeded();const box=await button.boundingBox()
  expect(box!.width).toBeGreaterThanOrEqual(44);expect(box!.height).toBeGreaterThanOrEqual(44)
  const before=await state(frame,path);await expect(button).toHaveAttribute('aria-pressed',String(before))
  await button.focus();await expect(button).toBeFocused();expect(await button.evaluate(e=>getComputedStyle(e).outlineWidth)).toBe('2px');await button.press('Space');await expect.poll(()=>state(frame,path)).toBe(!before);await expect(button).toHaveAttribute('aria-pressed',String(!before))
  await button.press('Enter');await expect.poll(()=>state(frame,path)).toBe(before);await expect(button).toHaveAttribute('aria-pressed',String(before))
  rows.push({label,path,before,box})
 }
 const atmosphere=dock.getByRole('button',{name:'Atmosphere',exact:true});const before=await state(frame,'atmosphere.visible')
 await frame.evaluate(()=>{const c=(document.querySelector('#app') as any).__vue__.$stel.core;c.atmosphere.visible=!c.atmosphere.visible})
 await expect(atmosphere).toHaveAttribute('aria-pressed',String(!before));await atmosphere.click();await expect.poll(()=>state(frame,'atmosphere.visible')).toBe(before)
 await expect(dock.getByRole('button',{name:'Fullscreen',exact:true})).toHaveCount(0)
 await expect(dock.getByRole('button',{name:'Equatorial J2000 Grid',exact:true})).toHaveCount(0)
 await dock.evaluate(e=>{e.scrollLeft=0});await page.mouse.move(0,0);await atmosphere.blur()
 await page.screenshot({path:`${out}/controls-${width}.png`})
 const first=dock.getByRole('button',{name:'Constellations',exact:true});await first.press('Tab');await first.focus();await page.screenshot({path:`${out}/controls-focus-${width}.png`})
 if(width===390){
  await page.getByRole('button',{name:'Change time',exact:true}).click();await expect(dock).toBeVisible()
  const dockBox=await dock.boundingBox(),creditBox=await frame.locator('.oras-workspace-source').boundingBox()
  expect(creditBox!.y).toBeGreaterThanOrEqual(dockBox!.y+dockBox!.height)
  await page.screenshot({path:`${out}/controls-mobile-time-sheet.png`});await page.getByRole('button',{name:'Close sheet',exact:true}).click()
 }
 const bounds=await dock.boundingBox(),time=await page.locator('.ws-time').boundingBox();expect(bounds!.y).toBeGreaterThanOrEqual(time!.y+time!.height)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 expect(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 writeFileSync(`${out}/controls-${width}.json`,JSON.stringify({rows,bounds,time,errors},null,2));expect(errors).toEqual([])
})
for(const unified of [false,true])test(`installed Gaia metadata and native faint tiles load ${unified?'unified':'standalone'}`,async({page,request})=>{
 test.setTimeout(150000);await page.addInitScript(pin);const errors:string[]=[],tiles:any[]=[];page.on('pageerror',e=>errors.push(e.message))
 page.on('response',r=>{if(/surveys\/gaia\/v1\/.*\.eph/.test(r.url()))tiles.push({url:r.url(),status:r.status()})})
 const metadata=await request.get('/oras-sky-engine/skydata/surveys/gaia/v1/properties');expect(metadata.status()).toBe(200)
 expect(metadata.headers()['content-type']).toContain('text/plain');expect(await metadata.text()).toMatch(/hips_tile_format\s*=\s*eph/)
 const missing=await request.get('/oras-sky-engine/skydata/surveys/__sky_followup_missing__/v1/properties');expect(missing.status()).toBe(404);expect(await missing.text()).not.toContain('<html')
 await page.goto(unified?'/sky-engine':'/oras-sky-engine/');const frame=await ready(page,unified)
 await frame.evaluate(()=>{const c=(document.querySelector('#app') as any).__vue__.$stel.core,o=c.observer;c.time_speed=0;c.selection=null;c.lock=null;o.latitude=41.44*Math.PI/180;o.longitude=-79.69*Math.PI/180;o.utc=Date.parse('2026-07-15T03:00:00Z')/86400000+40587;o.pitch=49.37*Math.PI/180;o.yaw=65.94*Math.PI/180;c.fov=5*Math.PI/180;c.stars.visible=true;c.atmosphere.visible=false;c.landscapes.visible=false})
 await expect.poll(()=>tiles.filter(t=>t.status===200).length,{timeout:45000}).toBeGreaterThan(10)
 await expect.poll(()=>frame.evaluate(()=>(document.querySelector('#app') as any).__vue__.$stel.core.progressbars.length),{timeout:45000}).toBe(0)
 const native=await frame.evaluate(()=>{const a=(document.querySelector('#app') as any).__vue__;return{fps:a.$stel.core.fps,profile:a.$store.state.orasDenseStarsProfile,starsVisible:a.$stel.core.stars.visible}})
 expect(native.fps).toBeGreaterThan(0);expect(native.profile).toBe('visual-default');expect(errors).toEqual([])
 writeFileSync(`${out}/star-loading-${unified?'unified':'standalone'}.json`,JSON.stringify({native,tiles,errors},null,2))
 console.log('native Gaia loading',JSON.stringify({unified,native,loadedTiles:tiles.filter(t=>t.status===200).length}))
})
