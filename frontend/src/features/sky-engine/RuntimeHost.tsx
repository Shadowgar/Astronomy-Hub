import React,{useEffect,useRef,useState} from 'react'
import {useLocation} from 'react-router-dom'
import {connectRuntime,type RuntimeClient} from '../../../../packages/runtime-protocol/client.mjs'
import type {RuntimeMode} from '../../../../packages/runtime-protocol/index.mjs'
import {useRuntimeProductState} from '../runtime/productState'
import {probeRuntime} from '../runtime/runtimeProbeService'
type Status='checking'|'loading'|'ready'|'error'
// The queue owns DOM lifetimes, never a renderer. Removal precedes the next mount.
let disposal:Promise<void>=Promise.resolve()
export default function RuntimeHost({mode='sky'}:{mode?:RuntimeMode}){
 const container=useRef<HTMLDivElement>(null),location=useLocation()
 const [retry,setRetry]=useState(0),[status,setStatus]=useState<Status>('checking'),[version,setVersion]=useState(''),[effective,setEffective]=useState(''),[error,setError]=useState('')
 const mountKey=JSON.stringify([mode,retry,location.search])
 const [statusKey,setStatusKey]=useState('')
 const visibleStatus=statusKey===mountKey?status:'checking'
 const url=(mode==='sky'?'/oras-sky-engine/':'/earth-runtime/')+location.search
 useEffect(()=>{
  let cancelled=false,frame:HTMLIFrameElement|null=null,client:RuntimeClient|null=null
  const abort=new AbortController()
  useRuntimeProductState.getState().ingestSearch(location.search)
  const generation=useRuntimeProductState.getState().activate(mode)
  const bytes=crypto.getRandomValues(new Uint8Array(16)),nonce=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('')
  setStatusKey(mountKey);setStatus('checking');setVersion('');setEffective('');setError('')
  async function mount(){
   await disposal;if(cancelled)return
   try{
    await probeRuntime(mode,{signal:abort.signal})
    if(cancelled)return
    setStatus('loading');frame=document.createElement('iframe');frame.title=mode==='sky'?'ORAS Sky-Engine Runtime':"ORAS Cesium Earth Runtime";frame.allowFullscreen=true
    const params=new URLSearchParams(location.search);params.set('orasEmbedded','1')
    if(mode==='sky'&&!params.has('catalog')){
     const selection=useRuntimeProductState.getState().selection
     if(selection)for(const field of ['catalog','source_id','model','ra','dec'] as const){const value=selection[field];if(value!==undefined)params.set(field,String(value))}
    }
    frame.src=(mode==='sky'?'/oras-sky-engine/':'/earth-runtime/')+'?'+params
    container.current?.append(frame)
    const connected=await connectRuntime(frame,{runtime:mode,nonce,generation},{signal:abort.signal})
    if(cancelled){connected.close();return}client=connected;setVersion(client.version)
    const state=useRuntimeProductState.getState()
    state.negotiate(mode,client.capabilities)
    const requested=state.requestedTime
    // Exact Sky links already carry engine-owned observer/time/selection intent.
    if(client.capabilities.includes('timeIntent')){
     const result=await client.request('setTimeIntent',{utc:requested});if(cancelled)return
     state.report(mode,{requestedTime:requested,...result});setEffective(result.ok?`${result.temporalMode}: ${result.effectiveTime}`:result.error||'Time unavailable')
    }
    if(client.capabilities.includes('observerIntent') && (mode==='earth' || !(new URLSearchParams(location.search).has('lat') && new URLSearchParams(location.search).has('lng')))){await client.request('setObserverIntent',state.observer);if(cancelled)return}
    setStatus('ready')
   }catch(cause){if(cancelled)return;client?.close();frame?.remove();setError(cause instanceof Error?cause.message:'Runtime initialization failed');setStatus('error')}
  }
  void mount()
  return ()=>{
   cancelled=true;abort.abort()
   const previous=client,previousFrame=frame
   // Bound graceful destroy. A document removal releases failed/nonresponsive engines.
   disposal=disposal.then(async()=>{try{if(previous?.capabilities.includes('destroy'))await previous.request('destroy',{},1000)}catch{/* removal is the final teardown */}finally{previous?.close();previousFrame?.remove()}})
  }
 },[mode,retry,location.search])
 const name=mode==='sky'?'Sky':'Earth'
 return <div className="oras-runtime-host" data-runtime-mode={mode} data-runtime-status={visibleStatus}>
  <h1 className="oras-sky-title">{mode==='sky'?'Interactive sky':"Earth"}</h1>
  <div className="oras-runtime-slot" ref={container}/>
  {visibleStatus!=='ready'&&<section className="oras-runtime-message oras-runtime-overlay" aria-label={`${name} availability`}>
   <h2>{visibleStatus==='error'?`${name} is unavailable`:`Opening ${name}…`}</h2><p role="status">{visibleStatus==='error'?error:visibleStatus==='checking'?'Checking the runtime.':'Starting the renderer.'}</p>
   <div className="oras-actions"><button className="oras-button" onClick={()=>setRetry(x=>x+1)} disabled={visibleStatus!=='error'}>Retry {name}</button><a className="oras-text-link" href={url} target="_blank" rel="noreferrer">Open {name} in a new tab ↗</a></div>
  </section>}
  {visibleStatus==='ready'&&<details className="oras-runtime-diagnostics"><summary>Runtime details</summary><p>{version}</p><p>Protocol 1.0 · {effective}</p><a href="/runtime-versions.json" target="_blank" rel="noreferrer">Artifact and source provenance</a>{mode==='earth'&&<p>Earth receives requested time. Live providers report their own temporal limits.</p>}</details>}
 </div>
}
