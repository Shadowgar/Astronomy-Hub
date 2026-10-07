import {test,expect,type Page,type Frame} from '@playwright/test'
test.use({channel:'chrome',viewport:{width:1440,height:900}})
const identityKeys=['catalog','source_id','model','ra','dec','focus']
const ready=async(page:Page)=>{await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:90000});await expect(page.locator('iframe')).toHaveCount(1);return page.frames().find(f=>f.url().includes('/oras-sky-engine/'))!}
const selection=(frame:Frame)=>frame.evaluate(()=>(window as any).orasSkyAdapter.snapshot().selection)
const persisted=(page:Page)=>page.evaluate(()=>Object.fromEntries(new URLSearchParams(sessionStorage.getItem('oras.runtime.intent.v1')||'')))
async function search(page:Page,frame:Frame,name:string){
 await frame.getByLabel('Search...').fill(name);const result=frame.locator('.oras-workspace-search .v-list-item').filter({hasText:new RegExp(name)}).first();await expect(result).toBeVisible({timeout:65000});await result.click()
 await expect(page.getByRole('region',{name:'Selected object',exact:true})).toBeVisible();await expect.poll(async()=>(await persisted(page)).source_id,{timeout:15000}).toMatch(new RegExp(name+'|NGC'))
}
async function deselect(page:Page,frame:Frame){
 const box=await frame.locator('#stel-canvas').boundingBox();expect(box).not.toBeNull()
 await page.mouse.click(box!.x+box!.width*.6,box!.y+box!.height*.3,{delay:150})
 console.log('native canvas click',await frame.evaluate(()=>{const s=(document.querySelector('#app') as any).__vue__.$stel;return {clicks:s.core.clicks,selected:!!s.core.selection}}))
 await expect.poll(()=>selection(frame),{timeout:15000}).toBeNull()
 await expect(page.getByRole('region',{name:'Selected object',exact:true})).toHaveCount(0)
 console.log('native deselection before product assertion',JSON.stringify({runtime:await selection(frame),persisted:await persisted(page),url:page.url()}))
 await expect.poll(async()=>{const intent=await persisted(page);return identityKeys.filter(key=>key in intent)},{timeout:6000}).toEqual([])
 for(const key of identityKeys)expect(new URL(page.url()).searchParams.has(key)).toBe(false)
 await page.getByRole('button',{name:'Workspace menu',exact:true}).click()
 const href=await page.getByRole('link',{name:'Open standalone Sky',exact:true}).getAttribute('href')
 for(const key of identityKeys)expect(new URL(href!,page.url()).searchParams.has(key)).toBe(false)
 await page.getByRole('button',{name:'Workspace menu',exact:true}).click()
}
for(const source of ['native-search','canonical-link'])test(`native deselection removes recovery identity through mode switch and reload ${source}`,async({page})=>{
 test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{if(window===top)sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site']}))})
 await page.goto(source==='native-search'?'/sky-engine':'/sky-engine?catalog=Messier+%28local%29&source_id=M31&model=dso&ra=10.6847083&dec=41.26875&focus=1&date=2026-10-03T02%3A00%3A00.000Z')
 let frame=await ready(page)
 if(source==='native-search')await search(page,frame,'M31')
 else {await expect.poll(async()=>(await selection(frame))?.source_id,{timeout:30000}).toBe('M31');await expect(page.getByRole('region',{name:'Selected object',exact:true})).toBeVisible();await expect.poll(async()=>(await persisted(page)).source_id).toBe('M31')}
 await deselect(page,frame)
 await page.getByRole('tab',{name:'Earth',exact:true}).click();await ready(page)
 await page.getByRole('tab',{name:'Sky',exact:true}).click();frame=await ready(page);await expect.poll(()=>selection(frame)).toBeNull();await expect(page.getByRole('region',{name:'Selected object',exact:true})).toHaveCount(0)
 await page.reload();frame=await ready(page);await expect.poll(()=>selection(frame)).toBeNull();await expect(page.getByRole('region',{name:'Selected object',exact:true})).toHaveCount(0)
 expect((await persisted(page)).source_id).toBeUndefined();await search(page,frame,'M42');expect((await selection(frame)).source_id).toMatch(/M42|NGC1976/)
 await page.screenshot({path:`../output/playwright/sky-ux/native-deselection-${source}.png`});expect(errors).toEqual([])
 console.log('native deselection recovered',JSON.stringify({source,switched:true,reloaded:true,newSelection:(await selection(frame)).source_id,pageErrors:errors}))
})
