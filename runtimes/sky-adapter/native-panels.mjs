import {validHello} from '../../packages/runtime-protocol/index.mjs';
// Sky presentation only. Shared protocol inputs belong to the frozen Earth release.
export function validSkyPanelReport(event,expected){
 const p=event.data;
 return event.origin===expected.origin&&event.source===expected.source&&p!==null&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).sort().join(',')==='generation,id,nonce,open,runtime,type'&&p.type==='oras-sky-panel.v1'&&p.runtime==='sky'&&p.nonce===expected.nonce&&p.generation===expected.generation&&typeof p.open==='boolean'&&Number.isSafeInteger(p.id)&&p.id>0;
}
export function installSkyPanelReports(w=window){
 let session=null,id=0,active=true;
 const hello=event=>{if(active&&event.source===w.parent&&w.parent!==w&&event.origin===w.location.origin&&validHello(event.data)&&event.data.runtime==='sky'){session={runtime:'sky',nonce:event.data.nonce,generation:event.data.generation}}};
 const report=event=>{if(active&&session&&typeof event.detail==='boolean'&&w.document.documentElement.classList.contains('oras-workspace-embedded'))w.parent.postMessage({...session,type:'oras-sky-panel.v1',id:++id,open:event.detail},w.location.origin)};
 const hide=event=>{if(!event.persisted)stop()};
 const stop=()=>{active=false;session=null;w.removeEventListener('message',hello);w.removeEventListener('oras-sky-panel',report);w.removeEventListener('pagehide',hide)};
 w.addEventListener('message',hello);w.addEventListener('oras-sky-panel',report);w.addEventListener('pagehide',hide);return stop;
}
// Native-owned Night Mode uses the same qualified Sky bootstrap/session boundary.
export function validSkyNightReport(event,expected){
 const p=event.data;
 return event.origin===expected.origin&&event.source===expected.source&&p!==null&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).sort().join(',')==='enabled,generation,id,nonce,runtime,type'&&p.type==='oras-sky-night.v1'&&p.runtime==='sky'&&p.nonce===expected.nonce&&p.generation===expected.generation&&typeof p.enabled==='boolean'&&Number.isSafeInteger(p.id)&&p.id>0;
}
export function installSkyNightReports(w=window,read=()=>w.orasSkyAdapter?.nightMode()){
 let session=null,id=0,active=true;
 const report=()=>{const enabled=read();if(active&&session&&typeof enabled==='boolean'&&w.document.documentElement.classList.contains('oras-workspace-embedded'))w.parent.postMessage({...session,type:'oras-sky-night.v1',id:++id,enabled},w.location.origin)};
 const hello=event=>{if(active&&w.parent!==w&&event.source===w.parent&&event.origin===w.location.origin&&validHello(event.data)&&event.data.runtime==='sky'){session={runtime:'sky',nonce:event.data.nonce,generation:event.data.generation};report()}};
 const change=event=>{if(typeof event.detail==='boolean')report()};
 const hide=event=>{if(!event.persisted)stop()};
 const stop=()=>{active=false;session=null;w.removeEventListener('message',hello);w.removeEventListener('oras-sky-ready',report);w.removeEventListener('oras-sky-night-mode',change);w.removeEventListener('pagehide',hide)};
 w.addEventListener('message',hello);w.addEventListener('oras-sky-ready',report);w.addEventListener('oras-sky-night-mode',change);w.addEventListener('pagehide',hide);return stop;
}
// Read-only native FOV reports; this Sky extension leaves the shared Earth protocol frozen.
export function validSkyFovReport(event,expected){
 const p=event.data;
 return event.origin===expected.origin&&event.source===expected.source&&p!==null&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).sort().join(',')==='fovRad,generation,id,nonce,runtime,type'&&p.type==='oras-sky-fov.v1'&&p.runtime==='sky'&&p.nonce===expected.nonce&&p.generation===expected.generation&&Number.isSafeInteger(p.id)&&p.id>0&&Number.isFinite(p.fovRad)&&p.fovRad>0&&p.fovRad<=2*Math.PI;
}
export function installSkyFovReports(w=window,read=()=>w.orasSkyAdapter?.fov(),clock=globalThis){
 let session=null,id=0,active=true,suspended=false,timer=null,last=null;
 const clear=()=>{if(timer!==null)clock.clearTimeout(timer);timer=null;};
 const enabled=()=>active&&!suspended&&session&&w.document.visibilityState!=='hidden'&&w.document.documentElement.classList.contains('oras-workspace-embedded');
 const report=()=>{if(!enabled())return;const fovRad=read();if(!Number.isFinite(fovRad)||fovRad<=0||fovRad>2*Math.PI||fovRad===last)return;last=fovRad;w.parent.postMessage({...session,type:'oras-sky-fov.v1',id:++id,fovRad},w.location.origin)};
 // Pinned zoomTo(..., 0) bypasses reactive notification. One native scalar
 // sample per 100ms covers that path; only changed values cross the bridge.
 const sample=()=>{timer=null;report();arm();};
 const arm=()=>{if(enabled()&&timer===null)timer=clock.setTimeout(sample,100);};
 const ready=()=>{report();arm();};
 const hello=event=>{if(!active||w.parent===w||event.source!==w.parent||event.origin!==w.location.origin||!validHello(event.data)||event.data.runtime!=='sky')return;if(session?.nonce!==event.data.nonce||session?.generation!==event.data.generation)last=null;session={runtime:'sky',nonce:event.data.nonce,generation:event.data.generation};ready();};
 const hide=event=>{clear();suspended=true;if(!event.persisted)stop();};
 const show=event=>{if(event.persisted){suspended=false;ready();}};
 const visibility=()=>{clear();if(w.document.visibilityState!=='hidden')ready();};
 const stop=()=>{active=false;session=null;clear();for(const[type,fn]of listeners)w.removeEventListener(type,fn);w.document.removeEventListener?.('visibilitychange',visibility);};
 const listeners=[['message',hello],['oras-sky-ready',ready],['oras-sky-fov',arm],['pagehide',hide],['pageshow',show]];
 for(const[type,fn]of listeners)w.addEventListener(type,fn);w.document.addEventListener?.('visibilitychange',visibility);return stop;
}
