import {cacheResource} from './imageryCachePolicy.mjs';
import {ImageryCacheStore} from './imageryCacheStore.mjs';
const store=new ImageryCacheStore();
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const resource=cacheResource(event.request,self.location.origin);if(!resource)return;
 const epoch=store.epoch;let finish;const maintenance=new Promise(resolve=>{finish=resolve});event.waitUntil(maintenance);
 event.respondWith((async()=>{try{const cached=await store.get(resource);if(cached){finish();return cached;}
  const response=await fetch(event.request);void store.put(resource,response.clone(),epoch).finally(finish);return response;
 }catch(error){finish();throw error;}})());
});
self.addEventListener('message',event=>{
 if(!event.source?.url||new URL(event.source.url).origin!==self.location.origin||!event.ports[0])return;
 if(!['imagery-cache-status','imagery-cache-clear'].includes(event.data?.type))return;
 event.waitUntil((async()=>{try{const result=event.data.type==='imagery-cache-clear'?await store.clear():await store.status();event.ports[0].postMessage({ok:true,...result});}catch{event.ports[0].postMessage({ok:false,status:'unavailable'});}})());
});
