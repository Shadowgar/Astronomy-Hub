import {test,expect} from '@playwright/test'
import {mkdirSync} from 'node:fs'

const out='../output/playwright/c57d'
mkdirSync(out,{recursive:true})
for(const mobile of [false,true])test(`bundled stars, missing-face fallback and Earth recovery ${mobile?'mobile':'desktop'}`,async({page})=>{
 test.setTimeout(120000)
 await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:900})
 const errors:string[]=[],faces=new Set<string>(),external=new Set<string>()
 page.on('pageerror',error=>errors.push(error.message))
 page.on('response',response=>{if(/\/SkyBox\/.+\.jpg$/.test(response.url())&&response.ok())faces.add(new URL(response.url()).pathname)})
 page.on('request',request=>{const url=new URL(request.url());if(url.protocol==='https:')external.add(url.hostname)})
 // Deterministic existing-local-imagery fallback, no live feed/provider calls.
 await page.route('https://**/*',route=>route.abort())
 await page.route('**/api/earth/**',route=>route.fulfill({status:503,body:'Declared unavailable fixture'}))
 await page.goto('/earth-runtime/')
 await expect(page.locator('#earth')).toHaveAttribute('data-status','ready')
 await expect(page.locator('#viewer canvas')).toHaveAttribute('data-skybox','ready')
 expect(faces.size).toBe(6)
 await expect(page.locator('#viewer canvas')).toHaveCount(1)
 await page.screenshot({path:`${out}/runtime-${mobile?'mobile':'desktop'}.png`})
 await page.route('**/SkyBox/*px.jpg',route=>route.fulfill({status:404,body:'Declared missing bundled face'}))
 await page.reload()
 await expect(page.locator('#viewer canvas')).toHaveAttribute('data-skybox','unavailable')
 await expect(page.locator('#viewer canvas')).toHaveAttribute('aria-description',/Earth remains usable/)
 await expect(page.locator('.cesium-widget-errorPanel')).toHaveCount(0)
 const before=await page.evaluate(()=>(window as any).orasEarthDiagnostics().cameraHeightM)
 await page.locator('#viewer canvas').focus();await page.keyboard.press('+')
 await expect.poll(()=>page.evaluate(()=>(window as any).orasEarthDiagnostics().cameraHeightM)).toBeLessThan(before)
 await page.unroute('**/SkyBox/*px.jpg');await page.reload()
 await expect(page.locator('#viewer canvas')).toHaveAttribute('data-skybox','ready')
 expect(errors).toEqual([])
 // Hosts are preserved existing providers; no ion/Google/new dependency is admitted.
 expect([...external].filter(host=>!['gibs.earthdata.nasa.gov','basemap.nationalmap.gov','celestrak.org'].includes(host))).toEqual([])
})

for(const mobile of [false,true])test(`five serial Sky Earth Sky cycles ${mobile?'mobile':'desktop'}`,async({page})=>{
 test.setTimeout(180000)
 await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:900})
 await page.addInitScript(()=>sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site']})))
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message))
 await page.goto('/earth')
 for(let i=0;i<5;i++)for(const mode of ['sky','earth']){
  await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:90000})
  const old=await page.locator('iframe').elementHandle()
  await page.getByRole('tab',{name:mode==='sky'?'Sky':'Earth',exact:true}).click()
  await expect(page.locator(`[data-runtime-mode=${mode}][data-runtime-status=ready]`)).toBeVisible({timeout:90000})
  await expect(page.locator('iframe')).toHaveCount(1)
  expect(await old!.evaluate(node=>node.isConnected)).toBe(false)
  if(mode==='earth'){
   const frame=await (await page.locator('iframe').elementHandle())!.contentFrame()
   await expect(frame!.locator('#viewer canvas')).toHaveAttribute('data-skybox','ready')
  }
 }
 expect(errors).toEqual([])
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
})
