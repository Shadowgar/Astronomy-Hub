import * as T from 'three'
import type {BodyId,Vector} from './solarContracts'

// Display radii in scene units. Source positions/physical radii are never changed.
export const glyphRadius:Record<BodyId,number>={sun:.44,earth:.23,mars:.175}
type Anchor={source_id:BodyId;position_au:Vector}
export type CameraPose={position:Vector;target:Vector}
const direction=new T.Vector3(-.78,-.48,.4).normalize()
export const overviewUp=(aspect:number):Vector=>aspect<.75?[1,0,0]:[.15,0,1]
export function overviewPose(bodies:Anchor[],aspect:number):CameraPose{
 const bounds=new T.Box3()
 for(const b of bodies){const p=new T.Vector3(...b.position_au),r=glyphRadius[b.source_id];bounds.expandByPoint(p.clone().addScalar(r));bounds.expandByPoint(p.clone().addScalar(-r))}
 const center=bounds.getCenter(new T.Vector3()),up=new T.Vector3(...overviewUp(aspect)),right=up.clone().cross(direction).normalize(),vertical=direction.clone().cross(right).normalize()
 const tan=Math.tan(21*Math.PI/180);let distance=1
 for(const b of bodies){const p=new T.Vector3(...b.position_au).sub(center),r=glyphRadius[b.source_id];distance=Math.max(distance,p.dot(direction)+(Math.abs(p.dot(right))+r)/(tan*Math.max(.25,aspect)*.82),p.dot(direction)+(Math.abs(p.dot(vertical))+r)/(tan*.7))}
 return{position:center.clone().addScaledVector(direction,distance).toArray(),target:center.toArray()}
}
export function focusPose(id:BodyId,p:Vector,aspect:number,close=false):CameraPose{
 const target=new T.Vector3(...p),sunward=target.clone().negate().normalize()
 if(id==='sun')sunward.copy(direction)
 // View mostly the illuminated hemisphere, with a visible terminator. This changes
 // only the camera; texture longitude/orientation remains an illustrative choice.
 const side=new T.Vector3(0,0,1).cross(sunward).normalize()
 const view=sunward.multiplyScalar(.72).addScaledVector(side,.7).add(new T.Vector3(0,0,.3)).normalize()
 const distance=glyphRadius[id]*(close?3.5:5.1)/Math.min(1,Math.max(.52,aspect))
 return{position:target.clone().addScaledVector(view,distance).toArray(),target:[...p]}
}
/** Shift the optical frame, never the orbit target or ephemeris anchor. */
export function focusViewport(width:number,height:number){
 const portrait=width<560
 const x=portrait?width*.5:width*.42
 const y=portrait?Math.max(185,height*.40):height*.5
 return{offsetX:width*.5-x,offsetY:height*.5-y}
}
export type SolarQuality='efficient'|'balanced'|'detailed'
export function qualityBudget(quality:SolarQuality,dpr:number){
 return{pixelRatio:Math.min(dpr,quality==='detailed'?2:quality==='balanced'?1.5:1),starCount:quality==='efficient'?1200:4000,background:quality!=='efficient'}
}
/** Decorative points, with no catalog IDs, magnitudes or claimed stellar distances. */
export function decorativeStars(count:number){
 const positions:number[]=[],colors:number[]=[],sizes:number[]=[]
 let seed=42621
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
 for(let i=0;i<Math.min(4000,Math.max(0,count));i++){
  const z=random()*2-1,a=random()*Math.PI*2,r=55+random()*40,q=Math.sqrt(1-z*z)
  positions.push(Math.cos(a)*q*r,Math.sin(a)*q*r,z*r)
  const brightness=.35+Math.pow(random(),2)*.65,tint=random()
  colors.push(brightness*(tint<.2?1:.72),brightness*(tint<.2?.78:.84),brightness*(tint<.2?.52:1))
  sizes.push(random()<.04?4.6:1.3+random()*1.6)
 }
 return{positions,colors,sizes}
}
