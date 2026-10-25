import {createRuntimeEndpoint} from '../../packages/runtime-protocol/endpoint.mjs';
import {installSkyPanelReports,installSkyNightReports,installSkyFovReports} from './native-panels.mjs';
const endpoint=createRuntimeEndpoint({runtime:'sky',version:'stellarium:comparison-023e3b2/oras-sky-baseline.v1+navigation.1',capabilities:['nativeTools','destroy','timeIntent','observerIntent','presentation','interactionEvents','selection','workspaceState','viewNavigation','navigation'],execute:async(command,payload)=>{
 const adapter=window.orasSkyAdapter;if(!adapter)throw new Error('Engine unavailable');
 if(command==='destroy'){stopPanelReports();stopNightReports();stopFovReports();cleanup();adapter.stop();return {ok:true};}
 if(command==='getNavigationState')return {ok:true,navigation:adapter.navigation()};
 if(command==='setNavigationView')return adapter.restoreView(payload.camera);
 if(command==='resetNavigation')return adapter.resetNavigation();
 if(command==='openNativeTools')return adapter.tools();
 if(command==='getWorkspaceState')return {ok:true,state:adapter.snapshot()};
 if(command==='setPresentation'){adapter.presentation(payload.embedded,payload.creditsAtTop);return {ok:true};}
 if(command==='selectEntity')return adapter.select(payload);
 if(command==='clearSelection')return adapter.clear();
 if(command==='focusSelection')return adapter.focus();
 if(command==='setTracking')return adapter.setTracking(payload.enabled);
 if(command==='setTimeIntent'){
  adapter.observer.utc=Date.parse(payload.utc)/86400000+40587;adapter.setLive?.(payload.live===true);
  return {ok:true,temporalMode:'CONTROLLED',effectiveTime:new Date(Math.round((adapter.observer.utc-40587)*86400000)).toISOString()};
 }
 if(command==='setObserverIntent')return adapter.setObserver(payload);
 return {ok:false,error:'Unsupported capability'};
}});
const stopPanelReports=installSkyPanelReports(),stopNightReports=installSkyNightReports(),stopFovReports=installSkyFovReports();
let timer=null,canvas=null;
const navigation=event=>endpoint.emit('navigationIntent',event.detail);
window.addEventListener('oras-navigation-intent',navigation);
const interaction=()=>{clearTimeout(timer);endpoint.emit('interaction',{active:true,focused:false});timer=setTimeout(()=>{timer=null;endpoint.emit('interaction',{active:false,focused:false})},350)};
function cleanup(){clearTimeout(timer);timer=null;canvas?.removeEventListener('pointerdown',interaction);canvas?.removeEventListener('wheel',interaction);window.removeEventListener('oras-navigation-intent',navigation);document.removeEventListener('keydown',key,true);document.removeEventListener('focusin',focusin);document.removeEventListener('focusout',focusout);}
function ready(){endpoint.ready();canvas=document.querySelector('#stel-canvas');if(!canvas)return;
 canvas.addEventListener('pointerdown',interaction,{passive:true});canvas.addEventListener('wheel',interaction,{passive:true});
}
window.addEventListener('oras-sky-ready',ready,{once:true});if(window.orasSkyAdapter)ready();
const nativeControl=target=>!!target?.closest?.('.oras-workspace-search,.oras-workspace-bottom');
const key=event=>{if(['PageUp','PageDown'].includes(event.key)){if(event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;if(document.documentElement.classList.contains('oras-workspace-embedded')&&!window.orasSkyAdapter?.panelOpen()&&!nativeControl(event.target)&&!event.target?.closest?.('input,textarea,select,[contenteditable=true]')){event.preventDefault();window.orasSkyAdapter?.zoom(event.key==='PageUp')}return}if(!document.documentElement.classList.contains('oras-workspace-embedded')||window.orasSkyAdapter?.panelOpen()||(event.key==='Tab'&&nativeControl(event.target))||(event.key==='Escape'&&event.target?.closest?.('.oras-workspace-search,.as-native-panel,.as-native-rail'))||!['Escape','Tab'].includes(event.key))return;if(event.key==='Tab')event.preventDefault();endpoint.emit('interaction',{active:false,focused:false,key:event.key});};document.addEventListener('keydown',key,true);
const focusin=event=>{if(document.documentElement.classList.contains('oras-workspace-embedded'))endpoint.emit('interaction',{active:false,focused:window.orasSkyAdapter?.panelOpen()===true||nativeControl(event.target)});};document.addEventListener('focusin',focusin);
const focusout=event=>{if(document.documentElement.classList.contains('oras-workspace-embedded'))endpoint.emit('interaction',{active:false,focused:window.orasSkyAdapter?.panelOpen()===true||nativeControl(event.relatedTarget)});};document.addEventListener('focusout',focusout);
window.addEventListener('pagehide',event=>{clearTimeout(timer);timer=null;endpoint.emit('interaction',{active:false,focused:false});if(!event.persisted){cleanup();endpoint.close();}});
