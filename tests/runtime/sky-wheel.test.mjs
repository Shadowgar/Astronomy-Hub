import test from 'node:test';
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
test('line/page wheel modes are bounded and zero or invalid delta does not zoom',()=>{
 const h=harness();h.wheel(-3,1);assert.equal(h.calls[0][0],1.05**2);
 h.wheel(-1,2);assert.ok(h.calls[1][0]>1);h.wheel(-1e9);assert.ok(h.calls[2][0]<=1.05**20);
 h.wheel(0);h.wheel(NaN);assert.equal(h.calls.length,3);h.remove();h.wheel(-120);assert.equal(h.calls.length,3);
});
