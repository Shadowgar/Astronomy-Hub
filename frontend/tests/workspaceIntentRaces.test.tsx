import React from 'react'
import {beforeEach,afterEach,it,expect,vi} from 'vitest'
import {QueryClient} from '@tanstack/react-query'
const h=vi.hoisted(()=>({states:[] as any[],refs:[] as any[],effects:[] as any[],pending:[] as any[],s:0,r:0,e:0,location:{pathname:'/sky-engine',search:'',key:'initial',state:null},navigate:vi.fn(),runtime:null as any,query:null as any}))
vi.mock('react',async original=>({...await original<typeof import('react')>(),useState:(initial:any)=>{const i=h.s++;if(!(i in h.states))h.states[i]=typeof initial==='function'?initial():initial;return [h.states[i],(next:any)=>{h.states[i]=typeof next==='function'?next(h.states[i]):next}]},useRef:(initial:any)=>h.refs[h.r++]??(h.refs[h.r-1]={current:initial}),useCallback:(fn:any)=>fn,useEffect:(fn:any,deps:any[])=>{const i=h.e++,old=h.effects[i];if(!old||!deps||deps.some((v,j)=>v!==old.deps?.[j]))h.pending.push(()=>{old?.cleanup?.();h.effects[i]={deps,cleanup:fn()}})}}))
vi.mock('react-router-dom',async original=>({...await original<typeof import('react-router-dom')>(),useLocation:()=>h.location,useNavigate:()=>h.navigate}))
vi.mock('@tanstack/react-query',async original=>({...await original<typeof import('@tanstack/react-query')>(),useQueryClient:()=>h.query}))
vi.mock('../src/features/workspace/workspaceRuntimeAdapter',()=>({useWorkspaceRuntime:()=>h.runtime}))
vi.mock('../src/features/workspace/ImmersiveController',()=>({useImmersive:()=>({interact:()=>{},reveal:()=>{},setFocused:()=>{},activity:()=>{},edgeReveal:()=>{},cancelEdge:()=>{}})}))
vi.mock('../src/features/workspace/useViewNavigation',()=>({useViewNavigation:()=>({})}))
vi.mock('../src/features/workspace/useEarthLocation',()=>({useEarthLocation:()=>()=>{}}))
vi.mock('../src/features/workspace/satelliteTimeStatus',()=>({useSatelliteFeedStatus:()=>({})}))
import WorkspaceShell from '../src/features/workspace/WorkspaceShell'
import {useRuntimeProductState} from '../src/features/runtime/productState'
import SatellitePasses,{SimulationControls} from '../src/features/workspace/SatellitePasses'
import ObserveSurface from '../src/features/workspace/ObserveSurface'
import AdaptiveSkyChrome from '../src/features/workspace/AdaptiveSkyChrome'
import TimeSurface from '../src/features/workspace/TimeSurface'
const initial='2026-10-26T10:22:00.000Z',advanced='2026-10-26T10:22:02.000Z'
const observer={lat:40,lon:-80,elevationM:300}
const camera={projection:0,fovRad:1,yawRad:0,pitchRad:0,rollRad:0,landscapeVisible:true}
const target={id:'pass',norad_id:'25544',source_id:'25544',catalog:'Satellite',model:'tle_satellite',name:'ISS',watch_utc:initial,watch_altitude_deg:20,watch_azimuth_deg:80,rise_utc:'2026-10-26T10:20:00Z',set_utc:'2026-10-26T10:30:00Z',optical_status:'potentially_observable',freshness_status:'fresh'} as any
const deferred=()=>{let resolve!:(value:any)=>void;const promise=new Promise<any>(r=>resolve=r);return {promise,resolve}}
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve()}
function find(tree:any,type:any):any{if(!tree)return null;if(Array.isArray(tree)){for(const child of tree){const result=find(child,type);if(result)return result}return null}if(tree.type===type)return tree;return find(tree.props?.children,type)}
function render(mode:'sky'|'earth'='sky'){h.s=h.r=h.e=0;const tree=WorkspaceShell({mode});const pending=h.pending.splice(0);pending.forEach(fn=>fn());return tree}
function change(search:string,path='/sky-engine'){h.location={...h.location,pathname:path,search,key:String(Number(h.location.key)||0)+':next'};return render(path==='/earth'?'earth':'sky')}
function selectSurface(){let tree=render();find(tree,AdaptiveSkyChrome).props.onContext('observe');tree=render();return find(tree,ObserveSurface).props}
function passesSurface(){let tree=render();function button(n:any):any{if(!n)return null;if(Array.isArray(n)){for(const c of n){const b=button(c);if(b)return b}return null}if(n.props?.['aria-label']==='Satellites / Next Passes')return n;return button(n.props?.children)}button(tree).props.onClick();tree=render();return find(tree,SatellitePasses).props}
beforeEach(()=>{
 h.states=[];h.refs=[];h.effects=[];h.pending=[];h.s=h.r=h.e=0;h.query=new QueryClient({defaultOptions:{queries:{retry:false}}});h.location={pathname:'/sky-engine',search:'?lat=40&lng=-80&elev=300&date='+initial+'&simulation=1',key:'initial',state:null};
 h.navigate=vi.fn((url:string)=>{const parsed=new URL(url,'https://example.test');h.location={...h.location,pathname:parsed.pathname,search:parsed.search,key:h.location.key+':navigation'}});
 h.runtime={client:{capabilities:[],version:'fixture'},snapshot:{selection:null,layers:[],tracking:false},time:{simulation:{utc:initial,playing:false,speed:1},live:false,pending:false,effective:initial,requested:initial},request:vi.fn(async(command:string)=>({ok:true,...(command==='getNavigationState'?{navigation:{mode:'sky',observer:{...observer},camera:{...camera},utc:initial,live:false}}:{})})),simulate:vi.fn(async()=>advanced),setNotice:vi.fn(),setSnapshot:vi.fn(),acceptClient:vi.fn()};
 useRuntimeProductState.setState({selection:null,pendingFocus:null,observer:{...observer}});
 vi.stubGlobal('window',{innerWidth:1200,location:{origin:'https://example.test'},sessionStorage:{getItem:()=>null,setItem:()=>{}}});vi.stubGlobal('document',{title:'Test',activeElement:null});vi.stubGlobal('HTMLElement',class {});vi.stubGlobal('matchMedia',()=>({matches:false,addEventListener:()=>{},removeEventListener:()=>{}}));vi.stubGlobal('requestAnimationFrame',()=>0);vi.stubGlobal('cancelAnimationFrame',()=>{});
})
afterEach(()=>{h.effects.forEach(effect=>effect?.cleanup?.());h.query.clear();vi.unstubAllGlobals()})
it.each(['play','live'])('late selection preserves newer %s time intent',async action=>{
 const ack=deferred(),request=h.runtime.request;h.runtime.request=vi.fn((command:string,...args:any[])=>command==='selectEntity'?ack.promise:request(command,...args));
 selectSurface().onSelect('/oras-sky-engine/?catalog=Satellite&source_id=25544&model=tle_satellite');
 const controls=find(render(),SimulationControls).props;if(action==='play')controls.onPlay(true);else controls.onLive();await flush();render();
 const temporal=new URLSearchParams(h.location.search);ack.resolve({ok:true});await flush();
 const final=new URLSearchParams(h.location.search);expect(final.get('source_id')).toBe('25544');expect(final.get('date')).toBe(temporal.get('date'));expect(final.get('simulation')).toBe(temporal.get('simulation'));
})
it.each(['route','client','selection'])('late selection cannot overwrite a newer %s generation',async kind=>{
 const first=deferred(),second=deferred();h.runtime.request=vi.fn((command:string,p:any)=>command==='selectEntity'?(p.source_id==='25544'?first.promise:second.promise):Promise.resolve({ok:true}));
 const surface=selectSurface();surface.onSelect('/oras-sky-engine/?catalog=Satellite&source_id=25544&model=tle_satellite');
 if(kind==='route')change('?date='+advanced,'/earth');else if(kind==='client'){h.runtime.client={capabilities:[]};render()}else{surface.onSelect('/oras-sky-engine/?catalog=Satellite&source_id=20580&model=tle_satellite');second.resolve({ok:true});await flush();render()}
 const before=h.navigate.mock.calls.length;first.resolve({ok:true});await flush();expect(h.navigate).toHaveBeenCalledTimes(before);expect(useRuntimeProductState.getState().selection?.source_id).not.toBe('25544');
})
it.each(['history','observer','time','query','client'])('Watch stops after a newer %s intent while its first acknowledgement is pending',async kind=>{
 const ack=deferred(),request=h.runtime.request;h.runtime.request=vi.fn((command:string,...args:any[])=>command==='getNavigationState'?ack.promise:request(command,...args));passesSurface().onWatch(target);await flush();
 if(kind==='history')change('?lat=35&lng=-120&elev=0');else if(kind==='observer'){find(render(),AdaptiveSkyChrome).props.onObserver({lat:35,lon:-120,elevationM:0});await flush();render()}else if(kind==='time'){find(render(),TimeSurface).props.onNow();await flush();render()}else if(kind==='client'){h.runtime.client={capabilities:[]};render()}else{void h.query.fetchQuery({queryKey:['satellite-passes',40,-80,300,'new-window'],queryFn:()=>Promise.resolve({passes:[]})});await flush()}
 const navigations=h.navigate.mock.calls.length;h.runtime.request.mockClear();ack.resolve({ok:true,navigation:{mode:'sky',observer,camera,utc:initial,live:false}});await flush();expect(h.runtime.request).not.toHaveBeenCalled();expect(h.runtime.simulate).not.toHaveBeenCalled();expect(h.navigate).toHaveBeenCalledTimes(navigations);
})
it('Watch rejects native observer mismatch before clearing selection or changing time',async()=>{
 h.runtime.request=vi.fn(async(command:string)=>({ok:true,...(command==='getNavigationState'?{navigation:{mode:'sky',observer:{lat:35,lon:-120,elevationM:0},camera}}:{})}));passesSurface().onWatch(target);await flush();expect(h.runtime.request.mock.calls.map(([c]:any)=>c)).not.toContain('clearSelection');expect(h.runtime.simulate).not.toHaveBeenCalled();
})
it('Watch preserves camera changes made during earlier acknowledgements',async()=>{
 const ack=deferred();let view=0;h.runtime.request=vi.fn(async(command:string)=>command==='clearSelection'?ack.promise:{ok:true,...(command==='getNavigationState'?{navigation:{mode:'sky',observer,camera:{...camera,fovRad:++view===1?1:0.5,landscapeVisible:view===1},utc:initial,live:false}}:{})});passesSurface().onWatch(target);await flush();ack.resolve({ok:true});await flush();const pointed=h.runtime.request.mock.calls.find(([c]:any)=>c==='setNavigationView')?.[1];expect(pointed.camera.fovRad).toBe(0.5);expect(pointed.camera.landscapeVisible).toBe(false);expect(pointed.camera.yawRad).toBeCloseTo(80*Math.PI/180);expect(pointed.camera.pitchRad).toBeCloseTo(20*Math.PI/180);
})
it.each(['clearSelection','simulation','latest-view','setNavigationView'])('Watch rechecks newer history after %s acknowledgement',async stage=>{
 const ack=deferred();let views=0,entered=false;
 h.runtime.request=vi.fn(async(command:string)=>{if(command==='getNavigationState')views++;if(command===stage||stage==='latest-view'&&command==='getNavigationState'&&views===2){entered=true;return ack.promise}return {ok:true,...(command==='getNavigationState'?{navigation:{mode:'sky',observer,camera,utc:initial,live:false}}:{})}});
 if(stage==='simulation')h.runtime.simulate=vi.fn(()=>{entered=true;return ack.promise});
 passesSurface().onWatch(target);await flush();expect(entered).toBe(true);change('?lat=35&lng=-120&elev=0');const requests=h.runtime.request.mock.calls.length,simulations=h.runtime.simulate.mock.calls.length,navigations=h.navigate.mock.calls.length;
 ack.resolve(stage==='simulation'?initial:{ok:true,navigation:{mode:'sky',observer,camera,utc:initial,live:false}});await flush();expect(h.runtime.request).toHaveBeenCalledTimes(requests);expect(h.runtime.simulate).toHaveBeenCalledTimes(simulations);expect(h.navigate).toHaveBeenCalledTimes(navigations);
})
it.each(['observer','time'])('Watch cancels as soon as newer %s intent starts, before its acknowledgement',async kind=>{
 const view=deferred(),newer=deferred();h.runtime.request=vi.fn((command:string)=>command==='getNavigationState'?view.promise:command==='setObserverIntent'||command==='setTimeIntent'?newer.promise:Promise.resolve({ok:true}));passesSurface().onWatch(target);await flush();
 if(kind==='observer')find(render(),AdaptiveSkyChrome).props.onObserver({lat:35,lon:-120,elevationM:0});else find(render(),TimeSurface).props.onNow();
 const count=h.runtime.request.mock.calls.length;view.resolve({ok:true,navigation:{mode:'sky',observer,camera,utc:initial,live:false}});await flush();expect(h.runtime.request).toHaveBeenCalledTimes(count);expect(h.runtime.simulate).not.toHaveBeenCalled();newer.resolve({ok:false});await flush();
})
it('Watch with an already selected identity completes without cancelling its own clear',async()=>{
 h.location.search+='&catalog=Satellite&source_id=25544&model=tle_satellite';useRuntimeProductState.setState({selection:{catalog:'Satellite',source_id:'25544',model:'tle_satellite'}});h.runtime.snapshot.selection={id:'25544',kind:'satellite',name:'ISS',catalog:'Satellite',source_id:'25544',model:'tle_satellite'};
 passesSurface().onWatch(target);await flush();expect(h.runtime.request.mock.calls.map(([command]:any)=>command)).toContain('setNavigationView');expect(h.navigate).toHaveBeenCalledTimes(1);expect(new URLSearchParams(h.location.search).get('source_id')).toBeNull();expect(new URLSearchParams(h.location.search).get('simulation')).toBe('1');
})
