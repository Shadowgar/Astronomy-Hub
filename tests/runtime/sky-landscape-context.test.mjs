import {satellitePresentation} from '../../runtimes/sky-adapter/satellite-presentation.mjs';
import {observerElevationSource,sameObserverLocation} from '../../packages/runtime-protocol/observer-elevation.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
const source=readFileSync(process.env.N1_PLUGIN_SOURCE||new URL('../../runtimes/sky-adapter/plugin.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace('export default','globalThis.plugin=');
function page(embedded,initial='guereins',search='',reduced=false){
 const window=new EventTarget(),watchers=[],added=[],zero={horizon_color:[.1,.15,.1,1],horizon_border_color:[.2,.4,.1,1]},core={landscapes:{zero,current_id:initial,visible:true,get current(){return this.current_id==='zero'?zero:{}},addDataSource:v=>added.push(v)},observer:{}},state={stel:core,nightmode:false};
 const document={documentElement:{classList:{toggle(){}}},createElement:()=>({textContent:''}),head:{appendChild(){}},querySelector:()=>null};
 const scope={matchMedia:()=>({matches:reduced}),satellitePresentation,observerElevationSource,sameObserverLocation,site:{latitude:41.321903,longitude:-79.585394,elevationMeters:432.816},Event,window,document,location:{search:(embedded?'?orasEmbedded=1&':'?')+search},URLSearchParams,BottomBar:{},swh:{},CustomEvent:class extends Event{constructor(name,options){super(name);this.detail=options.detail}},installNativeWheel:()=>Object.assign(()=>{},{reset(){}})};
 const app={$stel:{core},$store:{state,commit:(_name,v)=>{state[v.varName]=v.newValue}},$watch:(read,fn,options)=>{watchers.push({read,fn});if(options?.immediate)fn(read());return ()=>{}}};
 runInNewContext(source,scope);scope.plugin.onEngineReady(app);
 const select=id=>{core.landscapes.current_id=id;for(const w of watchers)w.fn(w.read())};
 return {core,added,app,adapter:window.orasSkyAdapter,select};
}
test('standalone keeps native landscape selection and visibility toggles',()=>{
 const p=page(false);assert.equal(p.core.landscapes.current_id,'guereins');assert.equal(p.added.length,0);
 p.select('native-choice');assert.equal(p.core.landscapes.current_id,'native-choice');p.core.landscapes.visible=false;p.core.landscapes.visible=true;assert.equal(p.core.landscapes.visible,true);
});
test('embedded landscape selects the illustrative panorama and releases native choices',()=>{
 const p=page(true);assert.equal(p.core.landscapes.current_id,'pennsylvania-woodland-v1');p.select('guereins');assert.equal(p.core.landscapes.current_id,'pennsylvania-woodland-v1');
 assert.deepEqual(JSON.parse(JSON.stringify(p.added)),[{url:'/oras-sky-engine/landscapes/pennsylvania-woodland-v1',key:'pennsylvania-woodland-v1'}]);
 p.core.landscapes.visible=false;p.adapter.presentation(false);assert.equal(p.core.landscapes.current_id,'guereins');assert.equal(p.core.landscapes.visible,false);
 p.select('native-choice');p.adapter.presentation(true);assert.equal(p.core.landscapes.current_id,'pennsylvania-woodland-v1');assert.equal(p.added.length,1);
 p.adapter.presentation(false);assert.equal(p.core.landscapes.current_id,'native-choice');
});
test('panorama never recolors or reactivates the original zero circle',()=>{
 const p=page(true,'zero');assert.equal(p.core.landscapes.current_id,'pennsylvania-woodland-v1');assert.deepEqual(p.core.landscapes.zero.horizon_color,[.1,.15,.1,1]);
 p.adapter.presentation(false);assert.equal(p.core.landscapes.current_id,'zero');assert.deepEqual(p.core.landscapes.zero.horizon_border_color,[.2,.4,.1,1]);
});

test('native Sky navigation rejects false elevation provenance and keeps provided zero',()=>{
 for(const [source,elevationM,expected] of [['oras-site',123,'provided'],['unavailable-zero',123,'provided'],['unavailable-zero',0,'unavailable-zero'],['provided',0,'provided']]){
  const p=page(true,'guereins',`lat=40.7829&lng=-73.9654&elev=${elevationM}&elevationSource=${source}`),o=p.core.observer;Object.assign(o,{latitude:40.7829*Math.PI/180,longitude:-73.9654*Math.PI/180,elevation:elevationM,utc:61327, yaw:0,pitch:0,roll:0});
  assert.equal(p.adapter.navigation().elevationSource,expected);
 }
});

test('native satellite point selection retains source-backed NORAD details and Focus availability',()=>{
 const p=page(true),data=JSON.parse(readFileSync(new URL('./fixtures/native-satellite-selection.json',import.meta.url),'utf8'));
 p.core.selection={jsonData:data};p.core.observer.utc=61196;
 const selection=p.adapter.snapshot().selection;assert.ok(selection);assert.equal(selection.catalog,'Satellite TLE (local)');assert.equal(selection.source_id,String(data.model_data.norad_number));assert.equal(selection.kind,'satellite');assert.equal(selection.focusable,true);assert.ok(selection.facts.some(f=>f.label==='NORAD'&&f.value===String(data.model_data.norad_number)));
 p.adapter.clear();assert.equal(p.adapter.snapshot().selection,null);
});

test('absent or blank URL coordinates do not identify a native zero observer as a missing-height fallback',()=>{
 for(const search of ['', 'lat=&lng=', 'date=2026-06-05T02:10:00.000Z']){
  const p=page(false,'guereins',search);Object.assign(p.core.observer,{latitude:0,longitude:0,elevation:0,utc:61196,yaw:0,pitch:0,roll:0});assert.equal(p.adapter.navigation().elevationSource,'provided');
 }
});

test('embedded reduced-motion satellite Focus retains native locking without a visible animation',()=>{
 for(const [embedded,reduced,model]of [[true,true,'tle_satellite'],[true,false,'tle_satellite'],[true,true,'star'],[false,true,'tle_satellite']]){
  const p=page(embedded,'guereins','',reduced),obj={jsonData:{model}};p.core.selection=obj;let duration;
  // Pinned core_lookat(0) resets the target struct, including its lock. Use the
  // actual supported native argument contract; browser RED records real WASM.
  p.app.$stel.pointAndLock=(value,seconds)=>{duration=seconds;p.core.lock=seconds===0?null:value};
  assert.equal(p.adapter.focus().ok,true);
  if(embedded&&reduced&&model==='tle_satellite'){assert.equal(p.core.lock,obj);assert.ok(duration>0&&duration<.001)}
  else assert.equal(duration,reduced?0:1);
 }
});
