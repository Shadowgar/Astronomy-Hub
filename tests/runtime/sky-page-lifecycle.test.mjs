import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {installSkyNightReports} from '../../runtimes/sky-adapter/native-panels.mjs';

const source=readFileSync(new URL('../../runtimes/sky-adapter/entry.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
function page(withCanvas=false){
 const window=new EventTarget(),document=new EventTarget(),canvas=new EventTarget(),timers=new Map(),interactions=[],nightReports=[],nightListeners=new Map();let closed=0,ready=0,nextTimer=0,execute,stopped=0,night=false,installingNight=false;
 const add=window.addEventListener.bind(window),remove=window.removeEventListener.bind(window);
 window.addEventListener=(type,fn,options)=>{if(installingNight){if(!nightListeners.has(type))nightListeners.set(type,new Set());nightListeners.get(type).add(fn)}add(type,fn,options)};
 window.removeEventListener=(type,fn)=>{nightListeners.get(type)?.delete(fn);remove(type,fn)};
 document.documentElement={classList:{contains:()=>true}};window.document=document;
 window.location={origin:'http://local'};window.parent={postMessage:message=>nightReports.push(message)};
 document.querySelector=()=>withCanvas?canvas:null;
 const createRuntimeEndpoint=options=>{execute=options.execute;return {ready(){ready++},close(){closed++},emit(type,payload){if(type==='interaction')interactions.push(JSON.parse(JSON.stringify(payload)))}}};
 window.orasSkyAdapter={nightMode:()=>night,stop(){stopped++}};
 runInNewContext(source,{window,document,installSkyPanelReports:()=>()=>{},installSkyNightReports:()=>{installingNight=true;const stop=installSkyNightReports(window);installingNight=false;return stop},createRuntimeEndpoint,setTimeout(callback){const id=++nextTimer;timers.set(id,callback);return id},clearTimeout(id){timers.delete(id)}});
 const send=(type,fields={})=>{const event=new Event(type);for(const [key,value] of Object.entries(fields))Object.defineProperty(event,key,{value});window.dispatchEvent(event)};
 return {counts:()=>({closed,ready}),pendingTimers:()=>timers.size,interactions,nightReports,listenerCount:type=>nightListeners.get(type)?.size||0,stopped:()=>stopped,destroy:()=>execute('destroy'),hello(){send('message',{source:window.parent,origin:'http://local',data:{type:'hello',protocol:{major:1,minor:1},runtime:'sky',nonce:'a'.repeat(32),generation:1}})},setNight(value){night=value;send('oras-sky-night-mode',{detail:value})},send,flushTimers(){for(const [id,callback] of timers){timers.delete(id);callback()}},interact(){canvas.dispatchEvent(new Event('pointerdown'))},dispatch(type,persisted){send(type,{persisted})}};
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
test('entry installs the real Night reporter, preserves it across cached cycles, and removes it on genuine departure',()=>{
 const p=page();p.hello();assert.equal(p.nightReports.at(-1).enabled,false);
 for(let i=0;i<3;i++){
  p.dispatch('pagehide',true);p.dispatch('pageshow',true);p.setNight(i%2===0);
  assert.equal(p.nightReports.length,i+2);assert.equal(p.nightReports.at(-1).enabled,i%2===0);
  assert.equal(p.listenerCount('message'),1);assert.equal(p.listenerCount('oras-sky-night-mode'),1);
 }
 p.dispatch('pagehide',false);
 for(const type of ['message','oras-sky-night-mode','oras-sky-ready','pagehide'])assert.equal(p.listenerCount(type),0);
 p.hello();p.send('oras-sky-ready');p.setNight(false);assert.equal(p.nightReports.length,4);
});
test('explicit destroy invokes Night reporter cleanup and native adapter stop without leaving stale reports',async()=>{
 const p=page();p.hello();assert.equal(p.nightReports.length,1);
 assert.equal((await p.destroy()).ok,true);assert.equal(p.stopped(),1);
 for(const type of ['message','oras-sky-night-mode','oras-sky-ready','pagehide'])assert.equal(p.listenerCount(type),0);
 p.dispatch('pagehide',true);p.dispatch('pageshow',true);p.hello();p.send('oras-sky-ready');p.setNight(true);
 assert.equal(p.nightReports.length,1);
});
