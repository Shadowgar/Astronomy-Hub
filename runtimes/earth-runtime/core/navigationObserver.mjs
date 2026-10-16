import {sameObserverLocation,observerElevationSource} from '../../../packages/runtime-protocol/observer-elevation.mjs';
// Only a qualified site or the same explicitly provided observer carries height.
// Moving to a new surface target never derives elevation from camera altitude.
export function surfaceObserver(lat,lon,site,known){
 const target={lat,lon};
 if(known&&sameObserverLocation(target,known.observer)){
  const observer={...target,elevationM:known.observer.elevationM};
  return {observer,elevationSource:observerElevationSource(observer,known.elevationSource,site)};
 }
 if(sameObserverLocation(target,site))return {observer:{...target,elevationM:site.elevationM},elevationSource:'oras-site'};
 return {observer:{...target,elevationM:0},elevationSource:'unavailable-zero'};
}
