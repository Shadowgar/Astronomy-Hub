import {afterEach,it,expect,vi} from 'vitest'
const hooks=vi.hoisted(()=>({effects:[] as (()=>void)[],refs:[] as any[],index:0,states:0,client:null as any}))
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:(value:any)=>[hooks.states++===0?{mode:'earth',client:hooks.client}:typeof value==='function'?value():value,()=>{}],useRef:(value:any)=>{const index=hooks.index++;return hooks.refs[index]??=({current:index===0?hooks.client:value})},useEffect:(effect:()=>void)=>hooks.effects.push(effect),useCallback:(fn:any)=>fn}))
import {useWorkspaceRuntime} from '../src/features/workspace/workspaceRuntimeAdapter'
import {useRuntimeProductState} from '../src/features/runtime/productState'
afterEach(()=>{hooks.effects=[];hooks.refs=[];hooks.index=0;hooks.states=0})
it('in-place observer intent remains pending until the runtime refresh acknowledgement',async()=>{let finish:(value:any)=>void=()=>{};const commands:string[]=[];hooks.client={capabilities:[],request:vi.fn(async(command:string)=>{commands.push(command);if(command==='setObserverIntent')return new Promise(resolve=>finish=resolve);return {ok:true,effectiveTime:'2026-10-03T02:00:00Z'}})};useRuntimeProductState.setState({observer:{lat:42,lon:-80,elevationM:0}});useWorkspaceRuntime('earth','?lat=35&lng=-120&elev=0',()=>{},()=>{});hooks.effects.at(-1)!();await Promise.resolve();await Promise.resolve();await Promise.resolve();expect(commands).toEqual(['setTimeIntent','setObserverIntent']);const acknowledged=hooks.refs.find(r=>r.current?.observer!==undefined&&r.current?.selection!==undefined);expect(acknowledged.current.observer).toBe('');finish({ok:true,effectiveObserver:{lat:35,lon:-120,elevationM:0}});await Promise.resolve();await Promise.resolve();await Promise.resolve();expect(acknowledged.current.observer).toBe('[35,-120,0]')})
it('queued layer work cannot dispatch to a replacement client',async()=>{
 const old={capabilities:[],request:vi.fn(async()=>({ok:true}))},replacement={...old,request:vi.fn(async()=>({ok:true}))};hooks.client=old
 const runtime=useWorkspaceRuntime('earth','',()=>{},()=>{});runtime.acceptClient(replacement as any)
 expect(await runtime.request('setLayerEnabled',{id:'earthquakes',enabled:true},18000,old as any)).toBeNull()
 expect(old.request).not.toHaveBeenCalled();expect(replacement.request).not.toHaveBeenCalled()
})
it('an in-flight old-client acknowledgement cannot persist a cancelled layer choice',async()=>{
 let finish:(value:any)=>void=()=>{};const old={capabilities:[],request:vi.fn(()=>new Promise(resolve=>finish=resolve))};hooks.client=old
 const runtime=useWorkspaceRuntime('earth','',()=>{},()=>{}),pending=runtime.request('setLayerEnabled',{id:'earthquakes',enabled:true},18000,old as any)
 runtime.acceptClient(null);finish({ok:true});expect(await pending).toBeNull()
})
