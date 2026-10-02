import {test,expect,type Route} from '@playwright/test'

test('final Earth artifact identity reaches ready in host and standalone',async({page,request})=>{
 test.setTimeout(120000)
 const metadata=await request.get('/runtime-versions.json'),release=await request.get('/earth-runtime/release.json')
 expect(metadata.ok()).toBe(true);expect(release.ok()).toBe(true)
 const expected=(await metadata.json()).earth,artifact=await release.json()
 expect(artifact.owner).toBe('Astronomy Hub');expect(artifact.upstream_sha).toBe(expected.sha);expect(artifact.artifact_sha256).toBe(expected.artifact_sha256)
 await page.goto('/earth');await expect(page.locator('[data-runtime-mode=earth][data-runtime-status=ready]')).toBeVisible({timeout:60000})
 await expect(page.locator('iframe')).toHaveCount(1)
 const earth=page.frames().find(f=>f.url().includes('/earth-runtime/'))!
 expect(await earth.evaluate(()=>(window as any).orasEarthDiagnostics().viewerDestroyed)).toBe(false)
 await expect(earth.locator('canvas').first()).toBeVisible()
 await page.goto('/earth-runtime/');await expect(page.locator('canvas').first()).toBeVisible({timeout:60000})
 expect(await page.evaluate(()=>(window as any).orasEarthDiagnostics().viewerDestroyed)).toBe(false)
 console.log('FINAL_PRODUCTION_IDENTITY',JSON.stringify({owner:artifact.owner,upstream_sha:artifact.upstream_sha,artifact_sha256:artifact.artifact_sha256,host:'ready',standalone:'ready'}))
})

test('RuntimeHost cancels an in-flight probe on unmount and checks fresh identity on return',async({page})=>{
 test.setTimeout(120000)
 let captured!:(route:Route)=>void
 const pending=new Promise<Route>(resolve=>{captured=resolve})
 await page.route('**/earth-runtime/release.json',route=>{captured(route)})
 await page.goto('/earth');const stale=await pending
 await expect(page.locator('[data-runtime-status=checking]')).toBeVisible()
 await page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'Home',exact:true}).click()
 await stale.fulfill({json:{owner:'stale',upstream_sha:'stale',artifact_sha256:'stale'}}).catch(()=>{/* request was aborted */})
 await expect(page.getByRole('heading',{name:'The sky over the ORAS observatory'})).toBeVisible();await expect(page.locator('iframe')).toHaveCount(0);await expect(page.locator('[data-runtime-status=error]')).toHaveCount(0)
 await page.unroute('**/earth-runtime/release.json');await page.goto('/earth')
 await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:60000});await expect(page.locator('iframe')).toHaveCount(1)
})
