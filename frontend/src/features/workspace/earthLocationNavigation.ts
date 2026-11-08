import {validNavigationState}from'../../../../packages/runtime-protocol/navigation.mjs'
import type{NavigationState}from'../../../../packages/runtime-protocol/index.mjs'
import{earthTargetFromSearch,type EarthDestination}from'./earthSearch'
type Request=(command:string,payload?:unknown,deadline?:number)=>Promise<any>
export function earthHistoryView(state:unknown):NavigationState|null{
 const s=state as {r2Search?:boolean;n1View?:unknown}|null
 return s?.r2Search===true&&validNavigationState(s.n1View)&&s.n1View.mode==='earth'?s.n1View:null
}
export async function visitEarthLocation(target:EarthDestination,search:string,request:Request,isCurrent:()=>boolean){
 if(!Number.isFinite(target.lat)||!Number.isFinite(target.lon)||Math.abs(target.lat)>90||Math.abs(target.lon)>180)return null
 const saved=await request('getNavigationState',{},4000);if(!isCurrent())return null
 const before=validNavigationState(saved?.navigation)&&saved.navigation.mode==='earth'?saved.navigation:null
 const result=await request('navigateLocation',{lat:target.lat,lon:target.lon},12000);if(!isCurrent()||!result?.ok)return null
 const arrived=await request('getNavigationState',{},4000);if(!isCurrent()||!arrived?.ok||!validNavigationState(arrived.navigation)||arrived.navigation.mode!=='earth')return null
 const params=new URLSearchParams(search);params.set('earthLat',String(target.lat));params.set('earthLon',String(target.lon))
 return{before,after:arrived.navigation,search:'?'+params}
}

export function earthInitialTarget(search:string,state:unknown){
 const saved=(state as {n1View?:unknown}|null)?.n1View
 return validNavigationState(saved)&&saved.mode==='earth'?null:earthTargetFromSearch(search)
}
