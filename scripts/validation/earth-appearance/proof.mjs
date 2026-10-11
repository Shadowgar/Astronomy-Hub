import 'cesium/Build/Cesium/Widgets/widgets.css';
import {Cartesian3,JulianDate,Math as CesiumMath,TileMapServiceImageryProvider} from 'cesium';
const params=new URLSearchParams(location.search);
const {ViewerController}=await import(/* @vite-ignore */ params.get('baseline')==='1'?'/base/ViewerController.mjs':'/@fs/hub/runtimes/earth-runtime/core/ViewerController.mjs');
const controller=new ViewerController(document.querySelector('#viewer'),document.querySelector('#credits'));
window.createProofController=()=>new ViewerController(document.querySelector('#viewer'),document.querySelector('#credits'));
const viewer=controller.viewer;
viewer.clock.currentTime=JulianDate.fromIso8601('2026-10-10T17:00:00Z');
viewer.imageryLayers.addImageryProvider(await TileMapServiceImageryProvider.fromUrl('/cesium/Assets/Textures/NaturalEarthII'));
window.proof={viewer,controller,setView({lon,lat,height,pitch=-90,heading=0,utc}){
 viewer.camera.setView({destination:Cartesian3.fromDegrees(lon,lat,height),orientation:{heading:CesiumMath.toRadians(heading),pitch:CesiumMath.toRadians(pitch),roll:0}});
 viewer.clock.currentTime=JulianDate.fromIso8601(utc);viewer.scene.requestRender();
},state(){const {camera,scene}=viewer;return {utc:JulianDate.toIso8601(viewer.clock.currentTime),camera:{cartesian:camera.positionWC,lon:CesiumMath.toDegrees(camera.positionCartographic.longitude),lat:CesiumMath.toDegrees(camera.positionCartographic.latitude),height:camera.positionCartographic.height,heading:camera.heading,pitch:camera.pitch,roll:camera.roll},renderer:{skyBoxShow:scene.skyBox.show,skyBoxLoaded:!!scene.skyBox._cubeMap,skyBoxSources:scene.skyBox.sources,skyAtmosphereShow:scene.skyAtmosphere.show,intensity:scene.skyAtmosphere.atmosphereLightIntensity,saturation:scene.skyAtmosphere.saturationShift,brightness:scene.skyAtmosphere.brightnessShift,lighting:scene.globe.enableLighting,dynamicSun:scene.globe.dynamicAtmosphereLightingFromSun,requestRenderMode:scene.requestRenderMode,maximumRenderTimeChange:scene.maximumRenderTimeChange,terrain:'EllipsoidTerrainProvider',imagery:'existing bundled Natural Earth fallback'}}}};
window.ready=true;
