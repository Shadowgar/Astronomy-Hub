import * as T from 'three'
export type EarthOrientation={from_frame:'ICRF';to_frame:'ITRS';quaternion_order:'xyzw';interpolation:'shortest-slerp';model:string;polar_motion:string;accuracy:string;max_sampled_interpolation_error_arcsec:number;samples:{epoch:string;quaternion:number[]}[]}
export function validateEarthOrientation(raw:unknown,epochs:string[]):EarthOrientation{
 const e=raw as EarthOrientation
 if(!e||e.from_frame!=='ICRF'||e.to_frame!=='ITRS'||e.quaternion_order!=='xyzw'||e.interpolation!=='shortest-slerp'||!e.model||!e.accuracy||e.polar_motion!=='zero; no observed EOP table installed'||!Number.isFinite(e.max_sampled_interpolation_error_arcsec)||e.max_sampled_interpolation_error_arcsec<0||e.max_sampled_interpolation_error_arcsec>=.05||!Array.isArray(e.samples)||e.samples.length!==epochs.length)throw Error('Invalid Earth orientation source.')
 for(let i=0;i<e.samples.length;i++){
  const s=e.samples[i],q=s?.quaternion
  if(s?.epoch!==epochs[i]||!Array.isArray(q)||q.length!==4||!q.every(Number.isFinite)||Math.abs(Math.hypot(...q)-1)>1e-9)throw Error('Invalid Earth orientation samples.')
 }
 return e
}
/** Row-major ICRF -> Earth-fixed rotation at the same millisecond UTC as JPL. */
export function evaluateEarthOrientation(e:EarthOrientation|undefined,utcMs:number):number[]|null{
 if(!e)return null
 const samples=e.samples
 if(utcMs<Date.parse(samples[0].epoch)||utcMs>Date.parse(samples.at(-1)!.epoch)||!Number.isFinite(utcMs))throw Error('Earth frame outside source coverage.')
 let lo=0,hi=samples.length-1
 while(hi-lo>1){const mid=(lo+hi)>>1;if(Date.parse(samples[mid].epoch)<=utcMs)lo=mid;else hi=mid}
 const a=samples[lo],b=samples[hi],u=(Math.trunc(utcMs)-Date.parse(a.epoch))/(Date.parse(b.epoch)-Date.parse(a.epoch))
 const q=new T.Quaternion().fromArray(a.quaternion).slerp(new T.Quaternion().fromArray(b.quaternion),u)
 const m=new T.Matrix4().makeRotationFromQuaternion(q).elements
 return [m[0],m[4],m[8],m[1],m[5],m[9],m[2],m[6],m[10]]
}
/** Equirectangular NASA image: u=.5 Greenwich, v=1 north; Three sphere Y up.
 * Local +X -> longitude0, -Z -> longitude90E, +Y -> north. */
export function earthSurfaceQuaternion(icrfToItrs:readonly number[]){
 const r=icrfToItrs,m=new T.Matrix4().set(r[0],r[1],r[2],0,r[3],r[4],r[5],0,r[6],r[7],r[8],0,0,0,0,1).transpose()
 return new T.Quaternion().setFromRotationMatrix(m.multiply(new T.Matrix4().makeRotationX(Math.PI/2)))
}
