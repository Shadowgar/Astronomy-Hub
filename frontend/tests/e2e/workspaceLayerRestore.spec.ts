import {test,expect} from '@playwright/test'

for(const mobile of [false,true])test(`new user layer intent wins while an earlier restoration is pending ${mobile?'mobile':'desktop'}`,async({page})=>{
 test.setTimeout(120000)
 await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:900})
 await page.addInitScript(()=>{
  if(window===window.top){
   sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site','aircraft']}))
   ;(window as any).layerTrace={commands:[],results:[],pending:[],maxPending:0}
  }
  const original=MessagePort.prototype.postMessage
  MessagePort.prototype.postMessage=function(data:any,...rest:any[]){
   const trace=(window.top as any).layerTrace
   if(trace&&data?.command==='setLayerEnabled'){
    const key=data.generation+':'+data.id
    if(data.type==='command'){trace.commands.push({key,...data.payload});trace.pending.push(key);trace.maxPending=Math.max(trace.maxPending,trace.pending.length)}
    if(data.type==='result'){trace.results.push(key);trace.pending=trace.pending.filter((id:string)=>id!==key)}
   }
   return original.call(this,data,...rest as [])
  }
 })
 let release:()=>void=()=>{},aircraftStarted=false
 const gate=new Promise<void>(resolve=>release=resolve)
 await page.route('**/api/earth/aircraft?*',async route=>{aircraftStarted=true;await gate;await route.fulfill({json:{now:Date.now(),ac:[]}}).catch(()=>{})})
 await page.route('**/api/earth/earthquakes',async route=>{const stamp=new Date().toISOString();await route.fulfill({json:{schemaVersion:1,kind:'earthquakes',temporalMode:'EVENT_FEED',source:'U.S. Geological Survey',observedAt:stamp,fetchedAt:stamp,records:[],limited:false}})})
 try{
  await page.goto('/earth');await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:90000})
  await expect.poll(()=>aircraftStarted).toBe(true)
  await page.getByRole('button',{name:'Layers',exact:true}).click()
  const quake=page.getByRole('switch',{name:'Earthquakes · M2.5+ · past day',exact:true})
  await expect(quake).toHaveAttribute('aria-checked','false');await quake.click()
  // The old head overlaps the toggle with restoration. Finish that acknowledgement
  // before releasing aircraft so its later stale restoration deterministically wins.
  const overlapping=await page.evaluate(()=>(window as any).layerTrace.commands.find((c:any)=>c.id==='earthquakes'))
  if(overlapping)await expect.poll(()=>page.evaluate(key=>(window as any).layerTrace.results.includes(key),overlapping.key)).toBe(true)
  release()
  await expect.poll(()=>page.evaluate(()=>{const t=(window as any).layerTrace,c=t.commands.find((c:any)=>c.id==='weather-radar');return !!c&&t.results.includes(c.key)}),{timeout:30000}).toBe(true)
  await expect(quake).toHaveAttribute('aria-checked','true')
  await expect.poll(()=>page.evaluate(()=>JSON.parse(sessionStorage.getItem('oras.workspace.ui.v1')!).layers.includes('earthquakes'))).toBe(true)
  const trace=await page.evaluate(()=>(window as any).layerTrace)
  expect(trace.commands.filter((c:any)=>c.id==='earthquakes').map((c:any)=>c.enabled)).toEqual([true])
  expect(trace.commands).toHaveLength(7);expect(trace.maxPending).toBe(1)
  const earth=page.frames().find(f=>f.url().includes('/earth-runtime/'))!
  expect(await earth.evaluate(()=>(window as any).orasEarthDiagnostics().layers.find((l:any)=>l.id==='earthquakes').status)).toBe('ready')
  await page.screenshot({path:`../output/playwright/earth-expansion/restore-intent-${mobile?'mobile':'desktop'}.png`})
 }finally{release()}
})

test('mode departure cancels queued choices and a new Earth client restores only acknowledged preferences',async({page})=>{
 test.setTimeout(120000)
 await page.addInitScript(()=>{
  if(window===window.top){sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site','aircraft']}));(window as any).layerCommands=[]}
  const original=MessagePort.prototype.postMessage
  MessagePort.prototype.postMessage=function(data:any,...rest:any[]){if(data?.type==='command'&&data.command==='setLayerEnabled')(window.top as any).layerCommands.push(data);return original.call(this,data,...rest as [])}
 })
 let release:()=>void=()=>{},started=false,hold=true
 const gate=new Promise<void>(resolve=>release=resolve)
 await page.route('**/api/earth/aircraft?*',async route=>{started=true;if(hold)await gate;await route.fulfill({json:{now:Date.now(),ac:[]}}).catch(()=>{})})
 try{
  await page.goto('/earth');await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:90000});await expect.poll(()=>started).toBe(true)
  const old=await page.locator('iframe').elementHandle()
  await page.getByRole('button',{name:'Layers',exact:true}).click()
  const quake=page.getByRole('switch',{name:'Earthquakes · M2.5+ · past day',exact:true})
  const aircraft=page.getByRole('switch',{name:'Aircraft near ORAS',exact:true});await expect(aircraft).toHaveAttribute('aria-checked','true')
  // Exercise the installed UI handlers in one browser task. Separate pointer
  // actionability waits can exhaust the deliberate 12-second aircraft hold on
  // software WebGL, testing completed jobs instead of queued cancellation.
  await page.evaluate(()=>{(document.querySelector('#layer-earthquakes') as HTMLButtonElement).click();(document.querySelector('#layer-aircraft') as HTMLButtonElement).click()})
  await expect(aircraft).toBeDisabled();await expect(quake).toBeDisabled()
  expect(await page.evaluate(()=>(window as any).layerCommands.filter((c:any)=>c.payload.id==='earthquakes'))).toEqual([])
  expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('oras.workspace.ui.v1')!).layers)).toEqual(['oras-site','aircraft'])
  await page.getByRole('tab',{name:'Sky',exact:true}).click();hold=false;release()
  await expect(page.locator('[data-runtime-mode=sky][data-runtime-status=ready]')).toBeVisible({timeout:90000});expect(await old!.evaluate(node=>node.isConnected)).toBe(false)
  expect(await page.evaluate(()=>(window as any).layerCommands.filter((c:any)=>c.payload.id==='earthquakes'))).toEqual([])
  await page.getByRole('tab',{name:'Earth',exact:true}).click();await expect(page.locator('[data-runtime-mode=earth][data-runtime-status=ready]')).toBeVisible({timeout:90000})
  await page.getByRole('button',{name:'Layers',exact:true}).click();await expect(page.getByRole('switch',{name:'Aircraft near ORAS',exact:true})).toHaveAttribute('aria-checked','true')
  await expect.poll(()=>page.evaluate(()=>(window as any).layerCommands.filter((c:any)=>c.payload.id==='weather-radar').length)).toBe(1)
  expect(await page.evaluate(()=>(window as any).layerCommands.filter((c:any)=>c.payload.id==='earthquakes').map((c:any)=>c.payload.enabled))).toEqual([false])
  expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('oras.workspace.ui.v1')!).layers)).toEqual(['oras-site','aircraft'])
 }finally{release()}
})
