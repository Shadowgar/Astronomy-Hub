import {test,expect} from '@playwright/test'
import {skyWorkspacePath} from '../../src/features/workspace/workspaceNavigation'
for(const [label,width,height] of [['desktop',1440,900],['mobile',390,844]] as const){
 test(`focused workflows preserve shareable routes ${label}`,async({page})=>{
  test.setTimeout(120000);await page.setViewportSize({width,height});await page.goto('/observe');const nav=page.getByRole('navigation',{name:'Primary navigation'});await expect(nav.getByRole('link')).toHaveCount(3);await expect(page.locator('.observe-card').first()).toBeVisible({timeout:60000});await page.getByRole('button',{name:/Details for/}).first().click();await expect(page.getByRole('complementary',{name:'Selected object detail'})).toBeVisible();await nav.getByRole('link',{name:'Tonight',exact:true}).click();await expect(page.getByRole('heading',{name:'Top opportunities tonight'})).toBeVisible({timeout:60000});await page.reload();await expect(nav.getByRole('link',{name:'Tonight',exact:true})).toHaveAttribute('aria-current','page');await page.goBack();await expect(page).toHaveURL(/\/observe/);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 })
}
test('workspace renderer becomes ready while Tonight is pending',async({page})=>{
 test.setTimeout(120000);await page.route('**/api/tonight?*',()=>{});await page.goto('/');await expect(page.locator('[data-runtime-mode=sky][data-runtime-status=ready]')).toBeVisible({timeout:90000});await expect(page.locator('.ws-context')).toContainText('Preparing your night plan');await page.getByRole('button',{name:'Observe',exact:true}).click();await expect(page.locator('.ws-target').first()).toBeVisible({timeout:60000})
})
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

test('Observe exact link still selects and centers the canonical object',async({page,request})=>{
 test.setTimeout(120_000)
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 const path='/observe?lat=42&lon=-80&elevation_ft=1200&at=2026-10-02T03%3A00%3A00Z'
 await page.goto(path)
 const link=page.locator('.observe-card-actions a').first()
 await expect(link).toBeVisible({timeout:60_000})
 const href=await link.getAttribute('href');const url=new URL(href!,'http://local.invalid')
 const response=await request.get('/api/above-me?lat=42&lng=-80&elev=365.76&time=2026-10-02T03%3A00%3A00Z&limit=100')
 expect(response.ok()).toBe(true)
 const payload=await response.json(),target=payload.data.objects.find((o:any)=>o.catalog===url.searchParams.get('catalog')&&o.source_id===url.searchParams.get('source_id')&&o.model===url.searchParams.get('model'))
 expect(target).toBeTruthy()
 const expected=new URL(skyWorkspacePath(target.sky_engine_url)!,'http://local.invalid')
 const assertIntent=(destination:URL)=>{
  expect(destination.pathname).toBe('/sky-engine')
  for(const key of ['catalog','source_id','model','ra','dec','date','lat','lng','elev','focus'])if(expected.searchParams.has(key))expect(destination.searchParams.get(key),key).toBe(expected.searchParams.get(key))
  expect(destination.searchParams.get('focus')).toBe('1')
  expect(Date.parse(destination.searchParams.get('date')!)).toBe(Date.parse(payload.meta.time))
  for(const key of ['lat','lng','elev'])expect(Number(destination.searchParams.get(key)),key).toBe(payload.meta.observer[key])
 }
 assertIntent(url)
 await link.click()
 await expect(page).toHaveURL(u=>u.pathname==='/sky-engine');assertIntent(new URL(page.url()))
 await expect(page.locator('[data-runtime-mode=sky][data-runtime-status=ready]')).toBeVisible({timeout:90_000})
 await expect(page.locator('iframe')).toHaveCount(1)
 const element=await page.getByTitle('ORAS Sky-Engine Runtime',{exact:true}).elementHandle(),frame=await element!.contentFrame()
 await frame!.waitForFunction(({identity,time,site}:any)=>{
  const vm=(document.querySelector('#app') as any)?.__vue__,stel=vm?.$stel,selected=vm?.$store?.state.selectedObject,selection=stel?.core.selection
  if(!selected||!selection||selected.catalog!==identity.catalog||selected.source_id!==identity.source_id||selected.model!==identity.model)return false
  const observer=stel.core.observer
  if(Math.abs(observer.utc-(Date.parse(time)/86400000+40587))>1/86400||Math.abs(observer.latitude*180/Math.PI-site.lat)>.00001||Math.abs(observer.longitude*180/Math.PI-site.lng)>.00001||Math.abs(observer.elevation-site.elev)>.01)return false
  const azalt=stel.c2s(stel.convertFrame(observer,'ICRF','OBSERVED',selection.getInfo('radec')))
  const yaw=Math.atan2(Math.sin(observer.yaw-azalt[0]),Math.cos(observer.yaw-azalt[0]))
  return Math.abs(yaw)<.02&&Math.abs(observer.pitch-azalt[1])<.02
 },{identity:target,time:payload.meta.time,site:payload.meta.observer},{timeout:60_000})
 console.log('Observe canonical identity/time/site and native yaw/pitch centered',JSON.stringify({catalog:target.catalog,source_id:target.source_id,model:target.model,route:Object.fromEntries(new URL(page.url()).searchParams)}))
 await page.screenshot({path:'../output/playwright/observe-unified-exact.png'})
 await page.goBack();await expect(page).toHaveURL(u=>u.pathname+u.search===path)
 await expect(page.getByRole('heading',{name:'Observe this sky'})).toBeVisible()
 await expect(page.locator('iframe')).toHaveCount(0);expect(page.frames()).toHaveLength(1)
 expect(errors).toEqual([])
})
