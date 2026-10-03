import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../runtimes/sky-adapter/entry.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
function page(withCanvas=false){
 const window=new EventTarget(),document=new EventTarget(),canvas=new EventTarget(),timers=new Set();let closed=0,ready=0,nextTimer=0;
 document.querySelector=()=>withCanvas?canvas:null;
 const createRuntimeEndpoint=()=>({ready(){ready++},close(){closed++},emit(){}});
 window.orasSkyAdapter={};
 runInNewContext(source,{window,document,createRuntimeEndpoint,setTimeout(){const id=++nextTimer;timers.add(id);return id},clearTimeout(id){timers.delete(id)}});
 return {counts:()=>({closed,ready}),pendingTimers:()=>timers.size,interact(){canvas.dispatchEvent(new Event('pointerdown'))},dispatch(type,persisted){const event=new Event(type);Object.defineProperty(event,'persisted',{value:persisted});window.dispatchEvent(event);}};
}
test('cached Sky navigation preserves the endpoint and leaves genuine departure cleanup installed',()=>{
 const p=page();
 for(let i=0;i<2;i++){p.dispatch('pagehide',true);p.dispatch('pageshow',true);}
 assert.deepEqual(p.counts(),{closed:0,ready:1});
 p.dispatch('pagehide',false);assert.deepEqual(p.counts(),{closed:1,ready:1});
});
test('genuine Sky departure closes the endpoint',()=>{
 const p=page();p.dispatch('pagehide',false);assert.deepEqual(p.counts(),{closed:1,ready:1});
});
test('interaction timers are cleared on every cached departure',()=>{
 const p=page(true);
 for(let i=0;i<2;i++){
  p.interact();assert.equal(p.pendingTimers(),1);
  p.dispatch('pagehide',true);assert.equal(p.pendingTimers(),0);
  p.dispatch('pageshow',true);
 }
});
