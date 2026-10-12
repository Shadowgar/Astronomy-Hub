import {IMAGERY_CACHE_NAME,cacheExpiry,cacheBudget} from './imageryCachePolicy.mjs';
const imageSignature=(bytes,type)=>{const b=new Uint8Array(bytes);return type.startsWith('image/jpeg')?b[0]===255&&b[1]===216&&b[2]===255:type.startsWith('image/png')?b.slice(0,8).join(',')==='137,80,78,71,13,10,26,10':type.startsWith('image/webp')?String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP':false;};
const digest=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');
export class ImageryCacheStore{
 constructor({storage=globalThis.caches,clock=()=>Date.now(),estimate=()=>globalThis.navigator?.storage?.estimate?.(),maxBytes}={}){this.storage=storage;this.clock=clock;this.estimate=estimate;this.maxBytes=maxBytes;this.epoch=0;this.records=new Map();this.counters={hits:0,misses:0,writes:0,evictions:0,errors:0,skipped:0};this.state='available';this.queue=Promise.resolve();}
 async open(){return this.storage.open(IMAGERY_CACHE_NAME);}
 error(){this.counters.errors++;this.state='unavailable';}
 async index(){if(!this.indexing)this.indexing=(async()=>{const epoch=this.epoch,records=new Map(),cache=await this.open();for(const request of await cache.keys()){const response=await cache.match(request.url),size=Number(response?.headers.get('x-oras-cache-size')),at=Number(response?.headers.get('x-oras-cache-at')),expires=Number(response?.headers.get('x-oras-cache-expires'));if(epoch!==this.epoch)return;if(!(expires>this.clock())||!Number.isFinite(size)||size<=0||!Number.isFinite(at)){await cache.delete(request.url);this.counters.evictions++;continue;}records.set(request.url,{size,at});}if(epoch===this.epoch)this.records=new Map([...records].sort((a,b)=>a[1].at-b[1].at));})().catch(error=>{this.indexing=null;throw error;});return this.indexing;}

 async get(resource){
  try{const cache=await this.open(),response=await cache.match(resource.key);if(!response){this.records.delete(resource.key);this.counters.misses++;return null;}
   const expiry=Number(response.headers.get('x-oras-cache-expires')),size=Number(response.headers.get('x-oras-cache-size')),hash=response.headers.get('x-oras-cache-sha256');
   if(!(expiry>this.clock())||!size||!hash){await cache.delete(resource.key);this.records.delete(resource.key);this.counters.misses++;return null;}
   const bytes=await response.clone().arrayBuffer();if(bytes.byteLength!==size||!imageSignature(bytes,response.headers.get('content-type')??'')&&resource.provider!=='local'||await digest(bytes)!==hash){await cache.delete(resource.key);this.records.delete(resource.key);this.counters.misses++;return null;}
   this.counters.hits++;this.state='available';return response;
  }catch{this.error();this.counters.misses++;return null;}
 }
 async put(resource,response,epoch=this.epoch){
  const expiry=cacheExpiry(response,this.clock());if(!expiry||!/^image\//i.test(response.headers.get('content-type')??'')&&resource.provider!=='local'){this.counters.skipped++;return;}
  try{const bytes=await response.arrayBuffer();if(!bytes.byteLength||bytes.byteLength>8*1048576||!imageSignature(bytes,response.headers.get('content-type')??'')&&resource.provider!=='local'){this.counters.skipped++;return;}
   const hash=await digest(bytes);const write=async()=>{if(epoch!==this.epoch)return;await this.index();const cache=await this.open(),owned=[...this.records.values()].reduce((a,r)=>a+r.size,0),limit=this.maxBytes??cacheBudget(await Promise.resolve(this.estimate()).catch(()=>null),owned);
    const evict=async target=>{let total=[...this.records.values()].reduce((a,r)=>a+r.size,0);for(const [key,row] of this.records){if(total+bytes.byteLength<=target&&this.records.size<20000)break;await cache.delete(key);this.records.delete(key);total-=row.size;this.counters.evictions++;}};
    if(bytes.byteLength>limit){this.counters.skipped++;return;}await evict(limit);if(epoch!==this.epoch)return;
    const headers=new Headers(response.headers);headers.delete('content-encoding');headers.delete('content-length');for(const [key,value] of Object.entries({'x-oras-cache-expires':expiry,'x-oras-cache-size':bytes.byteLength,'x-oras-cache-at':this.clock(),'x-oras-cache-sha256':hash}))headers.set(key,String(value));
    if(resource.provider!=='local'&&typeof globalThis.createImageBitmap==='function'){try{const image=await createImageBitmap(new Blob([bytes],{type:response.headers.get('content-type')}));image.close();}catch{this.counters.skipped++;return;}}
    if(epoch!==this.epoch)return;const saved=()=>new Response(bytes,{status:200,headers});try{await cache.put(resource.key,saved());}catch(error){if(error.name!=='QuotaExceededError')throw error;await evict(Math.max(bytes.byteLength,owned*.5));await cache.put(resource.key,saved());}
    if(epoch!==this.epoch)return;this.records.delete(resource.key);this.records.set(resource.key,{size:bytes.byteLength,at:this.clock()});this.counters.writes++;this.state='available';};
   const task=this.queue.then(write);this.queue=task.catch(()=>{});await task;
  }catch{this.error();}
 }
 async clear(){this.epoch++;await this.queue;await this.storage.delete(IMAGERY_CACHE_NAME);this.opening=null;this.indexing=null;this.records.clear();this.state='available';return this.status();}
 async status(){this.indexing=null;try{await this.index();}catch{this.error();}let estimate;try{estimate=await this.estimate();}catch{}return {status:this.state,entries:this.records.size,bytes:[...this.records.values()].reduce((a,r)=>a+r.size,0),maxBytes:this.maxBytes??cacheBudget(estimate,[...this.records.values()].reduce((a,r)=>a+r.size,0)),...this.counters};}
}
