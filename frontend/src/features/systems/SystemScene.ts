import * as T from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import type {ScreenRect} from '../solar/solarPresentation'
import type {EvaluatedSystem,SystemSnapshot,SystemCamera,Vec3} from './systemTypes'
import {displayRadius,fitSystem,sceneVector,validCamera,systemDiskBudgets,systemViewport} from './systemSceneMath'
import {systemMaterial} from './systemMaterials'
import {evaluateSystem} from './systemContracts'

export type SystemScene={update:(value:EvaluatedSystem)=>void;focus:(id:string|null)=>void;overview:()=>void;zoom:(factor:number)=>void;orbit:(angle:number)=>void;setSizeMode:(mode:'cinematic'|'physical')=>void;setOrbits:(show:boolean)=>void;restoreCamera:(value:SystemCamera)=>boolean;diagnostics:()=>unknown;dispose:()=>void}
type Body={id:string;radius:number;mesh:any;label:HTMLButtonElement;marker:HTMLSpanElement;extras:any[];width:number;height:number}
type Pose={position:Vec3;target:Vec3}
const earthUrl=new URL('../solar/assets/earth-blue-marble.png',import.meta.url).href
const cloudsUrl=new URL('../solar/assets/earth-clouds-2002.jpg',import.meta.url).href
const hudSelector='.system-header,.system-footer,.system-context,.system-toolbar,.system-breadcrumb,.system-title'

/** Native local-system renderer; React owns only controls and serialized intent. */
export function mountSystemScene(host:HTMLElement,snapshot:SystemSnapshot,reduced:boolean,onPick:(id:string)=>void,onCamera:(camera:SystemCamera)=>void=()=>{}):SystemScene{
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'})
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setClearColor('#02040a')
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label',`${snapshot.parent.name} system. Drag to orbit; pinch or scroll to zoom. Arrow keys orbit, plus and minus zoom, Home shows the system.`)
 host.append(canvas)
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(42,1,.001,1e7),controls=new OrbitControls(camera,canvas)
 camera.up.set(0,0,1);controls.enableDamping=false;controls.enablePan=false;controls.minDistance=1;controls.maxDistance=1e6
 const resources=new Set<{dispose:()=>void}>(),bodies:Body[]=[],paths:any[]=[],materials:any[]=[]
 const keep=<R extends {dispose:()=>void}>(r:R):R=>{resources.add(r);return r}
 let disposed=false,lost=false,raf=0,renderCount=0,selected:string|null=null,custom=false,sizeMode:'cinematic'|'physical'='cinematic',orbits=true,updating=false,texturesReady=0
 let epoch=snapshot.epoch,flight:null|{start:number;from:Pose;to:Pose}=null,press:null|{id:number;x:number;y:number}=null
 let bounds=host.getBoundingClientRect(),width=Math.max(1,bounds.width),height=Math.max(1,bounds.height),hud:ScreenRect[]=[]
 let viewport=systemViewport(width,height,[])
 const timings:number[]=[],ray=new T.Raycaster(),pointer=new T.Vector2()
 const km=(v:any):Vec3=>v.toArray().map((n:number)=>n*1000) as Vec3
 const state=():SystemCamera=>({position:km(camera.position),target:km(controls.target),up:camera.up.toArray(),focus:selected})
 const assetError=(name:string)=>{if(!disposed)host.dispatchEvent(new CustomEvent('system-asset-error',{detail:`${name} imagery unavailable; positions remain available.`}))}
 function texture(url:string,material:any,name:string,onReady?:()=>void){
  const t=keep(new T.TextureLoader().load(url,(loaded:any)=>{if(disposed){loaded.dispose();return}loaded.colorSpace=name==='Clouds'?T.NoColorSpace:T.SRGBColorSpace;loaded.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());material.uniforms.map.value=loaded;if(material.uniforms.hasMap)material.uniforms.hasMap.value=true;texturesReady++;onReady?.();requestDraw()},undefined,()=>assetError(name)))
  return t
 }
 const descriptors=[{id:snapshot.parent.id,name:snapshot.parent.name,radius:snapshot.parent.radius_km},...snapshot.satellites.filter(s=>s.status==='qualified'&&s.radius_km!==null&&snapshot.state[s.id]).map(s=>({id:s.id,name:s.name,radius:s.radius_km!}))]
 for(const descriptor of descriptors){
  const isEarth=descriptor.id==='earth',isMoon=descriptor.id==='moon'
  const material=keep(systemMaterial(isEarth?'earth':isMoon?'moon':descriptor.id===snapshot.parent.id?'planet':'moon',descriptor.id));materials.push(material)
  const mesh=new T.Mesh(keep(new T.SphereGeometry(descriptor.radius/1000,64,40)),material)
  mesh.position.fromArray(sceneVector(snapshot.state[descriptor.id]?.position_km??[0,0,0]))
  // Texture orientation is illustrative here; the qualified body-fixed Moon is a separate destination.
  mesh.rotation.x=Math.PI/2;mesh.rotation.y=isEarth?-.7:.35;scene.add(mesh)
  const label=document.createElement('button');label.className='system-body-label';label.textContent=descriptor.name
  label.setAttribute('aria-label',`Select ${descriptor.name} in system`);label.style.position='absolute';label.style.left='0';label.style.top='0';label.style.zIndex='2';label.onclick=()=>onPick(descriptor.id);host.append(label)
  const marker=document.createElement('span');marker.className='system-position-marker';marker.setAttribute('aria-hidden','true');Object.assign(marker.style,{position:'absolute',width:'5px',height:'5px',borderRadius:'50%',background:'#c4d8ed',pointerEvents:'none'});host.append(marker)
  const body:Body={id:descriptor.id,radius:descriptor.radius,mesh,label,marker,extras:[],width:80,height:32};bodies.push(body)
  if(isEarth){
   texture(earthUrl,material,'Earth')
   const cloudMaterial=keep(systemMaterial('clouds','earth')),atmosphere=keep(systemMaterial('atmosphere','earth'));materials.push(cloudMaterial,atmosphere)
   const clouds=new T.Mesh(keep(new T.SphereGeometry(descriptor.radius/1000*1.008,64,40)),cloudMaterial)
   clouds.visible=false;clouds.rotation.copy(mesh.rotation);clouds.position.copy(mesh.position);body.extras.push(clouds);scene.add(clouds)
   texture(cloudsUrl,cloudMaterial,'Clouds',()=>{clouds.visible=true})
   const rim=new T.Mesh(keep(new T.SphereGeometry(descriptor.radius/1000*1.018,48,32)),atmosphere);rim.position.copy(mesh.position);body.extras.push(rim);scene.add(rim)
  }else if(isMoon)texture('/planet-data/moon-wac.png',material,'Moon')
 }
 for(const track of snapshot.tracks){
  if(track.id===snapshot.parent.id||track.samples.length<2)continue
  const g=keep(new T.BufferGeometry().setFromPoints(track.samples.map(s=>new T.Vector3(...sceneVector(s.position_km)))))
  const path=new T.Line(g,keep(new T.LineBasicMaterial({color:'#9bb9d3',transparent:true,opacity:.32})));scene.add(path);paths.push(path)
 }
 const anchors:Vec3[]=[[0,0,0],...snapshot.tracks.flatMap(t=>t.samples.map(s=>s.position_km))]
 function updateControls(){updating=true;controls.update();updating=false}
 function overviewPose():Pose{
  const pose=fitSystem(anchors,viewport.clearWidth/Math.max(1,viewport.clearHeight),camera.fov)
  // A full-canvas projection fits a smaller unobstructed rectangle by increasing distance.
  const multiplier=height/Math.max(1,viewport.clearHeight)
  return{target:sceneVector(pose.target),position:pose.position.map((v,i)=>(pose.target[i]+(v-pose.target[i])*multiplier)/1000) as Vec3}
 }
 function focusPose(body:Body):Pose{
  const direction=camera.position.clone().sub(controls.target).normalize(),pixels=Math.max(20,Math.min(viewport.clearWidth,viewport.clearHeight)*.25)
  const distance=body.radius/1000*height/(2*pixels*Math.tan(camera.fov*Math.PI/360))
  return{target:body.mesh.position.toArray(),position:body.mesh.position.clone().add(direction.multiplyScalar(Math.max(distance,body.radius/1000*2.5))).toArray()}
 }
 function draw(){
  if(disposed||lost)return
  const start=performance.now();camera.updateMatrixWorld()
  const projected=bodies.map(body=>{const p=body.mesh.position.clone().project(camera),distance=body.mesh.position.distanceTo(camera.position)*1000;return{body,p,distance,x:(p.x+1)*width/2,y:(1-p.y)*height/2,desired:body.id===snapshot.parent.id?65:24,physical:body.radius*height/(2*distance*Math.tan(camera.fov*Math.PI/360))}})
  const budgets=systemDiskBudgets(projected,width,height,hud)
  for(const [index,{body,distance}] of projected.entries()){
   const radius=displayRadius(body.radius,distance,height,camera.fov,sizeMode,budgets[index])
   body.mesh.scale.setScalar(radius/body.radius);for(const extra of body.extras)extra.scale.copy(body.mesh.scale)
  }
  renderer.render(scene,camera);renderCount++
  const disks=projected.map(p=>({...p,radius:p.physical*p.body.mesh.scale.x}))
  const occupied=[...hud,...disks.filter(({p})=>p.z>-1&&p.z<1).map(({x,y,radius})=>({left:x-radius-4,right:x+radius+4,top:y-radius-4,bottom:y+radius+4}))]
  for(const {body,p,x,y,radius} of disks.sort((a,b)=>Number(b.body.id===selected)-Number(a.body.id===selected))){
   const visible=p.z>-1&&p.z<1&&x>=0&&x<=width&&y>=0&&y<=height
   body.marker.hidden=!visible||radius>=3;body.marker.style.transform=`translate(${x-2.5}px,${y-2.5}px)`
   const candidates=[[x+radius+10,y-body.height/2],[x-radius-body.width-10,y-body.height/2],[x-body.width/2,y+radius+10],[x-body.width/2,y-radius-body.height-10]]
   const spot=candidates.find(([left,top])=>left>=5&&top>=5&&left+body.width<=width-5&&top+body.height<=height-5&&!occupied.some(r=>left<r.right&&left+body.width>r.left&&top<r.bottom&&top+body.height>r.top))
   body.label.hidden=!visible||!spot;body.label.setAttribute('aria-pressed',String(body.id===selected))
   if(visible&&spot){body.label.style.transform=`translate3d(${spot[0]}px,${spot[1]}px,0)`;occupied.push({left:spot[0],top:spot[1],right:spot[0]+body.width,bottom:spot[1]+body.height})}
  }
  timings.push(performance.now()-start);if(timings.length>120)timings.shift();onCamera(state())
 }
 function tick(now:number){
  raf=0;if(disposed||lost)return
  if(flight){const u=Math.max(0,Math.min(1,(now-flight.start)/900)),ease=u*u*(3-2*u)
   camera.position.fromArray(flight.from.position.map((v,i)=>v+(flight!.to.position[i]-v)*ease));controls.target.fromArray(flight.from.target.map((v,i)=>v+(flight!.to.target[i]-v)*ease));updateControls()
   if(u===1)flight=null
  }
  draw();if(flight)requestDraw()
 }
 function requestDraw(){if(!disposed&&!lost&&!raf)raf=requestAnimationFrame(tick)}
 function cancelFlight(){flight=null;if(raf)cancelAnimationFrame(raf);raf=0}
 function move(pose:Pose,immediate=false){
  cancelFlight();if(reduced||immediate){camera.position.fromArray(pose.position);controls.target.fromArray(pose.target);updateControls();requestDraw()}
  else{flight={start:performance.now(),from:{position:camera.position.toArray(),target:controls.target.toArray()},to:pose};requestDraw()}
 }
 function focus(id:string|null){
  if(disposed||lost)return
  const body=bodies.find(b=>b.id===id);if(id&&!body)return
  selected=id;custom=false;controls.minDistance=body?body.radius/1000*1.15:1
  move(body?focusPose(body):overviewPose())
 }
 function zoom(factor:number){if(disposed||lost||!Number.isFinite(factor)||factor<=0)return;cancelFlight();custom=true;const delta=camera.position.clone().sub(controls.target);delta.setLength(Math.max(controls.minDistance,Math.min(controls.maxDistance,delta.length()*factor)));camera.position.copy(controls.target).add(delta);updateControls();requestDraw()}
 function orbit(angle:number){if(disposed||lost||!Number.isFinite(angle))return;cancelFlight();custom=true;const delta=camera.position.clone().sub(controls.target);delta.applyAxisAngle(camera.up,angle);camera.position.copy(controls.target).add(delta);updateControls();requestDraw()}
 const change=()=>{if(!updating)requestDraw()},start=()=>{cancelFlight();custom=true}
 controls.addEventListener('change',change);controls.addEventListener('start',start)
 function measure(){
  if(disposed)return;bounds=host.getBoundingClientRect();width=Math.max(1,bounds.width);height=Math.max(1,bounds.height)
  const shell=host.closest('.system-shell')??host.parentElement??host
  hud=[...shell.querySelectorAll(hudSelector)].map(e=>{const r=e.getBoundingClientRect();return{left:r.left-bounds.left,right:r.right-bounds.left,top:r.top-bounds.top,bottom:r.bottom-bounds.top}}).filter(r=>r.right>r.left&&r.bottom>r.top)
  viewport=systemViewport(width,height,hud);camera.aspect=width/height;camera.setViewOffset(width,height,viewport.rectangleOffsetX,viewport.rectangleOffsetY,width,height);camera.updateProjectionMatrix();renderer.setSize(width,height)
  for(const body of bodies){body.label.hidden=false;body.width=body.label.offsetWidth||80;body.height=body.label.offsetHeight||32}
  const body=bodies.find(b=>b.id===selected),pose=body?focusPose(body):overviewPose()
  if(flight)flight.to=pose;else if(!custom)move(pose,true)
  requestDraw()
 }
 const resize=new ResizeObserver(measure);resize.observe(host)
 const shell=host.closest('.system-shell')??host.parentElement??host
 const observed=new Set<Element>()
 function watchHud(){for(const element of shell.querySelectorAll(hudSelector))if(!observed.has(element)){observed.add(element);resize.observe(element)}measure()}
 const layout=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n instanceof Element&&(n.matches(hudSelector)||n.querySelector(hudSelector)))))watchHud()})
 layout.observe(shell,{childList:true,subtree:true})
 const down=(e:PointerEvent)=>{press=e.isPrimary?{id:e.pointerId,x:e.clientX,y:e.clientY}:null}
 const up=(e:PointerEvent)=>{if(!press||press.id!==e.pointerId||Math.hypot(e.clientX-press.x,e.clientY-press.y)>5){press=null;return}press=null
  pointer.set((e.clientX-bounds.left)/width*2-1,1-(e.clientY-bounds.top)/height*2);ray.setFromCamera(pointer,camera)
  const hit=ray.intersectObjects(bodies.map(b=>b.mesh))[0],body=bodies.find(b=>b.mesh===hit?.object);if(body)onPick(body.id)
 }
 const cancel=()=>{press=null}
 const key=(e:KeyboardEvent)=>{if(e.key==='+'||e.key==='='){zoom(.8);e.preventDefault()}else if(e.key==='-'){zoom(1.25);e.preventDefault()}else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){orbit(e.key==='ArrowLeft'?-.15:.15);e.preventDefault()}else if(e.key==='Home'){onPick(snapshot.parent.id);e.preventDefault()}}
 const contextLost=(e:Event)=>{e.preventDefault();lost=true;cancelFlight();host.dispatchEvent(new CustomEvent('system-webgl-error',{detail:'Graphics context lost. Retry the system view.'}))}
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('keydown',key);canvas.addEventListener('webglcontextlost',contextLost)
 function update(evaluated:EvaluatedSystem){
  if(disposed||lost)return
  epoch=evaluated.epoch
  const previous=bodies.find(b=>b.id===selected)?.mesh.position.clone()
  for(const body of bodies){const p=body.id===snapshot.parent.id?[0,0,0] as Vec3:evaluated.positions[body.id];if(!p)continue;body.mesh.position.fromArray(sceneVector(p));for(const extra of body.extras)extra.position.copy(body.mesh.position)}
  if(previous){const delta=bodies.find(b=>b.id===selected)!.mesh.position.clone().sub(previous);camera.position.add(delta);controls.target.add(delta)
   if(flight){for(const pose of [flight.from,flight.to]){pose.position=pose.position.map((v,i)=>v+delta.getComponent(i)) as Vec3;pose.target=pose.target.map((v,i)=>v+delta.getComponent(i)) as Vec3}}
  }
  for(const material of materials)material.uniforms.sourceSun.value.fromArray(sceneVector(evaluated.sun))
  updateControls();requestDraw()
 }
 watchHud();update(evaluateSystem(snapshot,Date.parse(snapshot.epoch)))
 // The route handoff approaches a genuine source-centered overview; reduced motion is immediate.
 if(!reduced){const destination=overviewPose();camera.position.fromArray(destination.position.map((v,i)=>destination.target[i]+(v-destination.target[i])*1.45));updateControls();move(destination)}
 return{update,focus,overview:()=>focus(null),zoom,orbit,
  setSizeMode(mode){sizeMode=mode;requestDraw()},setOrbits(show){orbits=show;for(const path of paths)path.visible=show;requestDraw()},
  restoreCamera(value){if(disposed||lost||!validCamera(value,bodies.map(b=>b.id)))return false;selected=value.focus;custom=true;camera.up.fromArray(value.up).normalize();const body=bodies.find(b=>b.id===selected);controls.minDistance=body?body.radius/1000*1.15:1;move({position:sceneVector(value.position),target:sceneVector(value.target)},true);return true},
  diagnostics(){const sorted=[...timings].sort((a,b)=>a-b);return{epoch,frame:snapshot.frame,origin:snapshot.origin,units:'km',sceneUnitKm:1000,selected,sizeMode,orbitsVisible:orbits,renderCount,disposed,contextLost:lost,animating:!!flight,texturesReady,camera:km(camera.position),target:km(controls.target),cameraState:state(),viewport,bodies:bodies.map(b=>{const p=b.mesh.position.clone().project(camera),distance=b.mesh.position.distanceTo(camera.position),r=b.radius/1000*b.mesh.scale.x*height/(2*distance*Math.tan(camera.fov*Math.PI/360));return{id:b.id,position:km(b.mesh.position),radiusKm:b.radius,displayRadiusKm:b.radius*b.mesh.scale.x,screenRadius:r,screen:[bounds.left+(p.x+1)*width/2,bounds.top+(1-p.y)*height/2],inView:p.z>-1&&p.z<1&&Math.abs(p.x)<1&&Math.abs(p.y)<1,labelVisible:!b.label.hidden,markerVisible:!b.marker.hidden}}),drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,renderCpuMs:{samples:sorted.length,median:sorted[Math.floor(sorted.length*.5)]??null,p95:sorted[Math.floor(sorted.length*.95)]??null}}},
  dispose(){if(disposed)return;disposed=true;cancelFlight();resize.disconnect();layout.disconnect();controls.removeEventListener('change',change);controls.removeEventListener('start',start);controls.dispose();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('keydown',key);canvas.removeEventListener('webglcontextlost',contextLost);for(const body of bodies){body.label.onclick=null;body.label.remove();body.marker.remove()}for(const resource of resources)resource.dispose();resources.clear();scene.clear();renderer.dispose();renderer.forceContextLoss();canvas.remove()}
 }
}
