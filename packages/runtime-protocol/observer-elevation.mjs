// Provenance describes the actual geographic observer, never the viewing camera.
export function sameObserverLocation(a,b){return !!a&&!!b&&Math.abs(a.lat-b.lat)<1e-5&&Math.abs(a.lon-b.lon)<1e-5;}
export function observerElevationSource(observer,claimed,site,missingElevation=false){
 if(sameObserverLocation(observer,site)&&Math.abs(observer.elevationM-site.elevationM)<1e-6)return 'oras-site';
 if(observer.elevationM===0&&(claimed==='unavailable-zero'||missingElevation))return 'unavailable-zero';
 return 'provided';
}
