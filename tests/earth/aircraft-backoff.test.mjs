import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {register} from 'node:module';
const source=process.env.GODS_EYE_SOURCE||'/var/tmp/oras-cesium/gods-eye';
if(!fs.existsSync(source+'/node_modules/cesium/Source/Cesium.js')){
 test('pinned aircraft backoff integration requires installed GODS_EYE_SOURCE',{skip:true},()=>{});
}else{
 register('./fixtures/pinned-earth-loader.mjs',import.meta.url);
 const {EntityCollection,JulianDate,Cartesian3,Ellipsoid,Event}=await import('cesium');
 const {createFlightsAdapter}=await import('../../runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs');
 const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve()};
 for(const [header,delay] of [['120',120000],['1',30000],['invalid',30000]])test(`actual pinned aircraft ingestion honors Retry-After ${header} with the approved 30-second minimum`,async t=>{
  t.mock.timers.enable({apis:['setTimeout','setInterval','Date'],now:1800000000000});
  const requests=[],statuses=new Map(),viewer={canvas:{clientWidth:1440,clientHeight:900},camera:{positionCartographic:{height:500000},positionWC:Cartesian3.fromDegrees(-79,41,500000),rightWC:new Cartesian3(1,0,0),upWC:new Cartesian3(0,1,0),changed:new Event(),moveEnd:new Event(),pickEllipsoid:()=>null},entities:new EntityCollection(),clock:{currentTime:JulianDate.fromDate(new Date())},scene:{globe:{ellipsoid:Ellipsoid.WGS84},requestRender(){}},isDestroyed:()=>false};
  t.mock.method(globalThis,'fetch',async()=>{requests.push(Date.now());return requests.length===1?new Response('',{status:429,headers:{'Retry-After':header}}):Response.json({now:Date.now()/1000,ac:[]})});
  const context={viewer,observer:()=>({lat:41,lon:-79}),selection:{value:null,clearLayer(){},set(){}},camera:{stopTracking(){}},providerStatus:{set:(id,value)=>statuses.set(id,value),get:id=>statuses.get(id)},attribution:{set(){},remove(){}},abortSignal:new AbortController().signal};
  const layer=createFlightsAdapter(context);layer.initialize(context);t.after(()=>layer.destroy());await layer.enable();
  assert.equal(statuses.get('aircraft').status,'unavailable');assert.equal(requests.length,1);
  t.mock.timers.tick(delay-1);await flush();assert.equal(requests.length,1,'no premature acquisition during server backoff');
  t.mock.timers.tick(1);await flush();assert.equal(requests.length,2);assert.equal(requests[1]-requests[0],delay);assert.equal(statuses.get('aircraft').status,'ready');
  t.mock.timers.tick(29999);await flush();assert.equal(requests.length,2,'successful recovery restores the ordinary cadence');
  t.mock.timers.tick(1);await flush();assert.equal(requests.length,3);
  layer.disable();t.mock.timers.tick(120000);await flush();assert.equal(requests.length,3,'disable cancels both animation and next acquisition');assert.equal(layer.timer,null);
 });
}
