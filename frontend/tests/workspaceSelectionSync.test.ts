import {beforeEach,afterEach,it,expect,vi} from 'vitest'
const hooks=vi.hoisted(()=>({effects:[] as (()=>(()=>void)|void)[],refs:[] as any[],index:0,states:0,mode:'sky',client:null as any,snapshot:null as any,storage:new Map<string,string>()}))
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:(value:any)=>{const index=hooks.states++;return [index===0?{mode:hooks.mode,client:hooks.client}:typeof value==='function'?value():value,(next:any)=>{if(index===1)hooks.snapshot=next}]},useRef:(value:any)=>{const index=hooks.index++;return hooks.refs[index]??=({current:index===0?hooks.client:value})},useEffect:(effect:any)=>hooks.effects.push(effect),useCallback:(fn:any)=>fn}))
const M31={catalog:'Messier (local)',source_id:'M31',model:'dso'},M42={catalog:'Messier (local)',source_id:'M42',model:'dso'}
const snapshot=(selection:any)=>({selection:selection?{...selection,id:selection.source_id,name:selection.source_id,kind:'dso'}:null,layers:[],tracking:false})
const deferred=()=>{let resolve:(value:any)=>void=()=>{};const promise=new Promise<any>(r=>resolve=r);return {promise,resolve}}
let useWorkspaceRuntime:any,product:any,skyStandalonePath:any,nativeSelectionSearch:any,cleanups:(()=>void)[]=[]
const settle=async()=>{for(let i=0;i<8;i++)await Promise.resolve()}
const stored=()=>new URLSearchParams(hooks.storage.get('oras.runtime.intent.v1'))
function mount(client:any,mode='sky',search='',onClear=vi.fn(),onSelect=vi.fn()){
 hooks.mode=mode;hooks.client=client;hooks.index=0;hooks.states=0;hooks.effects=[]
 const runtime=useWorkspaceRuntime(mode,search,()=>{},()=>{},onClear,onSelect)
 const cleanup=hooks.effects[0]();if(cleanup)cleanups.push(cleanup)
 return {runtime,onClear,onSelect}
}
function native(){let selection:any=M31;const client={capabilities:['workspaceState','selection'],subscribe:()=>()=>{},request:async(command:string,payload:any)=>{if(command==='selectEntity')selection=payload;if(command==='clearSelection')selection=null;return {ok:true,state:snapshot(selection)}}};return {client,set:(value:any)=>selection=value}}
beforeEach(async()=>{
 vi.useFakeTimers();vi.resetModules();hooks.refs=[];hooks.storage.clear();hooks.snapshot=null;cleanups=[]
 vi.stubGlobal('window',{sessionStorage:{getItem:(key:string)=>hooks.storage.get(key)??null,setItem:(key:string,value:string)=>hooks.storage.set(key,value)}})
 ;({useWorkspaceRuntime}=await import('../src/features/workspace/workspaceRuntimeAdapter'));({useRuntimeProductState:product}=await import('../src/features/runtime/productState'));({skyStandalonePath,nativeSelectionSearch}=await import('../src/features/workspace/workspaceNavigation'))
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

it('acknowledged A to native B reports canonical B for replace-style URL synchronization',async()=>{
 const n=native();const {onSelect}=mount(n.client);await settle();onSelect.mockClear()
 n.set(M42);await vi.advanceTimersByTimeAsync(1000)
 expect(product.getState().selection).toEqual(M42);expect(onSelect).toHaveBeenCalledWith(M42)
})
it('a transient non-null startup B cannot replace exact-link A before its acknowledgement',async()=>{
 const n=native();n.set(M42);const {onSelect}=mount(n.client);await settle()
 expect(product.getState().selection).toEqual(M31);expect(onSelect).not.toHaveBeenCalled()
})
it('unacknowledged replacement intent cannot be overwritten by a later non-null native snapshot',async()=>{
 const n=native();const {onSelect}=mount(n.client);await settle();onSelect.mockClear()
 const next={catalog:'NASA/JPL',source_id:'moon',model:'planet'};product.setState({selection:next});n.set(M42);await vi.advanceTimersByTimeAsync(1000)
 expect(product.getState().selection).toEqual(next);expect(onSelect).not.toHaveBeenCalled()
})

const exactA='?catalog=Messier+%28local%29&source_id=M31&model=dso&ra=10.6847083&dec=41.26875&focus=1&date=2026-10-03T02%3A00%3A00.000Z&lat=41.321903&lng=-79.585394&elev=432.816&context=proof'
function routed(client:any){
 let search=exactA;const replacements:string[]=[]
 const mounted=mount(client,'sky',search,()=>{const p=new URLSearchParams(search);for(const k of ['catalog','source_id','model','ra','dec','focus'])p.delete(k);search='?'+p},(entity:any)=>{const next=nativeSelectionSearch(search,entity);if(next!==null){search=next;replacements.push(next)}})
 return {...mounted,query:()=>new URLSearchParams(search),replacements}
}
it('native B replaces route identity once, removes stale A coordinates and does not create repeated navigation',async()=>{
 const n=native();const r=routed(n.client);await settle();n.set(M42);await vi.advanceTimersByTimeAsync(3000)
 expect(Object.fromEntries(['catalog','source_id','model'].map(k=>[k,r.query().get(k)]))).toEqual(M42)
 expect(r.query().has('ra')).toBe(false);expect(r.query().has('dec')).toBe(false);expect(r.replacements).toHaveLength(1)
})
it('only authoritative B coordinates are written into the canonical URL',async()=>{
 const n=native();const r=routed(n.client);await settle();n.set({...M42,ra:83.8221,dec:-5.3911});await vi.advanceTimersByTimeAsync(1000)
 expect(r.query().get('ra')).toBe('83.8221');expect(r.query().get('dec')).toBe('-5.3911')
})
it('native selection preserves exact scene UTC query without normalization or replacement',async()=>{
 const n=native();const r=routed(n.client);await settle();n.set(M42);await vi.advanceTimersByTimeAsync(1000)
 expect(r.query().get('date')).toBe('2026-10-03T02:00:00.000Z');expect(r.query().get('context')).toBe('proof')
})
it('native selection preserves observer coordinates and elevation',async()=>{
 const n=native();const r=routed(n.client);await settle();n.set(M42);await vi.advanceTimersByTimeAsync(1000)
 expect(['lat','lng','elev'].map(k=>r.query().get(k))).toEqual(['41.321903','-79.585394','432.816'])
})
it('ordinary native selection removes stale A focus and leaves same-identity focus alone',async()=>{
 expect(nativeSelectionSearch(exactA,M31)).toBeNull()
 const n=native();const r=routed(n.client);await settle();n.set(M42);await vi.advanceTimersByTimeAsync(1000)
 expect(r.query().has('focus')).toBe(false)
})
it('a fresh product module and route ingestion both restore B on reload',async()=>{
 const n=native();const r=routed(n.client);await settle();n.set(M42);await vi.advanceTimersByTimeAsync(1000);vi.resetModules()
 const {useRuntimeProductState:reload}=await import('../src/features/runtime/productState');expect(reload.getState().selection).toEqual(M42)
 reload.getState().ingestSearch('?'+r.query());expect(reload.getState().selection).toEqual(M42)
})
it('Sky Earth Sky client restoration retains acknowledged B',async()=>{
 const n=native();const r=routed(n.client);await settle();n.set(M42);await vi.advanceTimersByTimeAsync(1000)
 cleanups.forEach(fn=>fn());cleanups=[];hooks.refs=[];mount(native().client,'earth');await settle()
 hooks.refs=[];const next=native();next.set(null);const sky=mount(next.client);await settle();expect(product.getState().selection).toEqual(M42)
 await sky.runtime.request('selectEntity',product.getState().selection);await vi.advanceTimersByTimeAsync(1000);expect(product.getState().selection).toEqual(M42)
})
it('standalone recovery and canonical share identity both represent acknowledged B',async()=>{
 const n=native();const r=routed(n.client);await settle();n.set(M42);await vi.advanceTimersByTimeAsync(1000)
 const recovery=new URL(skyStandalonePath(product.getState(),false),'http://local.invalid')
 for(const k of ['catalog','source_id','model'])expect(recovery.searchParams.get(k)).toBe(r.query().get(k))
 expect(recovery.searchParams.has('focus')).toBe(false);expect(recovery.searchParams.has('ra')).toBe(false)
})
it('native deselection after B clears route identity and persisted recovery intent',async()=>{
 const n=native();const r=routed(n.client);await settle();n.set(M42);await vi.advanceTimersByTimeAsync(1000);n.set(null);await vi.advanceTimersByTimeAsync(1000)
 for(const k of ['catalog','source_id','model','ra','dec','focus'])expect(r.query().has(k)).toBe(false)
 expect(product.getState().selection).toBeNull();expect(stored().has('source_id')).toBe(false)
})
it('a pending replacement command prevents native B from rewriting the route',async()=>{
 const n=native();const r=routed(n.client);await settle();const pending=deferred(),request=n.client.request
 n.client.request=(c:string,p:any)=>c==='selectEntity'?pending.promise:request(c,p)
 const next={catalog:'Hipparcos',source_id:'14576',model:'star'};product.setState({selection:next});const command=r.runtime.request('selectEntity',next);n.set(M42);await vi.advanceTimersByTimeAsync(1000)
 expect(r.query().get('source_id')).toBe('M31');expect(product.getState().selection).toEqual(next)
 pending.resolve({ok:true,state:snapshot(next)});await command
})
it('a poll from before a newer selection revision cannot rewrite canonical URL',async()=>{
 const n=native();const r=routed(n.client);await settle();const late=deferred(),request=n.client.request
 n.client.request=(c:string,p:any)=>c==='getWorkspaceState'?late.promise:request(c,p);await vi.advanceTimersByTimeAsync(1000)
 const next={catalog:'Hipparcos',source_id:'14576',model:'star'};product.setState({selection:next});await r.runtime.request('selectEntity',next)
 late.resolve({ok:true,state:snapshot(M42)});await settle();expect(r.query().get('source_id')).toBe('M31');expect(product.getState().selection).toEqual(next)
})
it('a departed client non-null response cannot rewrite the route',async()=>{
 const n=native();const r=routed(n.client);await settle();const late=deferred();n.client.request=()=>late.promise;await vi.advanceTimersByTimeAsync(1000)
 r.runtime.acceptClient(native().client);late.resolve({ok:true,state:snapshot(M42)});await settle();expect(r.query().get('source_id')).toBe('M31');expect(product.getState().selection).toEqual(M31)
})
