import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../../runtimes/earth-runtime/entry.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function page(){
 const window=new EventTarget(),nodes=new Map();let viewers=0,bridges=0,live=0,peak=0;
 const document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,{hidden:false,dataset:{},replaceChildren(){},addEventListener(){}});return nodes.get(selector);}};
 class EarthRuntime {
  constructor(){viewers++;peak=Math.max(peak,++live);this.destroyed=false;this.lifecycle={closed:false};this.ready=false;this.site={};this.registry={snapshot:()=>[]};this.timings={};this.providerStatus={values:new Map()};this.viewer={entities:{values:[]},isDestroyed:()=>this.destroyed,camera:{positionCartographic:{height:1000}}};}
  async initialize(){await Promise.resolve();this.ready=true;}
  async destroy(){if(this.lifecycle.closed)return;this.lifecycle.closed=true;this.ready=false;for(let i=0;i<6;i++)await Promise.resolve();this.destroyed=true;live--;}
 }
 function RuntimeBridge(){bridges++;let closed=false;return {ready(){},close(){if(!closed){closed=true;bridges--;}}};}
 runInNewContext(source,{window,document,EarthRuntime,RuntimeBridge});
 return {window,counts:()=>({viewers,bridges}),peak:()=>peak,dispatch(type,persisted){const event=new Event(type);Object.defineProperty(event,'persisted',{value:persisted});window.dispatchEvent(event);}};
}
test('persisted pagehide preserves Viewer and bridge; repeated pageshow does not duplicate startup',async()=>{
 const p=page();await tick();p.dispatch('pagehide',true);p.dispatch('pageshow',true);p.dispatch('pageshow',true);await tick();
 assert.equal(p.window.orasEarthDiagnostics().ready,true);assert.equal(p.window.orasEarthDiagnostics().disposed,false);assert.deepEqual(p.counts(),{viewers:1,bridges:1});
 // A prior cached pagehide must not consume the genuine-unload listener.
 p.dispatch('pagehide',false);await tick();assert.equal(p.window.orasEarthDiagnostics().disposed,true);assert.equal(p.window.orasEarthDiagnostics().viewerDestroyed,true);assert.deepEqual(p.counts(),{viewers:1,bridges:0});
});
test('persisted restoration of a disposed runtime coalesces repeated startup into one new Viewer/bridge',async()=>{
 const p=page();await tick();p.dispatch('pagehide',false);p.dispatch('pageshow',true);p.dispatch('pageshow',true);await tick();
 assert.equal(p.window.orasEarthDiagnostics().ready,true);assert.equal(p.window.orasEarthDiagnostics().disposed,false);assert.deepEqual(p.counts(),{viewers:2,bridges:1});assert.equal(p.peak(),1);
});
test('genuine departure during startup creates no late Viewer/bridge and an absent runtime can restore',async()=>{
 const p=page();p.dispatch('pagehide',false);await tick();assert.deepEqual(p.counts(),{viewers:0,bridges:0});
 p.dispatch('pageshow',true);p.dispatch('pageshow',true);await tick();assert.equal(p.window.orasEarthDiagnostics().ready,true);assert.deepEqual(p.counts(),{viewers:1,bridges:1});
});
