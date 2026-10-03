import {createRuntimeEndpoint} from '../../packages/runtime-protocol/endpoint.mjs';
const endpoint=createRuntimeEndpoint({runtime:'sky',version:'stellarium:comparison-023e3b2/oras-sky-baseline.v1+workspace.1',capabilities:['nativeTools','destroy','timeIntent','observerIntent','presentation','interactionEvents','selection','workspaceState'],execute:async(command,payload)=>{
 const adapter=window.orasSkyAdapter;if(!adapter)throw new Error('Engine unavailable');
 if(command==='destroy'){adapter.stop();return {ok:true};}
 if(command==='openNativeTools')return adapter.tools();
 if(command==='getWorkspaceState')return {ok:true,state:adapter.snapshot()};
 if(command==='setPresentation'){adapter.presentation(payload.embedded,payload.creditsAtTop);return {ok:true};}
 if(command==='selectEntity')return adapter.select(payload);
 if(command==='clearSelection')return adapter.clear();
 if(command==='focusSelection')return adapter.focus();
 if(command==='setTimeIntent'){
  adapter.observer.utc=Date.parse(payload.utc)/86400000+40587;adapter.setLive?.(payload.live===true);
  return {ok:true,temporalMode:'CONTROLLED',effectiveTime:new Date(Math.round((adapter.observer.utc-40587)*86400000)).toISOString()};
 }
 if(command==='setObserverIntent'){
  adapter.observer.latitude=payload.lat*Math.PI/180;adapter.observer.longitude=payload.lon*Math.PI/180;adapter.observer.elevation=payload.elevationM;
  return {ok:true,effectiveObserver:{lat:adapter.observer.latitude*180/Math.PI,lon:adapter.observer.longitude*180/Math.PI,elevationM:adapter.observer.elevation}};
 }
 return {ok:false,error:'Unsupported capability'};
}});
let timer=null;
function ready(){endpoint.ready();const canvas=document.querySelector('#stel-canvas');if(!canvas)return;
 const interaction=()=>{clearTimeout(timer);endpoint.emit('interaction',{active:true,focused:false});timer=setTimeout(()=>{timer=null;endpoint.emit('interaction',{active:false,focused:false})},350)};
 canvas.addEventListener('pointerdown',interaction,{passive:true});canvas.addEventListener('wheel',interaction,{passive:true});
}
window.addEventListener('oras-sky-ready',ready,{once:true});if(window.orasSkyAdapter)ready();
document.addEventListener('keydown',event=>{if(!document.documentElement.classList.contains('oras-workspace-embedded')||window.orasSkyAdapter?.panelOpen()||!['Escape','Tab'].includes(event.key))return;if(event.key==='Tab')event.preventDefault();endpoint.emit('interaction',{active:false,focused:false,key:event.key});});
document.addEventListener('focusin',event=>{if(document.documentElement.classList.contains('oras-workspace-embedded'))endpoint.emit('interaction',{active:false,focused:window.orasSkyAdapter?.panelOpen()===true});});
window.addEventListener('pagehide',event=>{clearTimeout(timer);timer=null;endpoint.emit('interaction',{active:false,focused:false});if(!event.persisted)endpoint.close();});
