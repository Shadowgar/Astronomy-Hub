import {it,expect,vi} from 'vitest'
import {SolarResourceOwner,SolarTextureBudget} from '../src/features/solar/solarAssets'
it('disposes each owned GPU resource exactly once and rejects late ownership',()=>{
 const owner=new SolarResourceOwner(),resource={dispose:vi.fn()}
 owner.keep(resource);owner.keep(resource);owner.dispose();owner.dispose()
 expect(resource.dispose).toHaveBeenCalledTimes(1)
 const late={dispose:vi.fn()};expect(()=>owner.keep(late)).toThrow();expect(late.dispose).toHaveBeenCalledTimes(1)
})
it('aborts in-flight fetches and cannot accept a decoded image after disposal',async()=>{
 const owner=new SolarResourceOwner(),controller=owner.signal
 owner.dispose();expect(controller.aborted).toBe(true)
 await expect(owner.bytes('/solar-assets/v2/saturn-nasa.glb')).rejects.toThrow()
})
it('rejects oversized responses before decoding and bounds cumulative texture storage',async()=>{
 const owner=new SolarResourceOwner(32)
 expect(()=>owner.reserveTexture(2,2)).not.toThrow()
 expect(()=>owner.reserveTexture(4,4)).toThrow(/budget/)
 const fetcher=vi.fn(async()=>new Response('x',{headers:{'content-length':'999999999'}}))
 await expect(owner.bytes('/solar-assets/v2/saturn-nasa.glb',fetcher)).rejects.toThrow(/budget/)
 expect(owner.diagnostics().textureBytes).toBe(22)
 owner.dispose()
})
it('reserves in-flight decode memory and closes cancelled decode results without negative shared accounting',async()=>{
 const budget=new SolarTextureBudget(1024),owner=new SolarResourceOwner(budget)
 let finish!:(v:any)=>void
 const bitmap={width:4,height:2,close:vi.fn()},decode=vi.fn(()=>new Promise<any>(resolve=>{finish=resolve}))
 vi.stubGlobal('fetch',vi.fn(async()=>new Response('image')));vi.stubGlobal('createImageBitmap',decode)
 try{
  const pending=owner.texture('/detail.jpg',4,true,{width:4,height:2,flipY:false})
  await vi.waitFor(()=>expect(decode).toHaveBeenCalledTimes(1))
  expect(budget.diagnostics().textureBytes).toBe(43)
  expect(decode.mock.calls[0][1]).toMatchObject({resizeWidth:4,resizeHeight:2,imageOrientation:'none'})
  owner.dispose();expect(budget.diagnostics().textureBytes).toBe(43)
  finish(bitmap);await expect(pending).rejects.toThrow()
  expect(bitmap.close).toHaveBeenCalledTimes(1);expect(budget.diagnostics().textureBytes).toBe(0)
  expect(budget.diagnostics().textureAllocations).toBe(0)
 }finally{vi.unstubAllGlobals()}
})
