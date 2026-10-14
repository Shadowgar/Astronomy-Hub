import React,{useEffect,useRef,useState} from 'react'
import {Icon,IconButton} from './primitives'
import {ORAS_SITE} from '../../config/orasSite'
import type {ObserverIntent} from '../../../../packages/runtime-protocol/index.mjs'

export type ObserverDraft={lat:string;lon:string;elevationM:string}
export const observerDraft=(value:ObserverIntent):ObserverDraft=>({lat:String(value.lat),lon:String(value.lon),elevationM:String(value.elevationM)})
export function parseObserverDraft(draft:ObserverDraft):ObserverIntent|null{
 const result={} as ObserverIntent
 for(const [key,min,max] of [['lat',-90,90],['lon',-180,180],['elevationM',-1000,100000]] as const){
  const text=draft[key].trim()
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(text))return null
  const value=Number(text);if(!Number.isFinite(value)||value<min||value>max)return null
  result[key]=value
 }
 return result
}

export default function AdaptiveSkyChrome({onEarth,onContext,onMenu,observer,onObserver,busy}:{onEarth:()=>void;onContext:(tab:'tonight'|'observe')=>void;onMenu:()=>void;observer:ObserverIntent;onObserver:(value:ObserverIntent)=>Promise<boolean>;busy:boolean}){
 const dialog=useRef<HTMLDialogElement>(null),launcher=useRef<HTMLElement|null>(null)
 const [surface,setSurface]=useState<'explore'|'location'>('explore'),[draft,setDraft]=useState(()=>observerDraft(observer)),[pending,setPending]=useState(false),[error,setError]=useState('')
 const isOras=observer.lat===ORAS_SITE.latitude&&observer.lon===ORAS_SITE.longitude
 const close=()=>dialog.current?.close()
 const open=(next:typeof surface,event:React.MouseEvent<HTMLButtonElement>)=>{launcher.current=event.currentTarget;setSurface(next);setDraft(observerDraft(observer));setError('');dialog.current?.showModal()}
 useEffect(()=>{const node=dialog.current;if(!node)return;const restore=()=>{const target=launcher.current;launcher.current=null;if(target?.isConnected)target.focus()};node.addEventListener('close',restore);return ()=>node.removeEventListener('close',restore)},[])
 const submit=async(event:React.FormEvent)=>{event.preventDefault();const parsed=parseObserverDraft(draft);if(!parsed){setError('Enter a valid latitude (−90 to 90), longitude (−180 to 180) and elevation (−1000 to 100000 m).');return}setError('');setPending(true);try{if(await onObserver(parsed))close();else setError('The observing location could not be applied. Please try again.')}finally{setPending(false)}}
 return <>
  <header className="as-header">
   <a href="/" className="as-identity ws-panel" aria-label="Astronomy Hub · Sky View"><Icon name="eye"/><span><small>ASTRONOMY HUB</small><strong>Sky View</strong></span></a>
   <button className="as-explore ws-panel" aria-label="Explore" onClick={event=>open('explore',event)}><Icon name="navigation"/>Explore</button>
  </header>
  <button className="as-location ws-panel" aria-label="Observing location" disabled={busy} onClick={event=>open('location',event)}><Icon name="map-pin"/><span><small>OBSERVING LOCATION</small><span>{isOras?'ORAS · Pennsylvania':`${observer.lat.toFixed(3)}°, ${observer.lon.toFixed(3)}°`}</span></span></button>
  <button className="as-options ws-panel" aria-label="More Sky options" data-ws-trigger="menu" onClick={onMenu}><Icon name="ellipsis"/></button>
  <dialog className="as-dialog ws-panel" ref={dialog} aria-labelledby="as-dialog-title">
   <div className="ws-panel-heading"><div><small className="ws-eyebrow">{surface==='explore'?'Your universe':'Sky'}</small><h2 id="as-dialog-title">{surface==='explore'?'Explore':'Observing location'}</h2></div><IconButton icon="x" label="Close dialog" onClick={close}/></div>
   {surface==='explore'?<div className="as-destinations">
    <button onClick={close}><Icon name="eye"/><span>Sky View<small>Your observing sky · current view</small></span></button>
    <button onClick={()=>{close();onEarth()}}><Icon name="globe"/><span>Earth<small>Explore our planet</small></span></button>
    <button disabled><Icon name="globe"/><span>Solar System<small>Not yet available</small></span></button>
    <button disabled><Icon name="moon"/><span>Moon<small>Surface exploration not yet available</small></span></button>
    <div className="ws-actions"><button onClick={()=>{close();onContext('tonight')}}>Tonight</button><button onClick={()=>{close();onContext('observe')}}>Observe</button></div>
   </div>:<form noValidate onSubmit={event=>void submit(event)}>
    <p>The observing position controls your local sky.</p>
    {([['lat','Latitude',-90,90],['lon','Longitude',-180,180],['elevationM','Elevation (m)',-1000,100000]] as const).map(([key,label])=><label key={key}>{label}<input type="text" inputMode="decimal" required value={draft[key]} onChange={event=>setDraft(value=>({...value,[key]:event.target.value}))}/></label>)}
    <div className="ws-actions"><button type="button" onClick={()=>setDraft(observerDraft({lat:ORAS_SITE.latitude,lon:ORAS_SITE.longitude,elevationM:ORAS_SITE.elevationMeters}))}>ORAS</button><button className="ws-primary" disabled={pending} type="submit">{pending?'Applying…':'Apply location'}</button></div>
    {error?<p role="alert">{error}</p>:null}
   </form>}
  </dialog>
 </>
}
