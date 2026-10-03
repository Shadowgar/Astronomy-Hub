import {Viewer,EllipsoidTerrainProvider,Color,ScreenSpaceEventType} from 'cesium';
export class ViewerController {
  constructor(container,credits){
    this.viewer=new Viewer(container,{animation:false,timeline:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,infoBox:false,selectionIndicator:false,baseLayer:false,terrainProvider:new EllipsoidTerrainProvider(),creditContainer:credits,requestRenderMode:true,maximumRenderTimeChange:Infinity,shouldAnimate:false});
    const viewer=this.viewer;viewer.scene.globe.baseColor=Color.fromCssColorString('#182535');
    viewer.scene.globe.showGroundAtmosphere=true;viewer.scene.globe.enableLighting=true;viewer.scene.globe.dynamicAtmosphereLighting=true;viewer.scene.globe.dynamicAtmosphereLightingFromSun=true;viewer.scene.backgroundColor=Color.fromCssColorString('#03070B');viewer.scene.skyBox.show=false;viewer.scene.fog.enabled=true;viewer.scene.fog.density=0.0002;viewer.canvas.tabIndex=0;viewer.canvas.setAttribute('aria-label','Earth scene. Use arrow keys to pan, plus and minus to zoom.');viewer.resolutionScale=Math.min(devicePixelRatio||1,1.5)/(devicePixelRatio||1);
    viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    const controller=viewer.scene.screenSpaceCameraController;
    controller.minimumZoomDistance=100;controller.maximumZoomDistance=30_000_000;controller.inertiaZoom=.35;controller.inertiaSpin=.25;controller.inertiaTranslate=.25;
  }
  destroy(){if(!this.viewer.isDestroyed()){this.viewer.trackedEntity=undefined;this.viewer.destroy();}}
}
