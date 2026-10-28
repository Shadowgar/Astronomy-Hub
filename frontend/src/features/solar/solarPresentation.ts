import * as T from 'three'
import type {BodyId,Vector,SolarSnapshot} from './solarContracts'

export type BodyRadii=Record<string,number>
export type SolarPreset='full'|'inner'|'outer'
export type SolarCameraView=SolarPreset|'body'|'custom'
export type SolarSizeMode='cinematic'|'physical'
/** Allocate adjacent disks proportionally, keeping their real projected centers. */
export function diskBudget(desired:number,neighbors:{distance:number;desired:number}[],edge:number){
 return Math.max(0,Math.min(desired,edge,...neighbors.map(n=>n.distance*.92*desired/(desired+n.desired))))
}
/** Presentation-only enlargement. Source radii/positions remain immutable. */
export function displayScale(mode:SolarSizeMode,physicalPixels:number,desiredPixels:number,nearestPixels:number){
 if(mode==='physical'||!Number.isFinite(physicalPixels)||physicalPixels<=0)return 1
 return Math.max(1,Math.min(desiredPixels,nearestPixels*.44)/physicalPixels)
}
/** Physical mean radii and source positions share AU. No display enlargement. */
export function physicalRadii(snapshot:SolarSnapshot):BodyRadii{
 return Object.fromEntries(snapshot.bodies.map(b=>[b.source_id,b.shape.mean_radius_km/snapshot.km_per_au])) as BodyRadii
}
// Ring extent/orientation and optical atmosphere remain disclosed illustrations.
export const visualRadius=(radii:BodyRadii,id:string)=>radii[id]*(id==='saturn'?140180/58232:1.03)
type Anchor={source_id:BodyId;position_au:Vector}
export function presetAnchors<A extends Anchor>(bodies:A[],preset:SolarPreset):A[]{
 const inner=new Set<BodyId>(['sun','mercury','venus','earth','mars'])
 return bodies.filter(b=>preset==='full'||(preset==='inner'?inner.has(b.source_id):!inner.has(b.source_id)))
}
export type CameraPose={position:Vector;target:Vector}
/** Logarithmic distance interpolation makes true-scale close-ups navigable. */
export function cameraTransition(from:Vector,targetFrom:Vector,to:CameraPose,u:number):CameraPose{
 if(u<=0)return{position:[...from],target:[...targetFrom]}
 if(u>=1)return{position:[...to.position],target:[...to.target]}
 const ease=u*u*(3-2*u),start=new T.Vector3(...from).sub(new T.Vector3(...targetFrom)),end=new T.Vector3(...to.position).sub(new T.Vector3(...to.target))
 const a=Math.max(1e-15,start.length()),b=Math.max(1e-15,end.length());start.normalize();end.normalize()
 const rotation=new T.Quaternion().setFromUnitVectors(start,end),turn=new T.Quaternion().slerpQuaternions(new T.Quaternion(),rotation,ease)
 const target=new T.Vector3(...targetFrom).lerp(new T.Vector3(...to.target),ease),position=target.clone().add(start.applyQuaternion(turn).multiplyScalar(Math.exp(Math.log(a)+(Math.log(b)-Math.log(a))*ease)))
 return{position:position.toArray(),target:target.toArray()}
}
const direction=new T.Vector3(-.78,-.48,.4).normalize()
export const overviewUp=(aspect:number):Vector=>aspect<.75?[1,0,0]:[.15,0,1]
export function overviewPose(radii:BodyRadii,bodies:Anchor[],aspect:number,height=0,frame?:ReturnType<typeof clearViewport>,rectangular=false,viewDirection:Vector=direction.toArray()):CameraPose{
 const bounds=new T.Box3()
 for(const b of bodies){const p=new T.Vector3(...b.position_au),r=visualRadius(radii,b.source_id);bounds.expandByPoint(p.clone().addScalar(r));bounds.expandByPoint(p.clone().addScalar(-r))}
 const view=new T.Vector3(...viewDirection).normalize(),center=bounds.getCenter(new T.Vector3()),up=new T.Vector3(...overviewUp(aspect)),right=up.clone().cross(view).normalize(),vertical=view.clone().cross(right).normalize()
 const tan=Math.tan(21*Math.PI/180);let distance=1
 const horizontal=frame?(rectangular?frame.clearWidth:frame.maxGlobeRadius*2)/height:Math.max(.25,aspect)*.82,verticalFit=frame?(rectangular?frame.clearHeight:frame.maxGlobeRadius*2)/height:.7
 for(const b of bodies){const p=new T.Vector3(...b.position_au).sub(center),r=visualRadius(radii,b.source_id);distance=Math.max(distance,p.dot(view)+(Math.abs(p.dot(right))+r)/(tan*horizontal),p.dot(view)+(Math.abs(p.dot(vertical))+r)/(tan*verticalFit))}
 return{position:center.clone().addScaledVector(view,distance).toArray(),target:center.toArray()}
}
/** Screen budgets describe an illustration, never body dimensions or positions. */
export function cinematicRadius(id:string,width:number,height:number){
 const fraction:Record<string,number>={sun:.25,mercury:.026,venus:.075,earth:.12,mars:.10,jupiter:.14,saturn:.12,uranus:.075,neptune:.075}
 return Math.min(width*.24,height*(fraction[id]??.018),id==='mercury'?24:Infinity)
}
/** Pick a readable source-derived view, rather than rearranging the planets.
 * This bounded search runs on framing changes, never in the render loop. */
export function cinematicOverviewPose(radii:BodyRadii,bodies:Anchor[],aspect:number,height:number,frame:ReturnType<typeof clearViewport>):CameraPose{
 const up=new T.Vector3(...overviewUp(aspect)),north=new T.Vector3(0,-.3978,.9175).normalize(),sun=bodies.find(b=>b.source_id==='sun'),earth=bodies.find(b=>b.source_id==='earth')
 const origin=new T.Vector3(...(sun?.position_au||[0,0,0])),radial=new T.Vector3(...(earth?.position_au||[1,0,0])).sub(origin).normalize()
 if(radial.lengthSq()<.1)radial.set(1,0,0)
 const side=north.clone().cross(radial).normalize(),width=aspect*height
 // Reserve room around actual centers for their independently enlarged disks.
 const fit={...frame,clearWidth:frame.clearWidth*.82,clearHeight:frame.clearHeight*.82}
 let best=overviewPose(radii,bodies,aspect,height,fit,true),score=-Infinity
 for(let i=0;i<24;i++){
  const angle=i*Math.PI/12,view=radial.clone().multiplyScalar(Math.cos(angle)).addScaledVector(side,Math.sin(angle)).addScaledVector(north,.65).normalize()
  // Avoid nearly parallel camera up/view vectors on portrait screens.
  if(Math.abs(view.dot(up.clone().normalize()))>.94)continue
  const pose=overviewPose(radii,bodies,aspect,height,fit,true,view.toArray()),camera=new T.PerspectiveCamera(42,aspect,.001,2000)
  camera.up.copy(up);camera.position.fromArray(pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld()
  const projected=bodies.map(b=>({id:b.source_id,p:new T.Vector3(...b.position_au).project(camera)})),s=projected.find(b=>b.id==='sun')?.p
  let value=0
  for(let a=0;a<projected.length;a++)for(let b=a+1;b<projected.length;b++){
   const x=projected[a],y=projected[b],distance=Math.hypot((x.p.x-y.p.x)*width/2,(x.p.y-y.p.y)*height/2)
   value+=Math.min(2,distance/(cinematicRadius(x.id,width,height)+cinematicRadius(y.id,width,height)))
  }
  if(s){value-=Math.abs(s.x+(aspect>.9?.55:.2))*5+Math.abs(s.y-(aspect>.9?.05:.45))*2;const e=projected.find(b=>b.id==='earth')?.p;if(e&&aspect>.9&&s.x>e.x)value-=10}
  // Prefer a view of the actual sunlit hemispheres; do not add a fake fill Sun.
  for(const id of ['earth','mars']as const){const body=bodies.find(b=>b.source_id===id);if(!body)continue;const p=new T.Vector3(...body.position_au),towardSun=origin.clone().sub(p).normalize(),towardCamera=new T.Vector3(...pose.position).sub(p).normalize();value+=towardSun.dot(towardCamera)*(id==='earth'?6:3)}
  if(value>score){score=value;best=pose}
 }
 return best
}
export function focusPose(radii:BodyRadii,id:string,p:Vector,aspect:number,close=false,height=0,frame=focusViewport(aspect*height,height)):CameraPose{
 const target=new T.Vector3(...p),sunward=target.clone().negate().normalize()
 if(id==='sun')sunward.copy(direction)
 // View mostly the illuminated hemisphere, with a visible terminator. This changes
 // only the camera; texture longitude/orientation remains an illustrative choice.
 const side=new T.Vector3(0,0,1).cross(sunward).normalize()
 const view=sunward.multiplyScalar(.72).addScaledVector(side,.7).add(new T.Vector3(0,0,.3)).normalize()
 let distance=radii[id]*(close?3.5:5.1)/Math.min(1,Math.max(.52,aspect))
 const limit=frame.maxGlobeRadius*(close?1:.82)
 if(Number.isFinite(limit))distance=Math.max(distance,visualRadius(radii,id)*Math.sqrt(1+(height/(2*Math.tan(21*Math.PI/180)*limit))**2))
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
 let best={x:width*.5-preferred.offsetX,y:height*.5-preferred.offsetY,radius:18,clearWidth:36,clearHeight:36,rectangleOffsetX:preferred.offsetX,rectangleOffsetY:preferred.offsetY},score=-Infinity
 for(let l=0;l<xs.length;l++)for(let r=l+1;r<xs.length;r++)for(let t=0;t<ys.length;t++)for(let b=t+1;b<ys.length;b++){
  const left=xs[l],right=xs[r],top=ys[t],bottom=ys[b],radius=Math.min(right-left,bottom-top)/2
  if(radius<16||clipped.some(o=>left<o.right&&right>o.left&&top<o.bottom&&bottom>o.top))continue
  const x=Math.max(left+radius,Math.min(right-radius,width*.5-preferred.offsetX)),y=Math.max(top+radius,Math.min(bottom-radius,height*.5-preferred.offsetY))
  const candidate=radius*1000-Math.hypot(x-(width*.5-preferred.offsetX),y-(height*.5-preferred.offsetY))
  if(candidate>score){best={x,y,radius:radius-(radius<22?1:radius<26?4:12),clearWidth:Math.max(8,right-left-24),clearHeight:Math.max(8,bottom-top-24),rectangleOffsetX:width*.5-(left+right)/2,rectangleOffsetY:height*.5-(top+bottom)/2};score=candidate}
 }
 return{offsetX:width*.5-best.x,offsetY:height*.5-best.y,maxGlobeRadius:best.radius,clearWidth:best.clearWidth,clearHeight:best.clearHeight,rectangleOffsetX:best.rectangleOffsetX,rectangleOffsetY:best.rectangleOffsetY}
}
/** Place a label near its true anchor; a leader connects displaced text. */
export function labelPosition(anchor:{x:number;y:number;radius:number},w:number,h:number,width:number,height:number,occupied:ScreenRect[]):[number,number]|null{
 const {x,y,radius}=anchor
 const angles=[0,Math.PI,-Math.PI/2,Math.PI/2,-Math.PI/4,Math.PI/4,-3*Math.PI/4,3*Math.PI/4]
 for(const gap of [12,64,116,168,220,272,324])for(const a of angles){
  const left=x+Math.cos(a)*(radius+gap+w/2)-w/2,top=y+Math.sin(a)*(radius+gap+h/2)-h/2
  const box={left,top,right:left+w,bottom:top+h}
  if(left>=10&&top>=10&&box.right<=width-10&&box.bottom<=height-10&&!occupied.some(o=>box.left<o.right&&box.right>o.left&&box.top<o.bottom&&box.bottom>o.top))return[left,top]
 }
 // Crowded inner-system anchors can exhaust radial candidates. Search the
 // edges of existing clear boxes, still choosing the closest legal label slot.
 const xs=[10,width-w-10,x-w/2,...occupied.flatMap(r=>[r.left-w-6,r.right+6])],ys=[10,height-h-10,y-h/2,...occupied.flatMap(r=>[r.top-h-6,r.bottom+6])]
 let best:[number,number]|null=null,score=Infinity
 for(const left of xs)for(const top of ys){
  const box={left,top,right:left+w,bottom:top+h}
  if(left<10||top<10||box.right>width-10||box.bottom>height-10||occupied.some(o=>box.left<o.right&&box.right>o.left&&box.top<o.bottom&&box.bottom>o.top))continue
  const distance=Math.hypot(left+w/2-x,top+h/2-y)
  if(distance<score){score=distance;best=[left,top]}
 }
 return best
}
export type LabelAnchor={id:string;x:number;y:number;radius:number;width:number;height:number}
/** Retry bounded placement orders when a crowded group defeats greedy placement. */
export function arrangeLabels(labels:LabelAnchor[],width:number,height:number,obstacles:ScreenRect[],selected?:string|null):Map<string,[number,number]|null>{
 const orders=[labels,[...labels].reverse(),[...labels].sort((a,b)=>a.y-b.y),[...labels].sort((a,b)=>b.y-a.y),[...labels].sort((a,b)=>a.x-b.x),[...labels].sort((a,b)=>b.x-a.x)]
 for(let i=1;i<labels.length;i++)orders.push([...labels.slice(i),...labels.slice(0,i)])
 let best=new Map<string,[number,number]|null>(),count=-1
 for(const order of orders){
  order.sort((a,b)=>Number(b.id===selected)-Number(a.id===selected))
  const occupied=[...obstacles],result=new Map<string,[number,number]|null>();let found=0
  for(const label of order){const spot=labelPosition(label,label.width,label.height,width,height,occupied);result.set(label.id,spot);if(spot){found++;occupied.push({left:spot[0]-3,top:spot[1]-3,right:spot[0]+label.width+3,bottom:spot[1]+label.height+3})}}
  if(found>count){best=result;count=found}if(found===labels.length)break
 }
 return best
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
