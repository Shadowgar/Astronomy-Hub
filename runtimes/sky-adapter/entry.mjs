import {createRuntimeEndpoint} from '../../packages/runtime-protocol/endpoint.mjs';
const endpoint=createRuntimeEndpoint({runtime:'sky',version:'stellarium:comparison-023e3b2/oras-sky-baseline.v1+bridge.v1',capabilities:['destroy','timeIntent','observerIntent'],execute:async(command,payload)=>{
 const adapter=window.orasSkyAdapter;if(!adapter)throw new Error('Engine unavailable');
 if(command==='destroy'){adapter.stop();return {ok:true};}
 if(command==='setTimeIntent'){
  adapter.observer.utc=Date.parse(payload.utc)/86400000+40587;
  return {ok:true,temporalMode:'CONTROLLED',effectiveTime:new Date((adapter.observer.utc-40587)*86400000).toISOString()};
 }
 if(command==='setObserverIntent'){
  adapter.observer.latitude=payload.lat*Math.PI/180;adapter.observer.longitude=payload.lon*Math.PI/180;adapter.observer.elevation=payload.elevationM;
  return {ok:true,effectiveObserver:{lat:adapter.observer.latitude*180/Math.PI,lon:adapter.observer.longitude*180/Math.PI,elevationM:adapter.observer.elevation}};
 }
 return {ok:false,error:'Unsupported capability'};
}});
window.addEventListener('oras-sky-ready',()=>endpoint.ready(),{once:true});
if(window.orasSkyAdapter)endpoint.ready();
window.addEventListener('pagehide',()=>endpoint.close(),{once:true});
