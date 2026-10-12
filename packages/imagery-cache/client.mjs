const scope='/earth-runtime/';
export async function startImageryCache(){if(!globalThis.navigator?.serviceWorker)return null;try{return await navigator.serviceWorker.register(scope+'imagery-cache-sw.js',{scope,type:'module',updateViaCache:'none'});}catch{return null;}}
export async function imageryCacheStatus(clear=false){
 const unavailable={status:'unsupported',entries:null,bytes:null,persistent:null,httpCache:'Browser controlled; cannot be selectively cleared here'};
 if(!globalThis.navigator?.serviceWorker)return unavailable;
 try{const registration=await navigator.serviceWorker.getRegistration(scope),worker=registration?.active;if(!worker)return {...unavailable,status:'starting'};
  const result=await new Promise(resolve=>{const channel=new MessageChannel(),timer=setTimeout(()=>{channel.port1.close();resolve({status:'unavailable'})},5000);channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();resolve(event.data)};worker.postMessage({type:clear?'imagery-cache-clear':'imagery-cache-status'},[channel.port2]);});
  let persistent=null,estimate=null;try{persistent=await navigator.storage?.persisted?.()??null;estimate=await navigator.storage?.estimate?.();}catch{}
  return {...unavailable,...result,persistent,originUsage:estimate?.usage??null,originQuota:estimate?.quota??null};
 }catch{return {...unavailable,status:'unavailable'};}
}
