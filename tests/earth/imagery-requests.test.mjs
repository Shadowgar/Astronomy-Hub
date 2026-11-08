import test from 'node:test';
import assert from 'node:assert/strict';
import {observeImageryRequests,createImageryAvailability} from '../../runtimes/earth-runtime/core/imageryRequests.mjs';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}};
test('native scheduler undefined never counts as a dispatched or loaded request',async()=>{
 const p={requestImage:()=>undefined},guard=observeImageryRequests(p);assert.equal(p.requestImage(),undefined);assert.equal(guard.stats.requested,0);assert.equal(guard.stats.active,0);guard.stop();
});
test('a native pending request has no Hub timeout and retains its native result',async()=>{
 const task=deferred();let errors=0;const p={requestImage:()=>task.promise},guard=observeImageryRequests(p,{onError:()=>errors++});const pending=p.requestImage();await new Promise(resolve=>setTimeout(resolve,20));assert.equal(guard.stats.active,1);assert.equal(errors,0);task.resolve('native image');assert.equal(await pending,'native image');guard.stop();
});
test('teardown cancels active tiles; late resolution cannot call loaded hook',async()=>{
 const task=deferred();let loaded=0,cancelled=0;const provider={requestImage:()=>task.promise},guard=observeImageryRequests(provider,{onLoad:()=>loaded++});
 const pending=provider.requestImage(1,2,3,{cancel(){cancelled++}});guard.stop();await assert.rejects(pending,/disposed/);task.resolve('late');await Promise.resolve();assert.equal(loaded,0);assert.equal(cancelled,1);assert.equal(guard.stats.active,0);
});
test('Cesium cancellation rejects without a value and must not become a loaded tile',async()=>{
 let loaded=0,failed=0;const provider={requestImage:()=>Promise.reject()},guard=observeImageryRequests(provider,{onLoad:()=>loaded++,onError:()=>failed++});
 await assert.rejects(provider.requestImage(),/cancelled/);assert.equal(loaded,0);assert.equal(failed,0);assert.equal(guard.stats.cancelled,1);guard.stop();
});
test('native HTTP failure preserves the original rejection and host restrictions',async()=>{
 const error=Object.assign(Error('Access denied'),{statusCode:403}),availability=createImageryAvailability(),p={requestImage:()=>Promise.reject(error)},guard=observeImageryRequests(p,{budget:availability,host:'provider'});await assert.rejects(p.requestImage(),value=>value===error);assert.equal(availability.eligible('provider'),false);assert.equal(guard.stats.failed,1);assert.equal(guard.stats.active,0);guard.stop();
});

test('cached provider guard pauses reversibly without dispatch or late callbacks',async()=>{
 let calls=0;const provider={requestImage:()=>{calls++;return Promise.resolve('tile')}};
 const guard=observeImageryRequests(provider);guard.pause();assert.equal(provider.requestImage(),undefined);assert.equal(calls,0);guard.resume();await provider.requestImage();assert.equal(calls,1);guard.stop();guard.resume();assert.equal(provider.requestImage(),undefined);
});
test('availability telemetry shares counts without admitting or queuing requests',async()=>{
 const availability=createImageryAvailability(),tasks=[];const p={requestImage:()=>{const d=deferred();tasks.push(d);return d.promise}},guard=observeImageryRequests(p,{budget:availability,host:'same-host'});const pending=Array.from({length:12},()=>p.requestImage());assert.equal(availability.stats.active,12);for(const d of tasks)d.resolve('image');await Promise.all(pending);assert.equal(availability.stats.active,0);assert.equal(availability.stats.requested,12);guard.stop();
});

test('429 stops the whole host until explicit cooldown retry; unauthorized hosts never retry',async()=>{
 const {createImageryAvailability}=await import('../../runtimes/earth-runtime/core/imageryRequests.mjs');let now=0;const b=createImageryAvailability({clock:()=>now});b.block('eox',{statusCode:429,retryAfter:600});assert.equal(b.eligible('eox'),false);now=300000;assert.equal(b.retryHost('eox'),false);now=600000;assert.equal(b.eligible('eox'),false);assert.equal(b.retryHost('eox'),true);b.block('ion',{statusCode:403});now=1e9;assert.equal(b.retryHost('ion'),false);
});
test('a provider session cap counts accepted SDK requests, with no dispatch beyond cap',async()=>{
 let used=0,dispatched=0,limits=0;const p={requestImage:()=>{dispatched++;return Promise.resolve('image')}};const g=observeImageryRequests(p,{canDispatch:()=>used<2,onDispatch:()=>used++,onLimit:()=>limits++});await p.requestImage();await p.requestImage();assert.equal(p.requestImage(),undefined);assert.equal(used,2);assert.equal(dispatched,2);assert.equal(limits,1);g.stop();
});

test('late decoded imagery after cancellation releases its owned bitmap',async()=>{
 const task=deferred();let closed=0;const p={requestImage:()=>task.promise},guard=observeImageryRequests(p);const pending=p.requestImage();guard.stop();await assert.rejects(pending,/disposed/);task.resolve({close(){closed++}});await Promise.resolve();assert.equal(closed,1);
});

for(const detection of ['empty','throws'])test(`rejected decoded bitmap closes once when empty detection ${detection}`,async()=>{
 let closed=0,loaded=0;const errors=[],bitmap={close(){closed++}},failure=new Error('Detection failed');
 const {createImageryAvailability}=await import('../../runtimes/earth-runtime/core/imageryRequests.mjs');const budget=createImageryAvailability();
 const p={requestImage:()=>Promise.resolve(bitmap)},guard=observeImageryRequests(p,{budget,host:'naip',onLoad:()=>loaded++,onError:error=>errors.push(error),isEmpty:()=>{if(detection==='throws')throw failure;return true;}});
 await assert.rejects(p.requestImage(),error=>detection==='throws'?error===failure:error.message==='No imagery data'&&error.imageryGuardFailure===true);
 assert.equal(closed,1);assert.equal(loaded,0);assert.equal(errors.length,1);assert.equal(guard.stats.failed,1);assert.equal(guard.stats.loaded,0);assert.equal(guard.stats.active,0);assert.equal(budget.stats.active,0);assert.equal(budget.stats.requested,1);guard.stop();assert.equal(closed,1);
});
test('accepted decoded bitmap stays open for Cesium',async()=>{
 let closed=0;const bitmap={close(){closed++}},loaded=[];const p={requestImage:()=>Promise.resolve(bitmap)},guard=observeImageryRequests(p,{isEmpty:()=>false,onLoad:value=>loaded.push(value)});
 assert.equal(await p.requestImage(),bitmap);assert.deepEqual(loaded,[bitmap]);guard.stop();assert.equal(closed,0);
});
for(const detection of ['empty','throws'])test(`late cancelled bitmap closes once when empty detection ${detection}`,async()=>{
 const task=deferred();let closed=0,errors=0,loaded=0;const p={requestImage:()=>task.promise},guard=observeImageryRequests(p,{onError:()=>errors++,onLoad:()=>loaded++,isEmpty:()=>{if(detection==='throws')throw new Error('Detection failed');return true;}});
 const pending=p.requestImage();guard.pause();await assert.rejects(pending,/paused/);task.resolve({close(){closed++}});await Promise.resolve();guard.stop();
 assert.equal(closed,1);assert.equal(errors,0);assert.equal(loaded,0);assert.equal(guard.stats.cancelled,1);assert.equal(guard.stats.failed,0);assert.equal(guard.stats.active,0);
});
test('canvas and HTML images without disposal stay supported on accept and reject',async()=>{
 const image={width:256,height:256};for(const empty of [true,false]){const p={requestImage:()=>Promise.resolve(image)},guard=observeImageryRequests(p,{isEmpty:()=>empty});if(empty)await assert.rejects(p.requestImage(),/No imagery data/);else assert.equal(await p.requestImage(),image);assert.equal(guard.stats.active,0);guard.stop();}
});
test('a throwing bitmap close preserves the original failure and releases its slot',async()=>{
 let closed=0;const failure=new Error('Detection failed'),errors=[];const p={requestImage:()=>Promise.resolve({close(){closed++;throw new Error('Close failed');}})},guard=observeImageryRequests(p,{isEmpty:()=>{throw failure;},onError:error=>errors.push(error)});
 await assert.rejects(p.requestImage(),error=>error===failure);assert.equal(closed,1);assert.deepEqual(errors,[failure]);assert.equal(guard.stats.failed,1);assert.equal(guard.stats.active,0);guard.stop();
});

test('native SDK dispatch is not limited by a Hub rate or concurrency budget',async()=>{
 const tasks=[],p={requestImage:()=>{const task=deferred();tasks.push(task);return task.promise}},guard=observeImageryRequests(p);
 const requests=Array.from({length:20},()=>p.requestImage()),admitted=tasks.length;
 for(const task of tasks)task.resolve('image');await Promise.all(requests.filter(Boolean));guard.stop();assert.equal(admitted,20);assert.equal(guard.stats.loaded,20);
});

test('optional diagnostic observer cannot alter native image outcomes or counters',async()=>{const provider={requestImage:()=>Promise.resolve('pixels')},guard=observeImageryRequests(provider,{onObserve(){throw Error('diagnostic failed')}});assert.equal(await provider.requestImage(1,2,3),'pixels');assert.equal(guard.stats.loaded,1);assert.equal(guard.stats.active,0);guard.stop()});
