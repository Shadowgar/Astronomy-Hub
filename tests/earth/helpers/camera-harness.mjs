import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {ContinuedInput} from '../../../packages/runtime-protocol/continued-input.mjs';
const source=readFileSync(process.env.N1_CAMERA_SOURCE||new URL('../../../runtimes/earth-runtime/core/CameraController.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export class','class')+'; CameraController';
// Spherical globe fixture: production ray/altitude math, no WebGL or scheduler mock.
export const R=6378137;
export class V {
 constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z})}
 static clone(v,out=new V()){return Object.assign(out,v)}
 static add(a,b,out=new V()){return Object.assign(out,{x:a.x+b.x,y:a.y+b.y,z:a.z+b.z})}
 static subtract(a,b,out=new V()){return Object.assign(out,{x:a.x-b.x,y:a.y-b.y,z:a.z-b.z})}
 static multiplyByScalar(a,k,out=new V()){return Object.assign(out,{x:a.x*k,y:a.y*k,z:a.z*k})}
 static distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)}
 static normalize(a,out=new V()){return V.multiplyByScalar(a,1/Math.hypot(a.x,a.y,a.z),out)}
 static fromDegrees(lon,lat,height=0){return ellipsoid.cartographicToCartesian({longitude:lon*Math.PI/180,latitude:lat*Math.PI/180,height})}
}
const ellipsoid={cartesianToCartographic(p){const r=Math.hypot(p.x,p.y,p.z);return r?{longitude:Math.atan2(p.y,p.x),latitude:Math.asin(p.z/r),height:r-R}:undefined},cartographicToCartesian(p){const r=R+p.height;return new V(r*Math.cos(p.latitude)*Math.cos(p.longitude),r*Math.cos(p.latitude)*Math.sin(p.longitude),r*Math.sin(p.latitude))}};
class Signal{listeners=new Set();addEventListener(f){this.listeners.add(f);return ()=>this.listeners.delete(f)}raise(){for(const f of [...this.listeners])f()}}
export function harness(height=40000,{angle=0,hit=true,bridge=false,embedded=true}={}){
 let now=10000;const canvas=new EventTarget();Object.assign(canvas,{clientHeight:900,clientWidth:1200});
 const target=new V(R,0,0),direction=new V(-Math.cos(angle),Math.sin(angle),0),start=V.add(target,V.multiplyByScalar(direction,-height/Math.cos(angle)));
 const positions=[],native={positionWC:start,directionWC:direction,upWC:new V(0,0,1),heading:0,pitch:-Math.PI/2,roll:0,cancelFlight(){},getPickRay(){return {}},pickEllipsoid(){return hit?V.clone(target):undefined},lookAt(){},lookAtTransform(){},flyToBoundingSphere(_sphere,options){options.complete?.()},setView({destination}){this.positionWC=V.clone(destination);this.positionCartographic=ellipsoid.cartesianToCartographic(destination);positions.push(this.positionCartographic.height)}};native.positionCartographic=ellipsoid.cartesianToCartographic(start);
 const preUpdate=new Signal(),actions=new Map(),intents=[];let renders=0;
 const controller={zoomEventTypes:['wheel','pinch','right'],minimumZoomDistance:100,maximumZoomDistance:30000000,inertiaSpin:.25,inertiaTranslate:.25,inertiaZoom:.35,enableInputs:true};
 const viewer={canvas,camera:native,scene:{preUpdate,requestRender(){renders++},screenSpaceCameraController:controller,globe:{getHeight:()=>0,pick:()=>hit?target:undefined,ellipsoid},pick:()=>null},screenSpaceEventHandler:{setInputAction(fn,type){actions.set(type,fn)},removeInputAction(type){actions.delete(type)}},flyTo:async()=>true,isDestroyed:()=>false};
 const globals={ContinuedInput,matchMedia:()=>({matches:false}),Cartesian3:V,Cartesian2:class{constructor(x,y){Object.assign(this,{x,y})}},Cartographic:class{constructor(longitude,latitude,height){Object.assign(this,{longitude,latitude,height})}},Matrix4:{IDENTITY:{}},HeadingPitchRange:class{constructor(heading,pitch,range){Object.assign(this,{heading,pitch,range})}},BoundingSphere:class{},EllipsoidTerrainProvider:class{},CesiumMath:{toDegrees:r=>r*180/Math.PI,toRadians:d=>d*Math.PI/180},CameraEventType:{WHEEL:'wheel'},ScreenSpaceEventType:{LEFT_DOUBLE_CLICK:'double'},performance:{now:()=>now}};
 const Camera=runInNewContext(source,globals),camera=new Camera(viewer);if(embedded)camera.navigationEnabled=true;camera.onNavigation=v=>intents.push(v);
 let endpoint;
 if(bridge){const text=readFileSync(new URL('../../../runtimes/earth-runtime/core/RuntimeBridge.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export function','function')+'; RuntimeBridge';const Bridge=runInNewContext(text,{createRuntimeEndpoint:config=>(endpoint={...config,emit(){},close(){}}),setTimeout:()=>1,clearTimeout(){},document:{addEventListener(){},removeEventListener(){}}});Bridge({viewer,camera,lifecycle:{add(){}},navigation:()=>camera.navigation({lat:0,lon:0,elevationM:0})});}
 const wheel=(delta,time=now,extra={})=>{now=time;const e=new Event('wheel',{cancelable:true});Object.assign(e,{deltaY:delta,deltaMode:0,...extra});Object.defineProperty(e,'timeStamp',{value:time});canvas.dispatchEvent(e)};
 const step=ms=>{now+=ms;preUpdate.raise();return native.positionCartographic.height};
 const settle=()=>{for(let i=0;i<150;i++)step(16)};
 return {camera,native,viewer,canvas,controller,positions,intents,wheel,step,settle,preUpdate,endpoint,get renders(){return renders}};
}
