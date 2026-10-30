import type {Vector} from './solarContracts'

/** Subtract in CPU float64 before sending local coordinates to GPU float32. */
export const relativeVector=(position:readonly number[],origin:readonly number[]):Vector=>position.map((n,i)=>n-origin[i]) as Vector
export const absoluteVector=(local:readonly number[],origin:readonly number[]):Vector=>local.map((n,i)=>n+origin[i]) as Vector
export type OpaqueBody={position:Vector;radius:number;clearanceAU?:number}
const dot=(a:Vector,b:Vector)=>a.reduce((sum,n,i)=>sum+n*b[i],0)

/** Earliest intersection of the whole input segment, including a fast flight. */
export function stopAtSurface(from:Vector,to:Vector,bodies:OpaqueBody[]):Vector{
 const delta=relativeVector(to,from),a=dot(delta,delta)
 if(a<1e-30)return [...from]
 let limit=1
 for(const body of bodies){
  const p=relativeVector(from,body.position),radius=body.radius+(body.clearanceAU??body.radius*.02),c=dot(p,p)-radius*radius
  if(c<=0){if(dot(delta,p)<=0)return [...from];continue}
  const b=2*dot(p,delta),discriminant=b*b-4*a*c
  if(discriminant<0)continue
  const t=(-b-Math.sqrt(discriminant))/(2*a)
  if(t>=0&&t<limit)limit=t
 }
 return from.map((n,i)=>n+delta[i]*limit) as Vector
}

/** AU per real second; both speed and clearance refer to physical radii. */
export function flightSpeed(camera:Vector,bodies:OpaqueBody[]){
 let speed=5
 for(const body of bodies){
  const distance=Math.hypot(...relativeVector(camera,body.position))
  speed=Math.min(speed,Math.max(body.radius*.05,(distance-body.radius)*.35))
 }
 return Math.max(1e-10,speed)
}

/** Camera-relative line of sight to a DOM marker, using displayed sphere radii.
 * DOM overlays do not participate in the GPU depth buffer. */
export function pointOccluded(target:Vector,bodies:OpaqueBody[]):boolean{
 const distance=Math.hypot(...target)
 if(distance<1e-15)return false
 const direction=target.map(n=>n/distance) as Vector
 return bodies.some(body=>{
  const along=dot(body.position,direction),radius=body.radius
  if(along<=0||along>=distance+radius)return false
  const offset=body.position.map((n,i)=>n-direction[i]*along) as Vector
  const perpendicular=dot(offset,offset)
  if(perpendicular>=radius*radius)return false
  const entry=along-Math.sqrt(radius*radius-perpendicular)
  return entry>0&&entry<distance
 })
}
