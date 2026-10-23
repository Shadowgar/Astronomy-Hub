import{useCallback,useEffect,useRef}from'react'
import{useLocation,useNavigate}from'react-router-dom'
import type{RuntimeClient}from'../../../../packages/runtime-protocol/client.mjs'
import type{RuntimeResult,RuntimeMode}from'../../../../packages/runtime-protocol/index.mjs'
import type{RuntimeStatus}from'../sky-engine/RuntimeHost'
import{earthHistoryView,visitEarthLocation,earthInitialTarget}from'./earthLocationNavigation'
import type{EarthDestination}from'./earthSearch'
export function useEarthLocation(mode:RuntimeMode,status:RuntimeStatus,client:RuntimeClient|null,request:(command:string,payload?:unknown,deadline?:number,expectedClient?:RuntimeClient)=>Promise<RuntimeResult|null>,notice:(value:string)=>void){
 const location=useLocation(),navigate=useNavigate(),latest=useRef({mode,status,client,location}),pending=useRef(false)
 latest.current={mode,status,client,location}
 // Search identity is separate from the current camera center and observer.
 useEffect(()=>{if(mode!=='earth'||status!=='ready'||!client?.capabilities.includes('locationContext'))return
  const p=location.state?.r2Place,t=earthInitialTarget(location.search,null)
  const point=p&&Number.isFinite(p.lat)&&Math.abs(p.lat)<=90&&Number.isFinite(p.lon)&&Math.abs(p.lon)<=180?{lat:p.lat,lon:p.lon}:t
  void request('setSearchLocation',{location:point??null},4000,client)
 },[mode,status,client,location.key,request])
 // Same-document Back/Forward must restore its own bounded bookmark. Initial
 // restoration still uses the qualified host; ordinary wheel/pan never writes URL.
 useEffect(()=>{if(mode!=='earth'||status!=='ready'||!client)return;let cancelled=false;const saved=earthHistoryView(location.state),target=earthInitialTarget(location.search,location.state)
  if(saved)void request('setNavigationView',{mode:'earth',camera:saved.camera},4000,client).then(r=>{if(!cancelled&&!r?.ok)notice('This Earth view could not be restored. Search or enter coordinates to continue.')})
  else if(target)void request('navigateLocation',target,12000,client).then(r=>{if(!cancelled&&!r?.ok)notice('The saved location could not be reached. Try the search again.')})
  return()=>{cancelled=true}
 },[mode,status,client,location.key,request,notice])
 return useCallback(async(target:EarthDestination)=>{
  const from=latest.current;if(from.mode!=='earth'||from.status!=='ready'||!from.client||pending.current)return false
  pending.current=true
  const current=()=>{const next=latest.current;return next.mode==='earth'&&next.client===from.client&&next.location.key===from.location.key}
  try{
   const result=await visitEarthLocation(target,from.location.search,(command,payload,deadline)=>request(command,payload,deadline,from.client!),current)
   if(!result||!current())return false
   if(result.before)navigate(from.location.pathname+from.location.search,{replace:true,state:{...from.location.state,n1View:result.before,r2Search:true}})
   const label={name:target.name?.slice(0,240)||'Coordinates',description:target.description?.slice(0,1000)||'',source:target.source?.slice(0,80)||'Coordinates you entered',lat:target.lat,lon:target.lon}
   navigate('/earth'+result.search,{state:{n1View:result.after,r2Search:true,r2Place:label}})
   return true
  }catch{return false}finally{pending.current=false}
 },[navigate,request])
}
