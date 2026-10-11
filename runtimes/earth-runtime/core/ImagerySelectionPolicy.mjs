// Policy selects IDs; the pinned MapSourceController owns provider switching.
export const CONUS=Object.freeze([-125,24,-66,50]);
const degrees=([x,y])=>[x/6378137*180/Math.PI,(2*Math.atan(Math.exp(y/6378137))-Math.PI/2)*180/Math.PI];
// Interior rectangle of the exact ORAS raster footprint (OBJECTID 6697),
// qualified with one bounded geometry response; not all PA.
export const PEMA_COVERAGE=Object.freeze([-79.6009,41.3051,-79.5654,41.3319]);
export const ORAS_NAIP_RING=Object.freeze([[-8856589.0063,5058592.1862],[-8856596.1252,5058161.5343],[-8864230.0484,5058285.6545],[-8864073.8536,5068195.8694],[-8856432.1256,5068071.3311]].map(degrees));
export function contains(rect,point){return !!rect&&!!point&&rect[0]<=point[0]&&point[0]<=rect[2]&&rect[1]<=point[1]&&point[1]<=rect[3];}
export function containsView(bounds,rect){return !!rect&&rect[0]<=rect[2]&&contains(bounds,rect.slice(0,2))&&contains(bounds,rect.slice(2));}
export function inRing(point,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function chooseImagery(view,previous='nasa'){
 if(!view.rect||!containsView([-180,-85.051129,180,85.051129],view.rect))return 'nasa';
 if(view.height> (previous==='nasa'?1.5e6:2e6))return 'nasa';
 if(view.height<(previous==='pema'?30000:20000)&&containsView(PEMA_COVERAGE,view.rect))return 'pema';
 if(view.height<(previous==='usgs-naip'?250000:150000)&&containsView(CONUS,view.rect)&&view.naipCovered)return 'usgs-naip';
 return 'eox-2016';
}
