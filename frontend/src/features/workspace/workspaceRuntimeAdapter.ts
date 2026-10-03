import {useEffect,useState,useRef,useCallback} from 'react'
import type {RuntimeClient} from '../../../../packages/runtime-protocol/client.mjs'
import type {RuntimeMode,WorkspaceSnapshot} from '../../../../packages/runtime-protocol/index.mjs'
import {useRuntimeProductState,parseSceneDate,type CanonicalEntity} from '../runtime/productState'
import type {TimeState} from './TimeSurface'
const selectionKey=(value:CanonicalEntity|null)=>value?JSON.stringify([value.catalog,value.source_id,value.model,value.ra??null,value.dec??null]):null
const observerKey=(value:{lat:number;lon:number;elevationM:number})=>JSON.stringify([value.lat,value.lon,value.elevationM])
export const EMPTY_SNAPSHOT:WorkspaceSnapshot={selection:null,layers:[],tracking:false}
export function useWorkspaceRuntime(mode:RuntimeMode,search:string,onInteraction:(active:boolean,focused:boolean)=>void,onKey:(key:string)=>void){
 const [session,setSession]=useState<{mode:RuntimeMode;client:RuntimeClient}|null>(null),[snapshot,setSnapshot]=useState(EMPTY_SNAPSHOT),[notice,setNotice]=useState('');const current=useRef<RuntimeClient|null>(null),interact=useRef(onInteraction);interact.current=onInteraction;const keyboard=useRef(onKey);keyboard.current=onKey
 const acknowledged=useRef({observer:'',selection:null as string|null}),lastQuery=useRef({client:null as RuntimeClient|null,selection:null as string|null})
 const client=session?.mode===mode?session.client:null
 const params=new URLSearchParams(search),[time,setTime]=useState<TimeState>({requested:parseSceneDate(params.get('date'))||new Date().toISOString(),effective:null,live:parseSceneDate(params.get('date'))===null,pending:false,error:false})
 const acceptClient=useCallback((value:RuntimeClient|null)=>{current.current=value;acknowledged.current={observer:observerKey(useRuntimeProductState.getState().observer),selection:null};lastQuery.current={client:null,selection:null};setSession(value?{mode,client:value}:null);setSnapshot(EMPTY_SNAPSHOT)},[mode])
 const request=useCallback(async(command:string,payload:unknown={},deadline=4000)=>{const active=current.current;if(!active)return null;try{const result=await active.request(command,payload,deadline);if(active!==current.current)return null;if(!result.ok)setNotice(command==='focusSelection'?"Couldn't center this object. Use Focus to try again.":result.error||'Action unavailable');else{if(command==='selectEntity')acknowledged.current.selection=selectionKey(payload as CanonicalEntity);else if(command==='clearSelection')acknowledged.current.selection=null;else if(command==='setObserverIntent')acknowledged.current.observer=observerKey(payload as {lat:number;lon:number;elevationM:number});setNotice('');if(result.state)setSnapshot(result.state)};return result}catch{if(active===current.current)setNotice(command==='focusSelection'?"Couldn't center this object. Use Focus to try again.":'The action did not complete. Please try again.');return null}},[])
 useEffect(()=>{if(!client)return;setNotice('');let closed=false,running=false;const unsubscribe=client.subscribe((_name,payload)=>{interact.current(payload.active,payload.focused);if(payload.key)keyboard.current(payload.key)});const poll=async()=>{if(running||closed||!client.capabilities.includes('workspaceState'))return;running=true;try{const result=await client.request('getWorkspaceState');if(!closed&&current.current===client&&result.state)setSnapshot(result.state)}catch{/* renderer lifecycle handles failure; keep last known state */}finally{running=false}};void poll();const timer=setInterval(()=>void poll(),1000);return ()=>{closed=true;clearInterval(timer);unsubscribe()}},[client])
 useEffect(()=>{
  if(!client)return;let cancelled=false;const p=new URLSearchParams(search)
  useRuntimeProductState.getState().ingestSearch(search);const product=useRuntimeProductState.getState()
  const entity=product.selection,queryEntity=entity&&entity.catalog===p.get('catalog')&&entity.source_id===p.get('source_id')&&entity.model===p.get('model')?entity:null,key=selectionKey(queryEntity)
  const previous=lastQuery.current,changed=previous.client===client&&previous.selection!==key;lastQuery.current={client,selection:key}
  const live=parseSceneDate(p.get('date'))===null,utc=live?new Date().toISOString():product.requestedTime
  setTime(t=>({...t,requested:utc,live,pending:true}))
  void(async()=>{
   const result=await request('setTimeIntent',{utc,live},12000);if(cancelled)return
   setTime(t=>({...t,pending:false,error:!result?.ok,effective:result?.ok?result.effectiveTime||null:t.effective}));if(!result?.ok)return;product.report(mode,result)
   if(acknowledged.current.observer!==observerKey(product.observer)){
    const observer=await request('setObserverIntent',product.observer,12000);if(cancelled||!observer?.ok)return
   }
   if(mode==='sky'&&changed){
    if(queryEntity&&acknowledged.current.selection!==key)await request('selectEntity',queryEntity,25000)
    else if(!queryEntity&&acknowledged.current.selection!==null){const cleared=await request('clearSelection');if(!cancelled&&cleared?.ok)useRuntimeProductState.setState({selection:null})}
   }
  })();return ()=>{cancelled=true}
 },[client,mode,search,request])
 return {client,acceptClient,snapshot,setSnapshot,request,time,setTime,notice,setNotice}
}
