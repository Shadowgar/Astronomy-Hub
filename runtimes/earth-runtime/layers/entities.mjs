import {Cartesian3,Color,ConstantPositionProperty} from 'cesium';
export function entityRenderer(context,id,color){
 const entities=new Map();
 function remove(entity){if(context.selection.value===entity)context.selection.clearLayer(id);if(context.viewer.trackedEntity===entity)context.camera.stopTracking();context.viewer.entities.remove(entity);}
 return {replace(records){
  const present=new Set();for(const record of records){present.add(record.id);let entity=entities.get(record.id);const position=Cartesian3.fromDegrees(record.lon,record.lat,record.heightM);
   if(!entity){entity=context.viewer.entities.add({id:id+':'+record.id,name:record.name,position:new ConstantPositionProperty(position),point:{pixelSize:9,color:Color.fromCssColorString(color)}});entities.set(record.id,entity);}else{entity.position.setValue(position);entity.name=record.name;}
   entity.orasMetadata={layerId:id,name:record.name,detail:record.detail};if(context.selection.value===entity)context.selection.set(entity);
  }
  for(const [key,entity] of entities)if(!present.has(key)){remove(entity);entities.delete(key);}context.viewer.scene.requestRender();
 },clear(){context.selection.clearLayer(id);for(const entity of entities.values())remove(entity);entities.clear();if(!context.viewer.isDestroyed())context.viewer.scene.requestRender();}};
}
