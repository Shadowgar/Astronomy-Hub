import {create} from 'zustand'
import site from '../../config/orasSite.json'
import type {RuntimeMode,ObserverIntent} from '../../../../packages/runtime-protocol/index.mjs'
export type CanonicalEntity={catalog:string;source_id:string;model:string;ra?:number;dec?:number}
type State={mode:RuntimeMode|null;generation:number;requestedTime:string;observer:ObserverIntent;selection:CanonicalEntity|null;viewportPolicy:'serial';capabilities:Partial<Record<RuntimeMode,string[]>>;effective:Record<string,unknown>;activate:(mode:RuntimeMode)=>number;ingestSearch:(search:string)=>void;report:(mode:RuntimeMode,data:unknown)=>void;negotiate:(mode:RuntimeMode,caps:string[])=>void}
export const useRuntimeProductState=create<State>((set,get)=>({mode:null,generation:0,requestedTime:new Date().toISOString(),observer:{lat:site.latitude,lon:site.longitude,elevationM:site.elevationMeters},selection:null,viewportPolicy:'serial',capabilities:{},effective:{},activate(mode){const generation=get().generation+1;set({mode,generation});return generation},ingestSearch(search){
 const params=new URLSearchParams(search),update:Partial<State>={};const date=params.get('date');if(date&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().slice(0,19)===date.slice(0,19))update.requestedTime=new Date(date).toISOString()
 const lat=params.get('lat'),lon=params.get('lng'),elev=params.get('elev');if(lat!==null&&lat.trim()!==''&&lon!==null&&lon.trim()!==''&&elev!==null&&elev.trim()!==''&&Number.isFinite(Number(lat))&&Math.abs(Number(lat))<=90&&Number.isFinite(Number(lon))&&Math.abs(Number(lon))<=180){const elevationM=Number(elev);if(Number.isFinite(elevationM)&&elevationM>=-1000&&elevationM<=100000)update.observer={lat:Number(lat),lon:Number(lon),elevationM}}
 const catalog=params.get('catalog'),source_id=params.get('source_id'),model=params.get('model');if(catalog&&source_id&&model&&[catalog,source_id,model].every(x=>x.length<=256)){const selection:CanonicalEntity={catalog,source_id,model};const ra=params.get('ra'),dec=params.get('dec');if(ra!==null&&ra.trim()!==''&&Number.isFinite(Number(ra))&&Number(ra)>=0&&Number(ra)<360)selection.ra=Number(ra);if(dec!==null&&dec.trim()!==''&&Number.isFinite(Number(dec))&&Math.abs(Number(dec))<=90)selection.dec=Number(dec);update.selection=selection}set(update)
 },report(mode,data){set({effective:{...get().effective,[mode]:data}})},negotiate(mode,caps){set({capabilities:{...get().capabilities,[mode]:caps}})}}))
// Persist only bounded serializable intent across reloads; never sessions or engines.
const intentKey='oras.runtime.intent.v1'
if(typeof window!=='undefined'){
 try{const saved=window.sessionStorage.getItem(intentKey);if(saved&&saved.length<=2048)useRuntimeProductState.getState().ingestSearch(saved)}catch{/* storage may be unavailable */}
 useRuntimeProductState.subscribe(state=>{
  const params=new URLSearchParams({date:state.requestedTime,lat:String(state.observer.lat),lng:String(state.observer.lon),elev:String(state.observer.elevationM)})
  if(state.selection){for(const field of ['catalog','source_id','model','ra','dec'] as const){const value=state.selection[field];if(value!==undefined)params.set(field,String(value))}}
  const serialized=params.toString();if(serialized.length<=2048)try{window.sessionStorage.setItem(intentKey,serialized)}catch{/* in-memory intent still works */}
 })
}
