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
