import {WebMapServiceImageryProvider,TileMapServiceImageryProvider,IonImageryProvider,CesiumTerrainProvider,Cesium3DTileset,EllipsoidTerrainProvider} from 'cesium';
import {admitDisplayConfig} from './displayConfig.mjs';
export class VisualFoundation {
 constructor(runtime){this.runtime=runtime;this.viewer=runtime.viewer;this.generation=0;this.terrainReady=false;this.quality={imagery:'Imagery loading',terrain:'Terrain unavailable · ellipsoid',buildings:'Not configured',photorealistic:'Not configured'};this.layer=null;}
 async initialize(){
  await this.retryImagery();if(this.runtime.lifecycle.closed)return;
  this.usePublicImagery();
  let config=null;try{const response=await fetch('/earth-runtime/display-config.json',{signal:AbortSignal.any([this.runtime.lifecycle.controller.signal,AbortSignal.timeout(4000)]),cache:'no-store'});if(response.ok){const text=await response.text();if(text.length<=4096)config=admitDisplayConfig(JSON.parse(text));}}catch{/* fallback remains available */}
  if(!config)return;
  const token={accessToken:config.publicToken};
  if(config.imageryAsset)void IonImageryProvider.fromAssetId(config.imageryAsset,token).then(provider=>{if(this.runtime.lifecycle.closed)return;const previous=this.layer;this.layer=this.viewer.imageryLayers.addImageryProvider(provider);if(previous)this.viewer.imageryLayers.remove(previous,true);this.quality.imagery='Detailed imagery';}).catch(()=>{this.quality.imagery='Standard imagery · configured source unavailable';});
  if(config.terrainAsset){this.quality.terrain='Terrain loading';void CesiumTerrainProvider.fromIonAssetId(config.terrainAsset,{...token,requestVertexNormals:true}).then(provider=>{
   if(this.runtime.lifecycle.closed)return;this.viewer.terrainProvider=provider;this.terrainReady=true;this.quality.terrain='Detailed terrain';this.runtime.timings.terrainReadyMs=performance.now();
   const remove=provider.errorEvent.addEventListener(()=>{if(this.runtime.lifecycle.closed)return;this.viewer.terrainProvider=new EllipsoidTerrainProvider();this.terrainReady=false;this.quality.terrain='Terrain unavailable · ellipsoid';});this.runtime.lifecycle.add(remove);
  }).catch(()=>{this.quality.terrain='Terrain unavailable · ellipsoid';});}
  for(const [key,asset] of [['buildings',config.buildingsAsset],['photorealistic',config.photorealisticAsset]])if(asset){this.quality[key]='Loading configured 3D';void Cesium3DTileset.fromIonAssetId(asset,token).then(tileset=>{if(this.runtime.lifecycle.closed){tileset.destroy();return;}this.viewer.scene.primitives.add(tileset);this.quality[key]='Configured 3D · coverage varies';}).catch(()=>{this.quality[key]='Unavailable · fallback retained';});}
 }
 usePublicImagery(){
  const provider=new WebMapServiceImageryProvider({url:'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi',layers:'BlueMarble_ShadedRelief_Bathymetry',parameters:{format:'image/jpeg',transparent:false,version:'1.1.1'},enablePickFeatures:false,tileWidth:512,tileHeight:512,maximumLevel:8,credit:'NASA GIBS · Blue Marble (static composite)'});
  this.runtime.attribution.set('gibs','NASA GIBS · Blue Marble static composite','https://nasa-gibs.github.io/gibs-api-docs/');
  const detailed=this.viewer.imageryLayers.addImageryProvider(provider);this.publicLayer=detailed;this.quality.imagery='Blue Marble imagery resolving';
  const remove=provider.errorEvent.addEventListener(()=>{if(this.runtime.lifecycle.closed)return;if(this.publicLayer){this.viewer.imageryLayers.remove(this.publicLayer,true);this.publicLayer=null;this.runtime.attribution.remove('gibs');}this.quality.imagery='Standard imagery · public source unavailable';});this.runtime.lifecycle.add(remove);
  const visible=this.viewer.scene.globe.tileLoadProgressEvent.addEventListener(count=>{if(count===0&&this.publicLayer&&!this.runtime.lifecycle.closed){this.quality.imagery='Blue Marble · NASA GIBS static imagery';visible();}});this.runtime.lifecycle.add(visible);
 }
 async retryImagery(){
  const generation=++this.generation;this.quality.imagery='Imagery loading';
  try{const provider=await TileMapServiceImageryProvider.fromUrl('/earth-runtime/cesium/Assets/Textures/NaturalEarthII');if(this.runtime.lifecycle.closed||generation!==this.generation)return;
   const old=this.layer;this.layer=this.viewer.imageryLayers.addImageryProvider(provider);if(old)this.viewer.imageryLayers.remove(old,true);if(this.publicLayer){this.viewer.imageryLayers.remove(this.publicLayer,true);this.publicLayer=null;}
   this.quality.imagery='Standard imagery · Natural Earth';
   const remove=provider.errorEvent.addEventListener(()=>{if(!this.runtime.lifecycle.closed&&generation===this.generation)this.quality.imagery='Imagery unavailable';});this.runtime.lifecycle.add(remove);
   const visible=this.viewer.scene.globe.tileLoadProgressEvent.addEventListener(count=>{if(count===0&&!this.runtime.timings.firstImageryVisibleMs){this.runtime.timings.firstImageryVisibleMs=performance.now();visible();}});this.runtime.lifecycle.add(visible);this.viewer.scene.requestRender();
  }catch{if(generation===this.generation)this.quality.imagery='Imagery unavailable';}
 }
}
