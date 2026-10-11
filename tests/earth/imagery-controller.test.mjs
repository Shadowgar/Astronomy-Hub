import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';import {join} from 'node:path';
import {openImagerySession} from '../../runtimes/earth-runtime/core/imagerySession.mjs';
import {boundImageryRequests,createImageryBudget} from '../../runtimes/earth-runtime/core/imageryRequests.mjs';
import {chooseImagery,contains,containsView,inRing,CONUS,PEMA_COVERAGE,ORAS_NAIP_RING} from '../../runtimes/earth-runtime/core/ImagerySelectionPolicy.mjs';
function harness(failFactories=new Set()){
 let now=0;
 class Event{listeners=new Set();addEventListener(fn){this.listeners.add(fn);return ()=>this.listeners.delete(fn)}raiseEvent(e){for(const fn of [...this.listeners])fn(e)}}
 class Provider{errorEvent=new Event();requestImage(){return Promise.resolve('image')}}
 const providers=new Map(),factories=new Map(),layers=[{id:'radar'},{id:'fire'}],cleanups=[],credits=new Map();let locals=0;
 const viewer={camera:{positionCartographic:{height:20e6,longitude:-79.58*Math.PI/180,latitude:41.32*Math.PI/180},computeViewRectangle:()=>({west:-90*Math.PI/180,south:30*Math.PI/180,east:-70*Math.PI/180,north:45*Math.PI/180}),moveEnd:new Event()},imageryLayers:{get length(){return layers.length},get:i=>layers[i],indexOf:l=>layers.indexOf(l),add(layer,index){layers.splice(index,0,layer);return layer},addImageryProvider(provider,index){return this.add({imageryProvider:provider},index)},raise(layer){const i=layers.indexOf(layer);layers.splice(i,1);layers.splice(i+1,0,layer)},remove(layer){const i=layers.indexOf(layer);if(i<0)return false;layers.splice(i,1);return true}},scene:{globe:{ellipsoid:{}},primitives:{remove(){}},requestRender(){}}};
 const upstream=readFileSync(join(process.env.GODS_EYE_SOURCE??'/var/tmp/oras-cesium/gods-eye','src/maps/controller.js'),'utf8').replace(/^import .*;\n/gm,'').replace('export class','class')+';MapSourceController';
 const MapSourceController=runInNewContext(upstream,{indexMapSources:sources=>new Map(sources.map(s=>[s.descriptor.id,s])),Cesium:{ImageryLayer:class{constructor(p){this.imageryProvider=p}}},createMapCredits:()=>({show(){},destroy(){}}),AbortController,console});
 const SOURCE_FACTS=Object.fromEntries(['local','nasa','eox-2016','usgs-naip','pema','osm'].map(id=>[id,{label:id,product:id,host:id,credit:id,url:'https://example.org'}]));
 const createAdmittedMapSources=(config,wrap)=>({defaultId:'nasa',unknownId:'nasa',recoveryId:null,sources:['nasa','eox-2016','usgs-naip','pema','osm'].map(id=>({descriptor:{id,label:id},available:true,imagery:request=>wrap(id,()=>{factories.set(id,(factories.get(id)??0)+1);if(failFactories.has(id))throw Error('Declared factory failure');const p=new Provider();providers.set(id,p);return p},request),...(id==='nasa'?{}:{constructionFallback:{id:'nasa',message:'fallback'},tileFailureFallback:{id:'nasa',threshold:1,message:'fallback'}})}))});
 const code=readFileSync(new URL('../../runtimes/earth-runtime/core/ImageryController.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export class','class')+';ImageryController';
 const Controller=runInNewContext(code,{openImagerySession:()=>openImagerySession(null),MapSourceController,ImageryLayer:class{constructor(p){this.imageryProvider=p}},TileMapServiceImageryProvider:{fromUrl:async()=>{locals++;return new Provider()}},Rectangle:{},Math:globalThis.Math,CesiumMath:{toDegrees:v=>v*180/Math.PI},boundImageryRequests,createImageryBudget:()=>createImageryBudget({clock:()=>now}),createAdmittedMapSources,createLabels:()=>new Provider(),SOURCE_FACTS,chooseImagery,contains,containsView,inRing,CONUS,PEMA_COVERAGE,ORAS_NAIP_RING,performance:{now:()=>now},AbortController,AbortSignal,Promise,setTimeout,clearTimeout,setInterval:(fn,ms)=>{const timer=setInterval(fn,ms);timer.unref();return timer},clearInterval,queueMicrotask,URLSearchParams,fetch:()=>Promise.reject(Error('offline')),document:undefined,console});
 const runtime={viewer,lifecycle:{closed:false,controller:new AbortController(),add:fn=>cleanups.push(fn)},attribution:{set:(id,text)=>credits.set(id,text),remove:id=>credits.delete(id)},timings:{}};
 const controller=new Controller(runtime,{});return {controller,runtime,layers,providers,factories,credits,advance:ms=>now+=ms,get locals(){return locals},cleanups};
}
test('actual pinned controller retains healthy caches, one safety base and independent overlay order',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});assert.equal(h.locals,1);assert.equal(h.layers.length,4);assert.equal(h.layers[0],h.controller.base);assert.equal(h.layers.at(-1).id,'fire');
 const first=h.controller.map;await h.controller.select('eox-2016');await h.controller.select('nasa');assert.equal(h.controller.map,first);assert.equal(h.factories.get('nasa'),1);assert.equal(h.layers.length,4);assert.equal(h.controller.diagnostics().actual,'nasa');
 await h.controller.select('local');assert.equal(h.layers.length,3);assert.equal(h.controller.diagnostics().actual,'local');await h.controller.select('nasa');assert.equal(h.locals,1);assert.equal(h.layers.length,4);
 h.runtime.lifecycle.closed=true;h.cleanups[0]();assert.deepEqual(h.layers.map(l=>l.id),['radar','fire']);
});
test('terminal NASA failure removes the managed layer and labels only; recovery does not duplicate local',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});await h.controller.setLabels(true);assert.equal(h.layers.length,5);
 h.providers.get('nasa').errorEvent.raiseEvent({retry:true,statusCode:403});await new Promise(resolve=>setTimeout(resolve,0));assert.equal(h.controller.diagnostics().actual,'local');assert.equal(h.layers.length,3);assert.equal(h.layers.at(-1).id,'fire');assert.equal(h.locals,1);await h.controller.select('nasa');assert.equal(h.controller.diagnostics().actual,'local');h.cleanups[0]();
});
test('paused cached providers cannot dispatch and switching never changes the camera',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});const nasa=h.providers.get('nasa'),position={...h.runtime.viewer.camera.positionCartographic};await h.controller.select('eox-2016');assert.equal(nasa.requestImage(),undefined);await h.controller.select('nasa');await nasa.requestImage();assert.deepEqual(h.runtime.viewer.camera.positionCartographic,position);h.cleanups[0]();
});

test('ordinary rejected factory retry retains the controller; cached successful fallback retry recreates only after cooldown',async()=>{
 const failures=new Set(),h=harness(failures);await h.controller.retry({schema:1,qualified:false});await h.controller.select('eox-2016');const map=h.controller.map;
 // NASA has no construction fallback: rejected cache entry is evicted, while
 // the healthy EOX layer/controller stays owned and recoverable.
 failures.add('nasa');await h.controller.select('local');await h.controller.select('eox-2016');const retained=h.controller.map;await h.controller.select('nasa');assert.equal(h.controller.map,retained);assert.equal(h.controller.cachedFallbacks.has('nasa'),false);h.advance(60001);failures.delete('nasa');await h.controller.retrySelected();assert.equal(h.controller.map,retained);assert.equal(h.controller.diagnostics().actual,'nasa');
 // EOX now fails on a fresh controller; NASA resolves its construction fallback.
 await h.controller.select('local');failures.add('eox-2016');await h.controller.select('eox-2016');assert.equal(h.controller.diagnostics().actual,'nasa');const fallbackMap=h.controller.map;assert.equal(h.controller.cachedFallbacks.has('eox-2016'),true);await h.controller.retrySelected();assert.equal(h.controller.map,fallbackMap);h.advance(60001);failures.delete('eox-2016');await h.controller.retrySelected();assert.notEqual(h.controller.map,fallbackMap);assert.equal(h.controller.diagnostics().actual,'eox-2016');assert.equal(h.locals,1);h.cleanups[0]();
});
test('tile fallback and explicit eligible retry reuse the successful original provider, without accumulating listeners',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});await h.controller.select('eox-2016');const original=h.providers.get('eox-2016'),map=h.controller.map;original.errorEvent.raiseEvent({retry:true});await new Promise(resolve=>setTimeout(resolve,0));assert.equal(h.controller.diagnostics().actual,'nasa');assert.equal(original.requestImage(),undefined);h.advance(60001);await h.controller.retrySelected();assert.equal(h.controller.map,map);assert.equal(h.factories.get('eox-2016'),1);assert.equal(original.errorEvent.listeners.size,2);assert.equal(h.controller.diagnostics().actual,'eox-2016');h.cleanups[0]();assert.equal(original.errorEvent.listeners.size,0);
});

test('a paused old provider SDK cancellation event cannot tear down the pending replacement',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});const map=h.controller.map,nasa=h.providers.get('nasa');const switching=h.controller.select('eox-2016');nasa.errorEvent.raiseEvent({retry:false,error:Error('Imagery provider paused')});await switching;assert.equal(h.controller.map,map);assert.equal(h.controller.diagnostics().actual,'eox-2016');h.cleanups[0]();
});

test('elapsed cooldown and Auto camera events do not silently retry a failed source',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});h.providers.get('nasa').errorEvent.raiseEvent({retry:true});await new Promise(resolve=>setTimeout(resolve,0));const calls=h.factories.get('nasa');h.advance(60001);await h.controller.updateView();assert.equal(h.factories.get('nasa'),calls);assert.equal(h.controller.diagnostics().actual,'local');await h.controller.retrySelected();assert.equal(h.controller.diagnostics().actual,'nasa');assert.equal(h.locals,1);h.cleanups[0]();
});
