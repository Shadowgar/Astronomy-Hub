import {it,expect,vi} from 'vitest'
import {SolarResourceOwner,SolarTextureBudget} from '../src/features/solar/solarAssets'
import {SolarTextureStreamer,solarTextureQuality} from '../src/features/solar/solarTextureStreaming'
import {solarDetailAsset} from '../src/features/solar/solarVisualAssets'

const deferred=()=>{let resolve!:(v:any)=>void,reject!:(e:Error)=>void;const promise=new Promise<any>((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}}
const flush=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve()}
function fixture(){
 const calls:{id:string;max:number;owner:SolarResourceOwner;pending:ReturnType<typeof deferred>}[]=[],apply=vi.fn(),requestFrame=vi.fn()
 const budget=new SolarTextureBudget(solarTextureQuality('balanced').totalBytes)
 const load=vi.fn((id:string,max:number,owner:SolarResourceOwner)=>{const pending=deferred();calls.push({id,max,owner,pending});return pending.promise})
 const stream=new SolarTextureStreamer('balanced',{budget,load,apply,requestFrame})
 return{stream,calls,apply,load,budget}
}
it('loads no detail at startup, coalesces the selected target, and aborts superseded demand',async()=>{
 const {stream,calls,apply,load}=fixture();expect(load).not.toHaveBeenCalled()
 stream.setTarget('jupiter');stream.setTarget('jupiter');expect(calls).toHaveLength(1)
 stream.setTarget('saturn');expect(calls[0].owner.signal.aborted).toBe(true)
 calls[0].pending.resolve({map:'stale'});await flush();expect(apply).not.toHaveBeenCalled()
 calls[1].pending.resolve({map:'current'});await flush();expect(apply).toHaveBeenLastCalledWith('saturn',{map:'current'})
 expect(stream.diagnostics().cancelled).toBe(1);stream.dispose()
})
it('switches a completed quality generation atomically before disposing its old texture',async()=>{
 const {stream,calls,apply,budget}=fixture();stream.setTarget('earth')
 const first={dispose:vi.fn()},second={dispose:vi.fn()};calls[0].owner.keep(first);calls[0].owner.reserveTexture(4096,2048)
 calls[0].pending.resolve({map:'4k'});await flush()
 stream.setQuality('detailed');expect(first.dispose).not.toHaveBeenCalled();expect(calls[1].max).toBe(8192)
 calls[1].owner.keep(second);calls[1].owner.reserveTexture(8192,4096)
 apply.mockImplementation((_id,payload)=>{if(payload?.map==='8k')expect(first.dispose).not.toHaveBeenCalled()})
 calls[1].pending.resolve({map:'8k'});await flush();expect(first.dispose).toHaveBeenCalledTimes(1)
 expect(budget.diagnostics().textureBytes).toBe(Math.ceil(8192*4096*16/3))
 stream.setTarget(null);expect(apply).toHaveBeenLastCalledWith('earth',null);expect(second.dispose).toHaveBeenCalledTimes(1)
 expect(budget.diagnostics().textureBytes).toBe(0);stream.dispose()
})
it('retains a last valid map on load failure and bounds quality downgrade before new decoding',async()=>{
 const {stream,calls,apply,budget}=fixture();stream.setTarget('earth');calls[0].owner.reserveTexture(4096,2048);calls[0].pending.resolve({map:'4k'});await flush()
 stream.setQuality('detailed');calls[1].pending.reject(Error('offline'));await flush()
 expect(apply).toHaveBeenCalledTimes(1);expect(stream.diagnostics().errors).toBe(1)
 stream.setQuality('efficient');expect(calls[0].owner.signal.aborted).toBe(true);expect(apply).toHaveBeenLastCalledWith('earth',null)
 expect(budget.diagnostics().textureBudget).toBe(solarTextureQuality('efficient').totalBytes)
 stream.dispose();calls[2].pending.resolve({map:'late'});await flush();expect(apply).toHaveBeenCalledTimes(2)
})
it('shares per-texture GPU reservations across owners and returns every reservation on disposal',()=>{
 const budget=new SolarTextureBudget(64),base=new SolarResourceOwner(budget),detail=new SolarResourceOwner(budget)
 base.reserveTexture(2,2);detail.reserveTexture(2,2);expect(budget.diagnostics().textureAllocations).toBe(2)
 expect(()=>detail.reserveTexture(2,2)).toThrow(/budget/);detail.dispose()
 expect(budget.diagnostics().textureBytes).toBe(22);expect(budget.diagnostics().textureAllocations).toBe(1)
 expect(()=>budget.setLimit(16)).toThrow(/budget/);base.dispose();expect(budget.diagnostics().textureBytes).toBe(0)
})
it('honors hardware texture limits without requesting impossible source upscales',()=>{
 const calls:any[]=[],stream=new SolarTextureStreamer('detailed',{budget:new SolarTextureBudget(384*1024*1024),maxTextureSize:2048,apply:vi.fn(),requestFrame:vi.fn(),load:(id,max)=>{calls.push([id,max]);return new Promise(()=>{})}})
 stream.setTarget('earth');expect(calls).toEqual([['earth',2048]]);stream.dispose()
})
it('selects the actual source file for each quality instead of downloading a maximum to resize',()=>{
 expect(solarDetailAsset('earth',4096)?.image.url).toContain('earth-4096.jpg')
 expect(solarDetailAsset('earth',8192)?.image.width).toBe(8192)
 expect(solarDetailAsset('mars',8192)?.image.width).toBe(4096)
 expect(solarDetailAsset('jupiter',4096)?.asset.mapping).toBe('source-uv')
 expect(solarDetailAsset('sun',4096)).toBeNull()
})
it('defers replacement admission and a smaller budget until uncancellable bitmap work actually settles',async()=>{
 const bitmap={width:8192,height:4096,close:vi.fn()};let finish!:(v:any)=>void
 const decode=vi.fn(()=>new Promise<any>(resolve=>{finish=resolve}))
 vi.stubGlobal('fetch',vi.fn(async()=>new Response('source')));vi.stubGlobal('createImageBitmap',decode)
 const budget=new SolarTextureBudget(384*1024*1024),apply=vi.fn()
 const stream=new SolarTextureStreamer('detailed',{budget,apply,requestFrame:vi.fn()})
 try{
  stream.setTarget('earth');await vi.waitFor(()=>expect(decode).toHaveBeenCalledTimes(1))
  stream.setQuality('efficient');expect(stream.diagnostics().retiring).toHaveLength(1)
  expect(budget.diagnostics().textureBytes).toBe(Math.ceil(8192*4096*16/3))
  expect(decode).toHaveBeenCalledTimes(1);expect(apply).not.toHaveBeenCalled()
  finish(bitmap);await vi.waitFor(()=>expect(decode).toHaveBeenCalledTimes(2))
  expect(bitmap.close).toHaveBeenCalledTimes(1);expect(budget.diagnostics().textureBudget).toBe(64*1024*1024)
  stream.dispose();finish({width:2048,height:1024,close:vi.fn()});await flush()
  expect(budget.diagnostics().textureBytes).toBe(0)
 }finally{stream.dispose();vi.unstubAllGlobals()}
})
