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
test('orbital to surface approach takes at most sixteen ordinary notches, with bounded monotonic steps',()=>{
 const h=harness();let count=0,previous=h.native.positionCartographic.height;
 while(previous>1500&&count<100){h.wheel(-120,10000+count*250);const next=h.native.positionCartographic.height;assert.ok(next<previous);assert.ok(next>=previous*.25);previous=next;count++;}
 assert.ok(count<=16,`required ${count} notches`);assert.notEqual(h.camera.gate.phase,'request');
});
test('small deltas near the surface give precise control; huge input cannot cross altitude bounds',()=>{
 const h=harness(200);h.wheel(-12);assert.ok(h.native.positionCartographic.height>190);assert.ok(h.native.positionCartographic.height<200);
 for(let i=0;i<40;i++)h.wheel(-1e6);assert.equal(h.native.positionCartographic.height,100);
 for(let i=0;i<40;i++)h.wheel(1e6);assert.equal(h.native.positionCartographic.height,30000000);
});
