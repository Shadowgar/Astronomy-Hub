import {Cartesian3,Cartesian2,Color,ConstantPositionProperty,EllipsoidalOccluder} from 'cesium';
import {FlightRecords} from 'gods-eye-view/layers/flights/records';
import {lerpAngleDeg,screenProjectedRotation} from 'gods-eye-view/aircraft';
import {bracket} from './aircraftPolicy.mjs';

// Existing qualified Hub glyph; no model/media acquisition. Upstream MIT notices
// travel with the artifact. Lower-level records and orientation execute unchanged.
const glyph='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffe185" stroke-width="2"><path d="m12 3 2 7 7 4v2l-7-2v5l2 2h-8l2-2v-5-2 2H3v-2l7-4z"/></svg>');
export function aircraftDisplay(context){
 const {viewer,selection}=context,entities=new Map(),histories=new Map();
 const records=new FlightRecords({geoidHeight:()=>null,cachedGroundFloor:()=>null,floorAltitudeM:alt=>alt});
 const budget=()=>viewer.canvas.clientWidth<768?100:1000;
 const detailed=()=>viewer.camera.positionCartographic.height<2_000_000;
 const position=(id,result)=>{const history=histories.get(id)||[],now=Date.now();if(!history.length||now-history.at(-1).time>=120000)return undefined;const pair=bracket(history,now);return pair?Cartesian3.lerp(pair.a.position,pair.b.position,pair.t,result||new Cartesian3()):undefined};
 const erase=id=>{const entity=entities.get(id);if(!entity)return;if(selection.value===entity)selection.clearLayer('aircraft');if(viewer.trackedEntity===entity)context.camera.stopTracking();viewer.entities.remove(entity);entities.delete(id);histories.delete(id);records.forget(id)};
 let admitted=0,cohort=0;
 return {
  replace(observations,observedAt){
   admitted=observations.length;const present=new Set(),limit=budget();
   // A deterministic cohort preserves identity and applies the stricter detailed
   // device budget at all heights. Overview never expands source acquisition.
   for(const observation of observations.sort((a,b)=>a.id.localeCompare(b.id)).slice(0,limit)){
    const {icao24:id,meta,fixEpochMs}=records.receive(observation,{viewerLatDeg:null,viewerLonDeg:null,trackedId:null,floorWarmPoints:[]});
    present.add(id);const history=histories.get(id)||[],last=history.at(-1);
    if(!last||fixEpochMs>last.time){history.push({time:fixEpochMs,position:Cartesian3.fromDegrees(meta.rawLon,meta.rawLat,observation.ellipsoidAltitudeM),track:observation.courseDeg});if(history.length>5)history.shift()}
    histories.set(id,history);let entity=entities.get(id);
    if(!entity){entity=viewer.entities.add({id:'aircraft:'+id,position:new ConstantPositionProperty(position(id)),billboard:{image:glyph,width:20,height:20,show:detailed(),rotation:0},point:{pixelSize:8,color:Color.fromCssColorString('#ffe185'),outlineWidth:1,outlineColor:Color.fromCssColorString('#03070B'),show:!detailed()},label:{text:observation.callsign||id,font:'11px sans-serif',pixelOffset:new Cartesian2(0,-20),fillColor:Color.WHITE,show:false}});entities.set(id,entity)}
    entity.show=true;entity.name=meta.callsign||id;entity.label.text=entity.name;
    entity.orasMetadata={layerId:'aircraft',name:entity.name,detail:'Regional source-reported aircraft. Display delayed 30 s; interpolation uses only actual observations. No extrapolation.',facts:[{label:'Provider',value:'adsb.lol · ODbL 1.0'},{label:'Identity',value:id},{label:'Geometric altitude',value:observation.ellipsoidAltitudeM.toFixed(0)+' m'},{label:'Position observed',value:new Date(fixEpochMs).toISOString()},{label:'Source time',value:observedAt},{label:'Display',value:history.length>1?'Delayed, bracketed estimate or held observation':'Held source observation'}]};
    if(selection.value===entity)selection.set(entity);
   }
   for(const id of entities.keys())if(!present.has(id))erase(id);cohort=entities.size;viewer.scene.requestRender();
  },
  counts(){
   const occluder=new EllipsoidalOccluder(viewer.scene.globe.ellipsoid,viewer.camera.positionWC);let visible=0;
   for(const [id,entity] of entities){const p=position(id);if(!entity.show||!p||!occluder.isPointVisible(p))continue;const screen=viewer.scene.cartesianToCanvasCoordinates(p);if(screen&&screen.x>=0&&screen.y>=0&&screen.x<viewer.canvas.clientWidth&&screen.y<viewer.canvas.clientHeight)visible++}
   return {capped:admitted-cohort,renderable:[...entities.entries()].filter(([id,e])=>e.show&&position(id)).length,visible,lod:detailed()?'glyph':'point',budget:budget()};
  },
  clear(unavailable=false){for(const [id,entity] of entities){if(unavailable&&selection.value===entity){context.camera.stopTracking();entity.show=false;entity.orasMetadata={...entity.orasMetadata,available:false,detail:'Source unavailable; last known selection. No current position displayed.'};selection.set(entity)}else erase(id)}if(!unavailable){admitted=0;cohort=0}if(!viewer.isDestroyed())viewer.scene.requestRender()},
  animate(){
   let changed=false;const time=viewer.clock.currentTime,detail=detailed();
   if(entities.size>budget()){
    const ordered=[...entities.keys()].sort((a,b)=>(entities.get(a)===selection.value?-1:entities.get(b)===selection.value?1:a.localeCompare(b)));
    for(const id of ordered.slice(budget()))erase(id);cohort=entities.size;changed=true;
   }
   for(const [id,entity] of entities){
    if(entity.orasMetadata?.available===false)continue;
    const p=position(id),old=entity.position.getValue(time);
    if(!p){if(entity.show){entity.show=false;entity.orasMetadata={...entity.orasMetadata,available:false,detail:'Position expired; no current source position displayed.'};if(selection.value===entity){context.camera.stopTracking();selection.set(entity)}changed=true}continue}
    if(!Cartesian3.equals(p,old)){entity.position.setValue(p);changed=true}
    if(entity.billboard.show.getValue(time)!==detail){entity.billboard.show=detail;entity.point.show=!detail;changed=true}
    const pair=bracket(histories.get(id),Date.now()),rotation=Number.isFinite(pair?.a.track)&&Number.isFinite(pair?.b.track)?screenProjectedRotation(viewer.scene,p,lerpAngleDeg(pair.a.track,pair.b.track,pair.t))??0:0;
    if(Math.abs(entity.billboard.rotation.getValue(time)-rotation)>.005){entity.billboard.rotation=rotation;changed=true}
    const showLabel=selection.value===entity;if(entity.label.show.getValue(time)!==showLabel){entity.label.show=showLabel;changed=true}
   }
   if(changed)viewer.scene.requestRender();
  },
 };
}
