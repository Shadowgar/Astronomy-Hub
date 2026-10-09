import test from 'node:test';import assert from 'node:assert/strict';
import {regionalAircraft,bracket,regionPoint,validRawPositionAge,cachedAnchor} from '../../runtimes/earth-runtime/layers/aircraftPolicy.mjs';
test('regional admission reconciles duplicate, stale, missing height, invalid and out-of-region rows',()=>{
 const now=1800000000000,row=['abc123','CALL',null,now/1000,now/1000,-79,41,1000,false,null,null,null,null,3000];
 const variant=(id,index,value)=>{const r=[...row];r[0]=id;r[index]=value;return r};
 const result=regionalAircraft({time:now/1000,states:[row,[...row],variant('abc124',6,91),variant('abc125',13,null),variant('abc126',3,now/1000-200),variant('abc127',5,20)]},{lat:41,lon:-79},now);
 assert.equal(result.records.length,1);assert.deepEqual(result.counts,{parsed:6,valid:3,admitted:1,filtered:5,duplicates:1,outside:1});
});
test('motion brackets real fixes and holds observations beyond either end; no coast or future telemetry',()=>{
 const a={time:1000,position:'a'},b={time:31000,position:'b'},h=[a,b];
 assert.deepEqual(bracket(h,46000),{a,b,t:.5,estimated:true});
 assert.deepEqual(bracket(h,100000),{a:b,b,t:0,estimated:false});
 assert.deepEqual(bracket(h,20000),{a,b:a,t:0,estimated:false});
 assert.equal(bracket([],100000),null);
});
test('rounding matches bounded provider cells and missing/negative position age stays unavailable',()=>{
 assert.deepEqual(regionPoint({lat:41.321903,lon:-79.585394}),{lat:41.3,lon:-79.6});
 assert.equal(validRawPositionAge({lat:41,lon:-79,seen:0}),false);
 assert.equal(validRawPositionAge({lat:41,lon:-79,seen_pos:-1}),false);
 assert.equal(validRawPositionAge({lat:41,lon:-79,seen_pos:0}),true);
});

test('fresh cached region covers nearby return anchors without changing the disclosed source center',()=>{
 const now=1800000000000,original={lat:41.3,lon:-79.6},nearby={lat:41.8,lon:-79.6},far={lat:41.3,lon:-70};
 const cache=new Map([['original',{center:original,received:now-5000}],['far',{center:far,received:now-1000}]]);
 assert.deepEqual(cachedAnchor(cache,nearby,now),original);
 assert.deepEqual(cachedAnchor(cache,{lat:41.3,lon:-69.9},now),far);
 assert.deepEqual(cachedAnchor(cache,nearby,now+30000),nearby);
 assert.deepEqual(cachedAnchor(cache,{lat:0,lon:0},now),{lat:0,lon:0});
 assert.deepEqual(original,{lat:41.3,lon:-79.6});
});
