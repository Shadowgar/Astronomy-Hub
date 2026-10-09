import {createRuntimeEndpoint} from '../../../packages/runtime-protocol/endpoint.mjs';
export function RuntimeBridge(runtime){
 const endpoint=createRuntimeEndpoint({runtime:'earth',version:'oras-earth.v1+workspace.1',capabilities:['destroy','timeIntent','observerIntent','presentation','interactionEvents','selection','workspaceState','layers','navigation','providers'],execute:async(command,value)=>{
  if(command==='setTimeIntent')return runtime.setTime(value.utc);
  if(command==='setObserverIntent')return runtime.setObserver(value);
  if(command==='destroy'){await runtime.destroy();setTimeout(()=>endpoint.close(),0);return {ok:true};}
  if(command==='setPresentation'){document.documentElement.classList.toggle('embedded',value.embedded);document.documentElement.classList.toggle('credits-top',value.creditsAtTop===true);return {ok:true};}
  if(command==='getWorkspaceState')return {ok:true,state:runtime.snapshot()};
  if(command==='setLayerEnabled'){await runtime.registry[value.enabled?'enable':'disable'](value.id);return {ok:true,state:runtime.snapshot()};}
  if(command==='retryLayer'){await runtime.registry.disable(value.id);await runtime.registry.enable(value.id);return {ok:true,state:runtime.snapshot()};}
  if(command==='retryImagery'){await runtime.visual.retryImagery();return {ok:true,state:runtime.snapshot()};}
  if(command==='clearSelection'){runtime.camera.stopTracking();runtime.viewer.selectedEntity=undefined;runtime.selection.set(null);return {ok:true,state:runtime.snapshot()};}
  if(command==='globalView'){runtime.camera.home(runtime.site);return {ok:true};}
  if(command==='returnToOras'){await runtime.camera.returnToSite(runtime.site,runtime.visual.terrainReady);return {ok:true};}
  if(command==='focusSelection'){if(!runtime.selection.value||runtime.selectionMetadata?.available===false)return {ok:false,error:'No available selection'};return {ok:await runtime.camera.focus(runtime.selection.value)};}
  if(command==='setTracking'){if(!value.enabled){runtime.camera.stopTracking();return {ok:true};}if(runtime.selectionMetadata?.available===false||!['satellites','aircraft'].includes(runtime.selectionMetadata?.layerId))return {ok:false,error:'Only satellites and aircraft support tracking'};runtime.camera.track(runtime.selection.value);return {ok:true};}
  return {ok:false,error:'Unsupported command'};
 }});
 const node=runtime.viewer.canvas;let timer;
 const interaction=()=>{clearTimeout(timer);runtime.camera.interrupt();endpoint.emit('interaction',{active:true,focused:false});timer=setTimeout(()=>endpoint.emit('interaction',{active:false,focused:false}),350);};
 const focus=()=>endpoint.emit('interaction',{active:false,focused:document.activeElement===node});
 for(const type of ['pointerdown','wheel']){node.addEventListener(type,interaction,{passive:true});runtime.lifecycle.add(()=>node.removeEventListener(type,interaction));}
 for(const type of ['focus','blur']){node.addEventListener(type,focus);runtime.lifecycle.add(()=>node.removeEventListener(type,focus));}
 const key=event=>{if(!document.documentElement.classList.contains('embedded')||!['Escape','Tab'].includes(event.key))return;if(event.key==='Tab')event.preventDefault();endpoint.emit('interaction',{active:false,focused:false,key:event.key});};document.addEventListener('keydown',key);runtime.lifecycle.add(()=>document.removeEventListener('keydown',key));
 runtime.lifecycle.add(()=>clearTimeout(timer));return endpoint;
}
