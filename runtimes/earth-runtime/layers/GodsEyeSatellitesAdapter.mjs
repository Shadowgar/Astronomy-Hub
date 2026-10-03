import {createSatelliteSource} from 'gods-eye-view/layers/satellites/source';
import {celestrakTleUrl} from 'gods-eye-view/sources/space';
import {twoline2satrec,propagate,gstime,eciToGeodetic,degreesLat,degreesLong} from 'satellite.js';
import {PollingLayer} from './PollingLayer.mjs';
import {tleRecords,validPoint,readCapped} from './data.mjs';
import {entityRenderer} from './entities.mjs';
export function createSatellitesAdapter(context){
 const renderer=entityRenderer(context,'satellites','#a3d4ff');let cache=null,cachedAt=0,lastFailure=0;
 const source=createSatelliteSource({fetchImpl:async(_url,{signal})=>{const response=await fetch(celestrakTleUrl('stations'),{signal,cache:'no-store'});const text=await readCapped(response,500000);return {ok:true,status:response.status,text:async()=>text}}});
 const layer=new PollingLayer({id:'satellites',interval:15000,read:async signal=>{
  const now=new Date();if(!cache||Date.now()-cachedAt>4*3600000){
   if(lastFailure&&Date.now()-lastFailure<300000)throw Error('Provider backoff');
   try{const result=await source.readGroup('stations',{signal});if(!result.ok)throw Error('TLE unavailable');cache=tleRecords(result.text);if(!cache.length)throw Error('No valid TLE records');cachedAt=Date.now();lastFailure=0;}catch(error){lastFailure=Date.now();throw error;}
  }
  const records=[];
  for(const tle of cache){const sat=twoline2satrec(tle.line1,tle.line2);const epochMs=(sat.jdsatepoch-2440587.5)*86400000;if(!Number.isFinite(epochMs)||Math.abs(now.getTime()-epochMs)>7*86400000)continue;const state=propagate(sat,now);if(!state?.position||sat.error)continue;const geo=eciToGeodetic(state.position,gstime(now)),lat=degreesLat(geo.latitude),lon=degreesLong(geo.longitude),heightM=geo.height*1000;if(!validPoint(lat,lon)||!Number.isFinite(heightM)||heightM<0||heightM>100000000)continue;records.push({id:tle.id,name:tle.name,lat,lon,heightM,detail:'Modeled position from current CelesTrak station elements.',facts:[{label:'NORAD',value:tle.id},{label:'Propagation time',value:now.toISOString()},{label:'TLE epoch',value:new Date(epochMs).toISOString()},{label:'Model',value:'satellite.js SGP4'}]});}
  if(!records.length)throw Error('No fresh propagatable TLE');return {records,observedAt:now.toISOString()};
 },render:({records})=>{renderer.replace(records)},clear:unavailable=>renderer.clear(unavailable)});
 const initialize=layer.initialize.bind(layer);layer.initialize=ctx=>{initialize(ctx);ctx.attribution.set('satellites','CelesTrak · satellite.js SGP4','https://celestrak.org/NORAD/elements/')};
 const destroy=layer.destroy.bind(layer);layer.destroy=()=>{destroy();cache=null;context.attribution.remove('satellites')};return layer;
}
