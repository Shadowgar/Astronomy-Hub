import * as T from 'three'
import type {BodyId,Vector} from './solarContracts'

// Display radii in scene units. Source positions/physical radii are never changed.
export const glyphRadius:Record<BodyId,number>={sun:.20,mercury:.07,venus:.21,earth:.23,mars:.175,jupiter:.65,saturn:.55,uranus:.36,neptune:.35}
// Include the full illustrative ring envelope when fitting a selected Saturn.
export const visualRadius=(id:BodyId)=>glyphRadius[id]*(id==='saturn'?2.27:1.03)
type Anchor={source_id:BodyId;position_au:Vector}
export type CameraPose={position:Vector;target:Vector}
const direction=new T.Vector3(-.78,-.48,.4).normalize()
export const overviewUp=(aspect:number):Vector=>aspect<.75?[1,0,0]:[.15,0,1]
export function overviewPose(bodies:Anchor[],aspect:number,height=0,frame?:ReturnType<typeof clearViewport>):CameraPose{
 const bounds=new T.Box3()
 for(const b of bodies){const p=new T.Vector3(...b.position_au),r=visualRadius(b.source_id);bounds.expandByPoint(p.clone().addScalar(r));bounds.expandByPoint(p.clone().addScalar(-r))}
 const center=bounds.getCenter(new T.Vector3()),up=new T.Vector3(...overviewUp(aspect)),right=up.clone().cross(direction).normalize(),vertical=direction.clone().cross(right).normalize()
 const tan=Math.tan(21*Math.PI/180);let distance=1
 const horizontal=frame?frame.maxGlobeRadius*2/height:Math.max(.25,aspect)*.82,verticalFit=frame?frame.maxGlobeRadius*2/height:.7
 for(const b of bodies){const p=new T.Vector3(...b.position_au).sub(center),r=visualRadius(b.source_id);distance=Math.max(distance,p.dot(direction)+(Math.abs(p.dot(right))+r)/(tan*horizontal),p.dot(direction)+(Math.abs(p.dot(vertical))+r)/(tan*verticalFit))}
 return{position:center.clone().addScaledVector(direction,distance).toArray(),target:center.toArray()}
}
export function focusPose(id:BodyId,p:Vector,aspect:number,close=false,height=0,frame=focusViewport(aspect*height,height)):CameraPose{
 const target=new T.Vector3(...p),sunward=target.clone().negate().normalize()
 if(id==='sun')sunward.copy(direction)
 // View mostly the illuminated hemisphere, with a visible terminator. This changes
 // only the camera; texture longitude/orientation remains an illustrative choice.
 const side=new T.Vector3(0,0,1).cross(sunward).normalize()
 const view=sunward.multiplyScalar(.72).addScaledVector(side,.7).add(new T.Vector3(0,0,.3)).normalize()
 let distance=glyphRadius[id]*(close?3.5:5.1)/Math.min(1,Math.max(.52,aspect))
 const limit=frame.maxGlobeRadius*(close?1:.82)
 if(Number.isFinite(limit))distance=Math.max(distance,visualRadius(id)*Math.sqrt(1+(height/(2*Math.tan(21*Math.PI/180)*limit))**2))
 return{position:target.clone().addScaledVector(view,distance).toArray(),target:[...p]}
}
/** Shift the optical frame, never the orbit target or ephemeris anchor. */
export function focusViewport(width:number,height:number){
 const portrait=width<560
 const x=portrait?width*.5:width*.42
 let y=portrait?Math.max(185,height*.40):height*.5,maxGlobeRadius=Infinity
 // Short landscape has a full-width bottom card and a clear strip between the
 // body/effects rails. Fit the selected glyph there; do not move its source target.
 if(width>=480&&width<560&&height<=560){
  const cardHeight=Math.min(136,Math.max(100,Math.min(220,height-400)),Math.max(0,height-324))
  const cardTop=height-146-cardHeight
  y=(78+cardTop-10)/2
  maxGlobeRadius=Math.max(18,Math.min(y-78,x-186,width-120-x)-12)
 }
 return{offsetX:width*.5-x,offsetY:height*.5-y,maxGlobeRadius}
}
export type ScreenRect={left:number;top:number;right:number;bottom:number}
/** Largest clear HUD rectangle. Only the optical frame and camera distance move. */
export function clearViewport(width:number,height:number,obstacles:ScreenRect[]){
 const inset=14,pad=10,preferred=focusViewport(width,height)
 const clipped=obstacles.map(r=>({left:Math.max(inset,r.left-pad),right:Math.min(width-inset,r.right+pad),top:Math.max(inset,r.top-pad),bottom:Math.min(height-inset,r.bottom+pad)})).filter(r=>r.right>r.left&&r.bottom>r.top)
 const xs=[inset,width-inset,...clipped.flatMap(r=>[r.left,r.right])].sort((a,b)=>a-b),ys=[inset,height-inset,...clipped.flatMap(r=>[r.top,r.bottom])].sort((a,b)=>a-b)
 let best={x:width*.5-preferred.offsetX,y:height*.5-preferred.offsetY,radius:18},score=-Infinity
 for(let l=0;l<xs.length;l++)for(let r=l+1;r<xs.length;r++)for(let t=0;t<ys.length;t++)for(let b=t+1;b<ys.length;b++){
  const left=xs[l],right=xs[r],top=ys[t],bottom=ys[b],radius=Math.min(right-left,bottom-top)/2
  if(radius<26||clipped.some(o=>left<o.right&&right>o.left&&top<o.bottom&&bottom>o.top))continue
  const x=Math.max(left+radius,Math.min(right-radius,width*.5-preferred.offsetX)),y=Math.max(top+radius,Math.min(bottom-radius,height*.5-preferred.offsetY))
  const candidate=radius*1000-Math.hypot(x-(width*.5-preferred.offsetX),y-(height*.5-preferred.offsetY))
  if(candidate>score){best={x,y,radius:radius-12};score=candidate}
 }
 return{offsetX:width*.5-best.x,offsetY:height*.5-best.y,maxGlobeRadius:best.radius}
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
