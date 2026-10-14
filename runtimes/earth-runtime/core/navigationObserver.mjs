// ORAS is the only qualified observer height in the admitted ellipsoid runtime.
// Cached globe/mesh heights and camera altitude do not establish observer datum.
export function surfaceObserver(lat,lon,site){
 // Native space-view picking has sub-metre numeric error. A ~1 m site radius
 // preserves qualified site height without snapping or fabricating coordinates.
 const verified=Math.abs(lat-site.lat)<1e-5&&Math.abs(lon-site.lon)<1e-5;
 return {observer:{lat,lon,elevationM:verified?site.elevationM:0},elevationSource:verified?'oras-site':'unavailable-zero'};
}
