import {test,expect,type Page,type Frame} from '@playwright/test'
test.use({channel:'chrome',viewport:{width:1440,height:900}})
const keys=['catalog','source_id','model','ra','dec'] as const
const ready=async(page:Page)=>{await expect(page.locator('[data-runtime-mode=sky][data-runtime-status=ready]')).toBeVisible({timeout:90000});await expect(page.locator('iframe')).toHaveCount(1);return page.frames().find(f=>f.url().includes('/oras-sky-engine/'))!}
const selected=(frame:Frame)=>frame.evaluate(()=>(window as any).orasSkyAdapter.snapshot().selection)
const identity=(url:string)=>{const p=new URL(url).searchParams;return Object.fromEntries(keys.filter(k=>p.has(k)).map(k=>[k,p.get(k)]))}
const intent=(page:Page)=>page.evaluate(()=>Object.fromEntries(new URLSearchParams(sessionStorage.getItem('oras.runtime.intent.v1')||'')))
test('acknowledged native A to B selection replaces URL and survives reload, mode cycle and recovery',async({page})=>{
 test.setTimeout(240000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.addInitScript(()=>{if(window===top)sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site']}))})
 const scene={date:'2026-10-03T02:00:00.000Z',lat:'41.321903',lng:'-79.585394',elev:'432.816',context:'proof'}
 await page.goto('/sky-engine?'+new URLSearchParams({...scene,catalog:'Messier (local)',source_id:'M31',model:'dso',ra:'10.6847083',dec:'41.26875',focus:'1'}))
 let frame=await ready(page);await expect.poll(async()=>(await selected(frame))?.source_id,{timeout:30000}).toBe('M31')
 await expect(page.getByRole('region',{name:'Selected object',exact:true})).toBeVisible()
 const history=await page.evaluate(()=>window.history.length)
 await frame.getByLabel('Search...').fill('M42');const result=frame.locator('.oras-workspace-search .v-list-item').filter({hasText:/M42/}).first();await expect(result).toBeVisible({timeout:65000});await result.click()
 await expect.poll(async()=>(await selected(frame))?.source_id,{timeout:15000}).toMatch(/M42|NGC1976/)
 const b=await selected(frame),expected=Object.fromEntries(keys.filter(k=>b[k]!==undefined).map(k=>[k,String(b[k])]))
 await expect.poll(async()=>(await intent(page)).source_id,{timeout:15000}).toBe(b.source_id)
 // Soft URL assertions deliberately continue through reload to demonstrate the
 // stale exact link restoring A on the unfixed head, as well as catching the bug.
 await expect.configure({soft:true}).poll(()=>identity(page.url()),{timeout:5000}).toEqual(expected)
 const beforeReload={native:b,persisted:await intent(page),url:page.url()}
 await page.reload();frame=await ready(page);await expect.poll(async()=>(await selected(frame))?.source_id,{timeout:30000}).not.toBeUndefined()
 console.log('NATIVE_SELECTION_URL_RELOAD',JSON.stringify({beforeReload,afterReload:{native:await selected(frame),persisted:await intent(page),url:page.url()}}))
 expect((await selected(frame)).source_id).toBe(b.source_id);expect(identity(page.url())).toEqual(expected)
 expect(new URL(page.url()).searchParams.has('focus')).toBe(false)
 for(const [key,value] of Object.entries(scene))expect(new URL(page.url()).searchParams.get(key)).toBe(value)
 expect(await page.evaluate(()=>window.history.length)).toBe(history)
 await page.getByRole('tab',{name:'Earth',exact:true}).click();await expect(page.locator('[data-runtime-mode=earth][data-runtime-status=ready]')).toBeVisible({timeout:90000});await expect(page.locator('iframe')).toHaveCount(1)
 await page.getByRole('tab',{name:'Sky',exact:true}).click();frame=await ready(page);await expect.poll(async()=>(await selected(frame))?.source_id,{timeout:30000}).toBe(b.source_id)
 await page.getByRole('button',{name:'Workspace menu',exact:true}).click();const recovery=await page.getByRole('link',{name:'Open standalone Sky',exact:true}).getAttribute('href');expect(identity(new URL(recovery!,page.url()).href)).toEqual(expected)
 await page.getByRole('button',{name:'Workspace menu',exact:true}).click();await page.screenshot({path:'../output/playwright/sky-ux/native-selection-url.png'})
 expect(errors).toEqual([]);console.log('NATIVE_SELECTION_URL_GREEN',JSON.stringify({identity:expected,modeCycle:true,recovery,pageErrors:errors}))
})
