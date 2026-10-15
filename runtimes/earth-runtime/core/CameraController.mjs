import {Cartesian3,Cartesian2,Cartographic,Matrix4,EllipsoidTerrainProvider,HeadingPitchRange,BoundingSphere,Math as CesiumMath,ScreenSpaceEventType,CameraEventType} from 'cesium';
import {ContinuedInput} from '../../../packages/runtime-protocol/continued-input.mjs';
import {surfaceObserver} from './navigationObserver.mjs';
export class CameraController {
 constructor(viewer){this.viewer=viewer;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.userMoved=false;this.flightGeneration=0;this.gate=new ContinuedInput();this.boundary=false;this.lastPhase='idle';this.onNavigation=null;
 const canvas=viewer.canvas,controller=viewer.scene.screenSpaceCameraController;controller.zoomEventTypes=controller.zoomEventTypes.filter(type=>type!==CameraEventType.WHEEL);
 this.wheel=event=>{if(!Number.isFinite(event.deltaY)||event.deltaY===0)return;event.preventDefault();this.interrupt(false);const pixels=event.deltaY*(event.deltaMode===1?40:event.deltaMode===2?canvas.clientHeight:1);
  // Two broad altitude scales taper well before regional zoom, with finer surface control.
  // Bound a coalesced/large wheel event; retain the native view ray and clamps.
  const height=Math.max(0,viewer.camera.positionCartographic.height),gain=.045+.32*height/(height+10000)+.735*height/(height+200000);
  const factor=Math.exp(gain*Math.max(-1.25,Math.min(1.25,pixels/120)));this.zoom(factor);viewer.scene.requestRender();
  const target=this.surfaceTarget();if(!target||event.ctrlKey){this.resetNavigation();return;}
  if(target.rangeM<=1500)this.boundary=true;else if(target.rangeM>2500)this.boundary=false;
  const value=this.gate.input({atBoundary:target.rangeM<=1500,withinBoundary:this.boundary,continuing:event.deltaY<0,pixels:Math.abs(event.deltaY)*(event.deltaMode===1?40:event.deltaMode===2?canvas.clientHeight:1),now:event.timeStamp});
  if(value.phase!==this.lastPhase||value.phase==='progress'){this.lastPhase=value.phase;this.onNavigation?.({target:'sky',...value});}
 };canvas.addEventListener('wheel',this.wheel,{passive:false});
 this.key=event=>{if(!['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();this.interrupt();const camera=viewer.camera;if(['+','=','-'].includes(event.key))this.zoom(event.key==='-'?1.18:.85);else if(event.key==='ArrowLeft')camera.rotateRight(.015);else if(event.key==='ArrowRight')camera.rotateLeft(.015);else if(event.key==='ArrowUp')camera.rotateDown(.015);else camera.rotateUp(.015);viewer.scene.requestRender();};canvas.addEventListener('keydown',this.key);
 viewer.screenSpaceEventHandler.setInputAction(({position})=>{const hit=viewer.scene.pick(position);if(hit?.id?.orasMetadata){viewer.selectedEntity=hit.id;return;}const point=viewer.camera.pickEllipsoid(position,viewer.scene.globe.ellipsoid);if(!point)return;this.interrupt();this.zoom(.85);viewer.scene.requestRender();},ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
 }
 zoom(factor){
  const {camera,scene}=this.viewer,controller=scene.screenSpaceCameraController,ellipsoid=scene.globe.ellipsoid;
  const step=camera.positionCartographic.height*(1-factor),offset=Cartesian3.multiplyByScalar(camera.directionWC,step,new Cartesian3()),candidate=Cartesian3.add(camera.positionWC,offset,new Cartesian3()),position=ellipsoid.cartesianToCartographic(candidate);
  if(!position)return;
  const surface=scene.globe.getHeight(position),floor=controller.minimumZoomDistance+Math.max(0,Number.isFinite(surface)?surface:0);
  position.height=Math.max(floor,Math.min(controller.maximumZoomDistance,position.height));
  camera.setView({destination:ellipsoid.cartographicToCartesian(position),orientation:{direction:Cartesian3.clone(camera.directionWC),up:Cartesian3.clone(camera.upWC)}});
 }
 home(site){this.stopTracking();this.viewer.camera.setView({destination:Cartesian3.fromDegrees(site.lon,site.lat,(this.viewer.canvas.clientWidth<768?16_000_000:22_000_000)-6378137),orientation:{heading:0,pitch:-Math.PI/2,roll:0}});this.viewer.scene.requestRender();}
 interrupt(reset=true){this.userMoved=true;++this.flightGeneration;this.viewer.camera.cancelFlight();this.stopTracking();if(reset)this.resetNavigation();}
 resetNavigation(){this.gate.reset(performance.now()+1000);this.boundary=false;this.lastPhase='idle';this.onNavigation?.({target:'sky',phase:'idle',progress:0});}
 surfaceTarget(){
  const {camera,scene,canvas}=this.viewer,point=new Cartesian2(canvas.clientWidth/2,canvas.clientHeight/2),ray=camera.getPickRay(point);
  const hit=this.viewer.terrainProvider instanceof EllipsoidTerrainProvider?camera.pickEllipsoid(point,scene.globe.ellipsoid):ray&&scene.globe.pick(ray,scene)||camera.pickEllipsoid(point,scene.globe.ellipsoid);if(!hit)return null;
  const target=scene.globe.ellipsoid.cartesianToCartographic(hit);if(!target)return null;
  return {lat:CesiumMath.toDegrees(target.latitude),lon:CesiumMath.toDegrees(target.longitude),rangeM:Cartesian3.distance(camera.positionWC,hit)};
 }
 navigation(site){
  const target=this.surfaceTarget();if(!target)return null;
  const camera=this.viewer.camera,p=camera.positionCartographic;
  return {...surfaceObserver(target.lat,target.lon,site),camera:{latitudeRad:p.latitude,longitudeRad:p.longitude,heightM:p.height,headingRad:camera.heading,pitchRad:camera.pitch,rollRad:camera.roll}};
 }
 restoreView(view,center){this.interrupt();const camera=this.viewer.camera;if(center){camera.lookAt(Cartesian3.fromDegrees(center.lon,center.lat,0),new HeadingPitchRange(view.headingRad,-Math.PI/2,view.heightM));camera.lookAtTransform(Matrix4.IDENTITY);}else camera.setView({destination:this.viewer.scene.globe.ellipsoid.cartographicToCartesian(new Cartographic(view.longitudeRad,view.latitudeRad,view.heightM)),orientation:{heading:view.headingRad,pitch:view.pitchRad,roll:view.rollRad}});this.viewer.scene.requestRender();}
 navigateLocation({lat,lon}){this.interrupt();return new Promise(resolve=>{const generation=this.flightGeneration;this.viewer.camera.flyToBoundingSphere(new BoundingSphere(Cartesian3.fromDegrees(lon,lat,0),0),{offset:new HeadingPitchRange(0,-Math.PI/2,40000),duration:this.reduced?0:.9,complete:()=>resolve(generation===this.flightGeneration),cancel:()=>resolve(false)});});}
 async returnToSite(site,terrain){this.stopTracking();const range=terrain?8000:40000;return this.viewer.camera.flyToBoundingSphere(new BoundingSphere(Cartesian3.fromDegrees(site.lon,site.lat,site.elevationM),100),{duration:this.reduced?0:.9,offset:new HeadingPitchRange(0,CesiumMath.toRadians(terrain?-45:-60),range)});}
 track(entity){if(!entity||entity.orasMetadata?.layerId!=='satellites')return;this.viewer.trackedEntity=entity;this.viewer.scene.requestRender();}
 stopTracking(){this.viewer.trackedEntity=undefined;}
 async focus(entity){this.stopTracking();const kind=entity.orasMetadata?.layerId;const hint=entity.orasMetadata?.focusRangeM;const range=Number.isFinite(hint)&&hint>=1000&&hint<=10000000?hint:kind==='satellites'?750000:kind==='aircraft'?12000:40000;const generation=++this.flightGeneration;const ok=await this.viewer.flyTo(entity,{duration:this.reduced?0:.9,offset:new HeadingPitchRange(0,CesiumMath.toRadians(kind==='satellites'?-30:kind==='aircraft'?-35:-60),range)});return ok&&generation===this.flightGeneration;}
 destroy(){this.interrupt();this.viewer.canvas.removeEventListener('wheel',this.wheel);this.viewer.canvas.removeEventListener('keydown',this.key);}
}
