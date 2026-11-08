import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{runInNewContext}from'node:vm';
for(const change of ['scene','dispose'])test(`worker rejects a response completed after client ${change}`,async()=>{
 let resolve,live=true,writes=0;const listeners={},waits=[];const pending=new Promise(yes=>resolve=yes),client={id:'earth-1',url:'https://hub.example/earth-runtime/'};
 class Store{epoch=0;async get(){return null}async put(_r,_s,_e,canWrite=()=>true){if(await canWrite())writes++}}
 const self={location:{origin:'https://hub.example'},clients:{get:async()=>live?client:null,claim(){}},addEventListener:(name,fn)=>listeners[name]=fn};
 const code=readFileSync(new URL('../../runtimes/earth-runtime/core/imageryCacheWorker.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');runInNewContext(code,{self,ImageryCacheStore:Store,cacheResource:()=>({key:'fixture'}),fetch:()=>pending,URL,Map,Number});
 let result;listeners.fetch({clientId:client.id,request:{},waitUntil:p=>waits.push(p),respondWith:p=>result=p});await Promise.resolve();
 if(change==='scene')listeners.message({source:client,ports:[],data:{type:'imagery-cache-scene',generation:1,active:true},waitUntil:p=>waits.push(p)});else live=false;
 resolve(new Response('declared byte fixture'));await result;await Promise.all(waits);assert.equal(writes,0);
});
