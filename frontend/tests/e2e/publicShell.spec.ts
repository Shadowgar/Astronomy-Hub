import {test,expect} from '@playwright/test'
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
