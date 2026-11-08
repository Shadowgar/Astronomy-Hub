import test from 'node:test';import assert from 'node:assert/strict';
import {validSkyNightReport,installSkyNightReports} from '../../runtimes/sky-adapter/native-panels.mjs';
const source={},session={runtime:'sky',nonce:'a'.repeat(32),generation:3},expected={...session,source,origin:'http://local'},data={...session,type:'oras-sky-night.v1',id:1,enabled:true},event={data,source,origin:'http://local'};
test('night reports validate exact origin/frame/session/type/boolean payload before the Hub reflects them',()=>{
 assert.equal(validSkyNightReport(event,expected),true);assert.equal(validSkyNightReport({...event,data:{...data,enabled:false}},expected),true);
 for(const change of [{source:{}},{origin:'http://other'},{data:{...data,nonce:'b'.repeat(32)}},{data:{...data,generation:2}},{data:{...data,runtime:'earth'}},{data:{...data,type:'oras-sky-panel.v1'}},{data:{...data,enabled:'true'}},{data:{...data,id:0}},{data:{...data,extra:1}}])assert.equal(validSkyNightReport({...event,...change},expected),false)
});
function setup(){
 const w=new EventTarget(),sent=[];let night;
 w.parent={postMessage:(...args)=>sent.push(args)};w.location={origin:'http://local'};w.document={documentElement:{classList:{contains:()=>true}}};const stop=installSkyNightReports(w,()=>night);
 const send=(type,fields={})=>{const e=new Event(type);for(const [k,v] of Object.entries(fields))Object.defineProperty(e,k,{value:v});w.dispatchEvent(e)};
 const hello=()=>send('message',{source:w.parent,origin:'http://local',data:{...session,type:'hello',protocol:{major:1,minor:1}}});return {w,sent,stop,send,hello,set:value=>{night=value}}
}
test('engine-ready replay and native changes publish actual SWE state, not event or host toggle state',()=>{
 const p=setup();p.set(true);p.send('oras-sky-night-mode',{detail:true});assert.equal(p.sent.length,0);p.set(undefined);p.hello();assert.equal(p.sent.length,0);
 p.set(true);p.send('oras-sky-ready');assert.deepEqual(p.sent[0],[data,'http://local']);p.set(false);p.send('oras-sky-night-mode',{detail:true});assert.equal(p.sent.at(-1)[0].enabled,false);assert.equal(p.sent.at(-1)[0].id,2);
 p.send('oras-sky-night-mode',{detail:'true'});assert.equal(p.sent.length,2);p.stop()
});
test('hello replays already-restored native state; persisted pages survive, disposal releases all listeners',()=>{
 const p=setup();p.set(true);p.hello();assert.equal(p.sent[0][0].enabled,true);p.send('pagehide',{persisted:true});p.set(false);p.send('oras-sky-night-mode',{detail:false});assert.equal(p.sent.length,2);p.send('pagehide',{persisted:false});p.send('oras-sky-ready');p.hello();p.send('oras-sky-night-mode',{detail:true});assert.equal(p.sent.length,2)
});
