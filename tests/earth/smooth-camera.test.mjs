import test from 'node:test';
import assert from 'node:assert/strict';
import {harness,V,R} from './helpers/camera-harness.mjs';
test('one wheel event moves only on frames and supplies many monotonic intermediate positions',()=>{
 const h=harness();h.wheel(-120);assert.equal(h.native.positionCartographic.height,40000,'no event-time teleport');
 const heights=Array.from({length:40},()=>h.step(16));assert.ok(new Set(heights.map(n=>n.toFixed(4))).size>12);
 assert.ok(heights.every((v,i)=>v<=(i?heights[i-1]:40000)));assert.ok(heights[0]<40000);assert.ok(heights.at(-1)<35000);
});
test('equal elapsed time produces the same position with 30, 60, 144 Hz and uneven frame intervals',()=>{
 const sequences=[Array(15).fill(1000/30),Array(30).fill(1000/60),Array(72).fill(1000/144),[7,80,13,200,50,150]];
 const heights=sequences.map(seq=>{const h=harness();h.wheel(-120);for(const dt of seq)h.step(dt);return h.native.positionCartographic.height});assert.ok(Math.max(...heights)-Math.min(...heights)<.001);
});
test('scroll accumulates and decelerates to actual rest without idle rendering',()=>{
 const single=harness(),many=harness();single.wheel(-120);many.wheel(-120);many.step(30);many.wheel(-120);many.step(30);many.wheel(-120);single.settle();many.settle();assert.ok(many.native.positionCartographic.height<single.native.positionCartographic.height);
 assert.equal(many.preUpdate.listeners.size,0);const count=many.positions.length,renders=many.renders;many.step(5000);assert.equal(many.positions.length,count);assert.equal(many.renders,renders);
 const h=harness();h.wheel(-120);const heights=Array.from({length:60},()=>h.step(16)),speeds=heights.slice(1).map((v,i)=>Math.abs(v-heights[i]));const peak=speeds.indexOf(Math.max(...speeds));assert.ok(speeds.slice(peak+1).every((v,i)=>v<=speeds[peak+i]+.001));assert.equal(speeds.at(-1),0);
});
test('opposite input reverses the next frame, discarding unconsumed inward motion',()=>{
 const h=harness();h.wheel(-120);h.step(60);const before=h.native.positionCartographic.height;h.wheel(12);assert.ok(h.step(16)>before);h.settle();assert.ok(h.native.positionCartographic.height>before);
});
test('small trackpad input is proportional; rapid/coalesced input has bounded pending travel',()=>{
 const small=harness(),large=harness();small.wheel(-1);large.wheel(-12);small.settle();large.settle();const a=40000-small.native.positionCartographic.height,b=40000-large.native.positionCartographic.height;assert.ok(b>a*10&&b<a*14);
 const burst=harness();for(let i=0;i<1000;i++)burst.wheel(-1e6);assert.equal(burst.native.positionCartographic.height,40000);burst.step(16);assert.ok(burst.native.positionCartographic.height>36000);burst.settle();assert.ok(burst.native.positionCartographic.height>9000);
});
test('pointer, keyboard and all camera navigation actions cancel residual zoom',async()=>{
 for(const action of [h=>h.canvas.dispatchEvent(new Event('pointerdown')),h=>{const e=new Event('keydown',{cancelable:true});Object.assign(e,{key:'ArrowLeft'});h.native.rotateRight=()=>{};h.canvas.dispatchEvent(e)},h=>h.camera.home({lat:0,lon:0}),h=>h.camera.restoreView({latitudeRad:0,longitudeRad:0,heightM:40000,headingRad:0,pitchRad:-Math.PI/2,rollRad:0}),h=>h.camera.navigateLocation({lat:0,lon:0}),h=>h.camera.returnToSite({lat:0,lon:0,elevationM:0},false),h=>h.camera.focus({orasMetadata:{layerId:'aircraft'}}),h=>h.camera.track({orasMetadata:{layerId:'satellites'}}),h=>h.camera.resetNavigation()]){
  const h=harness();h.wheel(-120);h.step(35);await action(h);const n=h.positions.length;h.step(1000);assert.equal(h.positions.length,n,'cancelled animation must never resume');assert.equal(h.preUpdate.listeners.size,0);
 }
});
test('bounds preserve the center target and orientation even on oblique approach',()=>{
 for(const angle of [0,.7]){const h=harness(200,{angle}),direction={...h.native.directionWC},up={...h.native.upWC};for(let i=0;i<40;i++){h.wheel(-12000,undefined,{ctrlKey:true});h.settle()}assert.ok(Math.abs(h.native.positionCartographic.height-100)<.001);
  const unit=V.normalize(V.subtract(new V(R,0,0),h.native.positionWC));assert.ok(V.distance(unit,direction)<1e-8);assert.deepEqual({...h.native.upWC},up);
  for(let i=0;i<100;i++){h.wheel(12000,undefined,{ctrlKey:true});h.settle()}assert.ok(Math.abs(h.native.positionCartographic.height-30000000)<.01);assert.ok(h.positions.every(n=>n>=100-.001&&n<=30000000+.001));
 }
});
test('missing intersection and teardown leave no callbacks or corrupted position',()=>{
 const miss=harness(40000,{hit:false});miss.wheel(-120);miss.step(100);assert.equal(miss.native.positionCartographic.height,40000);assert.equal(miss.preUpdate.listeners.size,0);
 const h=harness();h.wheel(-120);h.step(30);h.camera.destroy();const n=h.positions.length;h.step(10000);h.wheel(-120);h.step(100);assert.equal(h.positions.length,n);assert.equal(h.preUpdate.listeners.size,0);assert.deepEqual(h.controller.zoomEventTypes,['wheel','pinch','right']);
});
test('animation arrival and residual motion cannot earn Sky intent; fresh continuation can',()=>{
 const h=harness(1600);for(let i=0;i<4;i++){h.wheel(-120);h.step(30)}h.settle();assert.ok(h.native.positionCartographic.height<1500);assert.ok(h.intents.every(v=>v.phase!=='request'));
 h.step(3000);assert.ok(h.intents.every(v=>v.phase!=='request'));for(let i=0;i<12;i++){h.wheel(-120);h.step(180)}assert.ok(h.intents.some(v=>v.phase==='request'));assert.equal(h.preUpdate.listeners.size,0,'handoff freezes outgoing camera');
 h.camera.resetNavigation();const n=h.positions.length;h.step(500);assert.equal(h.positions.length,n);assert.equal(h.intents.at(-1).phase,'idle');
});
test('bridge wheel interaction does not cancel the animation it just started',()=>{
 const h=harness(40000,{bridge:true});h.wheel(-120);assert.equal(h.native.positionCartographic.height,40000);assert.ok(h.step(16)<40000);h.settle();assert.ok(h.native.positionCartographic.height<35000);
});
test('arrival shows boundary guidance without crediting animation as deliberate input',()=>{
 const h=harness(1510);h.wheel(-120);h.settle();assert.ok(h.native.positionCartographic.height<1500);assert.equal(h.intents.at(-1)?.phase,'boundary');assert.equal(h.camera.gate.count,0);assert.equal(h.camera.gate.start,null);
 h.wheel(120);h.settle();assert.ok(h.intents.every(v=>v.phase!=='request'));
});
test('standalone Earth can keep zooming and reverse after sustained surface input',()=>{
 const h=harness(1400,{embedded:false});
 for(let i=0;i<12;i++){h.wheel(-120);h.step(180)}
 const before=h.native.positionCartographic.height;h.wheel(120);h.settle();assert.ok(h.native.positionCartographic.height>before,'standalone outward wheel must remain usable');
 const outward=h.native.positionCartographic.height;h.wheel(120,undefined,{ctrlKey:true});h.settle();assert.ok(h.native.positionCartographic.height>outward);
 assert.ok(h.intents.every(v=>v.phase!=='request'),'standalone must not request a Hub transition');
});
