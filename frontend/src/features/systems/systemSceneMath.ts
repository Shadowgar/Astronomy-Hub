import type {SystemCamera,Vec3} from './systemTypes'
import {diskBudget,type ScreenRect} from '../solar/solarPresentation'

/** Source ICRF axes are retained; the renderer's sole unit conversion is km/1000. */
export const sceneVector=(km:Vec3):Vec3=>km.map(v=>v/1000) as Vec3
export function displayRadius(radiusKm:number,distanceKm:number,height:number,fov:number,mode:'cinematic'|'physical',pixels:number){
 return mode==='physical'?radiusKm:Math.max(radiusKm,pixels*2*distanceKm*Math.tan(fov*Math.PI/360)/Math.max(1,height))
}
export function systemDiskBudgets(disks:{x:number;y:number;desired:number;physical:number}[],width:number,height:number,hud:ScreenRect[]):number[]{
 return disks.map((d,i)=>{
  const edge=Math.min(d.x,width-d.x,d.y,height-d.y,...hud.map(r=>Math.hypot(Math.max(r.left-d.x,0,d.x-r.right),Math.max(r.top-d.y,0,d.y-r.bottom))))-6
  const desired=Math.max(d.desired,d.physical)
  return Math.max(d.physical,diskBudget(desired,disks.filter((_,j)=>j!==i).map(n=>({distance:Math.hypot(n.x-d.x,n.y-d.y),desired:Math.max(n.desired,n.physical)})),edge))
 })
}
/** Choose the largest empty rectangle, so wide views use the whole horizontal strip. */
export function systemViewport(width:number,height:number,hud:ScreenRect[]){
 const obstacles=hud.map(r=>({left:Math.max(12,r.left-8),right:Math.min(width-12,r.right+8),top:Math.max(12,r.top-8),bottom:Math.min(height-12,r.bottom+8)})).filter(r=>r.right>r.left&&r.bottom>r.top)
 const xs=[12,width-12,...obstacles.flatMap(r=>[r.left,r.right])],ys=[12,height-12,...obstacles.flatMap(r=>[r.top,r.bottom])]
 let best={left:12,right:width-12,top:12,bottom:height-12},area=0
 for(const left of xs)for(const right of xs)for(const top of ys)for(const bottom of ys){
  const candidate=(right-left)*(bottom-top)
  if(right-left<32||bottom-top<32||candidate<=area||obstacles.some(r=>left<r.right&&right>r.left&&top<r.bottom&&bottom>r.top))continue
  best={left,right,top,bottom};area=candidate
 }
 return{clearWidth:Math.max(8,best.right-best.left-16),clearHeight:Math.max(8,best.bottom-best.top-16),rectangleOffsetX:width/2-(best.left+best.right)/2,rectangleOffsetY:height/2-(best.top+best.bottom)/2}
}
/** A conservative bounding sphere fits every source sample, never closes an orbit. */
export function fitSystem(points:Vec3[],aspect:number,fov:number):{position:Vec3;target:Vec3}{
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity]
 for(const p of points)for(let i=0;i<3;i++){lo[i]=Math.min(lo[i],p[i]);hi[i]=Math.max(hi[i],p[i])}
 const target=lo.map((v,i)=>(v+hi[i])/2) as Vec3
 if(!target.every(Number.isFinite))target.fill(0)
 const radius=Math.max(10000,...points.map(p=>Math.hypot(...p.map((v,i)=>v-target[i]))))
 const half=Math.min(fov*Math.PI/360,Math.atan(Math.tan(fov*Math.PI/360)*Math.max(.05,aspect)))
 const distance=radius/Math.sin(half)*1.3
 return{target,position:[target[0],target[1]-distance*.35,target[2]+distance*Math.sqrt(1-.35**2)]}
}
export function validCamera(value:unknown,ids:string[]):value is SystemCamera{
 if(!value||typeof value!=='object')return false
 const c=value as SystemCamera
 const vec=(v:unknown):v is Vec3=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e10)
 if(!vec(c.position)||!vec(c.target)||!vec(c.up)||(c.focus!==null&&!ids.includes(c.focus)))return false
 const d=c.position.map((v,i)=>v-c.target[i]),length=Math.hypot(...d),u=Math.hypot(...c.up)
 if(length<1||length>1e9||u<.5||u>1.5)return false
 const dot=d.reduce((s,v,i)=>s+v*c.up[i],0)/(length*u)
 return Math.abs(dot)<.9999
}
