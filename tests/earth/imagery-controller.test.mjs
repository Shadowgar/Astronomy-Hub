import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
import {boundImageryRequests} from '../../runtimes/earth-runtime/core/imageryRequests.mjs';
const deferred=()=>{let resolve;const promise=new Promise(yes=>resolve=yes);return {promise,resolve}};
function harness(localPromise){
 class Provider {constructor(options={}){this.options=options;this.rectangle=options.rectangle;this.listeners=new Set();this.errorEvent={addEventListener:fn=>{this.listeners.add(fn);return ()=>this.listeners.delete(fn)}};this.requestImage=()=>Promise.resolve('image');}fail(){for(const fn of [...this.listeners])fn({retry:true});}}
 const local=new Provider(),overlays=[{name:'radar'}],credits=new Map(),cleanups=[];
 const cameraListeners=new Set();
 const runtime={viewer:{camera:{view:[-80,40,-79,42],computeViewRectangle(){return this.view},positionCartographic:{height:100000},changed:{addEventListener:fn=>{cameraListeners.add(fn);return ()=>cameraListeners.delete(fn)}},notify(){for(const fn of cameraListeners)fn()}},imageryLayers:{addImageryProvider(provider,index){const layer={provider};overlays.splice(index,0,layer);return layer},remove(layer){const i=overlays.indexOf(layer);assert.notEqual(i,-1);overlays.splice(i,1)}},scene:{globe:{ellipsoid:{}},requestRender(){}}},lifecycle:{closed:false,add:fn=>cleanups.push(fn)},attribution:{set:(id,text)=>credits.set(id,text),remove:id=>credits.delete(id)},timings:{}};
 const source=readFileSync(new URL('../../runtimes/earth-runtime/core/ImageryController.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export class','class')+'; ImageryController';
 const Controller=runInNewContext(source,{TileMapServiceImageryProvider:{fromUrl:()=>localPromise??Promise.resolve(local)},WebMapServiceImageryProvider:Provider,UrlTemplateImageryProvider:Provider,IonImageryProvider:{fromAssetId:()=>Promise.resolve(new Provider())},Rectangle:{fromDegrees:(...args)=>args,intersection:(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1]?a:undefined},boundImageryRequests,performance});
 const quality={},controller=new Controller(runtime,quality);return {controller,runtime,quality,credits,overlays,local,cleanups};
}
test('CONUS envelope, native tile cap, credits and retry keep radar above imagery',async()=>{
 const h=harness();await h.controller.retry({publicImagery:'usgs-conus'});assert.equal(h.overlays.at(-1).name,'radar');assert.equal(h.overlays.length,4);
 const p=h.controller.entries.get('usgs').layer.provider;assert.equal(p.options.maximumLevel,16);assert.equal(p.options.minimumLevel,0);assert.equal(p.options.enablePickFeatures,false);assert.deepEqual([...p.options.rectangle],[-125,24,-66,50]);assert.ok(p.options.url.startsWith('https://basemap.nationalmap.gov/'));assert.match(h.credits.get('usgs'),/USDA\/NAIP/);
 await p.requestImage();assert.match(h.quality.imagery,/CONUS only/);assert.ok(h.quality.imagery.length<=120);
 await h.controller.retry({publicImagery:'usgs-conus'});assert.equal(h.overlays.length,4);assert.equal(h.overlays.at(-1).name,'radar');h.cleanups[0]();assert.deepEqual(h.overlays,[{name:'radar'}]);assert.equal(p.listeners.size,0);
});
test('provider failure removes only that imagery, retains truthful fallback, does not retry or lose overlay',async()=>{
 const h=harness();await h.controller.retry({publicImagery:'usgs-conus'});const hd=h.controller.entries.get('usgs').layer.provider,gibs=h.controller.entries.get('gibs').layer.provider;
 await hd.requestImage();hd.fail();await gibs.requestImage();assert.match(h.quality.imagery,/USGS unavailable.*Blue Marble/);assert.equal(h.credits.has('usgs'),false);assert.equal(hd.requestImage(),undefined);assert.equal(h.overlays.length,3);assert.equal(h.overlays.at(-1).name,'radar');
 gibs.fail();await h.local.requestImage();assert.match(h.quality.imagery,/USGS unavailable.*Natural Earth/);h.cleanups[0]();
});
test('late fallback completion cannot overwrite the HD source, and retries coalesce',async()=>{
 const task=deferred(),h=harness(task.promise);const one=h.controller.retry({publicImagery:'usgs-conus'}),two=h.controller.retry({publicImagery:'usgs-conus'});assert.equal(one,two);task.resolve(h.local);await one;
 await h.controller.entries.get('usgs').layer.provider.requestImage();await h.controller.entries.get('gibs').layer.provider.requestImage();await h.local.requestImage();assert.match(h.quality.imagery,/^USGS aerial/);h.cleanups[0]();
});
test('navigation during pending imagery initialization never attaches late layers',async()=>{
 const task=deferred(),h=harness(task.promise),pending=h.controller.retry({publicImagery:'usgs-conus'});h.runtime.lifecycle.closed=true;h.cleanups[0]();task.resolve(h.local);await pending;assert.deepEqual(h.overlays,[{name:'radar'}]);assert.equal(h.credits.size,0);
});
test('legacy and disabled imagery configuration retain global sources without contacting USGS',async()=>{
 for(const config of [null,{publicImagery:'blue-marble'}]){const h=harness();await h.controller.retry(config);assert.equal(h.controller.entries.has('usgs'),false);assert.equal(h.overlays.length,3);h.cleanups[0]();}
});

test('global view does not fetch or show a rectangular CONUS patch; regional view fades it in',async()=>{
 const h=harness(),camera=h.runtime.viewer.camera;camera.positionCartographic.height=15000000;
 await h.controller.retry({publicImagery:'usgs-conus'});const entry=h.controller.entries.get('usgs');assert.equal(entry.layer.show,false);assert.equal(entry.state,'standby');assert.doesNotMatch(h.quality.imagery,/USGS aerial loading/);
 camera.positionCartographic.height=1500000;camera.notify();assert.equal(entry.layer.show,true);assert.equal(entry.layer.alpha,.5);
 camera.positionCartographic.height=100000;camera.notify();assert.equal(entry.layer.alpha,1);h.cleanups[0]();camera.notify();
});

test('close views outside CONUS stay on fallback, then resume HD when coverage enters view',async()=>{
 const h=harness(),camera=h.runtime.viewer.camera;camera.view=[1,47,3,49];
 await h.controller.retry({publicImagery:'usgs-conus'});await h.controller.entries.get('gibs').layer.provider.requestImage();
 const hd=h.controller.entries.get('usgs');assert.equal(hd.state,'standby');assert.equal(hd.layer.show,false);assert.match(h.quality.imagery,/Blue Marble/);assert.doesNotMatch(h.quality.imagery,/USGS aerial loading/);
 camera.view=[-80,40,-79,42];camera.notify();assert.equal(hd.state,'loading');assert.equal(hd.layer.show,true);await hd.layer.provider.requestImage();
 camera.view=undefined;camera.notify();assert.equal(hd.layer.show,false);assert.match(h.quality.imagery,/Blue Marble/);assert.doesNotMatch(h.quality.imagery,/2017/);
 camera.view=[-80,40,-79,42];camera.notify();assert.equal(hd.layer.show,true);assert.match(h.quality.imagery,/2017/);h.cleanups[0]();
});
