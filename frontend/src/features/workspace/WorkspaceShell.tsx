import {observerWithProvenance} from './observerProvenance'
import {ORAS_SITE} from '../../config/orasSite'
import React,{useState,useEffect,useRef,useCallback} from 'react'
import {useLocation,useNavigate} from 'react-router-dom'
import {useQueryClient} from '@tanstack/react-query'
import type {RuntimeClient} from '../../../../packages/runtime-protocol/client.mjs'
import type {RuntimeResult} from '../../../../packages/runtime-protocol/index.mjs'
import type {RuntimeMode,LayerDTO} from '../../../../packages/runtime-protocol/index.mjs'
import RuntimeHost,{type RuntimeStatus} from '../sky-engine/RuntimeHost'
import {useRuntimeProductState} from '../runtime/productState'
import {readPreferences,savePreferences,type ContextTab,type Surface} from './workspaceUiState'
import {useImmersive} from './ImmersiveController'
import {useWorkspaceRuntime} from './workspaceRuntimeAdapter'
import ProductHeader from './ProductHeader'
import EarthSearch from './EarthSearch'
import './earthWorkspace.css'
import LayerPanel,{LayerRail} from './LayerPanel'
import ContextSurface from './ContextSurface'
import {currentObservingNight} from '../tonight/nightClock'
import TonightSurface from './TonightSurface'
import ObserveSurface from './ObserveSurface'
import SelectionDrawer,{SelectionDetails,SelectionActions} from './SelectionDrawer'
import SatellitePasses,{SimulationControls,passSimulationUtc,type SatellitePass} from './SatellitePasses'
import TimeSurface,{TimeEditor} from './TimeSurface'
import {useSatelliteFeedStatus} from './satelliteTimeStatus'
import BottomSheet from './BottomSheet'
import DiagnosticsSurface from './DiagnosticsSurface'
import {Icon,IconButton} from './primitives'
import {workspaceModePath,nativeSelectionSearch} from './workspaceNavigation'
import {readSkyNightMode,saveSkyNightMode} from './skyNightMode'
import AdaptiveSkyChrome from './AdaptiveSkyChrome'
import AboutLicenses from './AboutLicenses'
import {useViewNavigation} from './useViewNavigation'
import {useEarthLocation}from'./useEarthLocation'
import './workspace.css'
import './adaptiveSky.css'
import './skyCinematic.css'
type LayerSession={client:RuntimeClient;cancelled:boolean;tail:Promise<RuntimeResult|null>;touched:Set<string>;pending:Set<string>}
function useMobile(){const [mobile,setMobile]=useState(()=>typeof window!=='undefined'&&window.innerWidth<768);useEffect(()=>{const media=matchMedia('(max-width:767px)'),update=()=>setMobile(media.matches);media.addEventListener('change',update);update();return ()=>media.removeEventListener('change',update)},[]);return mobile}
export default function WorkspaceShell({mode='sky'}:{mode?:RuntimeMode}){
 const location=useLocation(),navigate=useNavigate(),mobile=useMobile(),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLElement|null>(null),triggerKey=useRef<string|null>(null),contextReturn=useRef(false)
 const [prefs,setPrefs]=useState(()=>{try{return readPreferences(typeof window!=='undefined'?window.sessionStorage:undefined)}catch{return readPreferences()}}),[tab,setTab]=useState<ContextTab>(prefs.context),[surface,setSurface]=useState<Surface>(null),[contextVisible,setContextVisible]=useState(mode!=='sky'),[expanded,setExpanded]=useState(false),[snap,setSnap]=useState(360),[menu,setMenu]=useState(false),[busy,setBusy]=useState<ReadonlySet<string>>(()=>new Set()),[status,setStatus]=useState<RuntimeStatus>('checking'),[nativePanelOpen,setNativePanelOpen]=useState(false)
 const [locationPending,setLocationPending]=useState(false)
 const [passesOpen,setPassesOpen]=useState(false),[pass,setPass]=useState<SatellitePass|null>(null),[passBusy,setPassBusy]=useState(false)
 const [fovRad,setFovRad]=useState<number|null>(null),[aboutOpen,setAboutOpen]=useState(false)
 const [skyNight,setSkyNight]=useState(()=>readSkyNightMode())
 const reflectNight=useCallback((enabled:boolean)=>{saveSkyNightMode(enabled);setSkyNight(enabled)},[])
 const chrome=useImmersive({pin:mode==='sky'||prefs.pin,panel:surface!==null||expanded||menu||aboutOpen,mobile,blocked:status!=='ready'}),runtime=useWorkspaceRuntime(mode,location.search,chrome.interact,key=>{if(key==='Escape')escape();else{chrome.reveal();requestAnimationFrame(()=>root.current?.querySelector<HTMLElement>('.cin-mode-trigger,.ws-brand,.as-identity')?.focus())}},()=>{
  const params=new URLSearchParams(location.search);for(const key of ['catalog','source_id','model','ra','dec','focus'])params.delete(key)
  if(params.toString()!==location.search.slice(1))navigate(location.pathname+(params.size?'?'+params:''),{replace:true})
 },entity=>{
  const search=nativeSelectionSearch(location.search,entity)
  if(search!==null)navigate(location.pathname+search,{replace:true})
 })
 // Deferred commands may acknowledge after newer route, observer or time intent.
 const queryClient=useQueryClient(),scopeParams=new URLSearchParams(location.search);scopeParams.delete('date');scopeParams.delete('simulation')
 const scope=mode+'|'+location.pathname+'|'+scopeParams.toString()
 const intent=useRef({location,client:runtime.client,scope,selection:0,watch:0,time:0,alive:true})
 if(intent.current.scope!==scope||intent.current.client!==runtime.client)intent.current.selection++
 if(intent.current.location.key!==location.key||intent.current.location.search!==location.search||intent.current.client!==runtime.client)intent.current.watch++
 const oldTime=new URLSearchParams(intent.current.location.search),newTime=new URLSearchParams(location.search)
 if(oldTime.get('date')!==newTime.get('date')||oldTime.get('simulation')!==newTime.get('simulation'))intent.current.time++
 Object.assign(intent.current,{location,client:runtime.client,scope})
 useEffect(()=>{intent.current.alive=true;return()=>{intent.current.alive=false;intent.current.watch++;intent.current.selection++}},[])
 useEffect(()=>queryClient.getQueryCache().subscribe(event=>{if(event.type==='updated'&&event.action.type==='fetch'&&event.query.queryKey[0]==='satellite-passes')intent.current.watch++}),[queryClient])
 const selectedSatellite=runtime.snapshot.selection?.kind==='satellite'?runtime.snapshot.selection.source_id:undefined
 const satelliteFeed=useSatelliteFeedStatus(mode==='sky',selectedSatellite)
 const navigationFlow=useViewNavigation(mode,status,runtime.client,runtime.request,runtime.setNotice,mobile)
 const visitLocation=useEarthLocation(mode,status,runtime.client,runtime.request,runtime.setNotice)
 const searchLocation=async(target:Parameters<typeof visitLocation>[0])=>{setLocationPending(true);try{return await visitLocation(target)}finally{setLocationPending(false)}}
 const navigationFocus=useRef(false)
 useEffect(()=>{if(navigationFlow.handoff){navigationFocus.current=true;const frame=requestAnimationFrame(()=>root.current?.querySelector<HTMLButtonElement>('.ws-handoff button')?.focus());return ()=>cancelAnimationFrame(frame)}if(status==='ready'&&navigationFocus.current){navigationFocus.current=false;const frame=requestAnimationFrame(()=>root.current?.querySelector<HTMLButtonElement>('[aria-label="Explore"]')?.focus());return ()=>cancelAnimationFrame(frame)}},[!!navigationFlow.handoff,status])
 useEffect(()=>{if(runtime.client)void runtime.request('setPresentation',{embedded:true,creditsAtTop:mobile&&surface!==null})},[runtime.client,mobile,surface])
 const selection=runtime.snapshot.selection,selectionId=selection?.id;const previousSelection=useRef<string|null>(null),restored=useRef<unknown>(null),layerSession=useRef<LayerSession|null>(null)
 useEffect(()=>{savePreferences(prefs)},[prefs])
 useEffect(()=>{setSurface(null);setExpanded(false);setMenu(false);setAboutOpen(false);setPassesOpen(false);setPass(null);setContextVisible(false);setStatus('checking');previousSelection.current=null;restored.current=null;contextReturn.current=false},[mode])
 useEffect(()=>{const old=document.title;document.title=`${mode==='sky'?'Sky':'Earth'} · Astronomy Hub`;return ()=>{document.title=old}},[mode])
 useEffect(()=>{if(selectionId&&selectionId!==previousSelection.current&&runtime.time.simulation){previousSelection.current=selectionId;return}if(selectionId&&selectionId!==previousSelection.current){setTab('selection');setContextVisible(true);setExpanded(false);if(mobile){setSurface('context');setSnap(360)}chrome.reveal()}else if(!selectionId&&previousSelection.current){setTab(prefs.context);setExpanded(false);if(mobile)setSurface(null)}previousSelection.current=selectionId||null},[selectionId,mobile,prefs.context])
 // Restore only whitelisted preferences and canonical selection through qualified capabilities.
 useEffect(()=>{const client=runtime.client;if(!client||restored.current===client)return;restored.current=client;let cancelled=false;
  const session:LayerSession|null=mode==='earth'&&client.capabilities.includes('layers')?{client,cancelled:false,tail:Promise.resolve(null),touched:new Set(),pending:new Set()}:null
  layerSession.current=session;setBusy(new Set())
  void(async()=>{
  if(session)for(const id of ['oras-site','satellites','aircraft','weather','earthquakes','fire-perimeters','weather-radar']){if(cancelled)return;if(!session.touched.has(id))await requestLayer(session,'setLayerEnabled',{id,enabled:prefs.layers.includes(id)})}
  const {selection:entity,pendingFocus}=useRuntimeProductState.getState()
  if(mode==='sky'&&entity&&client.capabilities.includes('selection')){
   useRuntimeProductState.setState({pendingFocus:null})
   const selected=await runtime.request('selectEntity',entity,25000)
   if(!cancelled&&selected?.ok&&(pendingFocus||new URLSearchParams(location.search).get('focus')==='1')&&['catalog','source_id','model'].every(key=>(!pendingFocus||pendingFocus[key as keyof typeof pendingFocus]===entity[key as keyof typeof entity])))await runtime.request('focusSelection',{},12000)
  }
 })();return ()=>{cancelled=true;if(session)session.cancelled=true;if(layerSession.current===session)layerSession.current=null}},[runtime.client,mode])
 const close=useCallback((restoreFocus=true)=>{const returnToContext=mobile&&surface!=='context'&&contextReturn.current;contextReturn.current=false;setSurface(returnToContext?'context':null);setMenu(false);if(surface==='context'||surface===null)setContextVisible(false);setExpanded(false);if(restoreFocus)requestAnimationFrame(()=>{if(trigger.current?.isConnected)trigger.current.focus();else if(triggerKey.current)root.current?.querySelector<HTMLElement>(`[data-ws-trigger="${triggerKey.current}"]`)?.focus()})},[mobile,surface])
 function escape(){if(passesOpen){setPassesOpen(false);return}if(navigationFlow.handoff){navigationFlow.cancel();return}if(menu){setMenu(false);requestAnimationFrame(()=>root.current?.querySelector<HTMLElement>('[data-ws-trigger=menu]')?.focus())}else if(mobile&&surface&&snap>96)setSnap(snap===640?360:96);else if(expanded)setExpanded(false);else if(surface||contextVisible&&tab==='selection')close();else chrome.reveal()}
 const enterImmersive=()=>{close(false);root.current?.querySelector<HTMLElement>('.ws-stage')?.focus();chrome.enter()}
 const open=(next:Surface)=>{if(next==='context')contextReturn.current=false;else if(mobile&&surface==='context')contextReturn.current=true;trigger.current=document.activeElement instanceof HTMLElement?document.activeElement:null;if(trigger.current?.closest('.ws-menu'))trigger.current=root.current?.querySelector<HTMLElement>('[data-ws-trigger=menu]')||null;triggerKey.current=trigger.current?.dataset.wsTrigger||null;chrome.reveal();setMenu(false);setSurface(next);setExpanded(false);setSnap(360);if(next==='context')setContextVisible(true)}
 const onContext=(next:'tonight'|'observe')=>{setTab(next);setPrefs(p=>({...p,context:next}));open('context')}
 const onMode=(next:RuntimeMode)=>{if(!locationPending)void navigationFlow.enter(next)}
 const solarSource=useRef<{key:string;client:RuntimeClient|null}|null>({key:location.key,client:runtime.client})
 if(solarSource.current?.key!==location.key||solarSource.current?.client!==runtime.client)solarSource.current={key:location.key,client:runtime.client}
 useEffect(()=>()=>{solarSource.current=null},[])
 const onSolar=async()=>{const source=solarSource.current;if(status!=='ready'||locationPending||navigationFlow.handoff||!source?.client)return;setLocationPending(true);try{const ack=await runtime.request('getNavigationState',{},4000,source.client);if(solarSource.current!==source||!ack?.ok||!ack.navigation)return;const p=new URLSearchParams(location.search);p.set('date',ack.navigation.utc);p.set('solarFrom',mode);navigate('/solar-system?'+p,{state:{solarReturn:{path:location.pathname+location.search,state:{...location.state,n1View:ack.navigation}}}})}finally{setLocationPending(false)}}
 const select=async(url:string,focus=false)=>{
  const p=new URL(url,window.location.origin).searchParams;const identity={catalog:p.get('catalog')||'',source_id:p.get('source_id')||'',model:p.get('model')||'',...(p.has('ra')?{ra:Number(p.get('ra'))}:{}),...(p.has('dec')?{dec:Number(p.get('dec'))}:{})}
  // Observe and Tonight may be opened over Earth; their target actions intentionally enter Sky.
  if(mode==='earth'){if(p.has('date')){const date=new Date(p.get('date')!);if(!Number.isFinite(date.getTime()))return;p.set('date',date.toISOString())}useRuntimeProductState.setState({selection:identity,pendingFocus:focus?identity:null});navigate('/sky-engine?'+p);return}
  const client=runtime.client,revision=++intent.current.selection;intent.current.watch++
  const valid=()=>intent.current.alive&&intent.current.client===client&&intent.current.selection===revision
  let focusedUtc:string|null=null,focusedTime=intent.current.time
  if(focus&&p.has('date')){const peak=new Date(p.get('date')!);if(!Number.isFinite(peak.getTime()))return;focusedUtc=peak.toISOString();focusedTime=++intent.current.time;const ack=await runtime.request('setTimeIntent',{utc:focusedUtc,live:false},12000,client||undefined);if(!valid()||!ack?.ok||intent.current.time!==focusedTime)return}
  const result=await runtime.request('selectEntity',identity,25000,client||undefined);if(!valid()||!result?.ok)return
  const latest=intent.current.location,q=new URLSearchParams(latest.search);q.delete('focus')
  if(focusedUtc&&intent.current.time===focusedTime)q.set('date',focusedUtc)
  useRuntimeProductState.setState({selection:identity})
  for(const field of ['catalog','source_id','model','ra','dec']){q.delete(field);if(p.has(field))q.set(field,p.get(field)!)}navigate(latest.pathname+'?'+q,{replace:true})
  if(focus&&valid())await runtime.request('focusSelection',{},12000,client||undefined)
 }
 const applyTime=async(utc:string,live=false)=>{const client=runtime.client,revision=++intent.current.time;intent.current.watch++;const ack=await runtime.request('setTimeIntent',{utc,live},12000,client||undefined);if(!ack?.ok||!intent.current.alive||intent.current.client!==client||intent.current.time!==revision||intent.current.location.pathname!==location.pathname)return;setPass(null);const latest=intent.current.location,p=new URLSearchParams(latest.search);p.delete('simulation');if(live)p.delete('date');else p.set('date',utc);navigate(latest.pathname+(p.size?'?'+p:''),{replace:true})}
 const simulationAction=async(playing:boolean,utc?:string)=>{if(passBusy)return;const client=runtime.client,revision=++intent.current.time;intent.current.watch++;setPassBusy(true);try{const actual=await runtime.simulate(playing,utc);if(!actual||!intent.current.alive||intent.current.client!==client||intent.current.time!==revision||intent.current.location.pathname!==location.pathname)return;const latest=intent.current.location,p=new URLSearchParams(latest.search);p.set('date',actual);p.set('simulation','1');navigate(latest.pathname+'?'+p,{replace:true})}finally{setPassBusy(false)}}
 const watchPass=async(target:SatellitePass)=>{const watchUtc=passSimulationUtc(target);if(passBusy||!watchUtc||target.watch_altitude_deg===null||target.watch_azimuth_deg===null||!runtime.client)return;setPassBusy(true);const client=runtime.client,revision=++intent.current.watch,observer={...product.observer};intent.current.selection++;
  const sameObserver=(value:typeof observer)=>Math.abs(value.lat-observer.lat)<1e-7&&Math.abs(value.lon-observer.lon)<1e-7&&Math.abs(value.elevationM-observer.elevationM)<1e-4
  const valid=()=>intent.current.alive&&intent.current.client===client&&intent.current.watch===revision&&sameObserver(useRuntimeProductState.getState().observer)
  try{
  const view=await runtime.request('getNavigationState',{},4000,client);if(!valid()||!view?.ok||view.navigation?.mode!=='sky'||!sameObserver(view.navigation.observer))return;
  const cleared=await runtime.request('clearSelection',{},4000,client);if(!valid()||!cleared?.ok)return;useRuntimeProductState.setState({selection:null,pendingFocus:null});
  const actual=await runtime.simulate(false,watchUtc);if(!valid()||!actual)return;
  // The bridge requires a complete camera. Refresh it after time/selection acks
  // so intervening FOV, projection and display changes are retained.
  const latestView=await runtime.request('getNavigationState',{},4000,client);if(!valid()||!latestView?.ok||latestView.navigation?.mode!=='sky'||!sameObserver(latestView.navigation.observer))return;
  const pointed=await runtime.request('setNavigationView',{mode:'sky',camera:{...latestView.navigation.camera,yawRad:target.watch_azimuth_deg*Math.PI/180,pitchRad:target.watch_altitude_deg*Math.PI/180}},4000,client);if(!valid()||!pointed?.ok)return;
  const latest=intent.current.location,p=new URLSearchParams(latest.search);for(const key of ['catalog','source_id','model','ra','dec','focus'])p.delete(key);p.set('date',actual);p.set('simulation','1');navigate(latest.pathname+'?'+p,{replace:true});setPass(target);setPassesOpen(false);setSurface(null);setContextVisible(false);
 }finally{setPassBusy(false)}}
 const clear=async()=>{intent.current.selection++;intent.current.watch++;const result=await runtime.request('clearSelection');if(result?.ok){useRuntimeProductState.setState({selection:null});setTab(prefs.context);setExpanded(false);const p=new URLSearchParams(location.search);for(const key of ['catalog','source_id','model','ra','dec'])p.delete(key);navigate(location.pathname+(p.size?'?'+p:''),{replace:true})}}
 // One acknowledged layer command at a time, bound to this exact runtime client.
 function requestLayer(session:LayerSession,command:string,payload:unknown){
  const result=session.tail.then(()=>session.cancelled?null:runtime.request(command,payload,18000,session.client))
  session.tail=result;return result
 }
 const changeLayer=async(id:string,enabled?:boolean)=>{
  const session=layerSession.current
  if(!session||session.cancelled||session.client!==runtime.client||session.pending.has(id))return
  // Record the choice before awaiting anything; restoration must never replay it.
  session.touched.add(id);session.pending.add(id);setBusy(new Set(session.pending))
  const result=await requestLayer(session,enabled===undefined?'retryLayer':'setLayerEnabled',enabled===undefined?{id}:{id,enabled})
  if(session.cancelled||layerSession.current!==session)return
  if(result?.ok&&enabled!==undefined)setPrefs(p=>({...p,layers:enabled?[...new Set([...p.layers,id])]:p.layers.filter(value=>value!==id)}))
  session.pending.delete(id);setBusy(new Set(session.pending))
 }
 const toggle=(layer:LayerDTO)=>changeLayer(layer.id,!layer.enabled)
 const retryLayer=(id:string)=>changeLayer(id)
 const actions={tracking:runtime.snapshot.tracking,onFocus:()=>void runtime.request('focusSelection',{},12000),onTrack:()=>void runtime.request('setTracking',{enabled:!runtime.snapshot.tracking}),onClear:()=>void clear()}
 const product=useRuntimeProductState.getState();const observeContext={latitude:product.observer.lat,longitude:product.observer.lon,elevationMeters:product.observer.elevationM,isOras:Math.abs(product.observer.lat-ORAS_SITE.latitude)<1e-5&&Math.abs(product.observer.lon-ORAS_SITE.longitude)<1e-5&&product.observer.elevationM===ORAS_SITE.elevationMeters,...(!runtime.time.live?{at:runtime.time.effective||runtime.time.requested}:{})}
 const context=<ContextSurface tab={tab==='selection'&&!selection?'tonight':tab} selection={!!selection} onTab={value=>{setTab(value);if(value!=='selection')setPrefs(p=>({...p,context:value}))}} onClose={()=>{setContextVisible(false);contextReturn.current=false;close()}}>{tab==='selection'&&selection?<><SelectionDetails selection={selection}/>{mobile?<SelectionActions selection={selection} {...actions}/>:null}{selection.kind==='site'?<div className="ws-actions"><button onClick={()=>onContext('tonight')}>Tonight</button><button onClick={()=>onContext('observe')}>Observe</button></div>:null}</>:tab==='observe'?<ObserveSurface context={observeContext} onSelect={url=>void select(url)} onFocus={url=>void select(url,true)}/>:<TonightSurface nightDate={!runtime.time.live&&runtime.time.effective?currentObservingNight(new Date(runtime.time.effective)):undefined} expanded={surface==='context'} onSelect={url=>void select(url)} onFocus={url=>void select(url,true)}/>}</ContextSurface>
 const layers=<LayerPanel isOras={observeContext.isOras} layers={runtime.snapshot.layers} busy={busy} onToggle={layer=>void toggle(layer)} onRetry={id=>void retryLayer(id)} onClose={close} onSources={()=>open('diagnostics')}/>
 const timeEditor=<TimeEditor mode={mode} time={runtime.time} tracking={runtime.snapshot.tracking} satelliteFeed={satelliteFeed.isError?undefined:satelliteFeed.data} selectedSatellite={selectedSatellite} isOras={observeContext.isOras} onApply={utc=>applyTime(utc)} onNow={()=>applyTime(new Date().toISOString(),true)} onClose={close}/>
 const diagnostics=<DiagnosticsSurface earth={mode==='earth'} version={runtime.client?.version||'Checking'} status={status} snapshot={runtime.snapshot} onClose={close} onRetryImagery={()=>void runtime.request('retryImagery',{},18000)}/>
 const navigation=<section aria-label="Earth navigation"><div className="ws-panel-heading"><h2>Navigation</h2><IconButton icon="x" label="Close navigation" onClick={()=>close()}/></div><p>Drag to explore. Scroll to zoom.</p><div className="ws-actions"><button onClick={()=>void runtime.request('globalView')}>Global view</button><button aria-label="View full Earth" title="View full Earth" onClick={()=>void runtime.request('globalView',{})}><Icon name="globe"/></button><button onClick={()=>void runtime.request('returnToOras',{},12000)}>Return to ORAS</button></div></section>
 const sheet=surface==='layers'?layers:surface==='time'?timeEditor:surface==='diagnostics'?diagnostics:context
 return <div ref={root} className={`ws-shell${mode==='sky'?` as-sky${skyNight?' as-sky-night':''}`:''}${chrome.hidden?' ws-shell--hidden':''}${chrome.immersive?' ws-shell--immersive':''}${nativePanelOpen?' ws-shell--native-panel':''}${mobile&&surface?' ws-shell--sheet-open':''}${navigationFlow.handoff?' ws-shell--handoff':''}`} data-workspace-mode={mode} data-chrome-state={chrome.state} onFocusCapture={event=>{if(!event.target.closest('.ws-stage'))chrome.setFocused(true)}} onBlurCapture={event=>{if(!event.relatedTarget||!root.current?.contains(event.relatedTarget as Node)||(event.relatedTarget as Element).closest('.ws-stage'))chrome.setFocused(false)}} onPointerMove={event=>{if(event.pointerType!=='touch')chrome.activity()}} onKeyDownCapture={event=>{if(event.key==='Tab'&&chrome.hidden)chrome.reveal();if(event.key==='Escape'&&!(event.target as Element).closest('dialog,[data-earth-search],.cin-brand[data-cinematic-open=true]')){event.preventDefault();escape()}}}>
  <a className="ws-skip" href="#workspace-main">Skip to workspace</a>
  {mode==='sky'?<AdaptiveSkyChrome onSolar={()=>void onSolar()} fovRad={fovRad} busy={status!=='ready'} elevationFallback={observerWithProvenance(product.observer,location.search).elevationSource==='unavailable-zero'} observer={product.observer} onEarth={()=>onMode('earth')} onContext={onContext} onMenu={()=>{trigger.current=document.activeElement as HTMLElement;triggerKey.current='menu';setMenu(x=>!x)}} onObserver={async observer=>{intent.current.watch++;intent.current.selection++;const ack=await runtime.request('setObserverIntent',observer,12000);if(!ack?.ok)return false;useRuntimeProductState.setState({observer});const p=new URLSearchParams(location.search);p.set('lat',String(observer.lat));p.set('lng',String(observer.lon));p.set('elev',String(observer.elevationM));p.set('elevationSource','provided');navigate(location.pathname+'?'+p,{replace:true});return true}}/>:<ProductHeader onSolar={()=>void onSolar()} mode={mode} busy={status!=='ready'||locationPending||!!navigationFlow.handoff} pin={prefs.pin} onMode={onMode} center={async()=>{const result=await runtime.request('getNavigationState');return result?.navigation?.observer||null}} onLocation={searchLocation} onContext={onContext} onPin={()=>setPrefs(p=>({...p,pin:!p.pin}))} onImmersive={enterImmersive} onMenu={()=>{trigger.current=document.activeElement as HTMLElement;triggerKey.current='menu';setMenu(x=>!x)}}/>}
  <main id="workspace-main" tabIndex={-1} className="ws-stage" aria-label={`${mode==='sky'?'Sky':'Earth'} workspace`}><h1 className="ws-sr-only">{mode==='sky'?'Sky':'Earth'} workspace</h1><RuntimeHost mode={mode} onClient={runtime.acceptClient} onStatus={setStatus} onNativePanel={setNativePanelOpen} onNightMode={reflectNight} onFov={setFovRad}/></main>
  {mode==='sky'?<><nav className="cs-tools ws-panel" aria-label="Observing tools"><button className="ws-icon-button" aria-label="Satellites / Next Passes" title="Satellites / Next Passes" onClick={()=>{setPassesOpen(x=>!x);close(false)}}>Passes</button><IconButton icon="eye" label="Observe sky" onClick={()=>onContext('observe')}/><IconButton icon="moon" label="Tonight's targets" onClick={()=>onContext('tonight')}/><IconButton icon="layers" label="Constellations and Sky settings" disabled={status!=='ready'||!runtime.client?.capabilities.includes('nativeTools')} onClick={()=>void runtime.request('openNativeTools')}/></nav></>:null}
  {mode==='earth'?<div className="ws-earth-direct"><EarthSearch active={mode==='earth'} busy={status!=='ready'||locationPending||!!navigationFlow.handoff} onNavigate={searchLocation}/></div>:null}
  {mode==='earth'&&status==='ready'?<nav className="ws-earth-map-tools ws-panel" aria-label="Map controls">{runtime.client?.capabilities.includes('zoomControls')?<><button aria-label="Zoom in" onClick={()=>void runtime.request('zoomStep',{direction:'in'})}>+</button><button aria-label="Zoom out" onClick={()=>void runtime.request('zoomStep',{direction:'out'})}>−</button></>:null}<button aria-label="View full Earth" title="View full Earth" onClick={()=>void runtime.request('globalView',{})}><Icon name="globe"/></button><button onClick={()=>void runtime.request('returnToOras',{},12000)}>ORAS</button><button aria-label="Imagery sources and availability" onClick={()=>open('diagnostics')}>Sources</button></nav>:null}
  {menu?<div className="ws-menu ws-panel" role="region" aria-label="Workspace menu"><button onClick={()=>onContext('tonight')}>Tonight</button><button onClick={()=>onContext('observe')}>Observe</button>{mode==='earth'?<><button aria-pressed={prefs.pin} onClick={()=>setPrefs(p=>({...p,pin:!p.pin}))}>{prefs.pin?'Controls pinned':'Pin controls'}</button><button onClick={enterImmersive}>Immersive</button></>:null}{mode==='sky'&&runtime.client?.capabilities.includes('nativeTools')?<button onClick={()=>{setMenu(false);void runtime.request('openNativeTools')}}>Sky view settings</button>:null}<button onClick={()=>open('diagnostics')}>Diagnostics</button><button onClick={()=>{setMenu(false);setAboutOpen(true)}}>About &amp; Licenses</button></div>:null}
  {chrome.hidden?<button className="ws-reveal" onClick={chrome.reveal}><Icon name="maximize"/>Show controls<span>{mode==='sky'?'Sky':'Earth'}</span></button>:null}
  <div className="ws-edges" aria-hidden="true">{['top','right','bottom','left'].map(edge=><span key={edge} className={`ws-edge ws-edge--${edge}`} onPointerEnter={event=>{if(event.pointerType==='mouse')chrome.edgeReveal()}} onPointerLeave={chrome.cancelEdge}/>)}</div>
  {!mobile&&mode==='earth'&&runtime.client?.capabilities.includes('layers')?<LayerRail onLayers={()=>surface==='layers'?close():open('layers')} onHome={()=>void runtime.request('returnToOras',{},12000)} onNavigation={()=>open('navigation')}/>:null}
  {!mobile&&surface==='layers'?<div className="ws-layers ws-panel ws-chrome">{layers}</div>:null}
  {!mobile&&contextVisible&&!expanded&&surface!=='diagnostics'&&surface!=='time'&&(surface!=='layers'||window.innerWidth>=1200)?<aside className="ws-context ws-panel ws-chrome">{context}</aside>:null}
  {!mobile&&selection&&!runtime.time.simulation?<SelectionDrawer selection={selection} expanded={expanded} onExpand={()=>{setExpanded(x=>!x);setSurface(null)}} {...actions}/>:null}
  {!mobile&&surface==='navigation'?<div className="ws-layers ws-panel ws-chrome">{navigation}</div>:null}
  {!mobile&&surface==='time'?<div className="ws-time-editor ws-panel ws-chrome">{timeEditor}</div>:null}
  {!mobile&&surface==='diagnostics'?<aside className="ws-diagnostics ws-panel ws-chrome">{diagnostics}</aside>:null}
  {mobile&&!surface&&!runtime.time.simulation&&(mode==='earth'||selection)?<div className="ws-mobile-launchers ws-chrome">{mode==='earth'&&runtime.client?.capabilities.includes('layers')?<button data-ws-trigger="layers" onClick={()=>open('layers')}><Icon name="layers"/>Layers</button>:<span/>}<button data-ws-trigger="context" onClick={()=>{if(selection)setTab('selection');open('context')}}>{selection?'Selected object':'Tonight'}<Icon name="chevron-up"/></button></div>:null}
  {mobile&&surface?<BottomSheet modalAllowed={mode!=='sky'} title={surface==='context'&&selection?selection.name:undefined} name={surface==='layers'?'Earth layers':surface==='context'?'Workspace context':surface==='time'?'Time details':'Diagnostics'} snap={snap} layers={surface==='layers'} onSnap={setSnap} onClose={close}>{sheet}<button data-ws-trigger="sheet-time" className="ws-link" onClick={()=>open('time')}>Time</button>{mode==='earth'&&surface==='layers'?<button className="ws-link" onClick={()=>void runtime.request('returnToOras',{},12000)}>Return to ORAS</button>:null}</BottomSheet>:null}
  {(!mobile||!surface)?<TimeSurface mode={mode} time={runtime.time} tracking={runtime.snapshot.tracking} satelliteFeed={satelliteFeed.isError?undefined:satelliteFeed.data} satelliteLoading={satelliteFeed.isLoading} onNow={()=>void applyTime(new Date().toISOString(),true)} onStopTracking={()=>void runtime.request('setTracking',{enabled:false})} isOras={observeContext.isOras} onOpen={()=>open('time')}/>:null}
  {mode==='sky'&&passesOpen?<SatellitePasses observer={product.observer} busy={passBusy||status!=='ready'} onWatch={target=>void watchPass(target)} onClose={()=>{setPassesOpen(false);requestAnimationFrame(()=>root.current?.querySelector<HTMLElement>('[aria-label="Satellites / Next Passes"]')?.focus())}}/>:null}
  {mode==='sky'&&runtime.time.simulation&&!passesOpen?<SimulationControls state={runtime.time.simulation} name={pass?`${pass.name} · NORAD ${pass.norad_id}`:selection?.name} busy={passBusy||status!=='ready'} onPlay={playing=>void simulationAction(playing)} onRestart={pass?.watch_utc?()=>void simulationAction(false,new Date(pass.watch_utc!).toISOString()):undefined} onLive={()=>void applyTime(new Date().toISOString(),true)} tracking={runtime.snapshot.tracking} onTrack={selectedSatellite?()=>void runtime.request('setTracking',{enabled:!runtime.snapshot.tracking}):undefined} onClear={selectedSatellite?()=>void clear():undefined} onSelect={pass&&selectedSatellite!==pass.norad_id?()=>void select('/oras-sky-engine/?'+new URLSearchParams({catalog:pass.catalog,source_id:pass.source_id,model:pass.model})):undefined}/>:null}
  {runtime.notice?<div className="ws-notice ws-panel" role="status"><span>{runtime.notice}</span><IconButton icon="x" label="Dismiss message" onClick={()=>runtime.setNotice('')}/></div>:null}
  {navigationFlow.handoff?<section className="ws-handoff ws-panel" aria-label="View transition" role="status"><strong>Opening {navigationFlow.handoff.target==='earth'?'Earth':'Sky View'}</strong>{navigationFlow.handoff.lat!==undefined?<span>{navigationFlow.handoff.lat.toFixed(4)}°, {navigationFlow.handoff.lon?.toFixed(4)}°{navigationFlow.handoff.elevationSource==='unavailable-zero'?' · elevation unavailable, using 0 m':''}</span>:null}<button className="ws-primary" onClick={navigationFlow.cancel}>Cancel transition</button></section>:navigationFlow.boundary?<div className="ws-navigation-hint ws-panel" role="status">{navigationFlow.boundary.phase==='progress'?`Continue scrolling ${mode==='sky'?'outward':'inward'} to open ${mode==='sky'?'Earth':'Sky'}…`:`${mode==='sky'?'Near the widest Sky view':'Near the surface'}. Keep scrolling ${mode==='sky'?'outward':'inward'} to open ${mode==='sky'?'Earth':'Sky'}.`}<span>Or use Explore.</span></div>:null}
  <AboutLicenses open={aboutOpen} onClose={()=>setAboutOpen(false)}/>
  <div className="ws-selection-announcement ws-sr-only" role="status">{selection?`${selection.name}, ${selection.kind}, selected`:''}</div>
 </div>
}
