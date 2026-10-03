import {parseSceneDate,type CanonicalEntity} from '../runtime/productState'
import type {RuntimeMode,ObserverIntent} from '../../../../packages/runtime-protocol/index.mjs'
export function workspaceModePath(mode:RuntimeMode,search:string){
 const params=new URLSearchParams(search),date=parseSceneDate(params.get('date'))
 if(date)params.set('date',date);else params.delete('date')
 if(mode==='earth')for(const key of ['catalog','source_id','model','ra','dec','fov'])params.delete(key)
 return (mode==='sky'?'/sky-engine':'/earth')+(params.size?'?'+params:'')
}
export function skyStandalonePath(intent:{requestedTime:string;observer:ObserverIntent;selection:CanonicalEntity|null},live:boolean){
 const params=new URLSearchParams({lat:String(intent.observer.lat),lng:String(intent.observer.lon),elev:String(intent.observer.elevationM)})
 const date=parseSceneDate(intent.requestedTime);if(!live&&date)params.set('date',date)
 if(intent.selection)for(const key of ['catalog','source_id','model','ra','dec'] as const){const value=intent.selection[key];if(value!==undefined)params.set(key,String(value))}
 return '/oras-sky-engine/'+(intent.selection?'skysource/'+encodeURIComponent(intent.selection.source_id):'')+'?'+params
}
