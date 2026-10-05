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
