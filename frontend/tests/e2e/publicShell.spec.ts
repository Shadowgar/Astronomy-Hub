import { test, expect } from '@playwright/test'

for (const [label,width,height] of [['desktop',1440,900],['mobile',390,844]] as const) {
 test(`public shell ${label}: four real surfaces, history, refresh and viewport`,async({page})=>{
  test.setTimeout(180_000)
  await page.setViewportSize({width,height})
  const errors:string[]=[]
  page.on('pageerror',error=>errors.push(error.message))
  for(const [path,active] of [['/','Home'],['/observe','Observe'],['/tonight?date=2026-10-01','Tonight'],['/sky-engine','Sky']]){
   await page.goto(path)
   const nav=page.getByRole('navigation',{name:'Primary navigation'})
   await expect(nav.getByRole('link',{name:active,exact:true})).toHaveAttribute('aria-current','page')
   await expect(nav.getByRole('link')).toHaveCount(4)
   await expect(page.locator('main')).toHaveCount(1)
   await expect(page.locator('h1')).toHaveCount(1)
   if(active==='Home'){
    await expect(page.getByRole('heading',{name:'The sky over the ORAS observatory'})).toBeVisible()
    await expect(page.locator('.home-observe-row').first()).toBeVisible({timeout:60_000})
    await expect(page.locator('.home-opportunities')).toBeVisible({timeout:60_000})
    await expect(page.locator('iframe')).toHaveCount(0)
    await expect(page.getByText('Scope',{exact:true})).toHaveCount(0)
   } else if(active==='Observe'){
    await expect(page.locator('.observe-card').first()).toBeVisible({timeout:60_000})
    await page.getByRole('button',{name:/Details for/}).first().click()
    await expect(page.getByRole('complementary',{name:'Selected object detail'})).toBeVisible()
    await page.getByRole('button',{name:/Stars/}).click()
    await expect(page.getByRole('button',{name:/Stars/})).toHaveAttribute('aria-pressed','true')
   } else if(active==='Tonight'){
    await expect(page.getByRole('heading',{name:'Top opportunities tonight'})).toBeVisible({timeout:60_000})
    await expect(page.getByRole('region',{name:'Hourly forecast'})).toBeVisible()
   } else {
    await expect(page.locator('iframe')).toBeVisible({timeout:20_000})
    await expect(page.frameLocator('iframe').locator('canvas')).toBeVisible({timeout:60_000})
    const runtime=page.frames().find(frame=>frame.url().includes('/oras-sky-engine/'))
    await runtime!.waitForFunction(()=>Boolean((document.querySelector('#app') as any)?.__vue__?.$stel?.core?.observer),undefined,{timeout:60_000})
    const box=await page.locator('iframe').boundingBox()
    expect(box!.height).toBeGreaterThan(height*.65)
    expect(box!.y+box!.height).toBeLessThanOrEqual(height+1)
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
   await page.screenshot({path:`../output/playwright/public-shell-${active.toLowerCase()}-${label}.png`,fullPage:active!=='Sky'})
   await page.screenshot({path:`../output/playwright/public-shell-viewport-${active.toLowerCase()}-${label}.png`})
   await page.reload()
   await expect(nav.getByRole('link',{name:active,exact:true})).toHaveAttribute('aria-current','page')
  }
  await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'Home',exact:true}).click()
  await expect(page).toHaveURL(/\/$/)
  await page.goBack();await expect(page).toHaveURL(/\/sky-engine$/)
  await page.goForward();await expect(page).toHaveURL(/\/$/)
  expect(errors).toEqual([])
 })
}

test('Home shares query requests with Observe and Tonight; keyboard navigation',async({page})=>{
 test.setTimeout(120_000)
 let observeRequests=0,tonightRequests=0
 page.on('request',req=>{if(req.url().includes('/api/above-me?'))observeRequests++;if(req.url().includes('/api/tonight?'))tonightRequests++})
 await page.goto('/')
 await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Skip to content'})).toBeFocused()
 await page.keyboard.press('Enter');await expect(page.locator('#main-content')).toBeFocused()
 await expect(page.locator('.home-opportunities')).toBeVisible({timeout:60_000})
 await expect(page.locator('.home-observe-row').first()).toBeVisible({timeout:60_000})
 expect(observeRequests).toBe(1);expect(tonightRequests).toBe(1)
 const nav=page.getByRole('navigation',{name:'Primary navigation'})
 await nav.getByRole('link',{name:'Observe',exact:true}).click()
 await expect(page.locator('.observe-card').first()).toBeVisible()
 expect(observeRequests).toBe(1)
 await nav.getByRole('link',{name:'Tonight',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Top opportunities tonight'})).toBeVisible()
 expect(tonightRequests).toBe(1)
})

test('Home loads independently while Tonight is held pending',async({page})=>{
 let release!:()=>void
 const blocked=new Promise<void>(resolve=>{release=resolve})
 await page.route('**/api/tonight?*',async route=>{await blocked;await route.continue()})
 await page.goto('/')
 await expect(page.getByRole('heading',{name:'The sky over the ORAS observatory'})).toBeVisible()
 await expect(page.getByText('Planning tonight at ORAS…')).toBeVisible()
 await expect(page.locator('.home-observe-row').first()).toBeVisible({timeout:60_000})
 await expect(page.getByRole('link',{name:'Open Sky →',exact:true})).toBeVisible()
 release()
})

for(const failed of ['tonight','above-me','all','weather'] as const){
 test(`Home controlled failure: ${failed}`,async({page})=>{
  test.setTimeout(90_000)
  await page.setViewportSize({width:390,height:844})
  if(['tonight','all'].includes(failed))await page.route('**/api/tonight?*',route=>route.fulfill({status:503,json:{error:{message:'Controlled test failure'}}}))
  if(['above-me','all'].includes(failed))await page.route('**/api/above-me?*',route=>route.fulfill({status:503,json:{error:{message:'Controlled test failure'}}}))
  if(failed==='weather') await page.route('**/api/above-me?*',async route=>{
   const response=await route.fetch();const payload=await response.json()
   payload.meta.observability_context.weather={status:'unavailable',source:'open_meteo_current',last_updated:null}
   await route.fulfill({json:payload})
  })
  await page.goto('/')
  await expect(page.getByRole('navigation',{name:'Primary navigation'})).toBeVisible()
  await expect(page.getByRole('link',{name:'Open Sky →',exact:true})).toBeVisible()
  if(['tonight','all'].includes(failed))await expect(page.getByText('Tonight’s plan could not be loaded.')).toBeVisible({timeout:30_000})
  else await expect(page.locator('.home-opportunities')).toBeVisible({timeout:60_000})
  if(['above-me','all'].includes(failed))await expect(page.getByText('The current sky could not be loaded.')).toBeVisible({timeout:30_000})
  else await expect(page.locator('.home-observe-row').first()).toBeVisible({timeout:60_000})
  if(['above-me','all','weather'].includes(failed))await expect(page.getByText('Current conditions unavailable.',{exact:true})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await page.screenshot({path:`../output/playwright/public-shell-failure-${failed}.png`,fullPage:true})
 })
}

test('Observe custom context survives workflow/history; Tonight remains ORAS-specific',async({page})=>{
 test.setTimeout(120_000)
 const path='/observe?lat=42&lon=-80&elevation_ft=1200&at=2026-10-02T03%3A00%3A00Z'
 await page.goto(path)
 await expect(page.getByRole('heading',{name:'Observe this sky'})).toBeVisible()
 await expect(page.getByRole('button',{name:/Details for/}).first()).toBeVisible({timeout:60_000})
 await page.getByRole('button',{name:/Details for/}).first().click()
 await expect(page).toHaveURL(new RegExp('lat=42&lon=-80'))
 const nav=page.getByRole('navigation',{name:'Primary navigation'})
 await expect(nav.getByRole('link',{name:'Observe',exact:true})).toHaveAttribute('href',path)
 await expect(nav.getByRole('link',{name:'Tonight',exact:true})).toHaveAttribute('href','/tonight')
 await nav.getByRole('link',{name:'Tonight',exact:true}).click()
 await expect(page.getByRole('heading',{name:'Tonight at ORAS'})).toBeVisible()
 await page.goBack();await expect(page).toHaveURL(new RegExp('lat=42&lon=-80'))
 await expect(page.getByRole('heading',{name:'Observe this sky'})).toBeVisible()
})

test('Observe exact link still selects and centers the canonical object',async({page})=>{
 test.setTimeout(120_000)
 await page.goto('/observe?at=2026-10-02T03%3A00%3A00Z')
 const link=page.locator('.observe-card-actions a').first()
 await expect(link).toBeVisible({timeout:60_000})
 const href=await link.getAttribute('href');const url=new URL(href!,'http://local.invalid')
 await link.click()
 await expect(page).toHaveURL(/\/oras-sky-engine\/skysource\//)
 await page.waitForFunction((identity:{catalog:string|null;source_id:string|null;model:string|null})=>{
  const vm=(document.querySelector('#app') as any)?.__vue__,stel=vm?.$stel,selected=vm?.$store?.state.selectedObject,selection=stel?.core.selection
  if(!selected||!selection||selected.catalog!==identity.catalog||selected.source_id!==identity.source_id||selected.model!==identity.model)return false
  const observer=stel.core.observer
  const azalt=stel.c2s(stel.convertFrame(observer,'ICRF','OBSERVED',selection.getInfo('radec')))
  const yaw=Math.atan2(Math.sin(observer.yaw-azalt[0]),Math.cos(observer.yaw-azalt[0]))
  return Math.abs(yaw)<.02&&Math.abs(observer.pitch-azalt[1])<.02
 },{catalog:url.searchParams.get('catalog'),source_id:url.searchParams.get('source_id'),model:url.searchParams.get('model')},{timeout:60_000})
 await page.goBack();await expect(page).toHaveURL(/\/observe\?at=/)
})
