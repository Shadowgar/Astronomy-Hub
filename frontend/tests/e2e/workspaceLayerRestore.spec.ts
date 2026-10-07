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
 test.setTimeout(180000)
 await page.addInitScript(()=>{
  if(window===window.top){
   sessionStorage.setItem('oras.workspace.ui.v1',JSON.stringify({version:1,pin:true,context:'tonight',layers:['oras-site','aircraft']}))
   ;(window as any).departureTrace={commands:[],results:[],barrier:null,lastDeadline:null,departed:false,release:null}
   // The result barrier also controls this request's clock. Production still
   // uses its ordinary 18-second deadline; only this held test request is paused.
   const timeout=window.setTimeout
   window.setTimeout=function(callback:any,delay?:number,...args:any[]){
    const id=timeout.call(window,callback,delay,...args)
    if(delay===18000)(window as any).departureTrace.lastDeadline=id
    return id
   } as typeof window.setTimeout
  }
  const original=MessagePort.prototype.postMessage
  MessagePort.prototype.postMessage=function(data:any,...rest:any[]){
   const trace=(window.top as any).departureTrace
   if(data?.command==='setLayerEnabled'){
    const key=data.nonce+':'+data.generation+':'+data.id
    if(data.type==='command'){
     trace.commands.push({...data,key,afterDeparture:trace.departed})
     if(data.payload.id==='aircraft'&&!trace.barrier){
      clearTimeout(trace.lastDeadline);trace.barrier={key,deadlinePaused:true,result:null,released:false}
     }
    }
    if(data.type==='result'){
     if(trace.barrier?.key===key&&!trace.barrier.released){
      trace.barrier.result=data
      const port=this;trace.release=()=>{trace.barrier.released=true;trace.results.push(key);original.call(port,data,...rest as [])}
      return
     }
     trace.results.push(key)
    }
   }
   if(data?.type==='command'&&data.command==='destroy'&&trace?.barrier&&!trace.barrier.released)trace.departed=true
   return original.call(this,data,...rest as [])
  }
 })
 await page.route('**/api/earth/aircraft?*',route=>route.fulfill({json:{now:Date.now(),ac:[]}}))
 await page.goto('/earth');await expect(page.locator('[data-runtime-status=ready]')).toBeVisible({timeout:90000})
 await expect.poll(()=>page.evaluate(()=>(window as any).departureTrace.barrier?.result?.payload.ok)).toBe(true)
 const old=await page.locator('iframe').elementHandle()
 await page.getByRole('button',{name:'Layers',exact:true}).click()
 const aircraft=page.getByRole('switch',{name:'Aircraft near ORAS',exact:true});await expect(aircraft).toHaveAttribute('aria-checked','true')
 const before=await page.evaluate(()=>{const t=(window as any).departureTrace;return {held:t.barrier,acknowledged:t.results.includes(t.barrier.key)}})
 expect(before.held.deadlinePaused).toBe(true);expect(before.held.released).toBe(false);expect(before.acknowledged).toBe(false)
 // Queue choices through installed UI handlers. The held acknowledgement and
 // its paused test clock make subsequent pointer actionability waits harmless.
 await page.evaluate(()=>{
  (document.querySelector('#layer-earthquakes') as HTMLButtonElement).click();
  (document.querySelector('#layer-aircraft') as HTMLButtonElement).click()
 })
 await expect(aircraft).toBeDisabled()
 await expect(page.getByRole('switch',{name:'Earthquakes · M2.5+ · past day',exact:true})).toBeDisabled()
 expect(await page.evaluate(()=>(window as any).departureTrace.barrier.released)).toBe(false)
 await page.getByRole('tab',{name:'Sky',exact:true}).click()
 await expect.poll(()=>page.evaluate(()=>(window as any).departureTrace.departed)).toBe(true)
 const departed=await page.evaluate(()=>{const t=(window as any).departureTrace;return {released:t.barrier.released,acknowledged:t.results.includes(t.barrier.key),quakes:t.commands.filter((c:any)=>c.payload.id==='earthquakes'),preferences:JSON.parse(sessionStorage.getItem('oras.workspace.ui.v1')!).layers}})
 expect(departed).toEqual({released:false,acknowledged:false,quakes:[],preferences:['oras-site','aircraft']})
 await expect(page.locator('[data-runtime-mode=sky][data-runtime-status=ready]')).toBeVisible({timeout:90000});expect(await old!.evaluate(node=>node.isConnected)).toBe(false)
 // Deliver the retained old-client result only after its document is departed.
 await page.evaluate(()=>(window as any).departureTrace.release())
 expect(await page.evaluate(()=>(window as any).departureTrace.commands.filter((c:any)=>c.payload.id==='earthquakes'))).toEqual([])
 await page.getByRole('tab',{name:'Earth',exact:true}).click();await expect(page.locator('[data-runtime-mode=earth][data-runtime-status=ready]')).toBeVisible({timeout:90000})
 await page.getByRole('button',{name:'Layers',exact:true}).click();await expect(page.getByRole('switch',{name:'Aircraft near ORAS',exact:true})).toHaveAttribute('aria-checked','true')
 await expect.poll(()=>page.evaluate(()=>{const t=(window as any).departureTrace,c=t.commands.find((c:any)=>c.payload.id==='weather-radar');return !!c&&t.results.includes(c.key)})).toBe(true)
 const trace=await page.evaluate(()=>(window as any).departureTrace)
 expect(trace.commands.filter((c:any)=>c.payload.id==='earthquakes').map((c:any)=>c.payload.enabled)).toEqual([false])
 const oldNonce=trace.commands[0].nonce
 expect(trace.commands.filter((c:any)=>c.nonce===oldNonce&&c.afterDeparture)).toEqual([])
 const earth=page.frames().find(f=>f.url().includes('/earth-runtime/'))!
 expect(await earth.evaluate(()=>(window as any).orasEarthDiagnostics().layers.find((l:any)=>l.id==='earthquakes').status)).toBe('disabled')
 expect(await page.evaluate(()=>JSON.parse(sessionStorage.getItem('oras.workspace.ui.v1')!).layers)).toEqual(['oras-site','aircraft'])
 console.log('DEPARTURE_BARRIER',JSON.stringify({before,departed,oldClientQueuedDispatches:0,newClientEarthquakeEnabled:false}))
})
