import {Cartesian3,Cartesian2,Cartographic,Matrix4,EllipsoidTerrainProvider,HeadingPitchRange,BoundingSphere,Math as CesiumMath,ScreenSpaceEventType,CameraEventType} from 'cesium';
import {ContinuedInput} from '../../../packages/runtime-protocol/continued-input.mjs';
import {surfaceObserver} from './navigationObserver.mjs';
export class CameraController {
 constructor(viewer){this.viewer=viewer;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.userMoved=false;this.flightGeneration=0;this.gate=new ContinuedInput();this.boundary=false;this.lastPhase='idle';this.onNavigation=null;
 const canvas=viewer.canvas,controller=viewer.scene.screenSpaceCameraController;
 this.nativeZoomEvents=controller.zoomEventTypes;controller.zoomEventTypes=controller.zoomEventTypes.filter(type=>type!==CameraEventType.WHEEL);
 this.motion=null;this.closed=false;this.navigationEnabled=false;
 // Pointer/touch gestures remain Cesium-owned. Cancel before its next input update.
 this.pointer=()=>this.interrupt();canvas.addEventListener('pointerdown',this.pointer);
 this.wheel=event=>{
  if(this.closed||!Number.isFinite(event.deltaY)||event.deltaY===0||event.buttons)return;
  event.preventDefault();if(this.navigationEnabled&&this.gate.phase==='request')return;
  const pixels=event.deltaY*(event.deltaMode===1?40:event.deltaMode===2?canvas.clientHeight:1),now=performance.now();
  const target=this.surfaceTarget();if(!target){this.interrupt();return;}
  if(!this.motion)this.interrupt(false);
  if(event.ctrlKey||!this.navigationEnabled){this.gate.reset();this.boundary=false;this.lastPhase='idle';}
  else {
   if(target.rangeM<=1500)this.boundary=true;else if(target.rangeM>2500)this.boundary=false;
   // Only newly delivered input at the actual boundary earns handoff intent.
   // Frame updates never feed the guard, including the tail that reaches the boundary.
   const value=this.gate.input({atBoundary:target.rangeM<=1500,withinBoundary:this.boundary,continuing:event.deltaY<0,pixels:Math.abs(pixels),now:event.timeStamp});
   if(value.phase==='request')this.cancelZoom();
   if(value.phase!==this.lastPhase||value.phase==='progress'){this.lastPhase=value.phase;this.onNavigation?.({target:'sky',...value});}
   if(value.phase==='request')return;
  }
  this.queueZoom(pixels,now);
 };canvas.addEventListener('wheel',this.wheel,{passive:false});
 this.key=event=>{if(!['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();this.interrupt();const camera=viewer.camera;if(['+','=','-'].includes(event.key))this.zoom(event.key==='-'?1.18:.85);else if(event.key==='ArrowLeft')camera.rotateRight(.015);else if(event.key==='ArrowRight')camera.rotateLeft(.015);else if(event.key==='ArrowUp')camera.rotateDown(.015);else camera.rotateUp(.015);viewer.scene.requestRender();};canvas.addEventListener('keydown',this.key);
 viewer.screenSpaceEventHandler.setInputAction(({position})=>{const hit=viewer.scene.pick(position);if(hit?.id?.orasMetadata){viewer.selectedEntity=hit.id;return;}const point=viewer.camera.pickEllipsoid(position,viewer.scene.globe.ellipsoid);if(!point)return;this.interrupt();this.zoom(.85);viewer.scene.requestRender();},ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
 }
 // Critically damped log-distance spring. Its closed-form solution depends on
 // elapsed seconds, not frame or wheel frequency. Pending travel is bounded.
 queueZoom(pixels,now){
  const sign=Math.sign(pixels);
  if(this.motion&&sign!==this.motion.sign)this.cancelZoom();
  if(!this.motion){
   const {camera,scene}=this.viewer,anchor=this.surfacePoint();if(!anchor)return;
   const range=Cartesian3.distance(camera.positionWC,anchor);if(!Number.isFinite(range)||range<=0)return;
   this.motion={anchor,axis:Cartesian3.normalize(Cartesian3.subtract(camera.positionWC,anchor,new Cartesian3()),new Cartesian3()),direction:Cartesian3.clone(camera.directionWC),up:Cartesian3.clone(camera.upWC),x:Math.log(range),target:Math.log(range),velocity:0,last:now,sign};
   // No native inertia may compete with this wheel gesture. Native drag/pinch
   // starts by cancelling us and restoring these public Cesium settings.
   const controller=scene.screenSpaceCameraController;
   this.nativeInputs=controller.enableInputs;controller.enableInputs=false;
   this.removeFrame=scene.preUpdate.addEventListener(()=>this.updateZoom(performance.now()));
  }else this.advanceZoom(now);
  const m=this.motion,height=Math.max(0,this.viewer.camera.positionCartographic.height);
  const gain=.045+.32*height/(height+10000)+.735*height/(height+200000);
  m.target=Math.max(m.x-1.4,Math.min(m.x+1.4,m.target+gain*Math.max(-1.25,Math.min(1.25,pixels/120))));
  this.viewer.scene.requestRender();
 }
 advanceZoom(now){
  const m=this.motion,dt=Math.max(0,(now-m.last)/1000);m.last=now;
  const omega=this.reduced?40:24,error=m.x-m.target,b=m.velocity+omega*error,decay=Math.exp(-omega*dt);
  m.x=m.target+(error+b*dt)*decay;m.velocity=(m.velocity-omega*b*dt)*decay;
 }
 updateZoom(now){
  if(!this.motion||this.closed)return;
  this.advanceZoom(now);const m=this.motion;
  // Stop below sub-pixel travel, with no endless requests or tiny final jitter.
  const settled=Math.abs(m.x-m.target)<1e-6&&Math.abs(m.velocity)<1e-5;
  const {camera,scene}=this.viewer,ellipsoid=scene.globe.ellipsoid,controller=scene.screenSpaceCameraController;
  const current=Cartesian3.distance(camera.positionWC,m.anchor),desired=Math.exp(m.x);
  const point=range=>Cartesian3.add(m.anchor,Cartesian3.multiplyByScalar(m.axis,range,new Cartesian3()),new Cartesian3());
  const valid=range=>{const position=ellipsoid.cartesianToCartographic(point(range));if(!position||!Number.isFinite(position.height))return false;const surface=scene.globe.getHeight(position);return position.height>=controller.minimumZoomDistance+Math.max(0,Number.isFinite(surface)?surface:0)&&position.height<=controller.maximumZoomDistance;};
  let range=desired,clamped=false;
  if(!valid(range)){
   // Clamp on the SAME geographic ray. Clamping latitude/longitude/height
   // independently would slide an oblique view away from its surface target.
   let good=current,bad=desired;for(let i=0;i<40;i++){const middle=(good+bad)/2;if(valid(middle))good=middle;else bad=middle;}
   range=good;clamped=true;
  }
  if(Math.abs(range-current)>1e-7){camera.setView({destination:point(range),orientation:{direction:m.direction,up:m.up}});scene.requestRender();}
  if(range<=1500&&!this.boundary){
   this.boundary=true;this.lastPhase='boundary';this.onNavigation?.({target:'sky',phase:'boundary',progress:0});
  }else if(range>2500&&this.boundary){
   this.boundary=false;this.gate.reset();this.lastPhase='idle';this.onNavigation?.({target:'sky',phase:'idle',progress:0});
  }
  if(settled||clamped)this.cancelZoom();
 }
 cancelZoom(){
  this.removeFrame?.();this.removeFrame=null;this.motion=null;
  if(this.nativeInputs!==undefined){this.viewer.scene.screenSpaceCameraController.enableInputs=this.nativeInputs;this.nativeInputs=undefined;}
 }
 motionState(){const m=this.motion;return m?{active:true,rangeM:Math.exp(m.x),targetRangeM:Math.exp(m.target),velocityMps:Math.exp(m.x)*m.velocity}:{active:false};}
 zoom(factor){
  const {camera,scene}=this.viewer,controller=scene.screenSpaceCameraController,ellipsoid=scene.globe.ellipsoid;
  const step=camera.positionCartographic.height*(1-factor),offset=Cartesian3.multiplyByScalar(camera.directionWC,step,new Cartesian3()),candidate=Cartesian3.add(camera.positionWC,offset,new Cartesian3()),position=ellipsoid.cartesianToCartographic(candidate);
  if(!position)return;
  const surface=scene.globe.getHeight(position),floor=controller.minimumZoomDistance+Math.max(0,Number.isFinite(surface)?surface:0);
  position.height=Math.max(floor,Math.min(controller.maximumZoomDistance,position.height));
  camera.setView({destination:ellipsoid.cartographicToCartesian(position),orientation:{direction:Cartesian3.clone(camera.directionWC),up:Cartesian3.clone(camera.upWC)}});
 }
 home(site){this.interrupt();this.viewer.camera.setView({destination:Cartesian3.fromDegrees(site.lon,site.lat,(this.viewer.canvas.clientWidth<768?16_000_000:22_000_000)-6378137),orientation:{heading:0,pitch:-Math.PI/2,roll:0}});this.viewer.scene.requestRender();}
 interrupt(reset=true){this.cancelZoom();this.userMoved=true;++this.flightGeneration;this.viewer.camera.cancelFlight();this.stopTracking();if(reset)this.resetNavigation();}
 resetNavigation(){this.cancelZoom();this.gate.reset(performance.now()+1000);this.boundary=false;this.lastPhase='idle';this.onNavigation?.({target:'sky',phase:'idle',progress:0});}
 surfacePoint(){
  const {camera,scene,canvas}=this.viewer,point=new Cartesian2(canvas.clientWidth/2,canvas.clientHeight/2),ray=camera.getPickRay(point);
  const hit=this.viewer.terrainProvider instanceof EllipsoidTerrainProvider?camera.pickEllipsoid(point,scene.globe.ellipsoid):ray&&scene.globe.pick(ray,scene)||camera.pickEllipsoid(point,scene.globe.ellipsoid);return hit||null;
 }
 surfaceTarget(){
  const {camera,scene}=this.viewer,hit=this.surfacePoint();if(!hit)return null;
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
 async returnToSite(site,terrain){this.interrupt();const range=terrain?8000:40000;return this.viewer.camera.flyToBoundingSphere(new BoundingSphere(Cartesian3.fromDegrees(site.lon,site.lat,site.elevationM),100),{duration:this.reduced?0:.9,offset:new HeadingPitchRange(0,CesiumMath.toRadians(terrain?-45:-60),range)});}
 track(entity){if(!entity||entity.orasMetadata?.layerId!=='satellites')return;this.interrupt();this.viewer.trackedEntity=entity;this.viewer.scene.requestRender();}
 stopTracking(){this.viewer.trackedEntity=undefined;}
 async focus(entity){this.interrupt();const kind=entity.orasMetadata?.layerId;const hint=entity.orasMetadata?.focusRangeM;const range=Number.isFinite(hint)&&hint>=1000&&hint<=10000000?hint:kind==='satellites'?750000:kind==='aircraft'?12000:40000;const generation=++this.flightGeneration;const ok=await this.viewer.flyTo(entity,{duration:this.reduced?0:.9,offset:new HeadingPitchRange(0,CesiumMath.toRadians(kind==='satellites'?-30:kind==='aircraft'?-35:-60),range)});return ok&&generation===this.flightGeneration;}
 destroy(){this.closed=true;this.interrupt();this.viewer.canvas.removeEventListener('pointerdown',this.pointer);this.viewer.scene.screenSpaceCameraController.zoomEventTypes=this.nativeZoomEvents;this.viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_DOUBLE_CLICK);this.viewer.canvas.removeEventListener('wheel',this.wheel);this.viewer.canvas.removeEventListener('keydown',this.key);}
}
