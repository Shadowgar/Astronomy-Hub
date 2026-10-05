import {test,expect} from '@playwright/test'

// Playwright disables bfcache by default; this regression must exercise restoration.
test.use({channel:'chromium',launchOptions:{ignoreDefaultArgs:['--disable-back-forward-cache']}})
test('standalone Earth survives actual bfcache Back and defensive restoration',async({page})=>{
 test.setTimeout(90000)
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message))
 await page.addInitScript(()=>{
  const state={identity:crypto.randomUUID(),restored:0,messages:new Set<EventListenerOrEventListenerObject>()}
  ;(window as any).bfcacheEvidence=state
  const add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window)
  window.addEventListener=((type:any,listener:any,options:any)=>{if(type==='message')state.messages.add(listener);add(type,listener,options)}) as typeof window.addEventListener
  window.removeEventListener=((type:any,listener:any,options:any)=>{if(type==='message')state.messages.delete(listener);remove(type,listener,options)}) as typeof window.removeEventListener
  add('pageshow',event=>{if((event as PageTransitionEvent).persisted)state.restored++})
 })
 await page.goto('/earth-runtime/')
 await expect(page.locator('#earth')).toHaveAttribute('data-status','ready')
 const identity=await page.evaluate(()=>(window as any).bfcacheEvidence.identity)
 await page.goto('/')
 await page.goBack()
 await expect(page.locator('#earth')).toHaveAttribute('data-status','ready')
 const evidence=await page.evaluate(()=>({identity:(window as any).bfcacheEvidence.identity,restored:(window as any).bfcacheEvidence.restored,bridges:(window as any).bfcacheEvidence.messages.size,...(window as any).orasEarthDiagnostics()}))
 expect(evidence.identity).toBe(identity);expect(evidence.restored).toBe(1)
 expect(evidence.ready).toBe(true);expect(evidence.disposed).toBe(false);expect(evidence.viewerDestroyed).toBe(false);expect(evidence.bridges).toBe(1)
 await expect(page.locator('#viewer canvas')).toHaveCount(1)
 await expect(page.locator('[data-layer-id]')).toHaveCount(7)
 await page.getByRole('button',{name:'Return to ORAS',exact:true}).click()
 const canvas=page.locator('#viewer canvas'),box=await canvas.boundingBox()
 await canvas.click({position:{x:box!.width/2,y:box!.height/2}})
 await expect(page.locator('#selected-name')).toContainText('Oil Region')
 // A genuinely disposed document must not restore a stale ready state. Repeated
 // restore events during initialization share one startup and one bridge.
 await page.evaluate(()=>{
  window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}))
  window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))
  window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))
 })
 await expect.poll(()=>page.evaluate(()=>(window as any).orasEarthDiagnostics().ready)).toBe(true)
 await expect(page.locator('#earth')).toHaveAttribute('data-status','ready')
 await expect(page.locator('#viewer canvas')).toHaveCount(1)
 await expect(page.locator('[data-layer-id]')).toHaveCount(7)
 expect(await page.evaluate(()=>(window as any).bfcacheEvidence.messages.size)).toBe(1)
 expect(await page.evaluate(()=>(window as any).orasEarthDiagnostics().viewerDestroyed)).toBe(false)
 await page.getByRole('button',{name:'Return to ORAS',exact:true}).click()
 expect(errors).toEqual([])
})
