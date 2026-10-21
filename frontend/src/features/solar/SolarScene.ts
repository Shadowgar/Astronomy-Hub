import * as T from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import type {SolarSnapshot,BodyId,Vector} from './solarContracts'
export type SolarScene={focus:(id:BodyId|null)=>void;zoom:(factor:number)=>void;orbit:(angle:number)=>void;diagnostics:()=>unknown;dispose:()=>void}
const style:Record<BodyId,{color:string;radius:number}>={sun:{color:'#ffd48a',radius:.09},earth:{color:'#75b8f0',radius:.045},mars:{color:'#cf8b6e',radius:.037}}
/** Isolated Solar engine. One scene owns all Three GPU resources and controls. */
export function mountSolarScene(host:HTMLElement,snapshot:SolarSnapshot,reduced:boolean,onPick:(id:BodyId)=>void):SolarScene{
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(42,1,.001,100),renderer=new T.WebGLRenderer({antialias:true,alpha:false})
 renderer.setClearColor('#060b16');renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.domElement.setAttribute('aria-label','Solar System 3D view. Drag to orbit, pinch or scroll to zoom. Body and camera controls follow.');renderer.domElement.tabIndex=0
 host.append(renderer.domElement)
 camera.position.set(0,-3.3,2.8);camera.up.set(0,0,1)
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minDistance=.13;controls.maxDistance=12;controls.target.set(0,0,0);controls.update()
 const light=new T.PointLight('#fff3db',7,0,2);scene.add(light);scene.add(new T.AmbientLight('#b9c8e7',.25))
 const resources:{dispose:()=>void}[]=[],objects:{id:BodyId;mesh:any;label:HTMLButtonElement}[]=[],ray=new T.Raycaster(),pointer=new T.Vector2()
 let disposed=false,raf=0,renderCount=0,selected:BodyId|null=null,flight:null|{start:number;from:Vector;targetFrom:Vector;to:Vector;targetTo:Vector}=null,press:null|{x:number;y:number}=null
 for(const body of snapshot.bodies){
  const s=style[body.source_id],geometry=new T.SphereGeometry(s.radius,32,20),material=body.source_id==='sun'?new T.MeshBasicMaterial({color:s.color}):new T.MeshStandardMaterial({color:s.color,roughness:1,metalness:0})
  resources.push(geometry,material);const mesh=new T.Mesh(geometry,material);mesh.position.fromArray(body.position_au);scene.add(mesh)
  const label=document.createElement('button');label.className='solar-body-label';label.textContent=body.name;label.setAttribute('aria-label',`Select ${body.name} in 3D view`);label.onclick=()=>onPick(body.source_id);host.append(label);objects.push({id:body.source_id,mesh,label})
  if(body.trajectory.length){const points=body.trajectory.map(p=>new T.Vector3(...p.position_au)),g=new T.BufferGeometry().setFromPoints(points),m=new T.LineBasicMaterial({color:s.color,transparent:true,opacity:.32});resources.push(g,m);scene.add(new T.Line(g,m))}
 }
 function draw(){if(disposed)return;renderCount++;renderer.render(scene,camera);const rect=host.getBoundingClientRect();for(const o of objects){const v=o.mesh.position.clone().project(camera),visible=v.z>-1&&v.z<1&&Math.abs(v.x)<1&&Math.abs(v.y)<1;o.label.hidden=!visible;o.label.style.left=`${(v.x+1)*rect.width/2}px`;o.label.style.top=`${(1-v.y)*rect.height/2+16}px`;o.label.setAttribute('aria-pressed',String(o.id===selected))}}
 function tick(now:number){if(disposed)return;raf=0;if(flight){const u=Math.min(1,Math.max(0,(now-flight.start)/650)),p=u*u*(3-2*u);camera.position.fromArray(flight.from).lerp(new T.Vector3(...flight.to),p);controls.target.fromArray(flight.targetFrom).lerp(new T.Vector3(...flight.targetTo),p);controls.update();if(u===1)flight=null;else raf=requestAnimationFrame(tick)}draw()}
 function cancelFlight(){flight=null;cancelAnimationFrame(raf);raf=0}
 const change=()=>draw(),start=()=>cancelFlight();controls.addEventListener('change',change);controls.addEventListener('start',start)
 const resize=new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();if(width&&height){camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);draw()}});resize.observe(host)
 const down=(e:PointerEvent)=>{press={x:e.clientX,y:e.clientY}},up=(e:PointerEvent)=>{if(!press||Math.hypot(e.clientX-press.x,e.clientY-press.y)>5){press=null;return}press=null;const r=renderer.domElement.getBoundingClientRect();pointer.set(2*(e.clientX-r.left)/r.width-1,1-2*(e.clientY-r.top)/r.height);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(objects.map(o=>o.mesh))[0],found=objects.find(o=>o.mesh===hit?.object);if(found)onPick(found.id)}
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up)
 const contextLost=(e:Event)=>{e.preventDefault();cancelFlight();host.dispatchEvent(new CustomEvent('solar-render-error'))};renderer.domElement.addEventListener('webglcontextlost',contextLost)
 draw()
 return{
  focus(id){if(disposed)return;selected=id;cancelFlight();const body=objects.find(o=>o.id===id),target=body?body.mesh.position.clone():new T.Vector3(),to=id?target.clone().add(new T.Vector3(.2,-.52,.32)):new T.Vector3(0,-3.3,2.8)
   if(reduced){camera.position.copy(to);controls.target.copy(target);controls.update();draw()}else{flight={start:performance.now(),from:camera.position.toArray(),targetFrom:controls.target.toArray(),to:to.toArray(),targetTo:target.toArray()};raf=requestAnimationFrame(tick)}
  },
  zoom(factor){if(disposed)return;cancelFlight();const delta=camera.position.clone().sub(controls.target),distance=Math.max(controls.minDistance,Math.min(controls.maxDistance,delta.length()*factor));delta.setLength(distance);camera.position.copy(controls.target).add(delta);controls.update();draw()},
  orbit(angle){if(disposed)return;cancelFlight();const delta=camera.position.clone().sub(controls.target);delta.applyAxisAngle(new T.Vector3(0,0,1),angle);camera.position.copy(controls.target).add(delta);controls.update();draw()},
  diagnostics(){const r=renderer.domElement.getBoundingClientRect();return{epoch:snapshot.epoch,frame:snapshot.frame,origin:snapshot.origin,units:snapshot.units,selected,renderCount,disposed,animating:!!flight,camera:camera.position.toArray(),target:controls.target.toArray(),bodies:objects.map(o=>{const p=o.mesh.position.clone().project(camera);return{id:o.id,position:o.mesh.position.toArray(),screen:[r.left+(p.x+1)*r.width/2,r.top+(1-p.y)*r.height/2]}}),drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries}},
  dispose(){if(disposed)return;disposed=true;cancelFlight();resize.disconnect();controls.removeEventListener('change',change);controls.removeEventListener('start',start);controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('webglcontextlost',contextLost);for(const o of objects)o.label.remove();for(const r of resources)r.dispose();scene.clear();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}
 }
}
