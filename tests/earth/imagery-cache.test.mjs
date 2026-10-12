import test from 'node:test';import assert from 'node:assert/strict';
import {cacheResource,cacheExpiry,cacheBudget} from '../../runtimes/earth-runtime/core/imageryCachePolicy.mjs';
import {ImageryCacheStore} from '../../runtimes/earth-runtime/core/imageryCacheStore.mjs';
const origin='https://hub.example',now=Date.parse('2026-10-12T10:00:00Z');
const eox='https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/14/8192/8192.jpg';
const response=(text='actual image bytes',extra={})=>new Response(new Uint8Array([255,216,255,...new TextEncoder().encode(text),255,217]),{headers:{'Content-Type':'image/jpeg','Cache-Control':'public,max-age=3600','Date':'Mon, 12 Oct 2026 10:00:00 GMT',...extra}});
function storage(){const entries=new Map(),foreign=new Map([['saved','owner work']]);return {entries,foreign,async open(){return {match:async key=>entries.get(String(key))?.clone(),keys:async()=>[...entries.keys()].map(key=>new Request(key)),put:async(key,value)=>{entries.set(String(key),value.clone())},delete:async key=>entries.delete(String(key))}},async delete(){entries.clear();return true}}}
test('exact provider edition and WMS parameters identify anonymous eligible resources only',()=>{
 const a=cacheResource(new Request(eox),origin);assert.equal(a.provider,'eox-2016');assert.equal(a.edition,'2016');assert.match(a.key,/14%2F8192%2F8192/);assert.notEqual(a.key,cacheResource(new Request(eox.replace('/8192.jpg','/8193.jpg')),origin).key);
 for(const url of [eox+'?token=secret','https://api.cesium.com/assets/1','https://other.example/image.jpg',origin+'/api/sky/object',origin+'/oras-sky-engine/skydata/stars'])assert.equal(cacheResource(new Request(url),origin),null);
 assert.equal(cacheResource(new Request(eox,{credentials:'include'}),origin),null);assert.equal(cacheResource(new Request(eox,{headers:{Authorization:'Bearer private'}}),origin),null);
});
test('freshness never resets origin age and honors revalidation/no-store/private/vary restrictions',()=>{
 assert.equal(cacheExpiry(response(),now+1800000),now+3600000);assert.equal(cacheExpiry(response('',{Age:'3600'}),now),0);
 for(const cc of ['no-store','private,max-age=3600','no-cache,max-age=3600','max-age=0'])assert.equal(cacheExpiry(response('',{'Cache-Control':cc}),now),0);
 assert.equal(cacheExpiry(response('',{Vary:'*'}),now),0);assert.equal(cacheExpiry(response('',{Vary:'Authorization'}),now),0);assert.equal(cacheExpiry(response('',{Vary:'Accept-Language'}),now),0);
 assert.equal(cacheExpiry(response('',{Date:'',Expires:'Mon, 12 Oct 2026 10:30:00 GMT'}),now),now+1800000);assert.equal(cacheExpiry(response('',{Date:''}),now),0);
});
test('actual response bytes survive a new store instance and expired entries miss',async()=>{
 const s=storage(),resource=cacheResource(new Request(eox),origin),a=new ImageryCacheStore({storage:s,clock:()=>now,estimate:async()=>({quota:1e9,usage:0})});await a.put(resource,response());const b=new ImageryCacheStore({storage:s,clock:()=>now+1000});const hit=await b.get(resource);assert.deepEqual([...new Uint8Array(await hit.arrayBuffer())],[255,216,255,...new TextEncoder().encode('actual image bytes'),255,217]);assert.equal((await b.status()).entries,1);assert.equal((await b.status()).hits,1);
 const expired=new ImageryCacheStore({storage:s,clock:()=>now+3600001});assert.equal(await expired.get(resource),null);
});
test('confirmed owned clear isolates preferences and suppresses pre-clear delayed writes',async()=>{
 const s=storage(),store=new ImageryCacheStore({storage:s,clock:()=>now}),resource=cacheResource(new Request(eox),origin);await store.put(resource,response());assert.equal(s.entries.size,1);const epoch=store.epoch;await store.clear();await store.put(resource,response(),epoch);assert.equal(s.entries.size,0);assert.equal(s.foreign.get('saved'),'owner work');assert.equal((await store.status()).entries,0);
});
test('storage denial falls back, corruption is evicted, and oldest entries yield to quota',async()=>{
 const denied=new ImageryCacheStore({storage:{open:async()=>{throw new DOMException('Denied','SecurityError')}},clock:()=>now});const resource=cacheResource(new Request(eox),origin);assert.equal(await denied.get(resource),null);await denied.put(resource,response());assert.equal((await denied.status()).status,'unavailable');
 const s=storage(),store=new ImageryCacheStore({storage:s,clock:()=>now,maxBytes:30});await store.put(resource,response('first bytes'));const other=cacheResource(new Request(eox.replace('/8192.jpg','/8193.jpg')),origin);await store.put(other,response('second longer bytes'));assert.equal(await store.get(resource),null);assert.deepEqual([...new Uint8Array(await(await store.get(other)).arrayBuffer())],[255,216,255,...new TextEncoder().encode('second longer bytes'),255,217]);assert.ok((await store.status()).evictions>=1);
 s.entries.set(other.key,new Response('CORRUPTED',{headers:{'Content-Type':'image/jpeg','x-oras-cache-expires':String(now+99999),'x-oras-cache-size':'19','x-oras-cache-sha256':'invalid'}}));assert.equal(await store.get(other),null);
});
test('opaque and no-store imagery are not persisted; budget cannot consume other user storage',async()=>{
 const s=storage(),store=new ImageryCacheStore({storage:s,clock:()=>now}),resource=cacheResource(new Request(eox),origin),opaque=response();Object.defineProperty(opaque,'type',{value:'opaque'});await store.put(resource,opaque);await store.put(resource,response('',{'Cache-Control':'no-store'}));assert.equal(s.entries.size,0);assert.equal(cacheBudget({quota:100000000,usage:98000000},0),1000000);
});

test('an HTML error falsely labeled as imagery is not persisted',async()=>{const s=storage(),store=new ImageryCacheStore({storage:s,clock:()=>now});const resource=cacheResource(new Request(eox),origin);await store.put(resource,new Response('<html>upstream error</html>',{headers:{'Content-Type':'image/jpeg','Cache-Control':'public,max-age=3600',Date:'Mon, 12 Oct 2026 10:00:00 GMT'}}));assert.equal(s.entries.size,0);});
