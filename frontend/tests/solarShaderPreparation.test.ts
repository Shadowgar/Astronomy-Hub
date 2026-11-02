import {it,expect,vi} from 'vitest'
import {prepareSolarShaders} from '../src/features/solar/solarShaderPreparation'
it('waits for parallel compile completion without querying disposed programs after cancellation',async()=>{
 vi.useFakeTimers();const material={},ready=vi.fn(()=>false),get=vi.fn(()=>({currentProgram:{isReady:ready}})),controller=new AbortController()
 const renderer={extensions:{has:()=>true},compile:()=>new Set([material]),properties:{get}}
 const promise=prepareSolarShaders(renderer,{}, {},controller.signal);expect(ready).toHaveBeenCalledTimes(1)
 controller.abort();const count=get.mock.calls.length;await vi.runAllTimersAsync();expect((await promise).state).toBe('aborted');expect(get).toHaveBeenCalledTimes(count);vi.useRealTimers()
})
it('keeps shader validation untouched and resolves only when all programs complete',async()=>{
 vi.useFakeTimers();let complete=false;const renderer={debug:{checkShaderErrors:true},extensions:{has:()=>true},compile:()=>new Set([{}]),properties:{get:()=>({currentProgram:{isReady:()=>complete}})}}
 const result=prepareSolarShaders(renderer,{}, {},new AbortController().signal);complete=true;await vi.advanceTimersByTimeAsync(10);expect((await result).state).toBe('ready');expect(renderer.debug.checkShaderErrors).toBe(true);vi.useRealTimers()
})
it('reports unavailable parallel compilation instead of claiming asynchronous qualification',async()=>{
 const compile=vi.fn();const result=await prepareSolarShaders({extensions:{has:()=>false},compile},{},{},new AbortController().signal)
 expect(result.supported).toBe(false);expect(compile).not.toHaveBeenCalled()
})
it('turns synchronous compile failure into a rejected promise for owner cleanup',async()=>{
 const renderer={extensions:{has:()=>true},compile:()=>{throw Error('compile failure')}}
 let promise:ReturnType<typeof prepareSolarShaders>|undefined
 expect(()=>{promise=prepareSolarShaders(renderer,{},{},new AbortController().signal)}).not.toThrow()
 await expect(promise).rejects.toThrow('compile failure')
})
it('does not touch programs for a pre-aborted lifetime',async()=>{
 const controller=new AbortController();controller.abort();const compile=vi.fn()
 expect((await prepareSolarShaders({extensions:{has:()=>true},compile},{},{},controller.signal)).state).toBe('aborted');expect(compile).not.toHaveBeenCalled()
})
it('bounds a permanently incomplete compile and clears polling',async()=>{
 vi.useFakeTimers();const get=vi.fn(()=>({currentProgram:{isReady:()=>false}})),promise=prepareSolarShaders({extensions:{has:()=>true},compile:()=>new Set([{}]),properties:{get}},{},{},new AbortController().signal)
 const rejected=expect(promise).rejects.toThrow('timed out');await vi.advanceTimersByTimeAsync(30010);await rejected;const count=get.mock.calls.length;await vi.advanceTimersByTimeAsync(100);expect(get).toHaveBeenCalledTimes(count);vi.useRealTimers()
})
