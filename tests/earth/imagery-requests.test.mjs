import test from 'node:test';
import assert from 'node:assert/strict';
import {boundImageryRequests} from '../../runtimes/earth-runtime/core/imageryRequests.mjs';
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no});return {promise,resolve,reject}};
test('tile concurrency is bounded; Cesium scheduler throttling does not consume a slot',async()=>{
 const tasks=[],provider={requestImage(){const task=deferred();tasks.push(task);return task.promise}};
 const guard=boundImageryRequests(provider,{limit:2});
 const one=provider.requestImage(),two=provider.requestImage();assert.equal(provider.requestImage(),undefined);assert.equal(guard.stats.peak,2);
 tasks[0].resolve('tile');assert.equal(await one,'tile');tasks[1].resolve('tile');await two;assert.equal(guard.stats.active,0);guard.stop();assert.equal(provider.requestImage(),undefined);
 const throttled=boundImageryRequests({requestImage:()=>undefined});assert.equal(throttled.stats.requested,0);throttled.stop();
});
test('stalled tile times out and cancels its Cesium request without retry',async()=>{
 let cancelled=0;const provider={requestImage:()=>new Promise(()=>{})},guard=boundImageryRequests(provider,{timeoutMs:15});
 await assert.rejects(provider.requestImage(1,2,3,{cancel(){cancelled++}}),/timed out/);
 assert.equal(cancelled,1);assert.equal(guard.stats.failed,1);assert.equal(guard.stats.active,0);guard.stop();
});
test('teardown cancels active tiles; late resolution cannot call loaded hook',async()=>{
 const task=deferred();let loaded=0,cancelled=0;const provider={requestImage:()=>task.promise},guard=boundImageryRequests(provider,{onLoad:()=>loaded++});
 const pending=provider.requestImage(1,2,3,{cancel(){cancelled++}});guard.stop();await assert.rejects(pending,/disposed/);task.resolve('late');await Promise.resolve();assert.equal(loaded,0);assert.equal(cancelled,1);assert.equal(guard.stats.active,0);
});
test('Cesium cancellation rejects without a value and must not become a loaded tile',async()=>{
 let loaded=0,failed=0;const provider={requestImage:()=>Promise.reject()},guard=boundImageryRequests(provider,{onLoad:()=>loaded++,onError:()=>failed++});
 await assert.rejects(provider.requestImage(),/cancelled/);assert.equal(loaded,0);assert.equal(failed,0);assert.equal(guard.stats.cancelled,1);guard.stop();
});
test('timeout reports provider failure even when cancellation suppresses Cesium error events',async()=>{
 let failures=0;const provider={requestImage:()=>new Promise(()=>{})},guard=boundImageryRequests(provider,{timeoutMs:10,onError:()=>failures++});
 await assert.rejects(provider.requestImage(0,0,0,{cancel(){this.state=4}}),/timed out/);assert.equal(failures,1);guard.stop();
});

test('cached provider guard pauses reversibly without dispatch or late callbacks',async()=>{
 let calls=0;const provider={requestImage:()=>{calls++;return Promise.resolve('tile')}};
 const guard=boundImageryRequests(provider);guard.pause();assert.equal(provider.requestImage(),undefined);assert.equal(calls,0);guard.resume();await provider.requestImage();assert.equal(calls,1);guard.stop();guard.resume();assert.equal(provider.requestImage(),undefined);
});
test('shared budget limits all hosts/providers and refunds scheduler-undefined requests',async()=>{
 const {createImageryBudget}=await import('../../runtimes/earth-runtime/core/imageryRequests.mjs');
 let now=0;const budget=createImageryBudget({clock:()=>now,globalLimit:2,hostLimit:1});
 const tasks=[],make=host=>{const p={requestImage:()=>{const d=deferred();tasks.push(d);return d.promise}};return {p,g:boundImageryRequests(p,{budget,host})}};
 const a=make('a'),b=make('a'),c=make('b');const one=a.p.requestImage();assert.equal(b.p.requestImage(),undefined);const two=c.p.requestImage();assert.equal(budget.stats.active,2);tasks[0].resolve('x');tasks[1].resolve('x');await Promise.all([one,two]);assert.equal(budget.stats.active,0);a.g.stop();b.g.stop();c.g.stop();
 const blocked={requestImage:()=>undefined};const guard=boundImageryRequests(blocked,{budget,host:'c'});for(let i=0;i<20;i++)assert.equal(blocked.requestImage(),undefined);assert.equal(budget.stats.requested,2);guard.stop();
});

test('429 stops the whole host until explicit cooldown retry; unauthorized hosts never retry',async()=>{
 const {createImageryBudget}=await import('../../runtimes/earth-runtime/core/imageryRequests.mjs');let now=0;const b=createImageryBudget({clock:()=>now});b.block('eox',{statusCode:429,retryAfter:600});assert.equal(b.take('eox'),null);now=300000;assert.equal(b.retryHost('eox'),false);now=600000;assert.equal(b.eligible('eox'),false);assert.equal(b.retryHost('eox'),true);b.block('ion',{statusCode:403});now=1e9;assert.equal(b.retryHost('ion'),false);
});
test('a provider session cap counts accepted SDK requests, with no dispatch beyond cap',async()=>{
 let used=0,dispatched=0,limits=0;const p={requestImage:()=>{dispatched++;return Promise.resolve('image')}};const g=boundImageryRequests(p,{canDispatch:()=>used<2,onDispatch:()=>used++,onLimit:()=>limits++});await p.requestImage();await p.requestImage();assert.equal(p.requestImage(),undefined);assert.equal(used,2);assert.equal(dispatched,2);assert.equal(limits,1);g.stop();
});
