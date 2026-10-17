import {cacheResource} from './imageryCachePolicy.mjs';
import {ImageryCacheStore} from './imageryCacheStore.mjs';
const store=new ImageryCacheStore(),scenes=new Map();
const earthClient=client=>client?.url&&new URL(client.url).origin===self.location.origin&&new URL(client.url).pathname.startsWith('/earth-runtime/');
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const resource=cacheResource(event.request,self.location.origin);if(!resource)return;
 const epoch=store.epoch,id=event.clientId;let scene=scenes.get(id);if(!scene){scene={generation:0,active:true};scenes.set(id,scene);}
 const canWrite=async()=>!!id&&scene.active&&scenes.get(id)===scene&&earthClient(await self.clients.get(id));
 let finish;const maintenance=new Promise(resolve=>{finish=resolve});event.waitUntil(maintenance);
 event.respondWith((async()=>{try{const cached=await store.get(resource);if(cached){finish();return cached;}
  const response=await fetch(event.request);void store.put(resource,response.clone(),epoch,canWrite).finally(finish);return response;
 }catch(error){finish();throw error;}})());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='imagery-cache-scene'){
  if(!earthClient(event.source)||!event.source.id||!Number.isSafeInteger(event.data.generation)||event.data.generation<0)return;
  const previous=scenes.get(event.source.id);if(previous&&event.data.generation<previous.generation)return;
  scenes.set(event.source.id,{generation:event.data.generation,active:event.data.active===true});while(scenes.size>128)scenes.delete(scenes.keys().next().value);return;
 }
 if(!event.source?.url||new URL(event.source.url).origin!==self.location.origin||!event.ports[0])return;
 if(!['imagery-cache-status','imagery-cache-clear'].includes(event.data?.type))return;
 event.waitUntil((async()=>{try{const result=event.data.type==='imagery-cache-clear'?await store.clear():await store.status();event.ports[0].postMessage({ok:true,...result});}catch{event.ports[0].postMessage({ok:false,status:'unavailable'});}})());
});
