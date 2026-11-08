import {validNavigationState} from '../../../../packages/runtime-protocol/navigation.mjs'
import type {NavigationState,RuntimeMode,ObserverIntent,ElevationSource} from '../../../../packages/runtime-protocol/index.mjs'
import type {CanonicalEntity} from '../runtime/productState'
import {handoffPath,handoffView} from '../workspace/viewNavigation'
import site from '../../config/orasSite.json'
import {observerElevationSource} from '../../../../packages/runtime-protocol/observer-elevation.mjs'
import {solarReturnPath} from './solarContracts'

/** Reuse the native handoff contract; a Sky camera cannot restore an Earth view. */
export function solarExit(path:string,epoch:string,state:Record<string,unknown>|undefined,views:Partial<Record<RuntimeMode,NavigationState>>,selection:CanonicalEntity|null,mobile:boolean,fallbackObserver?:ObserverIntent&{elevationSource?:ElevationSource}){
 const safePath=solarReturnPath(path,epoch),target:RuntimeMode=safePath.startsWith('/earth')?'earth':'sky',saved=state?.n1View
 const validSaved=validNavigationState(saved)
 if(!validSaved&&!fallbackObserver)return{path:safePath,state}
 const observer=fallbackObserver&&{lat:fallbackObserver.lat,lon:fallbackObserver.lon,elevationM:fallbackObserver.elevationM}
 const source=validSaved?{...saved,utc:epoch,live:false} as NavigationState:{mode:'sky',observer:observer!,utc:epoch,live:false,elevationSource:observerElevationSource(observer!,fallbackObserver?.elevationSource,{lat:site.latitude,lon:site.longitude,elevationM:site.elevationMeters}),camera:{projection:2,fovRad:2*Math.PI/3,yawRad:0,pitchRad:Math.PI/6,rollRad:0,landscapeVisible:true}} as NavigationState
 const same=validSaved&&source.mode===target,view=same?source:handoffView(target,source,views,mobile)
 return{path:handoffPath(target,new URL(safePath,'http://local').search,source,selection),state:{...(same?state:{}),n1View:view,n1Center:!same&&target==='earth'}}
}
