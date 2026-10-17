import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';import {join} from 'node:path';
import {openImagerySession} from '../../runtimes/earth-runtime/core/imagerySession.mjs';
import {observeImageryRequests,createImageryAvailability} from '../../runtimes/earth-runtime/core/imageryRequests.mjs';
import {chooseImagery,contains,containsView,inRing,CONUS,PEMA_COVERAGE,ORAS_NAIP_RING} from '../../runtimes/earth-runtime/core/ImagerySelectionPolicy.mjs';
function harness(failFactories=new Set(),fetcher=()=>Promise.reject(Error('offline'))){
 let now=0,renders=0;const wakes=[],cacheScenes=[];
 class Event{listeners=new Set();addEventListener(fn){this.listeners.add(fn);return ()=>this.listeners.delete(fn)}raiseEvent(e){for(const fn of [...this.listeners])fn(e)}}
 const requestResults=new Map();
 class Provider{constructor(id){this.id=id}tilingScheme={positionToTileXY:()=>({x:0,y:0})};maximumLevel=18;errorEvent=new Event();requestImage(){return this.requestResult?this.requestResult():requestResults.has(this.id)?requestResults.get(this.id)():Promise.resolve('image')}}
 const gates=new Map(),providers=new Map(),factories=new Map(),layers=[{id:'radar'},{id:'fire'}],cleanups=[],credits=new Map();let locals=0;
 const viewer={canvas:{clientWidth:1440,clientHeight:900},camera:{positionCartographic:{height:20e6,longitude:-79.58*Math.PI/180,latitude:41.32*Math.PI/180},computeViewRectangle:()=>({west:-90*Math.PI/180,south:30*Math.PI/180,east:-70*Math.PI/180,north:45*Math.PI/180}),moveEnd:new Event()},imageryLayers:{get length(){return layers.length},get:i=>layers[i],indexOf:l=>layers.indexOf(l),add(layer,index){layers.splice(index,0,layer);return layer},addImageryProvider(provider,index){return this.add({imageryProvider:provider},index)},raise(layer){const i=layers.indexOf(layer);layers.splice(i,1);layers.splice(i+1,0,layer)},remove(layer){const i=layers.indexOf(layer);if(i<0)return false;layers.splice(i,1);return true}},scene:{globe:{ellipsoid:{}},primitives:{remove(){}},requestRender(){renders++}}};
 viewer.camera.getPickRay=()=>({});viewer.camera.pickEllipsoid=()=>viewer.camera.positionCartographic;viewer.scene.globe.pick=()=>undefined;viewer.scene.globe.ellipsoid.cartesianToCartographic=value=>value;
 const upstream=readFileSync(join(process.env.GODS_EYE_SOURCE??'/var/tmp/oras-cesium/gods-eye','src/maps/controller.js'),'utf8').replace(/^import .*;\n/gm,'').replace('export class','class')+';MapSourceController';
 const MapSourceController=runInNewContext(upstream,{indexMapSources:sources=>new Map(sources.map(s=>[s.descriptor.id,s])),Cesium:{ImageryLayer:class{constructor(p){this.imageryProvider=p}}},createMapCredits:()=>({show(){},destroy(){}}),AbortController,console});
 const SOURCE_FACTS=Object.fromEntries(['local','nasa','eox-2016','usgs-naip','pema','osm'].map(id=>[id,{label:id,product:id,host:id,credit:id,url:'https://example.org'}]));
 const createAdmittedMapSources=(config,wrap)=>({defaultId:'nasa',unknownId:'nasa',recoveryId:null,sources:['nasa','eox-2016','usgs-naip','pema','osm'].map(id=>({descriptor:{id,label:id},available:true,imagery:request=>wrap(id,()=>{factories.set(id,(factories.get(id)??0)+1);if(failFactories.has(id))throw Error('Declared factory failure');const p=new Provider(id);providers.set(id,p);return gates.has(id)?gates.get(id).then(()=>p):p},request),...(id==='nasa'?{}:{constructionFallback:{id:id==='usgs-naip'?'eox-2016':'nasa',message:'fallback'},tileFailureFallback:{id:id==='usgs-naip'?'eox-2016':'nasa',threshold:id==='usgs-naip'?3:1,message:'fallback'}})}))});
 const code=readFileSync(new URL('../../runtimes/earth-runtime/core/ImageryController.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export class','class')+';ImageryController';
 const Controller=runInNewContext(code,{Cartographic:{fromDegrees:(longitude,latitude)=>({longitude,latitude})},Request:class{cancel(){}},RequestType:{IMAGERY:2},openImagerySession:()=>openImagerySession(null),MapSourceController,Cartesian2:class{constructor(x,y){this.x=x;this.y=y}},ImageryLayer:class{constructor(p){this.imageryProvider=p}},TileMapServiceImageryProvider:{fromUrl:async()=>{locals++;return new Provider()}},Rectangle:{},Math:globalThis.Math,CesiumMath:{toDegrees:v=>v*180/Math.PI},observeImageryRequests,createImageryAvailability:()=>createImageryAvailability({clock:()=>now}),createAdmittedMapSources,createLabels:()=>new Provider(),SOURCE_FACTS,localPemaAllowed:()=>true,imageryCacheScene(active=true){cacheScenes.push(active)},chooseImagery,contains,containsView,inRing,CONUS,PEMA_COVERAGE,ORAS_NAIP_RING,performance:{now:()=>now},AbortController,AbortSignal,Promise,setTimeout,clearTimeout,setInterval:(fn,ms)=>{wakes.push(fn);const timer=setInterval(fn,ms);timer.unref();return timer},clearInterval,queueMicrotask,URLSearchParams,TextDecoder,fetch:fetcher,document:undefined,console});
 const runtime={viewer,lifecycle:{closed:false,controller:new AbortController(),add:fn=>cleanups.push(fn)},attribution:{set:(id,text)=>credits.set(id,text),remove:id=>credits.delete(id)},timings:{}};
 const controller=new Controller(runtime,{});return {cacheScenes,controller,runtime,layers,providers,factories,gates,credits,requestResults,advance:ms=>now+=ms,get locals(){return locals},cleanups,tick:()=>wakes.forEach(fn=>fn()),get renders(){return renders}};
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
test('healthy cached providers remain reusable without Hub switching pauses or camera changes',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});const nasa=h.providers.get('nasa'),position={...h.runtime.viewer.camera.positionCartographic};await h.controller.select('eox-2016');assert.equal(await nasa.requestImage(),'image');await h.controller.select('nasa');await nasa.requestImage();assert.deepEqual(h.runtime.viewer.camera.positionCartographic,position);h.cleanups[0]();
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
 const h=harness();await h.controller.retry({schema:1,qualified:false});await h.controller.select('eox-2016');const original=h.providers.get('eox-2016'),map=h.controller.map;original.errorEvent.raiseEvent({retry:true});await new Promise(resolve=>setTimeout(resolve,0));assert.equal(h.controller.diagnostics().actual,'nasa');assert.equal(await original.requestImage(),'image');h.advance(60001);await h.controller.retrySelected();assert.equal(h.controller.map,map);assert.equal(h.factories.get('eox-2016'),1);assert.equal(original.errorEvent.listeners.size,2);assert.equal(h.controller.diagnostics().actual,'eox-2016');h.cleanups[0]();assert.equal(original.errorEvent.listeners.size,0);
});

test('a paused old provider SDK cancellation event cannot tear down the pending replacement',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});const map=h.controller.map,nasa=h.providers.get('nasa');const switching=h.controller.select('eox-2016');nasa.errorEvent.raiseEvent({retry:false,error:Error('Imagery provider paused')});await switching;assert.equal(h.controller.map,map);assert.equal(h.controller.diagnostics().actual,'eox-2016');h.cleanups[0]();
});

test('elapsed cooldown automatically recovers the overview without duplicating the safety base',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});h.providers.get('nasa').errorEvent.raiseEvent({retry:true});await new Promise(resolve=>setTimeout(resolve,0));const calls=h.factories.get('nasa');h.advance(60001);await h.controller.updateView();assert.equal(h.factories.get('nasa'),calls+1);assert.equal(h.controller.diagnostics().actual,'nasa');await h.controller.updateView();assert.equal(h.factories.get('nasa'),calls+1);assert.equal(h.locals,1);h.cleanups[0]();
});

const footprint=()=>new Response(JSON.stringify({spatialReference:{wkid:4326},features:[{attributes:{Name:'Verified raster'},geometry:{rings:[[[-75,40],[-73,40],[-73,42],[-75,42],[-75,40]]]}}]}));
function closeNewYork(h){h.runtime.viewer.camera.positionCartographic={height:1500,longitude:-74*Math.PI/180,latitude:40.7*Math.PI/180};h.runtime.viewer.camera.computeViewRectangle=()=>({west:-74.01*Math.PI/180,south:40.69*Math.PI/180,east:-73.99*Math.PI/180,north:40.71*Math.PI/180});}
test('initial stationary eligible camera qualifies footprint and selects NAIP without a moveEnd',async()=>{
 let calls=0;const h=harness(new Set(),async()=>{calls++;return footprint()});closeNewYork(h);await h.controller.retry({schema:1,qualified:false});assert.equal(calls,1);assert.equal(h.controller.actual,'usgs-naip');await h.controller.updateView();assert.equal(calls,1);h.cleanups[0]();
});
test('unavailable footprint and metadata timeout keep truthful global fallback with bounded requests',async()=>{
 for(const result of ['missing','timeout']){let calls=0;const h=harness(new Set(),async()=>{calls++;if(result==='timeout')throw new DOMException('Timeout','TimeoutError');return new Response(JSON.stringify({features:[]}))});closeNewYork(h);await h.controller.retry({schema:1,qualified:false});await h.controller.updateView();assert.equal(calls,1);assert.equal(h.controller.actual,'eox-2016');assert.equal(h.controller.footprints.length,1);h.cleanups[0]();}
});
test('late metadata from an earlier camera is rejected and cannot switch or populate coverage',async()=>{
 let finish;const h=harness(new Set(),()=>new Promise(resolve=>{finish=resolve}));await h.controller.retry({schema:1,qualified:false});closeNewYork(h);const pending=h.controller.updateView();await new Promise(resolve=>setTimeout(resolve,0));h.runtime.viewer.camera.positionCartographic.height=20e6;await h.controller.select('auto');finish(footprint());await pending;assert.equal(h.controller.actual,'nasa');assert.equal(h.controller.footprints.length,1);h.cleanups[0]();
});
test('automatic recovery after cooldown keeps cached healthy providers and listener counts',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});h.runtime.viewer.camera.positionCartographic.height=1e6;await h.controller.updateView();const original=h.providers.get('eox-2016'),map=h.controller.map;original.errorEvent.raiseEvent({retry:true});await new Promise(resolve=>setTimeout(resolve,0));assert.equal(h.controller.actual,'nasa');await h.controller.updateView();assert.equal(h.controller.actual,'nasa');h.advance(60001);h.tick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(h.controller.actual,'eox-2016');assert.equal(h.controller.map,map);assert.equal(h.factories.get('eox-2016'),1);assert.equal(original.errorEvent.listeners.size,2);h.cleanups[0]();assert.equal(original.errorEvent.listeners.size,0);
});
test('verified stationary footprint with provider failure retains actual fallback and respects factory cooldown',async()=>{
 let calls=0;const failures=new Set(['usgs-naip']),h=harness(failures,async()=>{calls++;return footprint()});closeNewYork(h);await h.controller.retry({schema:1,qualified:false});assert.equal(calls,1);assert.equal(h.controller.actual,'eox-2016');const map=h.controller.map;await h.controller.updateView();assert.equal(h.controller.actual,'eox-2016');assert.equal(h.controller.map,map);assert.equal(h.factories.get('usgs-naip'),1);h.advance(60001);failures.delete('usgs-naip');await h.controller.updateView();assert.equal(h.controller.actual,'usgs-naip');assert.notEqual(h.controller.map,map);assert.equal(h.locals,1);h.cleanups[0]();
});
test('automatic recovery honours Retry-After and permanently stops unauthorized hosts',async()=>{
 for(const status of [401,403,429]){const h=harness();await h.controller.retry({schema:1,qualified:false});h.runtime.viewer.camera.positionCartographic.height=1e6;await h.controller.updateView();const provider=h.providers.get('eox-2016');provider.errorEvent.raiseEvent({statusCode:status,retryAfter:'600',retry:true});await new Promise(resolve=>setTimeout(resolve,0));h.advance(300001);await h.controller.updateView();assert.equal(h.controller.actual,'nasa');h.advance(300001);await h.controller.updateView();assert.equal(h.controller.actual,status===429?'eox-2016':'nasa');assert.equal(h.factories.get('eox-2016'),1);h.cleanups[0]();}
});
test('footprint qualification remains independent of imagery dispatch and rejects partial coverage',async()=>{
 let calls=0;const h=harness(new Set(),async(url)=>{calls++;const geometry=JSON.parse(new URL(url).searchParams.get('geometry'));assert.equal(geometry.x,-74);return new Response(JSON.stringify({spatialReference:{wkid:4326},features:[{geometry:{rings:[[[-74.001,40.699],[-73.999,40.699],[-73.999,40.701],[-74.001,40.701],[-74.001,40.699]]]}}]}))});await h.controller.retry({schema:1,qualified:false});closeNewYork(h);await h.controller.updateView();assert.equal(calls,1);assert.equal(h.controller.actual,'eox-2016');assert.equal(h.controller.budget.stats.active,0);assert.equal(h.controller.footprints.length,2);h.cleanups[0]();
});
test('stale selection and renderer teardown reject in-flight coverage and release its request lease',async()=>{
 for(const dispose of [false,true]){let finish;const h=harness(new Set(),()=>new Promise(resolve=>{finish=resolve}));await h.controller.retry({schema:1,qualified:false});closeNewYork(h);const pending=h.controller.updateView();await new Promise(resolve=>setTimeout(resolve,0));if(dispose){h.runtime.lifecycle.closed=true;h.cleanups[0]();}else await h.controller.select('nasa');finish(footprint());await pending;assert.equal(h.controller.footprints.length,1);assert.equal(h.controller.budget.stats.active,0);if(!dispose){assert.equal(h.controller.actual,'nasa');h.cleanups[0]();}}
});

test('automatic health wake does not repeatedly render a healthy full-Earth or unauthorized fallback',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});let before=h.renders;h.advance(60001);h.tick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(h.renders,before);
 h.providers.get('nasa').errorEvent.raiseEvent({statusCode:403,retry:true});await new Promise(resolve=>setTimeout(resolve,0));before=h.renders;h.advance(600001);h.tick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(h.renders,before);assert.equal(h.controller.actual,'local');h.cleanups[0]();
});

test('last-choice-wins native switching can load the latest provider while an obsolete factory is pending',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});let finish;h.gates.set('eox-2016',new Promise(resolve=>{finish=resolve}));const old=h.controller.select('eox-2016');await h.controller.select('osm');assert.equal(h.controller.actual,'osm');await h.providers.get('osm').requestImage();const loaded=h.controller.activeRecord.loaded;finish();await old;assert.equal(loaded,true);assert.equal(h.controller.actual,'osm');assert.equal(h.controller.localAllocations,1);assert.equal(h.controller.diagnostics().managedLayers,1);h.cleanups[0]();
});
test('stationary footprint 429 automatically reopens after Retry-After without another camera move',async()=>{
 let calls=0;const h=harness(new Set(),async()=>{calls++;return calls===1?new Response('Rate limited',{status:429,headers:{'retry-after':'600'}}):footprint()});closeNewYork(h);await h.controller.retry({schema:1,qualified:false});assert.equal(calls,1);assert.equal(h.controller.actual,'eox-2016');h.advance(300001);h.tick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(calls,1);h.advance(300001);h.tick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(calls,2);assert.equal(h.controller.actual,'usgs-naip');assert.equal(h.controller.localAllocations,1);h.cleanups[0]();
});

test('tilted coverage targets the visible ground rather than the camera subpoint',async()=>{
 const h=harness();h.runtime.viewer.camera.positionCartographic={height:1500,longitude:-79.7*Math.PI/180,latitude:41.32*Math.PI/180};h.runtime.viewer.camera.computeViewRectangle=()=>({west:-79.59*Math.PI/180,south:41.32*Math.PI/180,east:-79.58*Math.PI/180,north:41.325*Math.PI/180});
 h.runtime.viewer.canvas={clientWidth:1440,clientHeight:900};h.runtime.viewer.camera.getPickRay=()=>({});h.runtime.viewer.camera.pickEllipsoid=()=>null;h.runtime.viewer.scene.globe.pick=()=>({longitude:-79.585394*Math.PI/180,latitude:41.321903*Math.PI/180});h.runtime.viewer.scene.globe.ellipsoid.cartesianToCartographic=x=>x;
 await h.controller.retry({schema:1,qualified:false});assert.ok(Math.abs(h.controller.view().point[0]+79.585394)<1e-8);assert.equal(h.controller.actual,'pema');h.cleanups[0]();
});
test('a horizon or sky center with no ground intersection never queries coverage or claims regional imagery',async()=>{
 let calls=0;const h=harness(new Set(),()=>{calls++;return footprint()});closeNewYork(h);h.runtime.viewer.canvas={clientWidth:1440,clientHeight:900};h.runtime.viewer.camera.getPickRay=()=>({});h.runtime.viewer.camera.pickEllipsoid=()=>null;h.runtime.viewer.scene.globe.pick=()=>undefined;h.runtime.viewer.scene.globe.ellipsoid.cartesianToCartographic=x=>x;
 await h.controller.retry({schema:1,qualified:false});assert.equal(h.controller.view().point,null);assert.equal(h.controller.actual,'nasa');assert.equal(calls,0);h.cleanups[0]();
});

test('one loaded tile with outstanding refinement is partial rather than repeatedly reporting ready',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});h.runtime.viewer.scene.globe.tilesLoaded=false;await h.providers.get('nasa').requestImage();assert.equal(h.controller.status,'partial');h.tick();assert.equal(h.controller.status,'partial');h.runtime.viewer.scene.globe.tilesLoaded=true;h.tick();assert.equal(h.controller.status,'ready');h.cleanups[0]();
});

test('one transient aerial tile failure retains useful imagery while repeated failures use native fallback',async()=>{
 const h=harness(new Set(),async()=>footprint());closeNewYork(h);await h.controller.retry({schema:1,qualified:false});const provider=h.providers.get('usgs-naip'),map=h.controller.map;await provider.requestImage();provider.errorEvent.raiseEvent({error:Error('One transient tile failure'),retry:false});await h.controller.updateView();assert.equal(h.controller.actual,'usgs-naip');assert.equal(h.controller.map,map);assert.equal(h.controller.status,'partial');
 provider.errorEvent.raiseEvent({error:Error('Second tile failure'),retry:false});provider.errorEvent.raiseEvent({error:Error('Third tile failure'),retry:false});await new Promise(resolve=>setTimeout(resolve,0));assert.equal(h.controller.actual,'eox-2016');assert.equal(h.controller.failedSources.has('usgs-naip'),true);h.cleanups[0]();
});

test('nadir coverage uses the center pixel and ellipsoid fallback before rendered tiles exist',async()=>{
 const h=harness(new Set(),async()=>footprint());closeNewYork(h);let pixel;h.runtime.viewer.camera.getPickRay=p=>{pixel=p;return {}};await h.controller.retry({schema:1,qualified:false});assert.equal(pixel.x,720);assert.equal(pixel.y,450);assert.equal(h.controller.actual,'usgs-naip');assert.equal(h.controller.view().point[0],-74);h.cleanups[0]();
});

test('rendered globe refinement cannot stale a coverage response for an unchanged camera',async()=>{
 let finish;const h=harness(new Set(),()=>new Promise(resolve=>{finish=resolve}));closeNewYork(h);let ground={longitude:-74*Math.PI/180,latitude:40.7*Math.PI/180};h.runtime.viewer.scene.globe.pick=()=>ground;const pending=h.controller.retry({schema:1,qualified:false});await new Promise(resolve=>setTimeout(resolve,0));ground={longitude:-74.0001*Math.PI/180,latitude:40.7001*Math.PI/180};finish(footprint());await pending;assert.equal(h.controller.footprints.length,2);assert.equal(h.controller.actual,'usgs-naip');h.cleanups[0]();
});

test('a guarded failure already reported by Cesium counts once toward native fallback',async()=>{
 const h=harness(new Set(),async()=>footprint());closeNewYork(h);await h.controller.retry({schema:1,qualified:false});const p=h.providers.get('usgs-naip'),error=Object.assign(Error('Declared guarded tile failure'),{imageryGuardFailure:true});p.requestResult=()=>Promise.reject(error);const request=p.requestImage(1,2,18);void request.catch(e=>p.errorEvent.raiseEvent({x:1,y:2,level:18,error:e,retry:false}));await assert.rejects(request);await new Promise(resolve=>setTimeout(resolve,5));assert.equal(h.controller.activeRecord.tileFailures,1);assert.equal(h.controller.actual,'usgs-naip');h.cleanups[0]();
});

test('NAIP attaches promptly without visible-tile preflight and preserves native cache reuse',async()=>{
 const h=harness(new Set(),async()=>footprint());await h.controller.retry({schema:1,qualified:false});closeNewYork(h);h.requestResults.set('usgs-naip',()=>new Promise(()=>{}));await h.controller.updateView();assert.equal(h.controller.actual,'usgs-naip');assert.equal(h.controller.diagnostics().managedLayers,1);assert.equal(h.controller.localAllocations,1);const pending=h.providers.get('usgs-naip').requestImage();h.cleanups[0]();await assert.rejects(pending,/disposed/);
});

test('a hard host response during a pending replacement remains registered for cooldown recovery',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});const old=h.providers.get('nasa');let finish;h.gates.set('eox-2016',new Promise(resolve=>{finish=resolve}));const switching=h.controller.select('eox-2016');old.requestResult=()=>Promise.reject(Object.assign(Error('Declared429'),{statusCode:429,retryAfter:'600'}));await assert.rejects(old.requestImage());assert.equal(h.controller.failedSources.has('nasa'),true);finish();await switching;assert.equal(h.controller.actual,'eox-2016');h.advance(600001);h.controller.recoverEligible();assert.equal(h.controller.failedSources.has('nasa'),false);h.cleanups[0]();
});

test('a finite grazing ground hit keeps global imagery without a close-view footprint query',async()=>{
 let calls=0;const h=harness(new Set(),()=>{calls++;return footprint()});h.runtime.viewer.camera.positionCartographic.height=100000;h.runtime.viewer.camera.computeViewRectangle=()=>({west:-100*Math.PI/180,south:55*Math.PI/180,east:-80*Math.PI/180,north:75*Math.PI/180});h.runtime.viewer.scene.globe.pick=()=>({longitude:-90*Math.PI/180,latitude:63*Math.PI/180});await h.controller.retry({schema:1,qualified:false});assert.equal(h.controller.view().point[1],63);assert.equal(h.controller.actual,'eox-2016');assert.equal(calls,0);h.cleanups[0]();
});

test('an active guarded unauthorized rejection reaches local fallback after pausing its host',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});h.providers.get('nasa').requestResult=()=>Promise.reject(Object.assign(Error('Declared403'),{statusCode:403}));await assert.rejects(h.providers.get('nasa').requestImage());await new Promise(resolve=>setTimeout(resolve,0));assert.equal(h.controller.actual,'local');assert.equal(h.controller.diagnostics().managedLayers,0);assert.equal(h.controller.localAllocations,1);h.cleanups[0]();
});

test('latest Paris camera defeats an older pending NYC provider without another moveEnd',async()=>{
 const h=harness(new Set(),async()=>footprint());await h.controller.retry({schema:1,qualified:false});
 let release;h.gates.set('usgs-naip',new Promise(resolve=>{release=resolve}));closeNewYork(h);h.controller.footprints.push({ring:[[-75,40],[-73,40],[-73,42],[-75,42],[-75,40]]});const old=h.controller.updateView();await new Promise(resolve=>setTimeout(resolve,0));
 h.runtime.viewer.camera.positionCartographic={height:1500,longitude:2.35*Math.PI/180,latitude:48.85*Math.PI/180};h.runtime.viewer.camera.computeViewRectangle=()=>({west:2.34*Math.PI/180,south:48.84*Math.PI/180,east:2.36*Math.PI/180,north:48.86*Math.PI/180});const latest=h.controller.updateView();await new Promise(resolve=>setTimeout(resolve,0));release();await Promise.all([old,latest]);assert.equal(h.controller.actual,'eox-2016');assert.equal(h.locals,1);h.cleanups[0]();
});

test('a healthy verified PEMA view does not preflight the lower-quality NAIP fallback',async()=>{
 let queries=0;const h=harness(new Set(),async()=>{queries++;return footprint()});h.controller.footprints=[];h.runtime.viewer.camera.positionCartographic={height:350,longitude:-79.585394*Math.PI/180,latitude:41.321903*Math.PI/180};h.runtime.viewer.camera.computeViewRectangle=()=>({west:-79.586*Math.PI/180,south:41.321*Math.PI/180,east:-79.585*Math.PI/180,north:41.322*Math.PI/180});await h.controller.retry({schema:1,qualified:false});assert.equal(h.controller.actual,'pema');assert.equal(queries,0);h.cleanups[0]();
});

test('a cached fallback from an obsolete factory recovers automatically after a stationary return',async()=>{
 const h=harness();await h.controller.retry({schema:1,qualified:false});let reject;h.gates.set('usgs-naip',new Promise((_,no)=>{reject=no}));closeNewYork(h);h.controller.footprints.push({ring:[[-75,40],[-73,40],[-73,42],[-75,42],[-75,40]]});const old=h.controller.updateView();await new Promise(resolve=>setTimeout(resolve,0));
 h.runtime.viewer.camera.positionCartographic={height:1500,longitude:2.35*Math.PI/180,latitude:48.85*Math.PI/180};h.runtime.viewer.camera.computeViewRectangle=()=>({west:2.34*Math.PI/180,south:48.84*Math.PI/180,east:2.36*Math.PI/180,north:48.86*Math.PI/180});await h.controller.updateView();reject(Error('Obsolete factory failure'));await old;h.gates.delete('usgs-naip');h.advance(60001);closeNewYork(h);await h.controller.updateView();assert.equal(h.controller.actual,'eox-2016');h.tick();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(h.controller.actual,'usgs-naip');assert.equal(h.controller.controllersCreated,2);assert.equal(h.locals,1);h.cleanups[0]();
});

test('terminal source changes invalidate pending cache writes; disposal keeps the client released',async()=>{const h=harness();await h.controller.retry({});const n=h.cacheScenes.length;h.controller.terminal('Declared terminal source failure');assert.ok(h.cacheScenes.length>n);h.cleanups[0]();assert.equal(h.cacheScenes.at(-1),false)});
