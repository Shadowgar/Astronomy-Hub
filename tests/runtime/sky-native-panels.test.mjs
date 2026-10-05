import test from 'node:test';import assert from 'node:assert/strict';
import {validSkyPanelReport,installSkyPanelReports} from '../../runtimes/sky-adapter/native-panels.mjs';
const source={},session={runtime:'sky',nonce:'a'.repeat(32),generation:3},expected={...session,source,origin:'http://local'},data={...session,type:'oras-sky-panel.v1',id:1,open:true},event={data,source,origin:'http://local'};
test('Sky panel reports accept only current origin, frame, session and boolean visibility',()=>{
 assert.equal(validSkyPanelReport(event,expected),true);assert.equal(validSkyPanelReport({...event,data:{...data,open:false}},expected),true);
 for(const change of [{source:{}},{origin:'http://other'},{data:{...data,nonce:'b'.repeat(32)}},{data:{...data,generation:2}},{data:{...data,runtime:'earth'}},{data:{...data,open:'true'}},{data:{...data,id:0}},{data:{...data,extra:1}}])assert.equal(validSkyPanelReport({...event,...change},expected),false);
});
test('panel reports require a qualified parent hello, survive persisted pagehide and stop on disposal',()=>{
 const w=new EventTarget(),sent=[];w.parent={postMessage:(...args)=>sent.push(args)};w.location={origin:'http://local'};w.document={documentElement:{classList:{contains:()=>true}}};const stop=installSkyPanelReports(w);
 const send=(type,fields)=>{const e=new Event(type);for(const [k,v] of Object.entries(fields))Object.defineProperty(e,k,{value:v});w.dispatchEvent(e)};
 send('oras-sky-panel',{detail:true});assert.equal(sent.length,0);
 send('message',{source:w.parent,origin:'http://local',data:{...session,type:'hello',protocol:{major:1,minor:1}}});send('oras-sky-panel',{detail:true});assert.deepEqual(sent[0],[data,'http://local']);
 send('pagehide',{persisted:true});send('oras-sky-panel',{detail:false});assert.equal(sent.at(-1)[0].id,2);assert.equal(sent.at(-1)[0].open,false);
 stop();send('oras-sky-panel',{detail:true});assert.equal(sent.length,2);
});
