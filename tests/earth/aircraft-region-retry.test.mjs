import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {register} from 'node:module';
const source=process.env.GODS_EYE_SOURCE||'/var/tmp/oras-cesium/gods-eye';
if(!fs.existsSync(source+'/node_modules/cesium/Source/Cesium.js')){
 test('pinned aircraft region/retry integration requires installed GODS_EYE_SOURCE',{skip:true},()=>{});
}else{
 register('./fixtures/pinned-earth-loader.mjs',import.meta.url);
 const {EntityCollection,JulianDate,Cartesian3,Ellipsoid,Event}=await import('cesium');
 const {createFlightsAdapter}=await import('../../runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs');
 const {LayerRegistry}=await import('../../runtimes/earth-runtime/core/LayerRegistry.mjs');
 const flush=async()=>{for(let i=0;i<40;i++)await Promise.resolve()};
 function setup(t){
  t.mock.timers.enable({apis:['setTimeout','setInterval','Date'],now:1800000000000});
  let anchor=null;const statuses=new Map(),viewer={canvas:{clientWidth:1440,clientHeight:900},camera:{positionCartographic:{height:500000},positionWC:Cartesian3.fromDegrees(-79,41,500000),rightWC:new Cartesian3(1,0,0),upWC:new Cartesian3(0,1,0),changed:new Event(),moveEnd:new Event(),pickEllipsoid:()=>anchor},entities:new EntityCollection(),clock:{currentTime:JulianDate.fromDate(new Date())},scene:{globe:{ellipsoid:Ellipsoid.WGS84},cartesianToCanvasCoordinates:()=>({x:50,y:50}),requestRender(){}},isDestroyed:()=>false};
  const selection={value:null,clearLayer(){this.value=null},set(entity){this.value=entity}},context={viewer,observer:()=>({lat:41,lon:-79}),selection,camera:{stopTracking(){viewer.trackedEntity=null}},providerStatus:{set:(id,value)=>statuses.set(id,value),get:id=>statuses.get(id)},attribution:{set(){},remove(){}},abortSignal:new AbortController().signal};
  const layer=createFlightsAdapter(context),registry=new LayerRegistry(context,()=>{});registry.register({id:'aircraft',load:async()=>layer});t.after(()=>registry.destroy());
  return {layer,registry,viewer,selection,statuses,move(lat,lon){anchor=Cartesian3.fromDegrees(lon,lat);viewer.camera.changed.raiseEvent()}};
 }
 const snapshot=(cached=false)=>Response.json({now:Date.now()/1000,cached,ac:[{hex:'abc123',flight:'DECLARED FIXTURE',lat:41,lon:-79,alt_geom:30000,seen:0,seen_pos:0,gs:200}]});
 test('new-region loading and failure never publish previous-region source time or cache metadata',async t=>{
  const c=setup(t);let calls=0;t.mock.method(globalThis,'fetch',async()=>++calls===1?snapshot(true):new Response('',{status:503}));await c.registry.enable('aircraft');
  const previous=c.statuses.get('aircraft');assert.equal(previous.status,'ready');assert.equal(previous.cached,true);assert(previous.observedAt);c.move(43,-77);
  const loading=c.statuses.get('aircraft');t.mock.timers.tick(1000);await flush();const failed=c.statuses.get('aircraft');
  assert.equal(failed.status,'unavailable');assert.equal(c.viewer.entities.values.length,0);assert.deepEqual(failed.coverage.center,{lat:43,lon:-77});
  assert.deepEqual({loadingObservedAt:loading.observedAt,failedObservedAt:failed.observedAt,cached:failed.cached,ageMs:failed.ageMs,count:failed.count},{loadingObservedAt:null,failedObservedAt:null,cached:false,ageMs:null,count:0});
 });
 test('explicit registry retry preserves an unavailable selected identity without bypassing backoff or restarting follow; disable clears it',async t=>{
  const c=setup(t);const requests=[];t.mock.method(globalThis,'fetch',async()=>{requests.push(Date.now());return requests.length===2?new Response('',{status:503}):snapshot()});await c.registry.enable('aircraft');
  assert.equal(c.statuses.get('aircraft').status,'ready');const entity=c.viewer.entities.getById('aircraft:abc123');assert(entity);c.selection.value=entity;c.viewer.trackedEntity=entity;t.mock.timers.tick(30000);await flush();assert.equal(c.statuses.get('aircraft').status,'unavailable');assert.equal(c.selection.value,entity);assert.equal(entity.show,false);assert.equal(c.viewer.trackedEntity,null);
  // Existing RuntimeBridge retry fallback is disable/enable; the qualified retry hook replaces it.
  if(c.registry.retry)await c.registry.retry('aircraft');else{await c.registry.disable('aircraft');await c.registry.enable('aircraft')}
  assert.equal(c.selection.value,entity,'explicit Retry must keep the retained unavailable identity');assert.equal(requests.length,2,'Retry must honor existing upstream backoff');assert.equal(entity.show,false);
  t.mock.timers.tick(30000);await flush();assert.equal(requests.length,3);assert.equal(c.statuses.get('aircraft').status,'ready');assert.equal(c.selection.value,entity);assert.equal(c.viewer.entities.getById(entity.id),entity);assert.equal(entity.show,true);assert.equal(c.viewer.trackedEntity,null);
  await c.registry.disable('aircraft');assert.equal(c.selection.value,null);assert.equal(c.viewer.entities.values.length,0);assert.equal(c.layer.timer,null);
 });
 test('layers without a source retry hook retain disable/enable retry and closed registry does nothing',async()=>{
  const calls=[],registry=new LayerRegistry({},()=>{});registry.register({id:'other',load:async()=>({initialize(){},enable(){calls.push('enable')},disable(){calls.push('disable')},destroy(){calls.push('destroy')}})});await registry.enable('other');
  if(registry.retry)await registry.retry('other');else{await registry.disable('other');await registry.enable('other')}
  assert.deepEqual(calls,['enable','disable','enable']);await registry.destroy();if(registry.retry)await registry.retry('other');assert.deepEqual(calls,['enable','disable','enable','destroy']);
 });
}
