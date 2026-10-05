import {beforeEach,afterEach,it,expect,vi} from 'vitest'
const hooks=vi.hoisted(()=>({effects:[] as (()=>(()=>void)|void)[],refs:[] as any[],index:0,states:0,mode:'sky',client:null as any,snapshot:null as any,storage:new Map<string,string>()}))
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:(value:any)=>{const index=hooks.states++;return [index===0?{mode:hooks.mode,client:hooks.client}:typeof value==='function'?value():value,(next:any)=>{if(index===1)hooks.snapshot=next}]},useRef:(value:any)=>{const index=hooks.index++;return hooks.refs[index]??=({current:index===0?hooks.client:value})},useEffect:(effect:any)=>hooks.effects.push(effect),useCallback:(fn:any)=>fn}))
const M31={catalog:'Messier (local)',source_id:'M31',model:'dso'},M42={catalog:'Messier (local)',source_id:'M42',model:'dso'}
const snapshot=(selection:any)=>({selection:selection?{...selection,id:selection.source_id,name:selection.source_id,kind:'dso'}:null,layers:[],tracking:false})
const deferred=()=>{let resolve:(value:any)=>void=()=>{};const promise=new Promise<any>(r=>resolve=r);return {promise,resolve}}
let useWorkspaceRuntime:any,product:any,skyStandalonePath:any,cleanups:(()=>void)[]=[]
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve()}
const stored=()=>new URLSearchParams(hooks.storage.get('oras.runtime.intent.v1'))
function mount(client:any,mode='sky',search='',onClear=vi.fn()){
 hooks.mode=mode;hooks.client=client;hooks.index=0;hooks.states=0;hooks.effects=[]
 const runtime=useWorkspaceRuntime(mode,search,()=>{},()=>{},onClear)
 const cleanup=hooks.effects[0]();if(cleanup)cleanups.push(cleanup)
 return {runtime,onClear}
}
function native(){let selection:any=M31;const client={capabilities:['workspaceState','selection'],subscribe:()=>()=>{},request:async(command:string,payload:any)=>{if(command==='selectEntity')selection=payload;if(command==='clearSelection')selection=null;return {ok:true,state:snapshot(selection)}}};return {client,set:(value:any)=>selection=value}}
beforeEach(async()=>{
 vi.useFakeTimers();vi.resetModules();hooks.refs=[];hooks.storage.clear();hooks.snapshot=null;cleanups=[]
 vi.stubGlobal('window',{sessionStorage:{getItem:(key:string)=>hooks.storage.get(key)??null,setItem:(key:string,value:string)=>hooks.storage.set(key,value)}})
 ;({useWorkspaceRuntime}=await import('../src/features/workspace/workspaceRuntimeAdapter'));({useRuntimeProductState:product}=await import('../src/features/runtime/productState'));({skyStandalonePath}=await import('../src/features/workspace/workspaceNavigation'))
 product.setState({selection:M31,pendingFocus:M31})
})
afterEach(()=>{cleanups.forEach(fn=>fn());vi.useRealTimers();vi.unstubAllGlobals()})
it('transient initial null leaves canonical restore intent and persisted identity intact',async()=>{
 const n=native();n.set(null);mount(n.client);await settle()
 expect(hooks.snapshot.selection).toBeNull();expect(product.getState().selection).toEqual(M31);expect(stored().get('source_id')).toBe('M31')
})
it('a null poll sent before restoration cannot erase its later successful acknowledgement',async()=>{
 const initial=deferred();const n=native();const request=n.client.request;n.client.request=(command:string,payload:any)=>command==='getWorkspaceState'?initial.promise:request(command,payload)
 const {runtime,onClear}=mount(n.client);await runtime.request('selectEntity',M31);initial.resolve({ok:true,state:snapshot(null)});await settle()
 expect(product.getState().selection).toEqual(M31);expect(stored().get('source_id')).toBe('M31');expect(onClear).not.toHaveBeenCalled()
})
it('acknowledged native deselection clears product, pending focus, persisted identity and recovery URL',async()=>{
 const n=native();const {onClear}=mount(n.client);await settle();expect(product.getState().selection?.source_id).toBe('M31')
 n.set(null);await vi.advanceTimersByTimeAsync(2000)
 expect(hooks.snapshot.selection).toBeNull();expect(product.getState().selection).toBeNull();expect(product.getState().pendingFocus).toBeNull();expect(onClear).toHaveBeenCalledTimes(1)
 for(const key of ['catalog','source_id','model','ra','dec'])expect(stored().has(key)).toBe(false)
 expect(skyStandalonePath(product.getState(),false)).not.toContain('M31')
})
it('Sky Earth Sky reconnection has no canonical entity to restore after native deselection',async()=>{
 const n=native();mount(n.client);await settle();n.set(null);await vi.advanceTimersByTimeAsync(1000)
 cleanups.forEach(fn=>fn());cleanups=[];hooks.refs=[];mount(native().client,'earth');await settle();hooks.refs=[];const next=native();next.set(null);mount(next.client);await settle()
 expect(product.getState().selection).toBeNull();expect(stored().has('source_id')).toBe(false)
})
it('a fresh product-state module hydrates no deselected identity on reload',async()=>{
 const n=native();mount(n.client);await settle();n.set(null);await vi.advanceTimersByTimeAsync(1000);vi.resetModules()
 const {useRuntimeProductState:reloaded}=await import('../src/features/runtime/productState')
 expect(reloaded.getState().selection).toBeNull();expect(stored().has('source_id')).toBe(false)
})
it('new native selection after deselection is acknowledged and persisted normally',async()=>{
 const n=native();mount(n.client);await settle();n.set(null);await vi.advanceTimersByTimeAsync(1000);expect(product.getState().selection).toBeNull()
 n.set(M42);await vi.advanceTimersByTimeAsync(1000);expect(product.getState().selection?.source_id).toBe('M42');expect(stored().get('source_id')).toBe('M42')
})
it('null snapshots during an in-flight replacement selection preserve newer intent',async()=>{
 const n=native();const pending=deferred(),request=n.client.request;n.client.request=(command:string,payload:any)=>command==='selectEntity'?pending.promise:request(command,payload)
 const {runtime,onClear}=mount(n.client);await settle();product.setState({selection:M42});const selected=runtime.request('selectEntity',M42);n.set(null);await vi.advanceTimersByTimeAsync(1000)
 expect(product.getState().selection).toEqual(M42);expect(onClear).not.toHaveBeenCalled();pending.resolve({ok:true,state:snapshot(M42)});await selected
 n.set(M42);await vi.advanceTimersByTimeAsync(1000);expect(product.getState().selection?.source_id).toBe('M42')
})
it('a late null response from before a newer command cannot clear its selection',async()=>{
 const n=native();const {runtime,onClear}=mount(n.client);await settle();const late=deferred(),request=n.client.request
 n.client.request=(command:string,payload:any)=>command==='getWorkspaceState'?late.promise:request(command,payload)
 await vi.advanceTimersByTimeAsync(1000);product.setState({selection:M42});await runtime.request('selectEntity',M42);late.resolve({ok:true,state:snapshot(null)});await settle()
 expect(product.getState().selection).toEqual(M42);expect(stored().get('source_id')).toBe('M42');expect(onClear).not.toHaveBeenCalled()
})
it('unacknowledged new canonical intent survives a null snapshot before select is dispatched',async()=>{
 const n=native();const {onClear}=mount(n.client);await settle();product.setState({selection:M42});n.set(null);await vi.advanceTimersByTimeAsync(1000)
 expect(product.getState().selection).toEqual(M42);expect(onClear).not.toHaveBeenCalled()
})
it('a departed client cannot clear selection intended for the replacement runtime',async()=>{
 const n=native();const {runtime,onClear}=mount(n.client);await settle();const late=deferred();n.client.request=()=>late.promise
 await vi.advanceTimersByTimeAsync(1000);runtime.acceptClient(native().client);product.setState({selection:M42});late.resolve({ok:true,state:snapshot(null)});await settle()
 expect(product.getState().selection).toEqual(M42);expect(onClear).not.toHaveBeenCalled()
})
