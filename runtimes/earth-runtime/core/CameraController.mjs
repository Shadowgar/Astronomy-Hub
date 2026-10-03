import {Cartesian3,HeadingPitchRange,BoundingSphere,Math as CesiumMath,ScreenSpaceEventType,CameraEventType} from 'cesium';
export class CameraController {
 constructor(viewer){this.viewer=viewer;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.userMoved=false;this.flightGeneration=0;
 const canvas=viewer.canvas,controller=viewer.scene.screenSpaceCameraController;controller.zoomEventTypes=controller.zoomEventTypes.filter(type=>type!==CameraEventType.WHEEL);
 this.wheel=event=>{event.preventDefault();this.interrupt();const factor=Math.pow(1.18,Math.max(-1.35,Math.min(1.35,event.deltaY/(event.deltaMode===1?3:100))));this.zoom(factor);viewer.scene.requestRender();};canvas.addEventListener('wheel',this.wheel,{passive:false});
 this.key=event=>{if(!['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();this.interrupt();const camera=viewer.camera;if(['+','=','-'].includes(event.key))this.zoom(event.key==='-'?1.18:.85);else if(event.key==='ArrowLeft')camera.rotateRight(.015);else if(event.key==='ArrowRight')camera.rotateLeft(.015);else if(event.key==='ArrowUp')camera.rotateDown(.015);else camera.rotateUp(.015);viewer.scene.requestRender();};canvas.addEventListener('keydown',this.key);
 viewer.screenSpaceEventHandler.setInputAction(({position})=>{const hit=viewer.scene.pick(position);if(hit?.id?.orasMetadata){viewer.selectedEntity=hit.id;return;}const point=viewer.camera.pickEllipsoid(position,viewer.scene.globe.ellipsoid);if(!point)return;this.interrupt();this.zoom(.85);viewer.scene.requestRender();},ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
 }
 zoom(factor){
  const {camera,scene}=this.viewer,controller=scene.screenSpaceCameraController,ellipsoid=scene.globe.ellipsoid;
  const step=camera.positionCartographic.height*(1-factor),offset=Cartesian3.multiplyByScalar(camera.directionWC,step,new Cartesian3()),candidate=Cartesian3.add(camera.positionWC,offset,new Cartesian3()),position=ellipsoid.cartesianToCartographic(candidate);
  if(!position)return;
  const surface=scene.globe.getHeight(position),floor=controller.minimumZoomDistance+Math.max(0,Number.isFinite(surface)?surface:0);
  position.height=Math.max(floor,Math.min(controller.maximumZoomDistance,position.height));
  camera.setView({destination:ellipsoid.cartographicToCartesian(position),orientation:{heading:camera.heading,pitch:camera.pitch,roll:camera.roll}});
 }
 home(site){this.stopTracking();this.viewer.camera.setView({destination:Cartesian3.fromDegrees(site.lon,site.lat,(this.viewer.canvas.clientWidth<768?16_000_000:22_000_000)-6378137),orientation:{heading:0,pitch:-Math.PI/2,roll:0}});this.viewer.scene.requestRender();}
 interrupt(){this.userMoved=true;++this.flightGeneration;this.viewer.camera.cancelFlight();this.stopTracking();}
 async returnToSite(site,terrain){this.stopTracking();const range=terrain?8000:40000;return this.viewer.camera.flyToBoundingSphere(new BoundingSphere(Cartesian3.fromDegrees(site.lon,site.lat,site.elevationM),100),{duration:this.reduced?0:.9,offset:new HeadingPitchRange(0,CesiumMath.toRadians(terrain?-45:-60),range)});}
 track(entity){if(!entity||entity.orasMetadata?.layerId!=='satellites')return;this.viewer.trackedEntity=entity;this.viewer.scene.requestRender();}
 stopTracking(){this.viewer.trackedEntity=undefined;}
 async focus(entity){this.stopTracking();const kind=entity.orasMetadata?.layerId;const hint=entity.orasMetadata?.focusRangeM;const range=Number.isFinite(hint)&&hint>=1000&&hint<=10000000?hint:kind==='satellites'?750000:kind==='aircraft'?12000:40000;const generation=++this.flightGeneration;const ok=await this.viewer.flyTo(entity,{duration:this.reduced?0:.9,offset:new HeadingPitchRange(0,CesiumMath.toRadians(kind==='satellites'?-30:kind==='aircraft'?-35:-60),range)});return ok&&generation===this.flightGeneration;}
 destroy(){this.interrupt();this.viewer.canvas.removeEventListener('wheel',this.wheel);this.viewer.canvas.removeEventListener('keydown',this.key);}
}
