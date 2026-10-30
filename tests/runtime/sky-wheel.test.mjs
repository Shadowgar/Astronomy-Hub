import test,{mock} from 'node:test';
import assert from 'node:assert/strict';
import {installNativeWheel} from '../../runtimes/sky-adapter/native-wheel.mjs';
function harness(){
 const canvas=new EventTarget();canvas.getBoundingClientRect=()=>({left:10,top:20,height:800});
 const calls=[];const remove=installNativeWheel(canvas,{_core_on_zoom:(...args)=>calls.push(args)});
 const wheel=(deltaY,deltaMode=0)=>{const e=new Event('wheel',{cancelable:true});Object.assign(e,{deltaY,deltaMode,clientX:210,clientY:320});canvas.dispatchEvent(e);return e};
 return {calls,wheel,remove};
}
test('standard wheel reaches native SWE zoom with cursor coordinates and cancels page scrolling',()=>{
 const h=harness();assert.equal(h.wheel(-120).defaultPrevented,true);assert.equal(h.calls.length,1);
 assert.deepEqual(h.calls[0],[1.05**2,200,300]);h.wheel(120);assert.ok(h.calls[1][0]<1);
});
test('qualified FOV clamp ignores arrival then accepts sustained continuation; removal releases input',()=>{
 let now=0;const notices=[],canvas=new EventTarget();canvas.getBoundingClientRect=()=>({left:0,top:0,height:800});
 const engine={core:{fov:180*Math.PI/180,projection:2},_core_on_zoom(k){this.core.fov=Math.min(185*Math.PI/180,this.core.fov/k)}};
 const remove=installNativeWheel(canvas,engine,{enabled:()=>true,now:()=>now,onBoundary:v=>notices.push(v)});
 const wheel=(deltaY,time)=>{now=time;const e=new Event('wheel',{cancelable:true});Object.assign(e,{deltaY,deltaMode:0,clientX:200,clientY:200});canvas.dispatchEvent(e)};
 for(let t=0;t<300;t+=20)wheel(120,t);
 assert.equal(notices.some(n=>n.phase==='request'),false);assert.ok(notices.some(n=>n.phase==='boundary'));
 for(let t=400;t<=1000;t+=100)wheel(120,t);assert.ok(notices.some(n=>n.phase==='request'));
 remove();const count=notices.length;wheel(120,2000);assert.equal(notices.length,count);
});
test('rendering stalls cannot turn continuously timestamped wheel input into a second gesture',()=>{
 let processing=1000;mock.method(performance,'now',()=>processing);
 try{
  const canvas=new EventTarget();canvas.getBoundingClientRect=()=>({left:0,top:0,height:800});const notices=[];
  const engine={core:{fov:185*Math.PI/180,projection:2},_core_on_zoom(){}};
  const remove=installNativeWheel(canvas,engine,{enabled:()=>true,onBoundary:value=>notices.push(value)});
  for(const [index,delay] of [0,400,100,150,500,100,150].entries()){
   processing+=delay;const e=new Event('wheel',{cancelable:true});Object.defineProperty(e,'timeStamp',{value:1000+index*60});Object.assign(e,{deltaY:120,deltaMode:0,clientX:200,clientY:200});canvas.dispatchEvent(e);
  }
  assert.equal(notices.some(value=>value.phase==='request'),false);remove();
 }finally{mock.restoreAll();}
});
test('line/page wheel modes are bounded and zero or invalid delta does not zoom',()=>{
 const h=harness();h.wheel(-3,1);assert.equal(h.calls[0][0],1.05**2);
 h.wheel(-1,2);assert.ok(h.calls[1][0]>1);h.wheel(-1e9);assert.ok(h.calls[2][0]<=1.05**20);
 h.wheel(0);h.wheel(NaN);assert.equal(h.calls.length,3);h.remove();h.wheel(-120);assert.equal(h.calls.length,3);
});
test('legacy wheelDelta quantization cannot turn a decaying standard trackpad tail into deliberate input',()=>{
 let clock=0;const canvas=new EventTarget();canvas.getBoundingClientRect=()=>({left:0,top:0,height:800});const notices=[];
 const remove=installNativeWheel(canvas,{core:{projection:2,fov:185*Math.PI/180},_core_on_zoom(){}},{enabled:()=>true,now:()=>clock,onBoundary:v=>notices.push(v)});
 for(let i=0;i<160;i++){clock=i*20;const e=new Event('wheel',{cancelable:true});Object.assign(e,{deltaY:120*.96**i,wheelDelta:-120,deltaMode:0,clientX:200,clientY:200});canvas.dispatchEvent(e)}
 assert.equal(notices.some(n=>n.phase==='request'),false);remove();
});
