import {afterEach,it,expect,vi} from 'vitest'
const hooks=vi.hoisted(()=>({effects:[] as (()=>void)[],refs:[] as any[],index:0,states:0,client:null as any,updates:[] as any[]}))
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:(value:any)=>[hooks.states++===0?{mode:'earth',client:hooks.client}:typeof value==='function'?value():value,(next:any)=>hooks.updates.push(next)],useRef:(value:any)=>{const index=hooks.index++;return hooks.refs[index]??=({current:index===0?hooks.client:value})},useEffect:(effect:()=>void)=>hooks.effects.push(effect),useCallback:(fn:any)=>fn}))
import {useWorkspaceRuntime} from '../src/features/workspace/workspaceRuntimeAdapter'
import {useRuntimeProductState} from '../src/features/runtime/productState'
afterEach(()=>{hooks.effects=[];hooks.refs=[];hooks.index=0;hooks.states=0;hooks.updates=[]})
it('in-place observer intent remains pending until the runtime refresh acknowledgement',async()=>{let finish:(value:any)=>void=()=>{};const commands:string[]=[];hooks.client={capabilities:[],request:vi.fn(async(command:string)=>{commands.push(command);if(command==='setObserverIntent')return new Promise(resolve=>finish=resolve);return {ok:true,effectiveTime:'2026-10-03T02:00:00Z'}})};useRuntimeProductState.setState({observer:{lat:42,lon:-80,elevationM:0}});useWorkspaceRuntime('earth','?lat=35&lng=-120&elev=0',()=>{},()=>{});hooks.effects.at(-1)!();await Promise.resolve();await Promise.resolve();await Promise.resolve();expect(commands).toEqual(['setTimeIntent','setObserverIntent']);const acknowledged=hooks.refs.find(r=>r.current?.observer!==undefined&&r.current?.selection!==undefined);expect(acknowledged.current.observer).toBe('');finish({ok:true,effectiveObserver:{lat:35,lon:-120,elevationM:0}});await Promise.resolve();await Promise.resolve();await Promise.resolve();expect(acknowledged.current.observer).toBe('[35,-120,0,"provided"]')})
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
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()}
function rerender(search:string){hooks.index=0;hooks.states=0;hooks.effects=[];return useWorkspaceRuntime('earth',search,()=>{},()=>{})}
it.each([
 ['new coordinates without a height','?lat=40&lng=-74&elev=123&elevationSource=provided',{lat:40,lon:-74,elevationM:123},'?lat=35&lng=-120','unavailable-zero'],
 ['provided zero becomes an explicit missing-height fallback','?lat=35&lng=-120&elev=0&elevationSource=provided',{lat:35,lon:-120,elevationM:0},'?lat=35&lng=-120','unavailable-zero'],
 ['fallback zero becomes explicitly provided','?lat=35&lng=-120&elevationSource=unavailable-zero',{lat:35,lon:-120,elevationM:0},'?lat=35&lng=-120&elev=0&elevationSource=provided','provided']
])('synchronizes validated same-client provenance: %s',async(_label,initial,observer,next,source)=>{
 const commands:{command:string,payload:any}[]=[];hooks.client={capabilities:[],request:vi.fn(async(command:string,payload:any)=>{commands.push({command,payload});return {ok:true,effectiveTime:'2026-06-05T02:10:00.000Z',effectiveObserver:payload}})}
 useRuntimeProductState.setState({observer:observer as any,selection:null});const runtime=rerender(initial as string);runtime.acceptClient(hooks.client);rerender(next as string);hooks.effects.at(-1)!();await flush();
 expect(commands.filter(r=>r.command==='setObserverIntent').map(r=>r.payload)).toEqual([{lat:35,lon:-120,elevationM:0,elevationSource:source}])
})
it('an inconsistent provenance enum alone does not resynchronize the same validated observer',async()=>{
 const commands:string[]=[];hooks.client={capabilities:[],request:vi.fn(async(command:string)=>{commands.push(command);return {ok:true,effectiveTime:'2026-06-05T02:10:00.000Z'}})};useRuntimeProductState.setState({observer:{lat:35,lon:-120,elevationM:123},selection:null});const runtime=rerender('?lat=35&lng=-120&elev=123&elevationSource=provided');runtime.acceptClient(hooks.client);rerender('?lat=35&lng=-120&elev=123&elevationSource=unavailable-zero');hooks.effects.at(-1)!();await flush();expect(commands).toEqual(['setTimeIntent'])
})

const fixed='2026-06-04T02:58:00.000Z'
function timeClient(){return {capabilities:[],request:vi.fn(async(command:string,payload:any)=>({ok:true,...(command==='setTimeIntent'?{effectiveTime:payload.utc}:{})}))}}
it.each(['?date='+encodeURIComponent(fixed),''])('selection-only route change preserves the active temporal intent %s',async search=>{
 hooks.client=timeClient();const runtime=rerender(search);runtime.acceptClient(hooks.client);rerender(search);hooks.effects.at(-1)!();await flush()
 rerender(search+(search?'&':'?')+'catalog=Satellite+TLE+%28local%29&source_id=28096&model=tle_satellite');hooks.effects.at(-1)!();await flush()
 expect(hooks.client.request.mock.calls.filter(([c]:any)=>c==='setTimeIntent')).toHaveLength(1)
})
it('observer-only updates preserve time, while Back/Forward date changes still synchronize',async()=>{
 hooks.client=timeClient();const runtime=rerender('?date='+fixed);runtime.acceptClient(hooks.client);rerender('?date='+fixed);hooks.effects.at(-1)!();await flush()
 rerender('?date='+fixed+'&lat=35&lng=-120');hooks.effects.at(-1)!();await flush()
 expect(hooks.client.request.mock.calls.filter(([c]:any)=>c==='setTimeIntent')).toHaveLength(1)
 for(const date of ['2026-06-04T17:00:00.000Z',fixed]){rerender('?date='+date);hooks.effects.at(-1)!();await flush()}
 expect(hooks.client.request.mock.calls.filter(([c]:any)=>c==='setTimeIntent').map(([,p]:any)=>p.utc)).toEqual([fixed,'2026-06-04T17:00:00.000Z',fixed])
})
it('selection arriving during a time acknowledgement reuses the pending intent and settles it',async()=>{
 let finish:(v:any)=>void=()=>{};hooks.client={capabilities:[],request:vi.fn((command:string)=>command==='setTimeIntent'?new Promise(resolve=>finish=resolve):Promise.resolve({ok:true}))};const runtime=rerender('?date='+fixed);runtime.acceptClient(hooks.client);rerender('?date='+fixed);const cleanup=hooks.effects.at(-1)!() as unknown as ()=>void
 cleanup?.();rerender('?date='+fixed+'&source_id=28096&catalog=Satellite&model=tle_satellite');hooks.effects.at(-1)!();finish({ok:true,effectiveTime:fixed});await flush()
 expect(hooks.client.request.mock.calls.filter(([c]:any)=>c==='setTimeIntent')).toHaveLength(1)
 const callbacks=hooks.updates.filter(v=>typeof v==='function');expect(callbacks.some(fn=>fn({pending:true}).pending===false)).toBe(true)
})
it('an explicit time command remains available even when its URL intent is unchanged',async()=>{
 hooks.client=timeClient();const runtime=rerender('');runtime.acceptClient(hooks.client);rerender('');hooks.effects.at(-1)!();await flush();const utc=new Date().toISOString();await runtime.request('setTimeIntent',{utc,live:true});expect(hooks.client.request.mock.calls.filter(([c]:any)=>c==='setTimeIntent')).toHaveLength(2)
})
