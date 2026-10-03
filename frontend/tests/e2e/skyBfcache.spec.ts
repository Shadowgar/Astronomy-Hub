import {test,expect} from '@playwright/test'

test.use({channel:'chromium',timezoneId:'America/Los_Angeles',launchOptions:{ignoreDefaultArgs:['--disable-back-forward-cache']}})
const pin=()=>sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site']}))
const ready=async(page:any)=>expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:90000})
const nativeUtc=async(page:any)=>page.locator('iframe').evaluate((node:HTMLIFrameElement)=>{
 const adapter=(node.contentWindow as any)?.orasSkyAdapter
 return adapter?new Date(Math.round((adapter.observer.utc-40587)*86400000)).toISOString():null
})

test('actual cached Sky restoration keeps the same document and working time bridge',async({page})=>{
 test.setTimeout(120000);await page.addInitScript(pin)
 await page.addInitScript(()=>{
  ;(window as any).reviewCache={identity:crypto.randomUUID(),restored:0}
  addEventListener('pageshow',event=>{if((event as PageTransitionEvent).persisted)(window as any).reviewCache.restored++})
 })
 await page.goto('/sky-engine?date=2026-10-03T02%3A00%3A00.000Z');await ready(page)
 const identity=await page.evaluate(()=>(window as any).reviewCache.identity)
 await page.goto('/observe');await page.goBack({waitUntil:'commit'});await ready(page);await expect.poll(()=>page.evaluate(()=>(window as any).reviewCache.restored)).toBe(1)
 expect(await page.evaluate(()=>(window as any).reviewCache.identity)).toBe(identity)
 expect(await page.evaluate(()=>(window as any).reviewCache.restored)).toBe(1)
 await page.getByRole('button',{name:'Change time',exact:true}).click()
 await page.getByRole('button',{name:'+1h',exact:true}).click()
 await expect.poll(()=>nativeUtc(page),{timeout:25000}).toBe('2026-10-03T03:00:00.000Z')
})
