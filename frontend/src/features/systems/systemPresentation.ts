import * as T from 'three'
import type {Vec3,SystemQuaternion} from './systemTypes'
import {KM_PER_AU,type CelestialAppearance} from '../celestial/celestialAssets'
export const systemToAU=(km:readonly number[]):Vec3=>km.map(n=>n/KM_PER_AU) as Vec3
export const systemToKm=(au:readonly number[]):Vec3=>au.map(n=>n*KM_PER_AU) as Vec3

/** Choose a camera, never rearrange source centers. Fit the current distribution
 * rather than an entire month of orbital samples. All math stays in CPU doubles. */
export function systemOverviewPose(points:Vec3[],pole:Vec3,sun:Vec3,width:number,height:number,fov:number,radii:number[]=[]){
 const north=new T.Vector3(...pole).normalize(),light=new T.Vector3(...sun).normalize()
 if(north.lengthSq()<.5)north.set(0,0,1)
 let east=new T.Vector3().crossVectors(north,light).normalize()
 if(east.lengthSq()<.5)east=new T.Vector3().crossVectors(north,new T.Vector3(0,1,0)).normalize()
 const equator=new T.Vector3().crossVectors(east,north).normalize()
 const halfY=Math.tan(fov*Math.PI/360),halfX=halfY*Math.max(.1,width/height)
 let best:any=null,bestScore=-Infinity
 for(let k=0;k<16;k++){
  const angle=k*Math.PI/8,direction=north.clone().multiplyScalar(.72).add(equator.clone().multiplyScalar(Math.cos(angle)*.69)).add(east.clone().multiplyScalar(Math.sin(angle)*.69)).normalize()
  const right=new T.Vector3().crossVectors(north,direction).normalize(),up=new T.Vector3().crossVectors(direction,right).normalize()
  const projected=points.map((p,i)=>{const v=new T.Vector3(...p);return{x:v.dot(right),y:v.dot(up),z:v.dot(direction),r:radii[i]??0}})
  const midX=(Math.min(...projected.map(p=>p.x))+Math.max(...projected.map(p=>p.x)))/2,midY=(Math.min(...projected.map(p=>p.y))+Math.max(...projected.map(p=>p.y)))/2
  const distance=Math.max(1e-5,...projected.map(p=>p.z+p.r+Math.max((Math.abs(p.x-midX)+p.r)/halfX,(Math.abs(p.y-midY)+p.r)/halfY)*1.35))
  const target=right.clone().multiplyScalar(midX).add(up.clone().multiplyScalar(midY))
  const screen=projected.map(p=>[(p.x-midX)/(distance-p.z)/halfX,(p.y-midY)/(distance-p.z)/halfY])
  const separations=screen.flatMap((p,i)=>screen.slice(i+1).map(q=>Math.hypot(p[0]-q[0],p[1]-q[1])))
  const score=Math.min(...separations)+.12*direction.dot(light)
  if(score>bestScore){bestScore=score;best={position:target.clone().addScaledVector(direction,distance).toArray() as Vec3,target:target.toArray() as Vec3,up:up.toArray() as Vec3}}
 }
 return best as {position:Vec3;target:Vec3;up:Vec3}
}

/** Orientation is independent of positional qualification. Never attach an
 * unregistered texture to a scientific meridian merely because a PCK exists. */
export function systemSurfaceFrame(id:string,q:SystemQuaternion|undefined,track:{body_fixed_frame:string;model_id?:string|null}|undefined,asset:CelestialAppearance|null){
 const fallback={quaternion:null as SystemQuaternion|null,qualified:false,classification:asset?.orientation??'illustrative-source-registration'}
 if(!q||!track)return fallback
 if(asset?.geometryKind==='measured-shape-km'){
  if(track.body_fixed_frame!==asset.expectedOrientationFrame||track.model_id!==asset.expectedOrientationModelId)return fallback
  return{quaternion:q,qualified:true,classification:track.body_fixed_frame}
 }
 if((id==='earth'&&track.body_fixed_frame==='ITRS')||(id==='moon'&&track.body_fixed_frame==='MOON_ME_DE440_ME421')){
  const surface=new T.Quaternion(...q).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI/2))
  return{quaternion:surface.toArray() as SystemQuaternion,qualified:true,classification:track.body_fixed_frame}
 }
 const pole=new T.Vector3(0,0,1).applyQuaternion(new T.Quaternion(...q))
 const visual=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),pole)
 return{quaternion:visual.toArray() as SystemQuaternion,qualified:false,classification:'source visual north aligned to PCK pole; longitude illustrative'}
}
