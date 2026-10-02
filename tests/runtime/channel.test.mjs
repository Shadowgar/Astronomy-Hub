import test from 'node:test';import assert from 'node:assert/strict';
import {connectRuntime} from '../../packages/runtime-protocol/client.mjs';
import {createRuntimeEndpoint} from '../../packages/runtime-protocol/endpoint.mjs';
const session={runtime:'earth',nonce:'a'.repeat(32),generation:7};
function fakeWindow(){const handlers=new Set();return {location:{origin:'https://oras.test'},handlers,addEventListener(_type,fn){handlers.add(fn)},removeEventListener(_type,fn){handlers.delete(fn)},emit(event){for(const fn of handlers)fn(event)}};}
test('bootstrap abort removes listeners and never creates a channel',async()=>{
 const host=fakeWindow(),frame={contentWindow:{postMessage(){}},addEventListener(){},removeEventListener(){}};const abort=new AbortController();
 const pending=connectRuntime(frame,session,{windowImpl:host,signal:abort.signal,timeoutMs:500});assert.equal(host.handlers.size,1);abort.abort();await assert.rejects(pending,/Disposed/);assert.equal(host.handlers.size,0);
});
test('negotiated channel hydrates, ignores stale responses, and rejects pending requests on teardown',async()=>{
 const host=fakeWindow(),child=fakeWindow();
 child.parent={postMessage(data){host.emit({data,source:frame.contentWindow,origin:host.location.origin})}};
 const frame={contentWindow:{postMessage(data,_origin,ports=[]){child.emit({data,source:child.parent,origin:host.location.origin,ports})}},addEventListener(){},removeEventListener(){}};
 const endpoint=createRuntimeEndpoint({runtime:'earth',version:'pin',capabilities:['destroy','timeIntent'],windowImpl:child,execute:async(command)=>command==='setTimeIntent'?{ok:true,temporalMode:'LIVE_ONLY',effectiveTime:'2026-10-02T12:00:00Z'}:new Promise(()=>{})});endpoint.ready();
 const client=await connectRuntime(frame,session,{windowImpl:host,timeoutMs:500});assert.equal(client.version,'pin');assert.equal(host.handlers.size,0);
 const result=await client.request('setTimeIntent',{utc:'2020-01-01T00:00:00Z'});assert.equal(result.temporalMode,'LIVE_ONLY');assert.notEqual(result.effectiveTime,'2020-01-01T00:00:00Z');
 const pending=client.request('destroy');client.close();await assert.rejects(pending,/Disposed/);endpoint.close();assert.equal(child.handlers.size,0);
});
test('old generation responses cannot settle a new channel request',async()=>{
 const host=fakeWindow();let peer;
 const frame={contentWindow:{postMessage(data,_origin,ports=[]){if(data.type==='hello')host.emit({data:{...session,type:'ready',protocol:{major:1,minor:8},version:'pin',capabilities:['destroy']},source:frame.contentWindow,origin:host.location.origin});else peer=ports[0]}},addEventListener(){},removeEventListener(){}};
 const client=await connectRuntime(frame,session,{windowImpl:host,timeoutMs:500});
 peer.onmessage=({data})=>{peer.postMessage({...data,type:'result',generation:6,payload:{ok:false,error:'stale'}});peer.postMessage({...data,type:'result',nonce:'b'.repeat(32),payload:{ok:false,error:'wrong nonce'}});peer.postMessage({...data,type:'result',payload:{ok:true,version:'current'}})};peer.start();
 assert.equal((await client.request('getVersion')).version,'current');client.close();peer.close();
});
test('runtime command failures return controlled results',async()=>{
 const child=fakeWindow();child.parent={postMessage(){}};const endpoint=createRuntimeEndpoint({runtime:'earth',version:'pin',capabilities:['timeIntent'],windowImpl:child,execute(){throw new Error('private provider detail')}});endpoint.ready();
 child.emit({data:{...session,type:'hello',protocol:{major:1,minor:0}},source:child.parent,origin:child.location.origin,ports:[]});const channel=new MessageChannel();child.emit({data:{...session,type:'connect'},source:child.parent,origin:child.location.origin,ports:[channel.port2]});
 const response=new Promise(resolve=>{channel.port1.onmessage=({data})=>resolve(data.payload);channel.port1.start()});channel.port1.postMessage({...session,id:1,type:'command',command:'setTimeIntent',payload:{utc:'2020-01-01T00:00:00Z'}});assert.deepEqual(await response,{ok:false,error:'Runtime command failed'});channel.port1.close();endpoint.close();
});
