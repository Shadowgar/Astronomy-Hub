import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {runInNewContext} from 'node:vm';
import {PollingLayer} from '../../runtimes/earth-runtime/layers/PollingLayer.mjs';import {readCapped} from '../../runtimes/earth-runtime/layers/data.mjs';import {validEventFeed,validRadarFeed} from '../../runtimes/earth-runtime/layers/eventData.mjs';
const source=readFileSync(new URL('../../runtimes/earth-runtime/layers/EventLayers.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'')+'; createEventAdapter';
function setup(id){
 const stamp=new Date().toISOString(),values=[],images=[],credits=new Map();let status,fail=false;
 const record={id:'fixture',name:'Declared fixture',lat:42,lon:-80,occurredAt:stamp,updatedAt:stamp,magnitude:3.5,depthKm:10,acres:12,containedPct:20,polygons:id==='fire-perimeters'?[[[[-80,42],[-79.9,42],[-79.9,42.1],[-80,42]]]]:null};if(id==='fire-perimeters'){record.magnitude=null;record.depthKm=null;record.occurredAt=null;}
 const dto=id==='weather-radar'?{schemaVersion:1,product:'radar',temporalMode:'CURRENT_SNAPSHOT',source:'NOAA/NWS nowCOAST',latest:stamp,times:[stamp],bounds:{west:-130,south:20,east:-60,north:55},fetchedAt:stamp,tileSize:256,maxLevel:6,tilingScheme:'geographic'}:{schemaVersion:1,kind:id,temporalMode:id==='earthquakes'?'EVENT_FEED':'CURRENT_SNAPSHOT',source:'Fixture source',observedAt:stamp,fetchedAt:stamp,limited:id==='fire-perimeters',records:[record]};
 const color=value=>({value,withAlpha(alpha){return {...this,alpha}}}),context={abortSignal:new AbortController().signal,viewer:{entities:{add(e){values.push(e);return e},remove(e){const i=values.indexOf(e);if(i>=0)values.splice(i,1)}},imageryLayers:{addImageryProvider(provider){const layer={provider};images.push(layer);return layer},remove(layer){images.splice(images.indexOf(layer),1)}},scene:{requestRender(){}},isDestroyed:()=>false},selection:{value:null,clearLayer(){this.value=null},set(e){this.value=e}},camera:{stopTracking(){}},attribution:{set(key,value){credits.set(key,value)},remove:key=>credits.delete(key)},providerStatus:{set(_id,value){status=value}}};
 const create=runInNewContext(source,{PollingLayer,readCapped,validEventFeed,validRadarFeed,Cartesian3:{fromDegrees:(lon,lat,height)=>({lon,lat,height})},ColorMaterialProperty:class{constructor(color){this.color=color}getType(){return 'Color'}},Color:{fromCssColorString:color,WHITE:color('#ffffff')},depthColor:depth=>color('depth:'+depth),perimeterAnchorDegrees:()=>({lat:42,lon:-80}),ConstantPositionProperty:class{constructor(value){this.value=value}setValue(value){this.value=value}},Cartesian2:class{},PolygonHierarchy:class{constructor(points,holes=[]){this.points=points;this.holes=holes}},CallbackProperty:class{constructor(get){this.get=get}},DistanceDisplayCondition:class{constructor(near,far){this.near=near;this.far=far}},Rectangle:{fromDegrees:()=>({})},SingleTileImageryProvider:{fromUrl:async()=>({})},URL,Blob,fetch:async url=>fail?new Response('',{status:503}):url.includes('radar-image')?new Response(new Uint8Array([1,2,3])):Response.json(dto)});
 return {layer:create(context,id),context,values,images,credits,dto,get status(){return status},fail(value){fail=value}};
}
for(const id of ['earthquakes','fire-perimeters','weather-radar'])test(`${id}: activation, exact selection metadata/time, unavailable, retry, disable and cleanup`,async()=>{const s=setup(id);s.layer.initialize(s.context);await s.layer.enable();assert.equal(s.status.status,'ready');assert.equal(s.status.temporalMode,id==='earthquakes'?'EVENT_FEED':'CURRENT_SNAPSHOT');assert.ok(s.status.observedAt);assert.ok(s.values.length);const marker=s.values.find(e=>e.orasMetadata);assert.ok(marker.id.startsWith(id+':'));assert.ok(marker.orasMetadata.facts.find(f=>f.label==='Source'));s.context.selection.value=marker;s.fail(true);clearTimeout(s.layer.timer);s.layer.timer=null;await s.layer.poll(s.layer.generation);assert.equal(s.status.status,'unavailable');assert.equal(s.values.length,0);assert.equal(s.images.length,0);s.fail(false);s.layer.disable();await s.layer.enable();assert.equal(s.status.status,'ready');s.layer.disable();assert.equal(s.values.length,0);s.layer.destroy();assert.equal(s.credits.size,0);assert.equal(s.layer.timer,null)});
test('fire renderer preserves polygon holes rather than substituting points for perimeters',async()=>{const s=setup('fire-perimeters');s.dto.records[0].polygons[0].push([[-79.99,42.01],[-79.98,42.01],[-79.98,42.02],[-79.99,42.01]]);s.layer.initialize(s.context);await s.layer.enable();const polygon=s.values.find(e=>e.polygon);assert.equal(polygon.polygon.hierarchy.holes.length,1);assert.equal(typeof polygon.polygon.material.getType,'function');assert.equal(polygon.orasSelectableEntity,s.values.find(e=>e.orasMetadata));s.layer.destroy()});
test('event selection identity survives a same-ID refresh',async()=>{const s=setup('earthquakes');s.layer.initialize(s.context);await s.layer.enable();const marker=s.values[0];s.context.selection.value=marker;s.dto.records[0].magnitude=5;clearTimeout(s.layer.timer);s.layer.timer=null;await s.layer.poll(s.layer.generation);assert.equal(s.values[0],marker);assert.equal(marker.orasMetadata.facts.find(f=>f.label==='Magnitude').value,'5.0');s.layer.destroy()});

for(const selected of [false,true])test(`same-ID earthquake revisions refresh marker facts and appearance; selected=${selected}`,async()=>{
 const s=setup('earthquakes');s.layer.initialize(s.context);
 try{
  await s.layer.enable();const marker=s.values[0];if(selected)s.context.selection.value=marker;
  for(const [magnitude,depthKm,name,far] of [[5.2,80,'Revised place',60000000],[3.1,null,'Second revision',15000000]]){
   Object.assign(s.dto.records[0],{magnitude,depthKm,name,lat:43,lon:-81});
   clearTimeout(s.layer.timer);s.layer.timer=null;await s.layer.poll(s.layer.generation);
   assert.equal(s.values[0],marker);assert.equal(s.values.length,1);
   assert.equal(marker.point.distanceDisplayCondition.far,far);
   assert.equal(marker.point.color.value,depthKm===null?'#a8bbce':'depth:'+depthKm);
   assert.equal(marker.point.color.alpha,.8);assert.equal(marker.label.text,name);
   assert.equal(marker.name,name);assert.equal(marker.point.pixelSize,selected?16:5+magnitude);
   assert.equal(marker.orasMetadata.basePointSize,5+magnitude);
   assert.equal(marker.orasMetadata.facts.find(f=>f.label==='Magnitude').value,magnitude.toFixed(1));
   assert.equal(s.context.selection.value,selected?marker:null);
  }
 }finally{s.layer.destroy()}
});
