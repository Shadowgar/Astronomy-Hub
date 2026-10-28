import * as T from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {cameraTransition,type CameraPose} from './solarPresentation'
import {flightSpeed,stopAtSurface,type OpaqueBody} from './solarPrecision'
import type {Vector} from './solarContracts'

export type NavigationMode='orbit'|'follow'|'free'
/** CPU float64 camera, independent of render origin and scientific clock. */
export class SolarCameraController{
 readonly controls:any
 mode:NavigationMode='orbit'
 private flight:null|{start:number;from:Vector;targetFrom:Vector;pose:CameraPose;duration:number}=null
 private keys=new Set<string>()
 private pressed:string|null=null
 private pointer:null|{id:number;x:number;y:number}=null
 private last=0
 private internal=false
 private disposed=false
 private near=.001
 private minimum=.001
 private reduced=false
 private listeners:(()=>void)[]=[]
 private accepted:Vector
 constructor(private camera:any,private element:HTMLCanvasElement,private bodies:()=>OpaqueBody[],private request:()=>void,private changed:()=>void,private modeChanged:(mode:NavigationMode)=>void=()=>{}){
  this.accepted=camera.position.toArray()
  this.controls=new OrbitControls(camera,element);this.controls.enableDamping=false;this.controls.enablePan=true;this.controls.minDistance=.001;this.controls.maxDistance=500
  this.controls.addEventListener('change',this.onChange);this.controls.addEventListener('start',this.onStart)
  this.listen(element,'keydown',this.keyDown);this.listen(element,'keyup',this.keyUp);this.listen(element,'blur',this.stopInput)
  this.listen(element,'pointerdown',this.pointerDown);this.listen(element,'pointermove',this.pointerMove);this.listen(element,'pointerup',this.pointerUp);this.listen(element,'pointercancel',this.pointerUp)
  this.listen(window,'blur',this.stopInput)
 }
 private listen(target:EventTarget,type:string,fn:any){target.addEventListener(type,fn);this.listeners.push(()=>target.removeEventListener(type,fn))}
 private onChange=()=>{if(!this.internal){
  const proposed=this.camera.position.toArray() as Vector,safe=stopAtSurface(this.accepted,proposed,this.bodies())
  // OrbitControls owns mouse/pinch/pan input; guard its resulting whole segment.
  // Translate the pan target by the rejected motion to retain viewing direction.
  this.controls.target.add(new T.Vector3(...safe).sub(this.camera.position))
  this.camera.position.fromArray(safe);this.updateControls();this.changed();this.request()
 }}
 private onStart=()=>{this.cancel();this.changed()}
 private keyDown=(e:KeyboardEvent)=>{if(this.mode!=='free'||!['KeyW','KeyS','KeyA','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code))return;e.preventDefault();this.keys.add(e.code);this.request()}
 private keyUp=(e:KeyboardEvent)=>{this.keys.delete(e.code)}
 private stopInput=()=>{this.keys.clear();this.pressed=null;this.pointer=null}
 private pointerDown=(e:PointerEvent)=>{if(this.mode!=='free'||!e.isPrimary)return;this.cancel();this.element.focus({preventScroll:true});this.element.setPointerCapture(e.pointerId);this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY}}
 private pointerMove=(e:PointerEvent)=>{
  if(this.mode!=='free'||this.pointer?.id!==e.pointerId)return
  const dx=e.clientX-this.pointer.x,dy=e.clientY-this.pointer.y;this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY}
  // Local pitch/yaw avoids a fixed-world pole flip and works for touch dragging.
  this.camera.rotateY(-dx*.003);this.camera.rotateX(-dy*.003)
  this.controls.target.copy(this.camera.position).add(this.camera.getWorldDirection(new T.Vector3()).multiplyScalar(Math.max(this.minimum,this.camera.position.distanceTo(this.controls.target))))
  this.changed();this.request()
 }
 private pointerUp=(e:PointerEvent)=>{if(this.pointer?.id===e.pointerId){this.pointer=null;if(this.element.hasPointerCapture(e.pointerId))this.element.releasePointerCapture(e.pointerId)}}
 setReduced(value:boolean){this.reduced=value;if(value&&this.flight){const pose=this.flight.pose;this.move(pose,this.near,this.minimum,true)}}
 cancel(){this.flight=null;this.controls.minDistance=Math.min(this.minimum,Math.max(1e-15,this.camera.position.distanceTo(this.controls.target)))}
 setMode(mode:NavigationMode){this.cancel();this.stopInput();this.mode=mode;this.accepted=this.camera.position.toArray();this.controls.enabled=mode!=='free';this.last=0;this.modeChanged(mode);this.request()}
 press(direction:string|null){this.pressed=direction;this.request()}
 updateControls(){this.internal=true;this.controls.update();this.accepted=this.camera.position.toArray();this.internal=false}
 move(pose:CameraPose,near:number,minimum:number,immediate=false){
  this.cancel();this.setMode('orbit');this.near=near;this.minimum=minimum
  // A previous giant's collision envelope must not clamp a smaller destination.
  this.controls.minDistance=Math.min(this.controls.minDistance,minimum)
  this.camera.near=this.reduced||immediate?near:Math.min(this.camera.near,near);this.camera.updateProjectionMatrix()
  if(this.reduced||immediate){this.camera.position.fromArray(pose.position);this.controls.target.fromArray(pose.target);this.controls.minDistance=minimum;this.updateControls()}
  else this.flight={start:performance.now(),from:this.camera.position.toArray(),targetFrom:this.controls.target.toArray(),pose,duration:1800}
  this.request()
 }
 follow(delta:Vector){
  if(this.mode==='free')return
  this.camera.position.add(new T.Vector3(...delta));this.controls.target.add(new T.Vector3(...delta))
  if(this.flight){this.flight.from=this.flight.from.map((v,i)=>v+delta[i]) as Vector;this.flight.targetFrom=this.flight.targetFrom.map((v,i)=>v+delta[i]) as Vector;this.flight.pose={position:this.flight.pose.position.map((v,i)=>v+delta[i]) as Vector,target:this.flight.pose.target.map((v,i)=>v+delta[i]) as Vector}}
  this.updateControls()
 }
 zoom(factor:number){this.cancel();const d=this.camera.position.clone().sub(this.controls.target);const distance=Math.max(this.controls.minDistance,Math.min(500,d.length()*factor));const to=this.controls.target.clone().add(d.setLength(distance)).toArray();this.camera.position.fromArray(stopAtSurface(this.camera.position.toArray(),to,this.bodies()));this.updateControls();this.changed();this.request()}
 orbit(angle:number){this.cancel();const delta=this.camera.position.clone().sub(this.controls.target).applyAxisAngle(this.camera.up.clone().normalize(),angle);const to=this.controls.target.clone().add(delta).toArray();this.camera.position.fromArray(stopAtSurface(this.camera.position.toArray(),to,this.bodies()));this.updateControls();this.changed();this.request()}
 tick(now:number){
  if(this.disposed)return false
  const dt=this.last?Math.min(.05,Math.max(0,(now-this.last)/1000)):0;this.last=now
  if(this.flight){
   const u=Math.min(1,(now-this.flight.start)/this.flight.duration),pose=cameraTransition(this.flight.from,this.flight.targetFrom,this.flight.pose,u)
   this.camera.position.fromArray(stopAtSurface(this.camera.position.toArray(),pose.position,this.bodies()));this.controls.target.fromArray(pose.target);this.updateControls()
   if(u>=1){this.flight=null;this.controls.minDistance=this.minimum;this.camera.near=this.near;this.camera.updateProjectionMatrix()}
  }
  if(this.mode==='free'&&(this.keys.size||this.pressed)){
   const active=(key:string,button:string)=>this.keys.has(key)||this.pressed===button
   const forward=Number(active('KeyW','forward')||this.keys.has('ArrowUp'))-Number(active('KeyS','back')||this.keys.has('ArrowDown'))
   const right=Number(active('KeyD','right')||this.keys.has('ArrowRight'))-Number(active('KeyA','left')||this.keys.has('ArrowLeft'))
   const up=Number(active('KeyE','up'))-Number(active('KeyQ','down'))
   const movement=new T.Vector3(right,up,-forward)
   if(movement.lengthSq()){
    const speed=flightSpeed(this.camera.position.toArray(),this.bodies())*(this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')?4:1)
    movement.normalize().applyQuaternion(this.camera.quaternion).multiplyScalar(speed*dt)
    const from=this.camera.position.toArray(),to=this.camera.position.clone().add(movement).toArray(),safe=stopAtSurface(from,to,this.bodies())
    const delta=new T.Vector3(...safe).sub(this.camera.position);this.camera.position.fromArray(safe);this.controls.target.add(delta);this.changed()
   }
  }
  return !!this.flight||(this.mode==='free'&&(this.keys.size>0||this.pressed!==null))
 }
 get animating(){return !!this.flight}
 dispose(){this.disposed=true;this.cancel();this.stopInput();this.controls.removeEventListener('change',this.onChange);this.controls.removeEventListener('start',this.onStart);this.controls.dispose();for(const off of this.listeners)off()}
}
