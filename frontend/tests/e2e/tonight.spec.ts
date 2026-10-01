import { test, expect } from '@playwright/test'

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
 const plan=await (await request.get('/api/tonight?date=2026-10-01')).json()
 const targets=[...['M31','M42','star-vega','moon','jupiter'].map(id=>plan.data.targets.find((t:any)=>t.source_id===id)),plan.data.targets.find((t:any)=>t.catalog==='Hipparcos Tier 2 (local)')]
 expect(targets.every(Boolean)).toBe(true)
 for (const target of targets) {
  await page.goto('/tonight?date=2026-10-01')
  await expect(page.getByRole('heading',{name:'Top opportunities tonight'})).toBeVisible({timeout:60_000})
  const group=page.getByRole('region',{name:({'solar-system':'Solar System','deep-sky':'Deep Sky',stars:'Stars'} as any)[target.category],exact:true})
  const link=group.locator(`a[href="${target.sky_engine_url}"]`)
  while(await link.count()===0) await group.getByRole('button',{name:/Show more/}).click()
  await link.click()
  await page.waitForFunction((expected:any)=>{
   const vm=(document.querySelector('#app') as any)?.__vue__
   const stel=vm?.$stel,selected=vm?.$store?.state.selectedObject,selection=stel?.core.selection
   if(!selected || !selection || selected.catalog!==expected.catalog || selected.source_id!==expected.source_id || selected.model!==expected.model) return false
   const observer=stel.core.observer
   const mjd=Date.parse(expected.opportunity.peak_time)/86400000+40587
   if(Math.abs(observer.utc-mjd)>60/86400 || Math.abs(observer.latitude*180/Math.PI-41.321903)>.00001 || Math.abs(observer.longitude*180/Math.PI+79.585394)>.00001 || Math.abs(observer.elevation-432.816)>.01) return false
   const azalt=stel.c2s(stel.convertFrame(observer,'ICRF','OBSERVED',selection.getInfo('radec')))
   const yaw=Math.atan2(Math.sin(observer.yaw-azalt[0]),Math.cos(observer.yaw-azalt[0]))
   return Math.abs(yaw)<.02 && Math.abs(observer.pitch-azalt[1])<.02
  },target,{timeout:60_000})
  await page.screenshot({path:`../output/playwright/tonight-sky-${target.source_id}.png`})
  await page.goBack()
  await expect(page).toHaveURL(/\/tonight\?date=2026-10-01/)
 }
})
