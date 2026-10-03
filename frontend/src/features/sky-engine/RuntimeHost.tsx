import React,{useEffect,useRef,useState} from 'react'
import {useLocation,useNavigate} from 'react-router-dom'
import {connectRuntime,type RuntimeClient} from '../../../../packages/runtime-protocol/client.mjs'
import type {RuntimeMode} from '../../../../packages/runtime-protocol/index.mjs'
import {useRuntimeProductState} from '../runtime/productState'
import {probeRuntime,RuntimeProbeError} from '../runtime/runtimeProbeService'
export type RuntimeStatus='checking'|'loading'|'ready'|'error'
let disposal:Promise<void>=Promise.resolve()
export default function RuntimeHost({mode='sky',onClient,onStatus}:{mode?:RuntimeMode;onClient?:(client:RuntimeClient|null)=>void;onStatus?:(status:RuntimeStatus)=>void}){
 const container=useRef<HTMLDivElement>(null),location=useLocation(),navigate=useNavigate(),latest=useRef({location,onClient,onStatus});latest.current={location,onClient,onStatus}
 const [retry,setRetry]=useState(0),[status,setStatus]=useState<RuntimeStatus>('checking'),[mismatch,setMismatch]=useState(false);const [statusKey,setStatusKey]=useState('');const mountKey=`${mode}:${retry}`;const visibleStatus=statusKey===mountKey?status:'checking'
 useEffect(()=>{
  let cancelled=false,frame:HTMLIFrameElement|null=null,client:RuntimeClient|null=null
  const abort=new AbortController(),search=latest.current.location.search
  const product=useRuntimeProductState.getState();product.ingestSearch(search)
  const params=new URLSearchParams(search),live=!params.has('date')
  if(live)useRuntimeProductState.setState({requestedTime:new Date().toISOString()})
  const generation=product.activate(mode),bytes=crypto.getRandomValues(new Uint8Array(16)),nonce=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('')
  function update(value:RuntimeStatus){if(cancelled)return;setStatus(value);latest.current.onStatus?.(value)}
  setStatusKey(mountKey);update('checking');setMismatch(false)
  async function mount(){
   await disposal;if(cancelled)return
   try{
    await probeRuntime(mode,{signal:abort.signal});if(cancelled)return
    update('loading');frame=document.createElement('iframe');frame.title=mode==='sky'?'ORAS Sky-Engine Runtime':'ORAS Cesium Earth Runtime';frame.allowFullscreen=true
    params.set('orasEmbedded','1')
    const state=useRuntimeProductState.getState()
    // Standalone exact links and native science remain unchanged; the adapter restores canonical intent.
    frame.src=(mode==='sky'?'/oras-sky-engine/':'/earth-runtime/')+'?'+params;container.current?.append(frame)
    const connected=await connectRuntime(frame,{runtime:mode,nonce,generation},{signal:abort.signal})
    if(cancelled){connected.close();return}client=connected;state.negotiate(mode,client.capabilities)
    if(client.capabilities.includes('presentation'))await client.request('setPresentation',{embedded:true})
    if(cancelled)return
    if(client.capabilities.includes('timeIntent')){const result=await client.request('setTimeIntent',{utc:state.requestedTime,live},12000);if(cancelled)return;state.report(mode,{requestedTime:state.requestedTime,...result})}
    if(client.capabilities.includes('observerIntent')){await client.request('setObserverIntent',state.observer,12000);if(cancelled)return}
    update('ready');latest.current.onClient?.(client)
   }catch(cause){if(cancelled)return;client?.close();frame?.remove();setMismatch(cause instanceof RuntimeProbeError&&cause.code==='artifact-mismatch');update('error')}
  }
  void mount()
  return ()=>{
   cancelled=true;abort.abort();latest.current.onClient?.(null)
   const previous=client,previousFrame=frame
   disposal=disposal.then(async()=>{try{if(previous?.capabilities.includes('destroy'))await previous.request('destroy',{},1000)}catch{/* bounded removal releases a failed document */}finally{previous?.close();previousFrame?.remove()}})
  }
 },[mode,retry])
 const name=mode==='sky'?'Sky':'Earth'
 return <div className="ws-runtime" data-runtime-mode={mode} data-runtime-status={visibleStatus}><div className="ws-runtime-slot" ref={container}/>{visibleStatus!=='ready'?<section className="ws-runtime-state ws-panel" aria-label={`${name} availability`}><h2>{visibleStatus==='error'?mismatch?'This view needs an update':`${name} is unavailable`:visibleStatus==='checking'?`Checking ${name}`:`Opening ${name}`}</h2><p role="status">{visibleStatus==='error'?mismatch?'Reload to try the latest version.':`We couldn't open this view. Try again, or continue exploring ${mode==='sky'?'Earth':'Sky'}.`:'Preparing your view…'}</p>{visibleStatus==='error'?<div className="ws-actions"><button className="ws-primary" onClick={()=>mismatch?window.location.reload():setRetry(x=>x+1)}>{mismatch?'Reload':`Retry ${name}`}</button><button onClick={()=>navigate(mode==='sky'?'/earth':'/sky-engine')}>Open {mode==='sky'?'Earth':'Sky'}</button></div>:<div className="ws-loading-line"/>}</section>:null}</div>
}
