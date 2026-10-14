import type {NavigationState,RuntimeMode} from '../../../../packages/runtime-protocol/index.mjs'
import {workspaceModePath} from './workspaceNavigation'
import type {CanonicalEntity} from '../runtime/productState'
export function handoffPath(target:RuntimeMode,search:string,source:NavigationState,selection:CanonicalEntity|null){
 const p=new URLSearchParams(search);for(const key of ['focus','fov','az','alt'])p.delete(key)
 p.set('lat',String(source.observer.lat));p.set('lng',String(source.observer.lon));p.set('elev',String(source.observer.elevationM));p.set('elevationSource',source.elevationSource)
 if(source.live)p.delete('date');else p.set('date',source.utc)
 if(target==='sky'&&selection)for(const key of ['catalog','source_id','model','ra','dec'] as const){const value=selection[key];if(value!==undefined)p.set(key,String(value))}
 return workspaceModePath(target,'?'+p)
}
export function handoffView(target:RuntimeMode,source:NavigationState,views:Partial<Record<RuntimeMode,NavigationState>>,mobile:boolean):NavigationState{
 const common={observer:source.observer,utc:source.utc,live:source.live,elevationSource:source.elevationSource}
 if(target==='earth')return {mode:'earth',...common,camera:{latitudeRad:source.observer.lat*Math.PI/180,longitudeRad:source.observer.lon*Math.PI/180,heightM:(mobile?16000000:22000000)-6378137,headingRad:views.earth?.mode==='earth'?views.earth.camera.headingRad:0,pitchRad:-Math.PI/2,rollRad:0}}
 const saved=views.sky,atSameObserver=saved&&Math.abs(saved.observer.lat-source.observer.lat)<1e-5&&Math.abs(saved.observer.lon-source.observer.lon)<1e-5
 return {mode:'sky',...common,camera:atSameObserver&&saved.mode==='sky'?saved.camera:{projection:2,fovRad:120*Math.PI/180,yawRad:0,pitchRad:30*Math.PI/180,rollRad:0,landscapeVisible:saved?.mode==='sky'?saved.camera.landscapeVisible:true}}
}
