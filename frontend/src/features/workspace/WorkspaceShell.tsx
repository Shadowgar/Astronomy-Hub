import {ORAS_SITE} from '../../config/orasSite'
import React,{useState,useEffect,useRef,useCallback} from 'react'
import {useLocation,useNavigate} from 'react-router-dom'
import type {RuntimeClient} from '../../../../packages/runtime-protocol/client.mjs'
import type {RuntimeResult} from '../../../../packages/runtime-protocol/index.mjs'
import type {RuntimeMode,LayerDTO} from '../../../../packages/runtime-protocol/index.mjs'
import RuntimeHost,{type RuntimeStatus} from '../sky-engine/RuntimeHost'
import {useRuntimeProductState} from '../runtime/productState'
import {readPreferences,savePreferences,type ContextTab,type Surface} from './workspaceUiState'
import {useImmersive} from './ImmersiveController'
import {useWorkspaceRuntime} from './workspaceRuntimeAdapter'
import ProductHeader from './ProductHeader'
import LayerPanel,{LayerRail} from './LayerPanel'
import ContextSurface from './ContextSurface'
import {currentObservingNight} from '../tonight/nightClock'
import TonightSurface from './TonightSurface'
import ObserveSurface from './ObserveSurface'
import SelectionDrawer,{SelectionDetails,SelectionActions} from './SelectionDrawer'
import TimeSurface,{TimeEditor} from './TimeSurface'
import BottomSheet from './BottomSheet'
import DiagnosticsSurface from './DiagnosticsSurface'
import {Icon,IconButton} from './primitives'
import {workspaceModePath,skyStandalonePath} from './workspaceNavigation'
import './workspace.css'
type LayerSession={client:RuntimeClient;cancelled:boolean;tail:Promise<RuntimeResult|null>;touched:Set<string>;pending:Set<string>}
function useMobile(){const [mobile,setMobile]=useState(()=>typeof window!=='undefined'&&window.innerWidth<768);useEffect(()=>{const media=matchMedia('(max-width:767px)'),update=()=>setMobile(media.matches);media.addEventListener('change',update);update();return ()=>media.removeEventListener('change',update)},[]);return mobile}
export default function WorkspaceShell({mode='sky'}:{mode?:RuntimeMode}){
 const location=useLocation(),navigate=useNavigate(),mobile=useMobile(),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLElement|null>(null),triggerKey=useRef<string|null>(null),contextReturn=useRef(false)
 const [prefs,setPrefs]=useState(()=>{try{return readPreferences(typeof window!=='undefined'?window.sessionStorage:undefined)}catch{return readPreferences()}}),[tab,setTab]=useState<ContextTab>(prefs.context),[surface,setSurface]=useState<Surface>(null),[contextVisible,setContextVisible]=useState(true),[expanded,setExpanded]=useState(false),[snap,setSnap]=useState(360),[menu,setMenu]=useState(false),[busy,setBusy]=useState<ReadonlySet<string>>(()=>new Set()),[status,setStatus]=useState<RuntimeStatus>('checking')
 const chrome=useImmersive({pin:prefs.pin,panel:surface!==null||expanded||menu,mobile,blocked:status!=='ready'}),runtime=useWorkspaceRuntime(mode,location.search,chrome.interact,key=>{if(key==='Escape')escape();else{chrome.reveal();requestAnimationFrame(()=>root.current?.querySelector<HTMLAnchorElement>('.ws-brand')?.focus())}})
 useEffect(()=>{if(runtime.client)void runtime.request('setPresentation',{embedded:true,creditsAtTop:mobile&&surface!==null})},[runtime.client,mobile,surface])
 const selection=runtime.snapshot.selection,selectionId=selection?.id;const previousSelection=useRef<string|null>(null),restored=useRef<unknown>(null),layerSession=useRef<LayerSession|null>(null)
 useEffect(()=>{savePreferences(prefs)},[prefs])
 useEffect(()=>{setSurface(null);setExpanded(false);setMenu(false);setContextVisible(mode==='sky');setStatus('checking');previousSelection.current=null;restored.current=null;contextReturn.current=false},[mode])
 useEffect(()=>{const old=document.title;document.title=`${mode==='sky'?'Sky':'Earth'} · Astronomy Hub`;return ()=>{document.title=old}},[mode])
 useEffect(()=>{if(selectionId&&selectionId!==previousSelection.current){setTab('selection');setContextVisible(true);setExpanded(false);if(mobile){setSurface('context');setSnap(360)}chrome.reveal()}else if(!selectionId&&previousSelection.current){setTab(prefs.context);setExpanded(false);if(mobile)setSurface(null)}previousSelection.current=selectionId||null},[selectionId,mobile,prefs.context])
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
 function escape(){if(menu){setMenu(false);requestAnimationFrame(()=>root.current?.querySelector<HTMLElement>('[data-ws-trigger=menu]')?.focus())}else if(mobile&&surface&&snap>96)setSnap(snap===640?360:96);else if(expanded)setExpanded(false);else if(surface||contextVisible&&tab==='selection')close();else chrome.reveal()}
 const open=(next:Surface)=>{if(next==='context')contextReturn.current=false;else if(mobile&&surface==='context')contextReturn.current=true;trigger.current=document.activeElement instanceof HTMLElement?document.activeElement:null;if(trigger.current?.closest('.ws-menu'))trigger.current=root.current?.querySelector<HTMLElement>('[data-ws-trigger=menu]')||null;triggerKey.current=trigger.current?.dataset.wsTrigger||null;chrome.reveal();setMenu(false);setSurface(next);setExpanded(false);setSnap(360);if(next==='context')setContextVisible(true)}
 const onContext=(next:'tonight'|'observe')=>{setTab(next);setPrefs(p=>({...p,context:next}));open('context')}
 const onMode=(next:RuntimeMode)=>{if(next===mode)return;useRuntimeProductState.setState({pendingFocus:null});navigate(workspaceModePath(next,location.search))}
 const select=async(url:string,focus=false)=>{
  const p=new URL(url,window.location.origin).searchParams;const identity={catalog:p.get('catalog')||'',source_id:p.get('source_id')||'',model:p.get('model')||'',...(p.has('ra')?{ra:Number(p.get('ra'))}:{}),...(p.has('dec')?{dec:Number(p.get('dec'))}:{})}
  // Observe and Tonight may be opened over Earth; their target actions intentionally enter Sky.
  if(mode==='earth'){if(p.has('date')){const date=new Date(p.get('date')!);if(!Number.isFinite(date.getTime()))return;p.set('date',date.toISOString())}useRuntimeProductState.setState({selection:identity,pendingFocus:focus?identity:null});navigate('/sky-engine?'+p);return}
  const q=new URLSearchParams(location.search);q.delete('focus')
  if(focus&&p.has('date')){const peak=new Date(p.get('date')!);if(!Number.isFinite(peak.getTime()))return;const utc=peak.toISOString();const ack=await runtime.request('setTimeIntent',{utc,live:false},12000);if(!ack?.ok)return;q.set('date',utc)}
  const result=await runtime.request('selectEntity',identity,25000);if(!result?.ok)return
  useRuntimeProductState.setState({selection:identity})
  for(const field of ['catalog','source_id','model','ra','dec'])if(p.has(field))q.set(field,p.get(field)!);navigate(location.pathname+'?'+q,{replace:true})
  if(focus)await runtime.request('focusSelection',{},12000)
 }
 const applyTime=async(utc:string,live=false)=>{const ack=await runtime.request('setTimeIntent',{utc,live});if(!ack?.ok)return;const p=new URLSearchParams(location.search);if(live)p.delete('date');else p.set('date',utc);navigate(location.pathname+(p.size?'?'+p:''),{replace:true})}
 const clear=async()=>{const result=await runtime.request('clearSelection');if(result?.ok){useRuntimeProductState.setState({selection:null});setTab(prefs.context);setExpanded(false);const p=new URLSearchParams(location.search);for(const key of ['catalog','source_id','model','ra','dec'])p.delete(key);navigate(location.pathname+(p.size?'?'+p:''),{replace:true})}}
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
 const product=useRuntimeProductState.getState();const observeContext={latitude:product.observer.lat,longitude:product.observer.lon,elevationMeters:product.observer.elevationM,isOras:product.observer.lat===ORAS_SITE.latitude&&product.observer.lon===ORAS_SITE.longitude&&product.observer.elevationM===ORAS_SITE.elevationMeters,...(!runtime.time.live?{at:runtime.time.effective||runtime.time.requested}:{})}
 const context=<ContextSurface tab={tab==='selection'&&!selection?'tonight':tab} selection={!!selection} onTab={value=>{setTab(value);if(value!=='selection')setPrefs(p=>({...p,context:value}))}} onClose={()=>{setContextVisible(false);contextReturn.current=false;close()}}>{tab==='selection'&&selection?<><SelectionDetails selection={selection}/>{mobile?<SelectionActions selection={selection} {...actions}/>:null}{selection.kind==='site'?<div className="ws-actions"><button onClick={()=>onContext('tonight')}>Tonight</button><button onClick={()=>onContext('observe')}>Observe</button></div>:null}</>:tab==='observe'?<ObserveSurface context={observeContext} onSelect={url=>void select(url)} onFocus={url=>void select(url,true)}/>:<TonightSurface nightDate={!runtime.time.live&&runtime.time.effective?currentObservingNight(new Date(runtime.time.effective)):undefined} expanded={surface==='context'} onSelect={url=>void select(url)} onFocus={url=>void select(url,true)}/>}</ContextSurface>
 const layers=<LayerPanel isOras={observeContext.isOras} layers={runtime.snapshot.layers} busy={busy} onToggle={layer=>void toggle(layer)} onRetry={id=>void retryLayer(id)} onClose={close} onSources={()=>open('diagnostics')}/>
 const timeEditor=<TimeEditor mode={mode} time={runtime.time} isOras={observeContext.isOras} onApply={utc=>applyTime(utc)} onNow={()=>applyTime(new Date().toISOString(),true)} onClose={close}/>
 const diagnostics=<DiagnosticsSurface version={runtime.client?.version||'Checking'} status={status} snapshot={runtime.snapshot} onClose={close} onRetryImagery={()=>void runtime.request('retryImagery',{},18000)}/>
 const navigation=<section aria-label="Earth navigation"><div className="ws-panel-heading"><h2>Navigation</h2><IconButton icon="x" label="Close navigation" onClick={()=>close()}/></div><p>Drag to explore. Scroll to zoom.</p><div className="ws-actions"><button onClick={()=>void runtime.request('globalView')}>Global view</button><button onClick={()=>void runtime.request('returnToOras',{},12000)}>Return to ORAS</button></div></section>
 const sheet=surface==='layers'?layers:surface==='time'?timeEditor:surface==='diagnostics'?diagnostics:context
 return <div ref={root} className={`ws-shell${chrome.hidden?' ws-shell--hidden':''}${chrome.immersive?' ws-shell--immersive':''}${mobile&&surface?' ws-shell--sheet-open':''}`} data-workspace-mode={mode} data-chrome-state={chrome.state} onFocusCapture={event=>{if(!event.target.closest('.ws-stage'))chrome.setFocused(true)}} onBlurCapture={event=>{if(!event.relatedTarget||!root.current?.contains(event.relatedTarget as Node)||(event.relatedTarget as Element).closest('.ws-stage'))chrome.setFocused(false)}} onPointerMove={event=>{if(event.pointerType!=='touch')chrome.activity()}} onKeyDownCapture={event=>{if(event.key==='Tab'&&chrome.hidden)chrome.reveal();if(event.key==='Escape'){event.preventDefault();escape()}}}>
  <a className="ws-skip" href="#workspace-main">Skip to workspace</a>
  <ProductHeader mode={mode} busy={status!=='ready'} pin={prefs.pin} onMode={onMode} onContext={onContext} onPin={()=>setPrefs(p=>({...p,pin:!p.pin}))} onImmersive={()=>{close(false);(document.activeElement as HTMLElement)?.blur?.();chrome.enter()}} onMenu={()=>{trigger.current=document.activeElement as HTMLElement;triggerKey.current='menu';setMenu(x=>!x)}}/>
  <main id="workspace-main" tabIndex={-1} className="ws-stage" aria-label={`${mode==='sky'?'Sky':'Earth'} workspace`}><h1 className="ws-sr-only">{mode==='sky'?'Sky':'Earth'} workspace</h1><RuntimeHost mode={mode} onClient={runtime.acceptClient} onStatus={setStatus}/></main>
  {menu?<div className="ws-menu ws-panel" role="region" aria-label="Workspace menu"><button onClick={()=>onContext('tonight')}>Tonight</button><button onClick={()=>onContext('observe')}>Observe</button><button aria-pressed={prefs.pin} onClick={()=>setPrefs(p=>({...p,pin:!p.pin}))}>{prefs.pin?'Controls pinned':'Pin controls'}</button><button onClick={()=>{close(false);(document.activeElement as HTMLElement)?.blur?.();chrome.enter()}}>Immersive</button>{mode==='sky'&&runtime.client?.capabilities.includes('nativeTools')?<button onClick={()=>{setMenu(false);void runtime.request('openNativeTools')}}>Sky view settings</button>:null}<button onClick={()=>open('diagnostics')}>Diagnostics</button><a href={mode==='sky'?selection?.link||skyStandalonePath(product,runtime.time.live):'/earth-runtime/'} target="_blank" rel="noreferrer">Open standalone {mode==='sky'?'Sky':'Earth'}</a></div>:null}
  {chrome.hidden?<button className="ws-reveal" onClick={chrome.reveal}><Icon name="maximize"/>Show controls<span>{mode==='sky'?'Sky':'Earth'}</span></button>:null}
  <div className="ws-edges" aria-hidden="true">{['top','right','bottom','left'].map(edge=><span key={edge} className={`ws-edge ws-edge--${edge}`} onPointerEnter={event=>{if(event.pointerType==='mouse')chrome.edgeReveal()}} onPointerLeave={chrome.cancelEdge}/>)}</div>
  {!mobile&&mode==='earth'&&runtime.client?.capabilities.includes('layers')?<LayerRail onLayers={()=>surface==='layers'?close():open('layers')} onHome={()=>void runtime.request('returnToOras',{},12000)} onNavigation={()=>open('navigation')}/>:null}
  {!mobile&&surface==='layers'?<div className="ws-layers ws-panel ws-chrome">{layers}</div>:null}
  {!mobile&&contextVisible&&!expanded&&surface!=='diagnostics'&&surface!=='time'&&(surface!=='layers'||window.innerWidth>=1200)?<aside className="ws-context ws-panel ws-chrome">{context}</aside>:null}
  {!mobile&&selection?<SelectionDrawer selection={selection} expanded={expanded} onExpand={()=>{setExpanded(x=>!x);setSurface(null)}} {...actions}/>:null}
  {!mobile&&surface==='navigation'?<div className="ws-layers ws-panel ws-chrome">{navigation}</div>:null}
  {!mobile&&surface==='time'?<div className="ws-time-editor ws-panel ws-chrome">{timeEditor}</div>:null}
  {!mobile&&surface==='diagnostics'?<aside className="ws-diagnostics ws-panel ws-chrome">{diagnostics}</aside>:null}
  {mobile&&!surface?<div className="ws-mobile-launchers ws-chrome">{mode==='earth'&&runtime.client?.capabilities.includes('layers')?<button data-ws-trigger="layers" onClick={()=>open('layers')}><Icon name="layers"/>Layers</button>:<span/>}<button data-ws-trigger="context" onClick={()=>{if(selection)setTab('selection');open('context')}}>{selection?'Selected object':'Tonight'}<Icon name="chevron-up"/></button></div>:null}
  {mobile&&surface?<BottomSheet title={surface==='context'&&selection?selection.name:undefined} name={surface==='layers'?'Earth layers':surface==='context'?'Workspace context':surface==='time'?'Time details':'Diagnostics'} snap={snap} layers={surface==='layers'} onSnap={setSnap} onClose={close}>{sheet}<button data-ws-trigger="sheet-time" className="ws-link" onClick={()=>open('time')}>Time</button>{mode==='earth'&&surface==='layers'?<button className="ws-link" onClick={()=>void runtime.request('returnToOras',{},12000)}>Return to ORAS</button>:null}</BottomSheet>:null}
  {(!mobile||!surface)?<TimeSurface mode={mode} time={runtime.time} isOras={observeContext.isOras} onOpen={()=>open('time')}/>:null}
  {runtime.notice?<div className="ws-notice ws-panel" role="status"><span>{runtime.notice}</span><IconButton icon="x" label="Dismiss message" onClick={()=>runtime.setNotice('')}/></div>:null}
  <div className="ws-selection-announcement ws-sr-only" role="status">{selection?`${selection.name}, ${selection.kind}, selected`:''}</div>
 </div>
}
