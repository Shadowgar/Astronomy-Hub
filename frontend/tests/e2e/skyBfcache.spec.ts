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


test('unpinned cached Sky departure resets exploration and controls recover',async({page})=>{
 test.setTimeout(120000)
 await page.addInitScript(()=>{
  sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:false,context:'tonight',layers:['oras-site']}))
  ;(window as any).reviewCache={identity:crypto.randomUUID(),restored:0}
  addEventListener('pageshow',event=>{if((event as PageTransitionEvent).persisted)(window as any).reviewCache.restored++})
 })
 await page.goto('/sky-engine?date=2026-10-03T02%3A00%3A00.000Z');await ready(page)
 const identity=await page.evaluate(()=>(window as any).reviewCache.identity)
 // Record real canvas interaction and the frame's pagehide before the idle timeout.
 await page.locator('iframe').evaluate((node:HTMLIFrameElement)=>{
  const frame=node.contentWindow as any
  frame.reviewInteraction={events:[],departed:null}
  const canvas=frame.document.querySelector('#stel-canvas')
  canvas.addEventListener('wheel',()=>frame.reviewInteraction.events.push(performance.now()))
  frame.addEventListener('pagehide',(event:PageTransitionEvent)=>{
   frame.reviewInteraction.departed={persisted:event.persisted,elapsed:performance.now()-frame.reviewInteraction.events.at(-1)}
  })
 })
 const canvas=page.frameLocator('iframe').locator('#stel-canvas')
 const bounds=await canvas.boundingBox();expect(bounds).not.toBeNull()
 await page.mouse.move(bounds!.x+bounds!.width/2,bounds!.y+bounds!.height/2)
 await page.mouse.wheel(0,1)
 await expect(page.locator('.ws-shell')).toHaveAttribute('data-chrome-state','ACTIVE_EXPLORATION')
 await page.goto('/observe');await page.goBack({waitUntil:'commit'});await ready(page)
 await expect.poll(()=>page.evaluate(()=>(window as any).reviewCache.restored)).toBe(1)
 expect(await page.evaluate(()=>(window as any).reviewCache.identity)).toBe(identity)
 const departure=await page.locator('iframe').evaluate((node:HTMLIFrameElement)=>(node.contentWindow as any).reviewInteraction.departed)
 expect(departure.persisted).toBe(true);expect(departure.elapsed).toBeLessThan(350)
 await expect(page.locator('.ws-shell')).not.toHaveAttribute('data-chrome-state','ACTIVE_EXPLORATION')
 // Auto-hide may legitimately remain; entering an edge must recover usable chrome.
 await page.mouse.move(1,100)
 await expect(page.locator('.ws-header')).toBeVisible()
 await page.getByRole('button',{name:'Change time',exact:true}).click()
 await page.getByRole('button',{name:'+1h',exact:true}).click()
 await expect.poll(()=>nativeUtc(page),{timeout:25000}).toBe('2026-10-03T03:00:00.000Z')
 console.log('Unpinned bfcache proof',JSON.stringify({sameDocument:true,pageshowPersisted:true,departure,controlsRecovered:true,nativeUtc:await nativeUtc(page)}))
})
