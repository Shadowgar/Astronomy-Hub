import test from 'node:test';import assert from 'node:assert/strict';
import {harness} from './helpers/camera-harness.mjs';
test('snapshot and repeated pre-departure cancellation preserve native tracking and flight',async()=>{
 const h=harness(40000,{bridge:true}),satellite={id:'fixture-satellite',orasMetadata:{layerId:'satellites'}};h.camera.track(satellite);
 let cancelled=0;h.native.cancelFlight=()=>cancelled++;const generation=h.camera.flightGeneration;
 for(let n=0;n<8;n++){
  const before={...h.native.positionWC},result=await h.endpoint.execute('getNavigationState',{});
  assert.equal(result.ok,true);assert.equal(h.viewer.trackedEntity,satellite,'inspection must not stop tracking');assert.equal(cancelled,0,'inspection must not cancel native flight');
  await h.endpoint.execute('resetNavigation',{});assert.equal(h.viewer.trackedEntity,satellite);assert.deepEqual({...h.native.positionWC},before);assert.equal(h.camera.flightGeneration,generation);
 }
 await h.endpoint.execute('destroy',{});assert.equal(h.viewer.trackedEntity,undefined);assert.equal(h.lifecycle.closed,true);assert.equal(h.preUpdate.listeners.size,0);assert.equal(h.camera.closed,true);assert.equal(cancelled,1);
});
test('snapshot and cancelled handoff preserve the accepted ongoing wheel animation',async()=>{
 const h=harness(40000,{bridge:true});h.wheel(-120);h.step(16);const motion=h.camera.motion,callbacks=h.preUpdate.listeners.size;
 assert.equal(callbacks,1);const before=h.native.positionCartographic.height;
 await h.endpoint.execute('getNavigationState',{});assert.equal(h.camera.motion,motion,'snapshot must not cancel animation');
 await h.endpoint.execute('resetNavigation',{});assert.equal(h.camera.motion,motion,'cancel resets intent, not animation');assert.equal(h.preUpdate.listeners.size,callbacks);
 assert.ok(h.step(16)<before);h.settle();assert.equal(h.preUpdate.listeners.size,0);assert.equal(h.controller.enableInputs,true);
});

test('inspection preserves pending native flight completion, and committed destruction drains cancellation',async()=>{
 const h=harness(40000,{bridge:true});let flight;h.native.flyToBoundingSphere=(_sphere,options)=>{flight=options};h.native.cancelFlight=()=>flight?.cancel?.();
 const pending=h.camera.navigateLocation({lat:0,lon:0});const generation=h.camera.flightGeneration;
 await h.endpoint.execute('getNavigationState',{});await h.endpoint.execute('resetNavigation',{});assert.equal(h.camera.flightGeneration,generation);flight.complete();assert.equal(await pending,true);
 const leaving=h.camera.navigateLocation({lat:0,lon:0});await h.endpoint.execute('destroy',{});assert.equal(await leaving,false);assert.equal(h.lifecycle.closed,true);assert.equal(h.preUpdate.listeners.size,0);
});
