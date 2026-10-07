import { test, expect } from '@playwright/test'
import { skyWorkspacePath } from '../../src/features/workspace/workspaceNavigation'
import { ORAS_SITE } from '../../src/config/orasSite'

for (const [label,width,height] of [['desktop',1440,900],['mobile',390,844]] as const) {
 test(`Tonight ${label}: real night, date navigation, refresh and weather degradation`,async({page})=>{
  test.setTimeout(120_000)
  await page.setViewportSize({width,height})
  const errors:string[]=[]
  page.on('pageerror',e=>errors.push(e.message))
  await page.goto('/tonight?date=2026-10-01')
  await expect(page.getByRole('heading',{name:'Top opportunities tonight'})).toBeVisible({timeout:60_000})
  await expect(page.getByRole('heading',{name:'Tonight at ORAS'})).toBeVisible()
  for(const name of ['Solar System','Deep Sky','Stars']) await expect(page.getByRole('heading',{name,exact:true})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await page.screenshot({path:`../output/playwright/tonight-${label}.png`,fullPage:true})
  await page.getByRole('link',{name:'Next night'}).click()
  await expect(page).toHaveURL(/date=2026-10-02/)
  await expect(page.locator('.observe-context-card strong')).toHaveText('2026-10-02',{timeout:60_000})
  await page.getByRole('link',{name:'Previous night'}).click()
  await expect(page).toHaveURL(/date=2026-10-01/)
  await page.reload()
  await expect(page.getByRole('heading',{name:'Top opportunities tonight'})).toBeVisible({timeout:60_000})
  const response=await page.request.get('/api/tonight?date=2026-10-01')
  const plan=await response.json()
  expect(plan.meta.contract_version).toBe('tonight.v1')
  await page.route('**/api/tonight?*',async route=>{
   // Controlled provider failure presentation, with real Docker astronomy.
   await route.fulfill({json:{...plan,data:{...plan.data,forecast:{status:'unavailable',provider:'open_meteo_hourly',hours:[]}}}})
  })
  await page.reload()
  await expect(page.getByText('Forecast unavailable for this night.',{exact:false})).toBeVisible()
  await expect(page.getByRole('heading',{name:'Top opportunities tonight'})).toBeVisible()
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  expect(errors).toEqual([])
 })
}

test('six exact Tonight targets preserve identity, planned time/site and camera',async({page,request})=>{
 test.setTimeout(240_000)
 const errors:string[]=[]
 page.on('pageerror',e=>errors.push(e.message))
 const response=await request.get('/api/tonight?date=2026-10-01')
 expect(response.ok()).toBe(true)
 const plan=await response.json()
 const targets=[...['M31','M42','star-vega','moon','jupiter'].map(id=>plan.data.targets.find((t:any)=>t.source_id===id)),plan.data.targets.find((t:any)=>t.catalog==='Hipparcos Tier 2 (local)')]
 expect(targets.every(Boolean)).toBe(true)
 for (const target of targets) {
  await page.goto('/tonight?date=2026-10-01')
  await expect(page.getByRole('heading',{name:'Top opportunities tonight'})).toBeVisible({timeout:60_000})
  await expect(page.locator('iframe')).toHaveCount(0)
  const group=page.getByRole('region',{name:({'solar-system':'Solar System','deep-sky':'Deep Sky',stars:'Stars'} as any)[target.category],exact:true})
  const card=group.getByRole('article').filter({has:page.getByRole('heading',{name:target.name,exact:true})})
  const more=group.getByRole('button',{name:/Show more/})
  // Each expansion must reveal another card; fail instead of waiting forever on a missing target.
  const count=plan.data.targets.filter((t:any)=>t.category===target.category).length
  for(let attempt=0;attempt<count&&await card.count()===0;attempt++){
   await expect(more).toBeVisible()
   const before=await group.getByRole('article').count()
   await more.click()
   await expect.poll(()=>group.getByRole('article').count()).toBeGreaterThan(before)
  }
  await expect(card).toHaveCount(1)
  const link=card.getByRole('link',{name:/Open in Sky/})
  await expect(link).toBeVisible()
  const path=skyWorkspacePath(target.sky_engine_url)
  expect(path).not.toBeNull()
  const expected=new URL(path!,page.url()),destination=new URL((await link.getAttribute('href'))!,page.url())
  const keys=['catalog','source_id','model','ra','dec','date','lat','lng','elev','focus']
  const assertIntent=(url:URL)=>{
   expect(url.pathname).toBe('/sky-engine')
   for(const key of keys)if(expected.searchParams.has(key))expect(url.searchParams.get(key),key).toBe(expected.searchParams.get(key))
   for(const key of ['catalog','source_id','model'])expect(url.searchParams.get(key),key).toBe(target[key])
   expect(url.searchParams.get('focus')).toBe('1')
   expect(Math.abs(Date.parse(url.searchParams.get('date')!)-Date.parse(target.opportunity.peak_time))).toBeLessThan(1)
   for(const [key,value] of [['lat',ORAS_SITE.latitude],['lng',ORAS_SITE.longitude],['elev',ORAS_SITE.elevationMeters]] as const)expect(Number(url.searchParams.get(key)),key).toBe(value)
  }
  assertIntent(destination)
  await link.click()
  await expect(page).toHaveURL(url=>url.pathname==='/sky-engine')
  assertIntent(new URL(page.url()))
  await expect(page.locator('[data-runtime-mode=sky][data-runtime-status=ready]')).toBeVisible({timeout:90_000})
  await expect(page.locator('iframe')).toHaveCount(1)
  const element=await page.getByTitle('ORAS Sky-Engine Runtime',{exact:true}).elementHandle()
  const frame=await element!.contentFrame()
  expect(frame).not.toBeNull()
  await frame!.waitForFunction(({target:expected,site}:any)=>{
   const vm=(document.querySelector('#app') as any)?.__vue__
   const stel=vm?.$stel,selected=vm?.$store?.state.selectedObject,selection=stel?.core.selection
   if(!selected || !selection || selected.catalog!==expected.catalog || selected.source_id!==expected.source_id || selected.model!==expected.model) return false
   const observer=stel.core.observer
   const mjd=Date.parse(expected.opportunity.peak_time)/86400000+40587
   if(Math.abs(observer.utc-mjd)>60/86400 || Math.abs(observer.latitude*180/Math.PI-site.latitude)>.00001 || Math.abs(observer.longitude*180/Math.PI-site.longitude)>.00001 || Math.abs(observer.elevation-site.elevationMeters)>.01) return false
   const azalt=stel.c2s(stel.convertFrame(observer,'ICRF','OBSERVED',selection.getInfo('radec')))
   const yaw=Math.atan2(Math.sin(observer.yaw-azalt[0]),Math.cos(observer.yaw-azalt[0]))
   return Math.abs(yaw)<.02 && Math.abs(observer.pitch-azalt[1])<.02
  },{target,site:ORAS_SITE},{timeout:60_000})
  const native=await frame!.evaluate(()=>{
   const vm=(document.querySelector('#app') as any).__vue__,stel=vm.$stel,o=stel.core.observer
   const angles=stel.c2s(stel.convertFrame(o,'ICRF','OBSERVED',stel.core.selection.getInfo('radec')))
   const s=vm.$store.state.selectedObject
   return {selection:{catalog:s.catalog,source_id:s.source_id,model:s.model},utc:o.utc,lat:o.latitude*180/Math.PI,lng:o.longitude*180/Math.PI,elev:o.elevation,yawError:Math.atan2(Math.sin(o.yaw-angles[0]),Math.cos(o.yaw-angles[0])),pitchError:o.pitch-angles[1]}
  })
  console.log('Tonight exact target',JSON.stringify({source_id:target.source_id,route:Object.fromEntries(new URL(page.url()).searchParams),native}))
  await page.screenshot({path:`../output/playwright/tonight-sky-${target.source_id}.png`})
  await page.goBack()
  await expect(page).toHaveURL(/\/tonight\?date=2026-10-01/)
  await expect(page.getByRole('heading',{name:'Top opportunities tonight'})).toBeVisible({timeout:60_000})
  await expect(page.locator('iframe')).toHaveCount(0)
  console.log('Tonight Back',target.source_id,'returned with zero runtime frames')
 }
 expect(errors).toEqual([])
})
