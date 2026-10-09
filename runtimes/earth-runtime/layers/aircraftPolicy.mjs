/** B-first acquisition and admission policy; no provider or renderer side effects. */
import {admitAircraft,validPoint} from './data.mjs';
export const AIRCRAFT_RADIUS_M=100*1852;
export function regionPoint(point){return {lat:Math.round(point.lat*10)/10,lon:Math.round(point.lon*10)/10};}
export function regionKey(point){return `${point.lat.toFixed(1)},${point.lon.toFixed(1)}`;}
export function distanceM(a,b){
 const r=Math.PI/180,lat=(b.lat-a.lat)*r,lon=(b.lon-a.lon)*r;
 const h=Math.sin(lat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(lon/2)**2;
 return 6371008.8*2*Math.asin(Math.sqrt(Math.min(1,h)));
}
export function regionalAircraft(snapshot,point,now=Date.now()){
 const valid=admitAircraft(snapshot,now),unique=new Map();let outside=0,duplicates=0;
 for(const row of valid){if(distanceM(point,{lat:row[6],lon:row[5]})>AIRCRAFT_RADIUS_M){outside++;continue}
  const id=row[0].toLowerCase(),previous=unique.get(id);if(previous){duplicates++;if(previous[3]>=row[3])continue}unique.set(id,row);
 }
 const records=[...unique.values()];return {records,counts:{parsed:snapshot.states.length,valid:valid.length,admitted:records.length,filtered:snapshot.states.length-records.length,duplicates,outside}};
}
/** Minimal port of flights/motion.js bracketing loop: delay, clamp, never coast. */
export function bracket(history,nowMs){
 const target=nowMs-30000;
 for(let i=history.length-1;i>0;i--){const a=history[i-1],b=history[i];if(a.time<=target&&target<=b.time)return {a,b,t:(target-a.time)/(b.time-a.time),estimated:true};}
 const sample=history.find(x=>x.time>=target)??history.at(-1);return sample?{a:sample,b:sample,t:0,estimated:false}:null;
}
export function validRawPositionAge(row){return validPoint(row?.lat,row?.lon)&&Number.isFinite(row?.seen_pos)&&row.seen_pos>=0&&row.seen_pos<120;}

/** Reuse a still-fresh acquisition that covers the settled view's inner region. */
export function cachedAnchor(cache,point,now=Date.now()){
 let closest=null,best=AIRCRAFT_RADIUS_M/2;
 for(const entry of cache.values()){
  if(!entry.center||now-entry.received<0||now-entry.received>=30000)continue;
  const distance=distanceM(entry.center,point);
  if(distance<best){closest=entry.center;best=distance;}
 }
 return closest?{...closest}:point;
}
