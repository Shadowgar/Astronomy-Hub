import test from 'node:test';import assert from 'node:assert/strict';
import {prepareVisibleTile} from '../../runtimes/earth-runtime/core/visibleImagery.mjs';
import {boundImageryRequests,createImageryBudget} from '../../runtimes/earth-runtime/core/imageryRequests.mjs';
test('one visible readiness tile is budgeted and reused once without an extra server request',async()=>{
 let requests=0,used=0;const image={width:256},p={requestImage:()=>{requests++;return Promise.resolve(image)}},budget=createImageryBudget(),guard=boundImageryRequests(p,{budget,host:'usgs',limit:2});guard.pause();
 const prepared=await prepareVisibleTile(p,{tile:{x:1,y:2,level:18},request:{cancel(){}},guard,signal:new AbortController().signal,onUse:()=>used++});assert.equal(requests,1);assert.equal(budget.stats.active,0);assert.equal(guard.paused,true);guard.resume();assert.equal(await p.requestImage(1,2,18),image);assert.equal(requests,1);assert.equal(used,1);await p.requestImage(2,2,18);assert.equal(requests,2);prepared.dispose();guard.stop();
});
test('a stalled visible readiness tile releases its lease and never claims usable imagery',async()=>{
 let cancelled=0;const p={requestImage:()=>new Promise(()=>{})},budget=createImageryBudget(),guard=boundImageryRequests(p,{budget,host:'usgs',limit:2});guard.pause();await assert.rejects(prepareVisibleTile(p,{tile:{x:1,y:2,level:18},request:{cancel(){cancelled++}},guard,signal:new AbortController().signal,timeoutMs:10}),/readiness/);assert.equal(budget.stats.active,0);assert.ok(cancelled>=1);assert.equal(guard.paused,true);guard.stop();
});
test('unconsumed readiness imagery is released at owned disposal',async()=>{
 let closed=0;const image={close(){closed++}},p={requestImage:()=>Promise.resolve(image)},guard=boundImageryRequests(p);guard.pause();const prepared=await prepareVisibleTile(p,{tile:{x:1,y:2,level:18},request:{cancel(){}},guard,signal:new AbortController().signal});prepared.dispose();prepared.dispose();assert.equal(closed,1);guard.stop();
});

test('a bounded visible ancestor and detail pair seeds native refinement without duplicate requests',async()=>{
 let requests=0;const p={requestImage:(x,y,level)=>{requests++;return Promise.resolve({level})}},budget=createImageryBudget(),guard=boundImageryRequests(p,{budget,host:'usgs',limit:2});guard.pause();const tiles=[{x:1,y:2,level:14},{x:4,y:8,level:18}];const prepared=await prepareVisibleTile(p,{tile:tiles[0],tiles,request:{cancel(){}},requestFactory:()=>({cancel(){}}),guard,signal:new AbortController().signal});assert.equal(requests,2);assert.equal(guard.stats.peak,2);guard.resume();assert.equal((await p.requestImage(1,2,14)).level,14);assert.equal((await p.requestImage(4,8,18)).level,18);assert.equal(requests,2);prepared.dispose();guard.stop();
});
