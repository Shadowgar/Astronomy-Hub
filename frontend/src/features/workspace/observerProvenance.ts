import site from '../../config/orasSite.json'
import type {ObserverIntent,ElevationSource} from '../../../../packages/runtime-protocol/index.mjs'
import {observerElevationSource,sameObserverLocation} from '../../../../packages/runtime-protocol/observer-elevation.mjs'
export const siteObserver={lat:site.latitude,lon:site.longitude,elevationM:site.elevationMeters}
export function observerWithProvenance(observer:ObserverIntent&{elevationSource?:ElevationSource},search:string){
 const p=new URLSearchParams(search),elev=p.get('elev'),lat=p.get('lat'),lon=p.get('lng')
 const urlLocation=lat!==null&&lat.trim()!==''&&lon!==null&&lon.trim()!==''?{lat:Number(lat),lon:Number(lon)}:null
 const bound=sameObserverLocation(observer,urlLocation),missing=(elev===null||elev.trim()==='')&&bound
 return {...observer,elevationSource:observerElevationSource(observer,bound?p.get('elevationSource'):observer.elevationSource,siteObserver,missing)}
}
