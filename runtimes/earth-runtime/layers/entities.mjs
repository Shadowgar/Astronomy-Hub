import {Cartesian3,Color,ConstantPositionProperty,Cartesian2,NearFarScalar,DistanceDisplayCondition,CallbackProperty} from 'cesium';
export function entityRenderer(context,id,color){
 if(!['satellites','weather'].includes(id))throw Error('Unsupported simple entity layer');
 const entities=new Map();
 const satellite='M7 7h10v10H7z M7 9H2v6h5 M17 9h5v6h-5 M10 7V3 M14 17v4';
 const glyph=path=>'data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6"><path d="${path}"/></svg>`);
 const height=()=>context.viewer.camera.positionCartographic.height;
 const selected=entity=>context.selection.value===entity;

 function remove(entity){if(context.selection.value===entity)context.selection.clearLayer(id);if(context.viewer.trackedEntity===entity)context.camera.stopTracking();context.viewer.entities.remove(entity);}
 return {replace(records){
  const present=new Set();for(const record of records){present.add(record.id);let entity=entities.get(record.id);const position=Cartesian3.fromDegrees(record.lon,record.lat,record.heightM);
   if(!entity){entity=context.viewer.entities.add({id:id+':'+record.id,name:record.name,position:new ConstantPositionProperty(position),point:{pixelSize:id==='weather'?16:6,color:Color.fromCssColorString(color),outlineWidth:1,outlineColor:Color.fromCssColorString('#03070B'),scaleByDistance:new NearFarScalar(200000,1.8,20000000,1)},label:{text:record.name,font:'11px sans-serif',fillColor:Color.fromCssColorString('#F1F5F9'),outlineColor:Color.fromCssColorString('#03070B'),outlineWidth:4,style:2,pixelOffset:new Cartesian2(0,-16),show:false}});if(id!=='weather'){entity.billboard={image:glyph(satellite),width:new CallbackProperty(()=>selected(entity)?18:14,false),height:new CallbackProperty(()=>selected(entity)?18:14,false),show:new CallbackProperty(()=>height()<20_000_000,false)};entity.point.show=new CallbackProperty(()=>id==='satellites'&&height()>=20_000_000,false);}
   entities.set(record.id,entity);}else{entity.position.setValue(position);entity.name=record.name;}
   entity.show=true;entity.orasMetadata={layerId:id,name:record.name,detail:record.detail,facts:record.facts||[]};entity.label.show=context.selection.value===entity;entity.point.pixelSize=context.selection.value===entity?12:id==='weather'?16:6;if(context.selection.value===entity)context.selection.set(entity);
  }
  for(const [key,entity] of entities)if(!present.has(key)){remove(entity);entities.delete(key);}context.viewer.scene.requestRender();
 },clear(unavailable=false){
  if(!unavailable){context.selection.clearLayer(id);for(const entity of entities.values())remove(entity);entities.clear();}
  else for(const [key,entity] of entities){if(context.selection.value===entity){context.camera.stopTracking();entity.show=false;entity.orasMetadata={...entity.orasMetadata,available:false,detail:entity.orasMetadata.detail+' · Source unavailable; last known selection'};context.selection.set(entity);}else{remove(entity);entities.delete(key);}}
 if(!context.viewer.isDestroyed())context.viewer.scene.requestRender();}};
}
