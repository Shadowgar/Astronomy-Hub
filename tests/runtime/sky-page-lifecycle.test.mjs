import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../runtimes/sky-adapter/entry.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
function page(withCanvas=false){
 const window=new EventTarget(),document=new EventTarget(),canvas=new EventTarget(),timers=new Map(),interactions=[];let closed=0,ready=0,nextTimer=0;
 document.querySelector=()=>withCanvas?canvas:null;
 const createRuntimeEndpoint=()=>({ready(){ready++},close(){closed++},emit(type,payload){if(type==='interaction')interactions.push(JSON.parse(JSON.stringify(payload)))}});
 window.orasSkyAdapter={};
 runInNewContext(source,{window,document,createRuntimeEndpoint,setTimeout(callback){const id=++nextTimer;timers.set(id,callback);return id},clearTimeout(id){timers.delete(id)}});
 return {counts:()=>({closed,ready}),pendingTimers:()=>timers.size,interactions,flushTimers(){for(const [id,callback] of timers){timers.delete(id);callback()}},interact(){canvas.dispatchEvent(new Event('pointerdown'))},dispatch(type,persisted){const event=new Event(type);Object.defineProperty(event,'persisted',{value:persisted});window.dispatchEvent(event);}};
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

test('cached departure resets active interaction and restored page can interact normally',()=>{
 const p=page(true);p.interact();
 assert.deepEqual(p.interactions,[{active:true,focused:false}]);
 p.dispatch('pagehide',true);assert.equal(p.pendingTimers(),0);
 assert.deepEqual(p.interactions.at(-1),{active:false,focused:false});
 const emitted=p.interactions.length;p.flushTimers();assert.equal(p.interactions.length,emitted);
 assert.deepEqual(p.counts(),{closed:0,ready:1});
 p.dispatch('pageshow',true);p.interact();
 assert.deepEqual(p.interactions.at(-1),{active:true,focused:false});
 p.flushTimers();assert.equal(p.pendingTimers(),0);
 assert.deepEqual(p.interactions.at(-1),{active:false,focused:false});
 assert.deepEqual(p.counts(),{closed:0,ready:1});
});
test('every cached cycle resets interaction without accumulating timers or endpoints',()=>{
 const p=page(true);
 for(let i=0;i<3;i++){
  p.interact();assert.equal(p.pendingTimers(),1);
  p.dispatch('pagehide',true);assert.equal(p.pendingTimers(),0);
  assert.deepEqual(p.interactions.at(-1),{active:false,focused:false});
  assert.equal(p.interactions.length,(i+1)*2);
  p.flushTimers();p.dispatch('pageshow',true);
 }
 assert.deepEqual(p.counts(),{closed:0,ready:1});
 p.interact();p.dispatch('pagehide',false);
 assert.equal(p.pendingTimers(),0);
 assert.deepEqual(p.interactions.at(-1),{active:false,focused:false});
 assert.deepEqual(p.counts(),{closed:1,ready:1});
 p.flushTimers();assert.equal(p.interactions.length,8);
});
test('departure before canvas readiness still explicitly resets interaction and closes once',()=>{
 const p=page();p.dispatch('pagehide',false);
 assert.deepEqual(p.interactions,[{active:false,focused:false}]);
 assert.deepEqual(p.counts(),{closed:1,ready:1});
});
