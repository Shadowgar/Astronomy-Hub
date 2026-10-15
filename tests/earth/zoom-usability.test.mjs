import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';import {ContinuedInput} from '../../packages/runtime-protocol/continued-input.mjs';
const source=readFileSync(process.env.N1_CAMERA_SOURCE||new URL('../../runtimes/earth-runtime/core/CameraController.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export class','class')+'; CameraController';
function harness(height=15621863){
 const canvas=new EventTarget();canvas.clientHeight=900;class vectors{static clone(v){return {...v}}static multiplyByScalar(v,k){return {z:v.z*k}}static add(a,b){return {z:a.z+b.z}}}
 const Camera=runInNewContext(source,{ContinuedInput,matchMedia:()=>({matches:true}),Cartesian3:vectors,CameraEventType:{WHEEL:'wheel'},ScreenSpaceEventType:{LEFT_DOUBLE_CLICK:'double'},performance});
 const native={positionWC:{z:height},directionWC:{z:-1},upWC:{z:0},positionCartographic:{height},cancelFlight(){},setView({destination}){this.positionWC=destination;this.positionCartographic.height=destination.z;}};
 const viewer={canvas,camera:native,scene:{requestRender(){},screenSpaceCameraController:{zoomEventTypes:['wheel'],minimumZoomDistance:100,maximumZoomDistance:30000000},globe:{getHeight:()=>0,ellipsoid:{cartesianToCartographic:v=>({height:v.z}),cartographicToCartesian:p=>({z:p.height})}}},screenSpaceEventHandler:{setInputAction(){}}};
 const camera=new Camera(viewer);camera.surfaceTarget=()=>({rangeM:native.positionCartographic.height,lat:41,lon:-79});
 const wheel=(delta,time=10000)=>{const event=new Event('wheel',{cancelable:true});Object.assign(event,{deltaY:delta,deltaMode:0});Object.defineProperty(event,'timeStamp',{value:time});canvas.dispatchEvent(event)};
 return {native,camera,wheel};
}
test('orbital traversal stays fast while approach uses a gradual curve',()=>{
 const h=harness();let count=0,previous=h.native.positionCartographic.height;
 while(previous>40000&&count<100){h.wheel(-120,10000+count*250);const next=h.native.positionCartographic.height;assert.ok(next<previous);assert.ok(next>=previous*.25);previous=next;count++;}
 assert.ok(count<=9,`required ${count} notches`);assert.notEqual(h.camera.gate.phase,'request');
});
test('small deltas near the surface give precise control; huge input cannot cross altitude bounds',()=>{
 const h=harness(200);h.wheel(-12);assert.ok(h.native.positionCartographic.height>190);assert.ok(h.native.positionCartographic.height<200);
 for(let i=0;i<40;i++)h.wheel(-1e6);assert.equal(h.native.positionCartographic.height,100);
 for(let i=0;i<200;i++)h.wheel(1e6);assert.equal(h.native.positionCartographic.height,30000000);
});

test('40 km approach takes 12–18 ordinary notches, with substantially finer steps near the ground',()=>{
 const h=harness(40000),heights=[40000];let count=0;
 while(heights.at(-1)>1500&&count<30){h.wheel(-120,10000+count*600);heights.push(h.native.positionCartographic.height);count++;}
 assert.ok(count>=12&&count<=18,`40 km approach took ${count} notches`);
 for(const start of [200000,100000,40000,10000,2000,1500]){
  const probe=harness(start);probe.wheel(-120);const fraction=1-probe.native.positionCartographic.height/start;
  assert.ok(fraction<(start<=2000?.11:start<=10000?.23:start<=40000?.36:.60),`${start} m step fraction ${fraction}`);
 }
});
test('near-surface small deltas and large/coalesced packets stay fine, and reverse zoom remains responsive',()=>{
 const h=harness(2000);h.wheel(-12);assert.ok(h.native.positionCartographic.height>1970);
 const large=harness(2000);large.wheel(-12000);assert.ok(large.native.positionCartographic.height>1750);
 const out=harness(1500);let steps=0;while(out.native.positionCartographic.height<40000&&steps<30){out.wheel(120);steps++;}assert.ok(steps<=21);
});
