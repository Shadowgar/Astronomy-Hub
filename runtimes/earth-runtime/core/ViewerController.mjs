import {Viewer,EllipsoidTerrainProvider,Color,ScreenSpaceEventType} from 'cesium';
export class ViewerController {
  constructor(container,credits){
    this.viewer=new Viewer(container,{animation:false,timeline:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,infoBox:false,selectionIndicator:true,baseLayer:false,terrainProvider:new EllipsoidTerrainProvider(),creditContainer:credits,requestRenderMode:true,maximumRenderTimeChange:Infinity,shouldAnimate:false});
    const viewer=this.viewer;viewer.scene.globe.baseColor=Color.fromCssColorString('#253e50');
    viewer.scene.globe.showGroundAtmosphere=false;viewer.resolutionScale=Math.min(devicePixelRatio||1,1.5)/(devicePixelRatio||1);
    viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    const controller=viewer.scene.screenSpaceCameraController;
    controller.minimumZoomDistance=100;controller.maximumZoomDistance=30_000_000;controller.inertiaZoom=.65;controller.inertiaSpin=.7;controller.inertiaTranslate=.7;
  }
  destroy(){if(!this.viewer.isDestroyed()){this.viewer.trackedEntity=undefined;this.viewer.destroy();}}
}
