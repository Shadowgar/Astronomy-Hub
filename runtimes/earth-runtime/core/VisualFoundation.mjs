import {CesiumTerrainProvider,Cesium3DTileset,EllipsoidTerrainProvider} from 'cesium';
import {admitDisplayConfig,isPublicDisplayConfig} from './displayConfig.mjs';
import {ImageryController} from './ImageryController.mjs';
export class VisualFoundation {
 constructor(runtime){this.runtime=runtime;this.viewer=runtime.viewer;this.terrainReady=false;this.quality={imagery:'Imagery loading',terrain:'Terrain unavailable · ellipsoid',buildings:'Not configured',photorealistic:'Not configured'};this.imagery=new ImageryController(runtime,this.quality);this.configPromise=this.readConfig();}
 async readConfig(){
  try{const response=await fetch('/earth-runtime/display-config.json',{signal:AbortSignal.any([this.runtime.lifecycle.controller.signal,AbortSignal.timeout(4000)]),cache:'no-store'});if(response.ok){const text=await response.text();if(text.length<=4096){const value=JSON.parse(text);if(isPublicDisplayConfig(value))return value;}}}catch{/* safe public fallback */}
  return {schema:1,qualified:false};
 }
 async retryImagery(){const config=await this.configPromise;if(!this.runtime.lifecycle.closed)await this.imagery.retry(config);}
 async initialize(){
  await this.retryImagery();if(this.runtime.lifecycle.closed)return;
  const config=admitDisplayConfig(await this.configPromise);if(!config)return;
  const token={accessToken:config.publicToken};
  if(config.terrainAsset){this.quality.terrain='Terrain loading';void CesiumTerrainProvider.fromIonAssetId(config.terrainAsset,{...token,requestVertexNormals:true}).then(provider=>{
   if(this.runtime.lifecycle.closed)return;this.viewer.terrainProvider=provider;this.terrainReady=true;this.quality.terrain='Detailed terrain';this.runtime.timings.terrainReadyMs=performance.now();
   const remove=provider.errorEvent.addEventListener(()=>{if(this.runtime.lifecycle.closed)return;this.viewer.terrainProvider=new EllipsoidTerrainProvider();this.terrainReady=false;this.quality.terrain='Terrain unavailable · ellipsoid';});this.runtime.lifecycle.add(remove);
  }).catch(()=>{this.quality.terrain='Terrain unavailable · ellipsoid';});}
  for(const [key,asset] of [['buildings',config.buildingsAsset],['photorealistic',config.photorealisticAsset]])if(asset){this.quality[key]='Loading configured 3D';void Cesium3DTileset.fromIonAssetId(asset,token).then(tileset=>{if(this.runtime.lifecycle.closed){tileset.destroy();return;}this.viewer.scene.primitives.add(tileset);this.quality[key]='Configured 3D · coverage varies';}).catch(()=>{this.quality[key]='Unavailable · fallback retained';});}
 }
}
