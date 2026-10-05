import {test,expect,type Frame,type Page} from '@playwright/test'
import {mkdirSync,writeFileSync} from 'node:fs'
test.use({channel:'chrome'})
const out='../output/playwright/sky-sheet-presentation'
mkdirSync(out,{recursive:true})
type Box={x:number;y:number;width:number;height:number}
const overlaps=(a:Box,b:Box)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y
async function ready(page:Page){await expect(page.locator('[data-runtime-mode=sky][data-runtime-status=ready]')).toBeVisible({timeout:90000});await expect(page.locator('iframe')).toHaveCount(1);return (await (await page.locator('iframe').elementHandle())!.contentFrame())!}
async function geometry(page:Page,frame:Frame,label:string){
 const header=(await page.locator('.ws-header').boundingBox())!,iframe=(await page.locator('iframe').boundingBox())!,toolbar=(await frame.locator('.oras-workspace-bottom').boundingBox())!,credits=(await frame.locator('.oras-workspace-source').boundingBox())!,modes=(await page.locator('.ws-modes').boundingBox())!,search=await frame.locator('.oras-workspace-search').isVisible()?await frame.locator('.oras-workspace-search').boundingBox():null,sheet=await page.locator('.ws-sheet').count()?await page.locator('.ws-sheet').boundingBox():null
 for(const box of [toolbar,credits]){expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize()!.width);expect(box.y).toBeGreaterThanOrEqual(header.y+header.height);expect(box.height).toBeGreaterThanOrEqual(44);expect(overlaps(box,modes)).toBe(false);if(sheet)expect(box.y+box.height).toBeLessThanOrEqual(sheet.y)}
 expect(overlaps(toolbar,credits)).toBe(false);if(search){expect(overlaps(toolbar,search)).toBe(false);expect(overlaps(credits,search)).toBe(false)}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 const buttons=await frame.locator('.oras-workspace-bottom button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{width:r.width,height:r.height}}));expect(buttons).toHaveLength(8);for(const b of buttons){expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44)}
 await page.screenshot({path:`${out}/${label}.png`});return{label,header,iframe,toolbar,credits,modes,search,sheet,inert:await page.locator('iframe').evaluate(n=>(n as HTMLElement).inert)}
}
async function toggle(frame:Frame,touch=false){const control=frame.getByRole('button',{name:'Atmosphere',exact:true}),before=await control.getAttribute('aria-pressed');if(touch)await control.tap();else await control.click();await expect(control).toHaveAttribute('aria-pressed',String(before!=='true'));await control.press('Space');await expect(control).toHaveAttribute('aria-pressed',before!)}
test.describe('mobile touch',()=>{
 test.use({hasTouch:true,isMobile:true})
 test('mobile Sky controls and attribution remain reachable at every sheet snap',async({page})=>{
 test.setTimeout(180000);await page.setViewportSize({width:390,height:844});await page.addInitScript(()=>sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site']})));const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/sky-engine');const frame=await ready(page),rows=[]
 rows.push(await geometry(page,frame,'mobile-no-sheet'));await toggle(frame,true)
 for(const surface of ['context','time','diagnostics']){
  if(surface==='context')await page.getByRole('button',{name:'Tonight',exact:true}).click()
  else if(surface==='time')await page.getByRole('button',{name:'Change time',exact:true}).click()
  else{await page.getByRole('button',{name:'Workspace menu',exact:true}).click();await page.getByRole('button',{name:'Diagnostics',exact:true}).click()}
  for(const snap of [360,640,96]){
   if(snap===640)await page.getByRole('button',{name:'Expand sheet',exact:true}).click()
   if(snap===96){await page.locator('.ws-sheet-handle').focus();await page.keyboard.press('Escape');await page.keyboard.press('Escape')}
   await expect(page.locator('.ws-sheet')).toHaveCSS('height',`${snap}px`);await page.waitForTimeout(220)
   rows.push(await geometry(page,frame,`mobile-${surface}-${snap}`));await expect(frame.locator('.oras-workspace-search')).not.toBeVisible();expect(await page.locator('iframe').evaluate(n=>(n as HTMLElement).inert)).toBe(false);await toggle(frame,true)
   if(surface==='context'&&snap===640){
    const dock=frame.locator('.oras-workspace-bottom'),dockBox=(await dock.boundingBox())!
    for(const button of await dock.getByRole('button').all()){
     await button.scrollIntoViewIfNeeded();const box=(await button.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(dockBox.x);expect(box.x+box.width).toBeLessThanOrEqual(dockBox.x+dockBox.width)
     const before=await button.getAttribute('aria-pressed');await button.tap();await expect(button).toHaveAttribute('aria-pressed',String(before!=='true'));await button.press('Space');await expect(button).toHaveAttribute('aria-pressed',before!)
    }
    await dock.evaluate(n=>{n.scrollLeft=0})
    const yaw=()=>frame.evaluate(()=>(document.querySelector('#app') as any).__vue__.$stel.core.observer.yaw),before=await yaw()
    expect(await page.evaluate(()=>document.elementFromPoint(350,194)?.tagName)).toBe('IFRAME');await page.mouse.move(320,194);await page.mouse.down();await page.waitForTimeout(150);await page.mouse.move(360,194,{steps:8});await page.waitForTimeout(150);await page.mouse.up();await expect.poll(async()=>Math.abs(await yaw()-before)).toBeGreaterThan(.00001);await expect(page.locator('.ws-sheet')).toHaveCSS('height','640px')
   }
   const credits=frame.getByRole('button',{name:'Sky sources and survey credits',exact:true});await credits.tap();await expect(frame.locator('.v-dialog .text-h5').filter({hasText:'Data Credits'})).toBeVisible();await expect.poll(()=>frame.evaluate(()=>(document.querySelector('#app') as any).__vue__.$store.state.showDataCreditsDialog)).toBe(true);await expect(page.locator('.ws-sheet')).not.toBeVisible();await expect(frame.locator('.v-dialog--active')).toHaveCSS('transform','none');const close=frame.getByRole('button',{name:'Close',exact:true}),closeBox=(await close.boundingBox())!;expect(closeBox.height).toBeGreaterThanOrEqual(44);expect(await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName,{x:closeBox.x+closeBox.width/2,y:closeBox.y+closeBox.height/2})).toBe('IFRAME');await page.screenshot({path:`${out}/mobile-${surface}-${snap}-credits.png`});await expect(frame.locator('.v-dialog--active')).toBeFocused();await page.keyboard.press('Escape');await expect(frame.locator('.v-dialog .text-h5').filter({hasText:'Data Credits'})).not.toBeVisible();await expect(page.locator('.ws-sheet')).toHaveCSS('height',`${snap}px`);await expect(page.locator('.ws-sheet')).toBeVisible()
  }
  await page.getByRole('button',{name:'Close sheet',exact:true}).click();await expect(frame.locator('.oras-workspace-search')).toBeVisible()
 }
 await frame.getByRole('textbox',{name:'Search...'}).fill('M31');await expect(frame.locator('.oras-workspace-search .v-list-item').filter({hasText:'M31'}).first()).toBeVisible({timeout:30000});await frame.locator('.oras-workspace-search').getByRole('textbox').fill('');await frame.locator('#stel-canvas').click({position:{x:350,y:300},delay:150});await expect(page.locator('iframe')).toHaveCount(1);writeFileSync(`${out}/mobile-geometry.json`,JSON.stringify({rows,errors},null,2));expect(errors).toEqual([])
})
})
test('desktop Sky search, toolbar, credits, time and selection drawer remain separate',async({page})=>{
 test.setTimeout(120000);await page.setViewportSize({width:1440,height:900});await page.addInitScript(()=>sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site']})));const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/sky-engine');const frame=await ready(page)
 await frame.getByRole('textbox',{name:'Search...'}).fill('M31');await frame.locator('.oras-workspace-search .v-list-item').filter({hasText:'M31'}).first().click();await expect(page.getByRole('region',{name:'Selected object',exact:true})).toBeVisible();await toggle(frame)
 const rows=[];for(const expanded of [false,true]){if(expanded)await page.getByRole('button',{name:'Details',exact:true}).click();const row=await geometry(page,frame,`desktop-${expanded?'expanded':'selection'}`),time=(await page.locator('.ws-time').boundingBox())!,drawer=(await page.getByRole('region',{name:'Selected object',exact:true}).boundingBox())!;for(const box of [row.toolbar,row.credits,row.search!]){expect(overlaps(box,time)).toBe(false);expect(overlaps(box,drawer)).toBe(false)}rows.push({...row,time,drawer})}
 await frame.getByRole('button',{name:'Sky sources and survey credits',exact:true}).press('Enter');await expect(frame.locator('.v-dialog .text-h5').filter({hasText:'Data Credits'})).toBeVisible();await frame.getByRole('button',{name:'Close',exact:true}).click();writeFileSync(`${out}/desktop-geometry.json`,JSON.stringify({rows,errors},null,2));expect(errors).toEqual([])
})
