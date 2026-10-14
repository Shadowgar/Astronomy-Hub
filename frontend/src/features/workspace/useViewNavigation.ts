import {useState,useRef,useEffect,useCallback} from 'react'
import {useLocation,useNavigate} from 'react-router-dom'
import type {RuntimeClient} from '../../../../packages/runtime-protocol/client.mjs'
import type {RuntimeMode,RuntimeResult,NavigationIntent,ElevationSource} from '../../../../packages/runtime-protocol/index.mjs'
import {validNavigationState} from '../../../../packages/runtime-protocol/navigation.mjs'
import {useRuntimeProductState} from '../runtime/productState'
import {handoffPath,handoffView} from './viewNavigation'
import type {RuntimeStatus} from '../sky-engine/RuntimeHost'
type Handoff={id:number;target:RuntimeMode;departed:boolean;sourceKey:string;lat?:number;lon?:number;elevationSource?:string}
export function useViewNavigation(mode:RuntimeMode,status:RuntimeStatus,client:RuntimeClient|null,request:(command:string,payload?:unknown,deadline?:number,expectedClient?:RuntimeClient)=>Promise<RuntimeResult|null>,notice:(value:string)=>void,mobile:boolean){
 const location=useLocation(),navigate=useNavigate(),[handoff,setHandoff]=useState<Handoff|null>(null),[boundary,setBoundary]=useState<NavigationIntent|null>(null),pending=useRef<Handoff|null>(null),sequence=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|null>(null)
 const latest=useRef({mode,status,client,location});latest.current={mode,status,client,location}
 const cancel=useCallback(()=>{const active=pending.current;if(!active)return;pending.current=null;setHandoff(null);setBoundary(null);if(timer.current)clearTimeout(timer.current);timer.current=null;if(active.departed)navigate(-1);else void request('resetNavigation');},[navigate,request])
 const enter=useCallback(async(target:RuntimeMode)=>{
  const from=latest.current;if(target===from.mode||pending.current||from.status!=='ready')return
  if(!from.client?.capabilities.includes('viewNavigation')){notice('Navigation is unavailable in this runtime.');return}
  const active:Handoff={id:++sequence.current,target,departed:false,sourceKey:from.location.key};pending.current=active;setHandoff(active);setBoundary(null)
  const result=await request('getNavigationState',{},4000,from.client)
  if(pending.current!==active)return
  if(latest.current.client!==from.client){pending.current=null;setHandoff(null);return}
  if(!result?.ok||!validNavigationState(result.navigation)){pending.current=null;setHandoff(null);notice(result?.error||'The view could not be saved. Please try again.');void request('resetNavigation');return}
  const declaredElevation=new URLSearchParams(from.location.search).get('elevationSource')
  const source={...result.navigation,...(from.mode==='sky'&&['provided','unavailable-zero','oras-site'].includes(declaredElevation||'')?{elevationSource:declaredElevation as ElevationSource}:{})},product=useRuntimeProductState.getState(),views={...product.views,[source.mode]:source}
  Object.assign(active,{lat:source.observer.lat,lon:source.observer.lon,elevationSource:source.elevationSource});setHandoff({...active})
  // Fade the outgoing view before the serial host destroys it. Reduced motion is immediate.
  timer.current=setTimeout(()=>{
   timer.current=null;if(pending.current!==active||latest.current.client!==from.client)return
   const sourcePath=handoffPath(source.mode,from.location.search,source,product.selection),view=handoffView(target,source,views,mobile)
   useRuntimeProductState.setState({views,observer:source.observer,requestedTime:source.utc,pendingFocus:null})
   navigate(sourcePath,{replace:true,state:{...from.location.state,n1View:source,n1Center:false}})
   active.departed=true
   navigate(handoffPath(target,from.location.search,source,product.selection),{state:{n1View:view,n1Center:target==='earth',n1Transfer:active.id}})
  },matchMedia('(prefers-reduced-motion: reduce)').matches?0:200)
 },[request,navigate,notice,mobile])
 useEffect(()=>{if(!client)return;return client.subscribe((name,payload)=>{
  if(name==='navigationIntent'&&'target' in payload){if(payload.phase==='request')void enter(payload.target);else if(!pending.current)setBoundary(payload.phase==='idle'?null:payload)}
  if(name==='interaction'&&'key' in payload&&payload.key==='Escape')cancel()
 })},[client,enter,cancel])
 useEffect(()=>{const active=pending.current;if(!active)return;if(!active.departed){if(location.key!==active.sourceKey)cancel();return}if(location.state?.n1Transfer!==active.id){pending.current=null;setHandoff(null);setBoundary(null)}else if(mode===active.target&&status==='ready'&&client){pending.current=null;setHandoff(null);setBoundary(null)}},[location.key,location.state,mode,status,client,cancel])
 useEffect(()=>{setBoundary(null)},[mode])
 useEffect(()=>()=>{pending.current=null;if(timer.current)clearTimeout(timer.current)},[])
 return {enter,cancel,handoff,boundary}
}
