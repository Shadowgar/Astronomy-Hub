import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import {register} from 'node:module';
const source=process.env.GODS_EYE_SOURCE||'/var/tmp/oras-cesium/gods-eye';
if(!fs.existsSync(source+'/node_modules/cesium/Source/Cesium.js')){
 test('pinned Earth aircraft integration requires installed GODS_EYE_SOURCE',{skip:true},()=>{});
}else{
 register('./fixtures/pinned-earth-loader.mjs',import.meta.url);
 const {EntityCollection,JulianDate,Cartesian3,Ellipsoid}=await import('cesium');
 const {aircraftDisplay}=await import('../../runtimes/earth-runtime/layers/aircraftDisplay.mjs');
 const epoch=1800000000000;let now=epoch;
 const originalNow=Date.now;Date.now=()=>now;
 test.after(()=>Date.now=originalNow);
 const row=(id='abc123',time=now,lon=-79)=>({id,callsign:'DECLARED FIXTURE',longitude:lon,latitude:41,ellipsoidAltitudeM:9144,baroAltitudeM:null,positionTimeMs:time,contactTimeMs:time,onGround:false,speedMps:100,courseDeg:null});
 function setup(width=1440){now=epoch;const viewer={canvas:{clientWidth:width,clientHeight:900},camera:{positionCartographic:{height:500000},positionWC:Cartesian3.fromDegrees(-79,41,500000)},entities:new EntityCollection(),clock:{currentTime:JulianDate.fromDate(new Date(epoch))},scene:{globe:{ellipsoid:Ellipsoid.WGS84},cartesianToCanvasCoordinates:()=>({x:50,y:50}),requestRender(){}},isDestroyed:()=>false};const selection={value:null,set(entity){this.value=entity},clearLayer(){this.value=null}};const camera={stopTracking(){viewer.trackedEntity=null}};return {viewer,selection,display:aircraftDisplay({viewer,selection,camera})}}
 const replace=(c,rows,options)=>c.display.replace(rows,new Date(now).toISOString(),options);
 const select=c=>{const e=c.viewer.entities.getById('aircraft:abc123');c.selection.value=e;c.viewer.trackedEntity=e;return e};
 test('five-minute recovery holds a genuine fresh fix with stable selection, repeated errors keep it hidden',()=>{
  const c=setup();replace(c,[row()]);const e=select(c);c.display.clear(true);now+=300000;c.display.clear(true);assert.equal(e.show,false);assert.equal(e.orasMetadata.available,false);assert.equal(c.viewer.trackedEntity,null);
  replace(c,[row('abc123',now,-77)]);c.display.animate();assert.equal(c.selection.value,e);assert.equal(e.show,true);assert(Cartesian3.equalsEpsilon(e.position.getValue(c.viewer.clock.currentTime),Cartesian3.fromDegrees(-77,41,9144),1e-10));assert(e.orasMetadata.facts.some(f=>f.label==='Position observed'&&f.value===new Date(now).toISOString()));
 });
 test('one omitted snapshot retains selected followed identity, discloses held facts, reappearance clears missing state',()=>{
  const c=setup();replace(c,[row()]);const e=select(c),source=e.orasMetadata.facts.find(f=>f.label==='Position observed').value;now+=30000;replace(c,[]);assert.equal(c.viewer.entities.getById(e.id),e);assert.equal(c.viewer.trackedEntity,e);assert.match(e.orasMetadata.detail,/missing/);assert.equal(e.orasMetadata.facts.find(f=>f.label==='Position observed').value,source);assert.equal(c.display.counts().retainedMissing,1);assert.equal(c.display.counts().capped,0);
  now+=30000;replace(c,[row()]);assert.equal(c.selection.value,e);assert.equal(c.viewer.trackedEntity,e);assert.equal(c.display.counts().retainedMissing,0);
 });
 test('complete snapshots remove on third missing poll; partial snapshots retain only until actual fix expires',()=>{
  for(const complete of [true,false]){const c=setup();replace(c,[row()]);select(c);for(let i=1;i<=3;i++){now=epoch+i*30000;replace(c,[],{complete});assert.equal(c.viewer.entities.values.length,complete&&i===3?0:1)}now=epoch+120000;c.display.animate();assert.equal(c.viewer.entities.values.length,0);assert.equal(c.selection.value,null);assert.equal(c.viewer.trackedEntity,null)}
 });
 test('explicit invalidation, abandoned coverage and display budget removal do not receive omission grace',()=>{
  for(const operation of ['invalid','coverage','budget']){const c=setup(390);replace(c,[row()]);const e=select(c);now+=30000;if(operation==='invalid')replace(c,[],{complete:false,rejectedIds:['abc123']});if(operation==='coverage')c.display.clear();if(operation==='budget'){c.selection.value=null;c.viewer.trackedEntity=null;replace(c,Array.from({length:100},(_,i)=>row(i.toString(16).padStart(6,'0'))));assert.equal(c.viewer.entities.values.length,100)}assert.equal(c.viewer.entities.getById(e.id),undefined)}
 });
 test('retained selected contact shares the mobile cap with current contacts and keeps truthful capped counts',()=>{
  const c=setup(390);replace(c,[row()]);const e=select(c);now+=30000;replace(c,Array.from({length:100},(_,i)=>row(i.toString(16).padStart(6,'0'))));assert.equal(c.viewer.entities.values.length,100);assert.equal(c.viewer.trackedEntity,e);assert.deepEqual({...c.display.counts(),visible:undefined},{capped:1,retainedMissing:1,renderable:100,visible:undefined,lod:'glyph',budget:100});
 });
 test('held glyphs avoid repeated orientation work and overview points skip invisible glyph orientation',()=>{
  const c=setup();c.viewer.scene.camera=c.viewer.camera;let reads=0,renders=0;
  Object.defineProperty(c.viewer.camera,'rightWC',{get(){reads++;return Cartesian3.UNIT_X}});
  Object.defineProperty(c.viewer.camera,'upWC',{get(){reads++;return Cartesian3.UNIT_Y}});
  c.viewer.scene.requestRender=()=>renders++;
  replace(c,Array.from({length:100},(_,i)=>({...row(i.toString(16).padStart(6,'0')),courseDeg:90})));
  c.display.animate();reads=0;renders=0;c.display.animate();assert(reads<=4,'steady held glyphs repeatedly recompute orientation');assert.equal(renders,0);
  c.viewer.camera.positionCartographic.height=3000000;reads=0;c.display.animate();assert(reads<=4,'overview computes invisible glyph orientation');
 });

 test('source-age status stays current without five duplicate provider notifications per second',async()=>{
  const {Event}=await import('cesium'),{ProviderStatusRegistry}=await import('../../runtimes/earth-runtime/core/ProviderStatusRegistry.mjs'),{createFlightsAdapter}=await import('../../runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs');
  const c=setup();Object.assign(c.viewer.camera,{pickEllipsoid:()=>null,changed:new Event(),moveEnd:new Event()});let tick,readyWrites=0;
  const providerStatus=new ProviderStatusRegistry((id,status)=>{if(status.status==='ready')readyWrites++}),context={...c,observer:()=>({lat:41,lon:-79}),abortSignal:new AbortController().signal,providerStatus,attribution:{set(){},remove(){}}};
  const originalFetch=globalThis.fetch,originalInterval=globalThis.setInterval;globalThis.fetch=async()=>new Response(JSON.stringify({now:now/1000,ac:[]}));globalThis.setInterval=fn=>{tick=fn;return 0};
  const layer=createFlightsAdapter(context);layer.initialize(context);
  try{await layer.enable();readyWrites=0;for(let i=0;i<10;i++){now=epoch+i*200;tick()}assert(readyWrites<=3,'unchanged feed produces five status notifications per second');assert(providerStatus.get('aircraft').ageMs>=1000);assert.equal(providerStatus.get('aircraft').observedAt,new Date(epoch).toISOString());}finally{layer.destroy();globalThis.fetch=originalFetch;globalThis.setInterval=originalInterval;}
 });

 test('the acquisition row ceiling cannot prove a complete regional feed; explicit invalid IDs remain rejected',async()=>{
  const {createFlightsAdapter}=await import('../../runtimes/earth-runtime/layers/GodsEyeFlightsAdapter.mjs'),c=setup(),context={...c,observer:()=>({lat:41,lon:-79}),abortSignal:new AbortController().signal};
  const originalFetch=globalThis.fetch;
  try{for(const invalid of [false,true]){globalThis.fetch=async()=>new Response(JSON.stringify({now:now/1000,ac:invalid?[{hex:'abc123',lat:41,lon:-79,seen_pos:0,alt_geom:null,alt_baro:30000}]:Array.from({length:2000},(_,i)=>({hex:i.toString(16).padStart(6,'0'),lat:41,lon:-79,seen_pos:0,alt_geom:30000}))}));const layer=createFlightsAdapter(context),snapshot=await layer.read(context.abortSignal);assert.equal(snapshot.complete,false);if(invalid){assert.deepEqual(snapshot.rejectedIds,['abc123']);assert.equal(snapshot.records.length,0)}else assert.equal(snapshot.records.length,2000);}}finally{globalThis.fetch=originalFetch;}
 });

 test('reported landing after airborne observation receives upstream fast cull; first-seen parked contact keeps normal grace',()=>{
  for(const flew of [false,true]){const c=setup();if(flew){replace(c,[row()]);now+=30000}replace(c,[{...row(),onGround:true,ellipsoidAltitudeM:432}]);now+=30000;replace(c,[]);assert.equal(c.viewer.entities.values.length,flew?0:1)}
 });

 test('a moving cohort publishes one collection change while preserving every interpolated position and followed identity',()=>{
  const c=setup(),rows=time=>Array.from({length:100},(_,i)=>row(i.toString(16).padStart(6,'0'),time,time===epoch?-79:-78.965));
  replace(c,rows(epoch));const followed=c.viewer.entities.values[0];c.selection.value=followed;c.viewer.trackedEntity=followed;
  now+=30000;replace(c,rows(now));now+=15000;let notifications=0,changed=0;
  c.viewer.entities.collectionChanged.addEventListener((_,added,removed,updates)=>{notifications++;changed+=updates.length});c.display.animate();
  assert.equal(notifications,1,'per-contact collection notifications amplify Viewer subscriber work');assert.equal(changed,100);assert.equal(c.viewer.trackedEntity,followed);
  const expected=Cartesian3.lerp(Cartesian3.fromDegrees(-79,41,9144),Cartesian3.fromDegrees(-78.965,41,9144),.5,new Cartesian3());
  for(const entity of c.viewer.entities.values)assert(Cartesian3.equalsEpsilon(entity.position.getValue(c.viewer.clock.currentTime),expected,1e-10));
 });

 test('current higher-sorting contacts fill the cap before unselected missing contacts',()=>{
  for(const followed of [false,true]){
   const c=setup(390),old=Array.from({length:100},(_,i)=>row(i.toString(16).padStart(6,'0')));
   replace(c,old);const kept=c.viewer.entities.values[0];if(followed){c.selection.value=kept;c.viewer.trackedEntity=kept}
   now+=30000;replace(c,Array.from({length:100},(_,i)=>row((0xabc000+i).toString(16))));
   const current=c.viewer.entities.values.filter(e=>String(e.id).startsWith('aircraft:abc'));
   assert.equal(current.length,followed?99:100,'missing placeholders starve current observations');
   assert.equal(c.display.counts().retainedMissing,followed?1:0);assert.equal(c.display.counts().capped,followed?1:0);
   assert.equal(c.viewer.entities.values.length,100);if(followed)assert.equal(c.viewer.trackedEntity,kept);
  }
 });
 test('resizing prioritizes current contacts while reserving a qualifying missing follow within the cap',()=>{
  for(const followed of [false,true]){
   const c=setup(),old=Array.from({length:100},(_,i)=>row(i.toString(16).padStart(6,'0')));
   replace(c,old);const kept=c.viewer.entities.values[0];if(followed){c.selection.value=kept;c.viewer.trackedEntity=kept}
   now+=30000;replace(c,Array.from({length:100},(_,i)=>row((0xabc000+i).toString(16))));assert.equal(c.viewer.entities.values.length,200);
   c.viewer.canvas.clientWidth=390;c.display.animate();
   assert.equal(c.viewer.entities.values.filter(e=>String(e.id).startsWith('aircraft:abc')).length,followed?99:100);
   assert.equal(c.display.counts().retainedMissing,followed?1:0);assert.equal(c.display.counts().capped,followed?1:0);
   assert.equal(c.viewer.entities.values.length,100);if(followed)assert.equal(c.viewer.trackedEntity,kept);
  }
 });
}
