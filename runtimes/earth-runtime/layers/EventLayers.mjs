import {Cartesian3,Color,ColorMaterialProperty,ConstantPositionProperty,Cartesian2,PolygonHierarchy,CallbackProperty,DistanceDisplayCondition,SingleTileImageryProvider,Rectangle} from 'cesium';
import {depthColor} from 'gods-eye-view/layers/earthquakes';
import {perimeterAnchorDegrees} from 'gods-eye-view/layers/perimeters';
import {PollingLayer} from './PollingLayer.mjs';
import {readCapped} from './data.mjs';
import {validEventFeed,validRadarFeed} from './eventData.mjs';
const sources={earthquakes:['U.S. Geological Survey','https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php'], 'fire-perimeters':['NIFC/WFIGS · public perimeter context','https://data-nifc.opendata.arcgis.com/datasets/nifc::wfigs-current-interagency-fire-perimeters/about'],'weather-radar':['NOAA/NWS nowCOAST · public domain','https://www.weather.gov/disclaimer']};
export const EVENT_LAYERS=[
 {id:'earthquakes',title:'Earthquakes · M2.5+ · past day',category:'Events',temporalMode:'EVENT_FEED',interval:60000},
 {id:'fire-perimeters',title:'Fire perimeters · recent subset',category:'Environment',temporalMode:'CURRENT_SNAPSHOT',interval:300000},
 {id:'weather-radar',title:'Radar reflectivity · CONUS',category:'Environment',temporalMode:'CURRENT_SNAPSHOT',interval:240000},
];
export function eventFacts(record,id){
 const facts=[{label:'Source',value:sources[id][0]}];
 if(id==='earthquakes'){facts.push({label:'Magnitude',value:record.magnitude.toFixed(1)});if(record.depthKm!==null)facts.push({label:'Depth',value:record.depthKm+' km'});facts.push({label:'Occurred',value:record.occurredAt},{label:'Location',value:record.name});}
 else {if(record.updatedAt)facts.push({label:'Boundary updated',value:record.updatedAt});if(record.acres!==null)facts.push({label:'Mapped polygon area',value:record.acres.toFixed(1)+' acres'});if(record.containedPct!==null)facts.push({label:'Reported containment',value:record.containedPct+'%'});}
 return facts;
}
export function createEventAdapter(context,id){
 const spec=EVENT_LAYERS.find(row=>row.id===id);if(!spec)throw Error('Unknown layer');
 const entities=new Map();let imagery=null,objectUrl=null;
 const remove=entity=>{if(context.selection.value===entity)context.selection.clearLayer(id);if(context.viewer.trackedEntity===entity)context.camera.stopTracking();context.viewer.entities.remove(entity)};
 const clear=()=>{for(const entity of entities.values())remove(entity);entities.clear();if(imagery){context.viewer.imageryLayers.remove(imagery,true);imagery=null;}if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=null;}if(!context.viewer.isDestroyed())context.viewer.scene.requestRender()};
 const read=async signal=>{const dto=JSON.parse(await readCapped(await fetch('/api/earth/'+id,{signal,cache:'no-store'}),4000000));if(!(id==='weather-radar'?validRadarFeed(dto):validEventFeed(dto,id)))throw Error('Malformed Earth DTO');return {...dto,observedAt:id==='weather-radar'?dto.latest:dto.observedAt,records:id==='weather-radar'?[{id:'conus',name:'CONUS radar reflectivity',lat:37.5,lon:-95}]:dto.records};};
 const render=async(data,{signal,isCurrent}={})=>{
  if(id==='weather-radar'){
   const response=await fetch('/api/earth/radar-image?time='+encodeURIComponent(data.latest),{signal});if(!response.ok||!response.body)throw Error('Radar image unavailable');
   const reader=response.body.getReader(),chunks=[];let bytes=0;
   try{while(true){const {value,done}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>4000000)throw Error('Radar image cap');chunks.push(value)}}finally{await reader.cancel()}
   const url=URL.createObjectURL(new Blob(chunks,{type:'image/png'}));let provider;
   try{provider=await SingleTileImageryProvider.fromUrl(url,{rectangle:Rectangle.fromDegrees(-130,20,-60,55)});}catch(error){URL.revokeObjectURL(url);throw error;}
   if(signal?.aborted||isCurrent&&!isCurrent()){URL.revokeObjectURL(url);return;}
   if(imagery)context.viewer.imageryLayers.remove(imagery,true);if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=url;imagery=context.viewer.imageryLayers.addImageryProvider(provider);imagery.alpha=.65;
  }
  const present=new Set();for(const record of data.records){present.add(record.id);let entity=entities.get(record.id);const anchor=id==='fire-perimeters'?perimeterAnchorDegrees(record.polygons):record;
   const lon=anchor.lon,lat=anchor.lat;const position=Cartesian3.fromDegrees(lon,lat,0),size=id==='earthquakes'?Math.min(14,5+record.magnitude):7;
   if(!entity){entity=context.viewer.entities.add({id:id+':'+record.id,name:record.name,position:new ConstantPositionProperty(position),point:{pixelSize:size,distanceDisplayCondition:new DistanceDisplayCondition(0,id==='earthquakes'&&record.magnitude<4.5?15000000:60000000),color:id==='earthquakes'?(record.depthKm===null?Color.fromCssColorString('#a8bbce'):depthColor(record.depthKm)).withAlpha(.8):Color.fromCssColorString(id==='fire-perimeters'?'#ecb575':'#9be4f2'),outlineColor:Color.fromCssColorString('#03070b'),outlineWidth:1},label:{text:record.name,font:'11px sans-serif',fillColor:Color.WHITE,outlineColor:Color.fromCssColorString('#03070b'),outlineWidth:3,style:2,pixelOffset:new Cartesian2(0,-16),show:false}});entities.set(record.id,entity);}
   else {
    entity.position.setValue(position);entity.name=record.name;entity.label.text=record.name;
    entity.point.distanceDisplayCondition=new DistanceDisplayCondition(0,id==='earthquakes'&&record.magnitude<4.5?15000000:60000000);
    entity.point.color=id==='earthquakes'?(record.depthKm===null?Color.fromCssColorString('#a8bbce'):depthColor(record.depthKm)).withAlpha(.8):Color.fromCssColorString(id==='fire-perimeters'?'#ecb575':'#9be4f2');
   }
   entity.show=true;entity.point.pixelSize=context.selection.value===entity?16:size;
   const facts=id==='weather-radar'?[{label:'Source',value:sources[id][0]},{label:'Observation',value:data.latest},{label:'Coverage',value:'Contiguous United States; gaps are not evidence of no precipitation.'},{label:'Product',value:'Radar base reflectivity (dBZ); not rainfall forecast.'}]:eventFacts(record,id);
   entity.orasMetadata={basePointSize:size,layerId:id,name:record.name,kind:id==='earthquakes'?'earthquake':id==='fire-perimeters'?'fire':'weather',detail:id==='earthquakes'?'Source-reported event; no impact or damage inference.':id==='fire-perimeters'?'Generalized public boundary; recent subset, incomplete coverage. Not a threat assessment.':'CONUS radar surface; marker denotes coverage centre, not a weather event.',facts,focusRangeM:id==='weather-radar'?5000000:50000};
   if(id==='fire-perimeters'){entity.polygon=undefined;for(let index=0;index<record.polygons.length;index++){const rings=record.polygons[index],key=record.id+':polygon:'+index;present.add(key);let polygon=entities.get(key);const hierarchy=new PolygonHierarchy(rings[0].map(([x,y])=>Cartesian3.fromDegrees(x,y)),rings.slice(1).map(ring=>new PolygonHierarchy(ring.map(([x,y])=>Cartesian3.fromDegrees(x,y)))));if(!polygon){polygon=context.viewer.entities.add({id:id+':'+key,polygon:{hierarchy,material:new ColorMaterialProperty(new CallbackProperty(()=>Color.fromCssColorString('#ecb575').withAlpha(context.selection.value===entity ? .18 : .08),false)),outline:true,outlineColor:Color.fromCssColorString('#ecb575').withAlpha(.65)}});entities.set(key,polygon)}else polygon.polygon.hierarchy=hierarchy;polygon.orasSelectableEntity=entity;}}
   if(context.selection.value===entity)context.selection.set(entity);
  }
  for(const [key,entity] of entities)if(!present.has(key)){remove(entity);entities.delete(key)}context.viewer.scene.requestRender();
 };
 const layer=new PollingLayer({id,interval:spec.interval,temporalMode:spec.temporalMode,read,render,clear});
 const initialize=layer.initialize.bind(layer);layer.initialize=ctx=>{initialize(ctx);ctx.attribution.set(id,...sources[id])};
 const destroy=layer.destroy.bind(layer);layer.destroy=()=>{destroy();context.attribution.remove(id)};return layer;
}
