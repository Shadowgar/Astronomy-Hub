import {Viewer,EllipsoidTerrainProvider,Color,ScreenSpaceEventType,Resource} from 'cesium';
export class ViewerController {
  constructor(container,credits){
    this.viewer=new Viewer(container,{animation:false,timeline:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,fullscreenButton:false,infoBox:false,selectionIndicator:false,baseLayer:false,terrainProvider:new EllipsoidTerrainProvider(),creditContainer:credits,requestRenderMode:true,maximumRenderTimeChange:Infinity,shouldAnimate:false});
    const viewer=this.viewer;
    // Native quadtree refinement needs frames while tiles remain outstanding.
    // Cesium owns the loop/priority; return to request-render mode when settled.
    this.offTileProgress=viewer.scene.globe.tileLoadProgressEvent.addEventListener(count=>{viewer.scene.requestRenderMode=count===0;viewer.scene.requestRender();});viewer.scene.globe.baseColor=Color.fromCssColorString('#182535');
    viewer.scene.globe.showGroundAtmosphere=true;viewer.scene.globe.enableLighting=true;viewer.scene.globe.dynamicAtmosphereLighting=true;viewer.scene.globe.dynamicAtmosphereLightingFromSun=true;viewer.scene.backgroundColor=Color.fromCssColorString('#03070B');
    // Standard Cesium stars use existing bundled textures, not a scientific catalog.
    // Load through Cesium's public Resource API before enabling: a missing face
    // otherwise raises a render error and stops Cesium's default render loop.
    viewer.scene.skyBox.show=false;this.skyboxStatus=viewer.canvas.dataset.skybox='loading';
    this.skyboxResources=Object.entries(viewer.scene.skyBox.sources).map(([face,url])=>({face,resource:new Resource({url})}));
    this.skyboxReady=Promise.all(this.skyboxResources.map(async({face,resource})=>[face,await resource.fetchImage()])).then(faces=>{
      if(viewer.isDestroyed())return;
      viewer.scene.skyBox.sources=Object.fromEntries(faces);viewer.scene.skyBox.show=true;
      this.skyboxStatus=viewer.canvas.dataset.skybox='ready';viewer.scene.requestRender();
    },()=>{
      if(viewer.isDestroyed())return;
      this.skyboxStatus=viewer.canvas.dataset.skybox='unavailable';
      viewer.canvas.setAttribute('aria-description','Star background unavailable; Earth remains usable.');
      viewer.scene.requestRender();
    });
    // Pinned God's Eye appearance configuration; retain the Hub Viewer and lifecycle.
    viewer.scene.skyAtmosphere.atmosphereLightIntensity=18;
    viewer.scene.skyAtmosphere.saturationShift=-0.12;
    viewer.scene.skyAtmosphere.brightnessShift=-0.08;
    viewer.scene.fog.enabled=true;viewer.scene.fog.density=0.0002;viewer.canvas.tabIndex=0;viewer.canvas.setAttribute('aria-label','Earth scene. Use arrow keys to pan, plus and minus to zoom.');viewer.resolutionScale=Math.min(devicePixelRatio||1,1.5)/(devicePixelRatio||1);
    viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    const controller=viewer.scene.screenSpaceCameraController;
    controller.minimumZoomDistance=100;controller.maximumZoomDistance=30_000_000;controller.inertiaZoom=.35;controller.inertiaSpin=.25;controller.inertiaTranslate=.25;
  }
  destroy(){this.offTileProgress?.();if(!this.viewer.isDestroyed()){for(const {resource} of this.skyboxResources)resource.request.cancel();this.viewer.trackedEntity=undefined;this.viewer.destroy();}}
}
