import test from 'node:test';import assert from 'node:assert/strict';
import {regionalAircraft,bracket,regionPoint,validRawPositionAge,cachedAnchor,viewRegion,aircraftCohort} from '../../runtimes/earth-runtime/layers/aircraftPolicy.mjs';
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

test('initial enable follows an already settled distant view and keeps observer default for nearby home',()=>{
 const current={lat:41.3,lon:-79.6},near={lat:41.4,lon:-79.6},far={lat:41,lon:-73},cache=new Map();
 assert.deepEqual(viewRegion(current,null,cache),current);
 assert.deepEqual(viewRegion(current,near,cache),current);
 assert.deepEqual(viewRegion(current,far,cache),far);
});
test('capped cohorts reserve still-admitted selected and followed identities without synthesizing missing contacts',()=>{
 const rows=['000001','000002','000003','abc001','abc002'].map(id=>({id}));
 assert.deepEqual(aircraftCohort(rows,3,['abc001','abc002']).map(r=>r.id),['abc001','abc002','000001']);
 assert.deepEqual(aircraftCohort(rows,3,['missing']).map(r=>r.id),['000001','000002','000003']);
 assert.deepEqual(rows.map(r=>r.id),['000001','000002','000003','abc001','abc002']);
});

test('recovery after a five-minute outage holds the new observation instead of interpolating the gap',()=>{
 const a={time:1000,position:'old'},b={time:301000,position:'recovered'};
 assert.deepEqual(bracket([a,b],301000),{a:b,b,t:0,estimated:false});
});
test('interpolation has a bounded 90-second gap and duplicate epochs never divide by zero',()=>{
 const a={time:1000},b={time:91000},c={time:91001};
 assert.equal(bracket([a,b],106000).estimated,true);
 assert.deepEqual(bracket([a,c],106000),{a:c,b:c,t:0,estimated:false});
 const duplicate={...a};assert.deepEqual(bracket([a,duplicate],31000),{a:duplicate,b:duplicate,t:0,estimated:false});
});
