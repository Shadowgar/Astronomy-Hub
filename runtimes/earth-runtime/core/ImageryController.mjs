import {WebMapServiceImageryProvider,TileMapServiceImageryProvider,UrlTemplateImageryProvider,IonImageryProvider,Rectangle} from 'cesium';
import {boundImageryRequests} from './imageryRequests.mjs';

export class ImageryController {
 constructor(runtime,quality){
  this.runtime=runtime;this.viewer=runtime.viewer;this.quality=quality;this.entries=new Map();this.generation=0;this.pending=null;
  runtime.lifecycle.add(()=>this.clear());
 }
 clear(){
  this.generation++;
  for(const entry of this.entries.values())this.remove(entry);
  this.entries.clear();
 }
 remove(entry){
  entry.off?.();entry.guard.stop();
  if(entry.layer){this.viewer.imageryLayers.remove(entry.layer,true);entry.layer=null;}
  this.runtime.attribution.remove(entry.id);
 }
 retry(config){
  if(this.pending)return this.pending;
  this.pending=this.load(config).finally(()=>{this.pending=null;});return this.pending;
 }
 async load(config){
  this.clear();this.configuredFailed=false;const generation=this.generation;this.quality.imagery='Imagery loading';
  const active=()=>!this.runtime.lifecycle.closed&&generation===this.generation;
  try{
   const local=await TileMapServiceImageryProvider.fromUrl('/earth-runtime/cesium/Assets/Textures/NaturalEarthII');
   if(!active())return;
   this.add('local',local,0,'Natural Earth · public domain','https://www.naturalearthdata.com/about/terms-of-use/');
  }catch{if(!active())return;}
  if(!active())return;
  this.add('gibs',new WebMapServiceImageryProvider({url:'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',layers:'BlueMarble_ShadedRelief_Bathymetry',parameters:{format:'image/jpeg',transparent:false,version:'1.1.1'},enablePickFeatures:false,tileWidth:512,tileHeight:512,maximumLevel:8,credit:'NASA GIBS · Blue Marble (static 500m composite)'}),[...this.entries.values()].filter(entry=>entry.layer).length,'NASA GIBS · Blue Marble static 500m','https://nasa-gibs.github.io/gibs-api-docs/');
  if(config?.imageryAsset){
   try{
    const provider=await IonImageryProvider.fromAssetId(config.imageryAsset,{accessToken:config.publicToken});
    if(active())this.add('ion',provider,[...this.entries.values()].filter(entry=>entry.layer).length,'Configured imagery · asset terms apply','https://cesium.com/learn/ion/content-usage-and-attribution-guide/');
   }catch{if(active()){this.configuredFailed=true;this.refresh();}}
  }else if(config?.publicImagery==='usgs-conus'){
   // Service maxScale is level 16, despite a generic metadata LOD list through 23.
   // CONUS envelope excludes Alaska's separately restricted SPOT imagery.
   this.add('usgs',new UrlTemplateImageryProvider({url:'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',rectangle:Rectangle.fromDegrees(-125,24,-66,50),minimumLevel:0,maximumLevel:16,tileWidth:256,tileHeight:256,enablePickFeatures:false,credit:'USDA/NAIP · USGS National Geospatial Program · CONUS imagery'}),[...this.entries.values()].filter(entry=>entry.layer).length,'USDA/NAIP · USGS National Geospatial Program · CONUS, dates vary','https://www.usgs.gov/faqs/what-are-terms-uselicensing-map-services-and-data-national-map');
  }
  if(active())this.refresh();
 }
 add(id,provider,index,credit,url){
  const generation=this.generation,entry={id,state:'loading',layer:null,guard:null,off:null};
  const active=()=>!this.runtime.lifecycle.closed&&generation===this.generation&&entry.state!=='failed';
  const fail=()=>{if(!active())return;entry.state='failed';this.remove(entry);this.refresh();};
  entry.guard=boundImageryRequests(provider,{onError:fail,onLoad:()=>{
   if(!active())return;entry.state='ready';
   this.runtime.timings.firstImageryTileMs??=performance.now();
   if(id==='usgs')this.runtime.timings.firstHdTileMs??=performance.now();
   this.refresh();
  }});
  entry.off=provider.errorEvent.addEventListener(error=>{
   if(error)error.retry=false;
   fail();
  });
  entry.layer=this.viewer.imageryLayers.addImageryProvider(provider,index);this.entries.set(id,entry);
  if(id==='usgs'){
   const update=()=>{
    if(!active())return;
    const alpha=Math.max(0,Math.min(1,(2000000-this.viewer.camera.positionCartographic.height)/1000000));
    entry.layer.alpha=alpha;entry.layer.show=alpha>0;
    if(entry.state==='loading'&&alpha===0)entry.state='standby';
    else if(entry.state==='standby'&&alpha>0)entry.state='loading';
    this.refresh();
   };
   const offError=entry.off,offCamera=this.viewer.camera.changed.addEventListener(update);
   entry.off=()=>{offError();offCamera();};update();
  }
  this.runtime.attribution.set(id,credit,url);this.viewer.scene.requestRender();
 }
 refresh(){
  const state=id=>this.entries.get(id)?.state;
  let fallback=state('gibs')==='ready'?'Blue Marble · NASA static 500m':state('gibs')==='loading'?'Blue Marble loading':state('local')==='ready'?'Standard imagery · Natural Earth':state('local')==='loading'?'Standard imagery loading':'Imagery unavailable';
  if(state('ion')==='ready')fallback='Configured imagery · coverage/resolution depend on asset';
  else if(state('usgs')==='standby'||(this.entries.get('usgs')?.layer?.show===false))fallback+=' · USGS aerial at regional zoom';
  else if(state('usgs')==='ready')fallback='USGS aerial · CONUS only · 2017–2021 mosaic; global fallback elsewhere';
  else if(state('usgs')==='loading')fallback='USGS aerial loading · CONUS only; global fallback elsewhere';
  else if(state('usgs')==='failed')fallback='USGS unavailable · '+fallback;
  if(state('ion')==='failed'||this.configuredFailed)fallback='Configured imagery unavailable · '+fallback;
  this.quality.imagery=fallback;this.viewer.scene.requestRender();
 }
 diagnostics(){return Object.fromEntries([...this.entries].map(([id,entry])=>[id,{state:entry.state,...entry.guard.stats}]))}
}
