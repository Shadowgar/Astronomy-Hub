import test from 'node:test';
import assert from 'node:assert/strict';
import {harness} from './helpers/camera-harness.mjs';
// The owner superseded all notch-count acceptance targets. These compare actual motion.
test('altitude gain is continuous across orbital, regional and near-surface scales',()=>{
 const fraction=start=>{const h=harness(start);h.wheel(-12);h.settle();return 1-h.native.positionCartographic.height/start};
 let previous=0;
 for(const height of [200,1500,2000,10000,40000,100000,200000,1000000,15621863]){
  const value=fraction(height);assert.ok(value>previous);previous=value;
  assert.ok(Math.abs(fraction(height*.999)-fraction(height*1.001))<.001,'no altitude band discontinuity');
 }
 assert.ok(fraction(200)<.01);assert.ok(fraction(15621863)>.09);
});
test('equivalent pixel, line and page deltas give equivalent movement',()=>{
 const heights=[[-120,0],[-3,1],[-120/900,2]].map(([delta,deltaMode])=>{const h=harness();h.wheel(delta,undefined,{deltaMode});h.settle();return h.native.positionCartographic.height});
 assert.ok(Math.max(...heights)-Math.min(...heights)<.001);
});
test('native inputs have exclusive ownership after pointer cancellation, with settings restored',()=>{
 const h=harness();h.wheel(-120);assert.equal(h.controller.enableInputs,false);assert.deepEqual(h.controller.zoomEventTypes,['pinch','right']);
 h.canvas.dispatchEvent(new Event('pointerdown'));assert.equal(h.controller.enableInputs,true);assert.equal(h.controller.inertiaSpin,.25);assert.equal(h.controller.inertiaZoom,.35);
 const before=h.native.positionCartographic.height;h.step(1000);assert.equal(h.native.positionCartographic.height,before);
});
