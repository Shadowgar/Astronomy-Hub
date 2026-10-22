import * as T from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import type {SolarSnapshot,BodyId,Vector} from './solarContracts'
import {glyphRadius,overviewPose,overviewUp,focusPose,decorativeStars,focusViewport,qualityBudget,type SolarQuality,type CameraPose} from './solarPresentation'
import {sunMaterial,coronaMaterial,atmosphereMaterial,starsMaterial,earthMaterial,cloudsMaterial,backgroundMaterial,planetMaterial,ringMaterial} from './solarMaterials'

import {aggregateBelt} from './solarBelt'
import {gpuTiming} from './solarGpuTiming'

export type SolarScene={focus:(id:BodyId|null,close?:boolean)=>void;zoom:(factor:number)=>void;orbit:(angle:number)=>void;setOrbits:(visible:boolean)=>void;setEffects:(visible:boolean)=>void;setOverview:(scope:'inner'|'full')=>void;setBelt:(visible:boolean,density:number)=>void;setQuality:(quality:SolarQuality)=>void;diagnostics:()=>unknown;dispose:()=>void}
const colors:Record<BodyId,string>={sun:'#ffbd68',mercury:'#aaa398',venus:'#e7c387',earth:'#8ec5ff',mars:'#ec9466',jupiter:'#d4b191',saturn:'#dfcc9b',uranus:'#8bd8dc',neptune:'#547ed8'}
const earthUrl=new URL('./assets/earth-blue-marble.png',import.meta.url).href
const cloudUrl=new URL('./assets/earth-clouds-2002.jpg',import.meta.url).href
const marsUrl=new URL('./assets/mars-nasa.glb',import.meta.url).href

/** A contained renderer: source geometry is immutable, effects own no science state. */
export function mountSolarScene(host:HTMLElement,snapshot:SolarSnapshot,reduced:boolean,onPick:(id:BodyId)=>void):SolarScene{
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(42,1,.001,500)
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'})
 let quality:SolarQuality='balanced',budget=qualityBudget(quality,devicePixelRatio),pixelRatio=budget.pixelRatio
 const gpu=gpuTiming(renderer.getContext())
 renderer.setClearColor('#02040a');renderer.setPixelRatio(pixelRatio);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0
 renderer.domElement.setAttribute('aria-label','Solar System 3D view. Drag to orbit, pinch or scroll to zoom. Body and camera controls follow.');renderer.domElement.tabIndex=0
 host.append(renderer.domElement);camera.up.set(0,0,1)
 const controls=new OrbitControls(camera,renderer.domElement)
 controls.enableDamping=false;controls.minDistance=.15;controls.maxDistance=180;controls.enablePan=false
 const light=new T.PointLight('#fff5ed',2.8,0,0);scene.add(light);scene.add(new T.AmbientLight('#bac6e0',.045))
 const resources=new Set<{dispose:()=>void}>(),objects:{id:BodyId;mesh:any;label:HTMLButtonElement}[]=[],paths:any[]=[],effects:any[]=[]
 const keep=<A extends {dispose:()=>void}>(r:A):A=>{resources.add(r);return r}
 let overviewScope:'inner'|'full'='inner'
 const overviewAnchors=()=>overviewScope==='full'?snapshot.bodies:snapshot.bodies.filter(b=>Math.hypot(...b.position_au)<2.2)
 let disposed=false,raf=0,renderCount=0,selected:BodyId|null=null,closeView=false,orbitsVisible=true,effectsVisible=true,texturesReady=0,cloudsReady=false,updatingControls=false
 let flight:null|{start:number;from:Vector;targetFrom:Vector;pose:CameraPose}=null,press:null|{x:number;y:number;id:number}=null
 const ray=new T.Raycaster(),pointer=new T.Vector2(),frameTimes:number[]=[]
 function textureFailure(body:string){if(!disposed)host.dispatchEvent(new CustomEvent('solar-asset-error',{detail:`${body} imagery unavailable; showing an untextured body. Positions and navigation remain available.`}))}
 for(const body of snapshot.bodies){
  const radius=glyphRadius[body.source_id],geometry=keep(new T.SphereGeometry(radius,64,40))
  const material=keep(body.source_id==='sun'?sunMaterial():body.source_id==='earth'?earthMaterial():planetMaterial(body.source_id))
  const mesh=new T.Mesh(geometry,material);mesh.position.fromArray(body.position_au);scene.add(mesh)
  // Static presentation orientation. Never claimed as a measured body-fixed frame.
  mesh.rotation.x=Math.PI/2;mesh.rotation.y=body.source_id==='earth'?-.7:.35
  const label=document.createElement('button');label.className='solar-body-label';label.textContent=body.name;label.setAttribute('aria-label',`Select ${body.name} in 3D view`);label.onclick=()=>onPick(body.source_id);host.append(label)
  objects.push({id:body.source_id,mesh,label})
  if(body.source_id==='earth'){
   const texture=keep(new T.TextureLoader().load(earthUrl,(t:any)=>{if(disposed){t.dispose();return}t.colorSpace=T.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());material.uniforms.map.value=t;material.uniforms.hasMap.value=true;texturesReady++;draw()},undefined,()=>textureFailure('Earth')))
   texture.colorSpace=T.SRGBColorSpace
   const cloudMaterial=keep(cloudsMaterial()),clouds=new T.Mesh(keep(new T.SphereGeometry(radius*1.008,64,40)),cloudMaterial)
   clouds.position.copy(mesh.position);clouds.rotation.copy(mesh.rotation);clouds.visible=false;scene.add(clouds);effects.push(clouds)
   const cloudTexture=keep(new T.TextureLoader().load(cloudUrl,(t:any)=>{if(disposed){t.dispose();return}t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());cloudMaterial.uniforms.map.value=t;cloudsReady=true;clouds.visible=effectsVisible;draw()},undefined,()=>{if(!disposed)host.dispatchEvent(new CustomEvent('solar-asset-error',{detail:'Historical cloud imagery unavailable; Earth surface and source positions remain available.'}))}))
   cloudMaterial.uniforms.map.value=cloudTexture
  }
  if(body.source_id==='mars'){
   new GLTFLoader().load(marsUrl,(gltf:any)=>{
    gltf.scene.traverse((node:any)=>{if(!node.isMesh)return
     const loaded=[node.geometry,node.material,...Object.values(node.material).filter((v:any)=>v?.isTexture)] as {dispose:()=>void}[]
     if(disposed){for(const r of loaded)r.dispose();return}
     for(const r of loaded)keep(r)
     // Preserve NASA model's UVs: its map is an atlas, not equirectangular.
     node.geometry.computeBoundingSphere();node.geometry.scale(radius/node.geometry.boundingSphere.radius,radius/node.geometry.boundingSphere.radius,radius/node.geometry.boundingSphere.radius)
     mesh.geometry=node.geometry
     mesh.material=keep(new T.MeshStandardMaterial({map:node.material.map,roughness:.95,metalness:0}))
     texturesReady++;draw()
    })
   },undefined,()=>textureFailure('Mars'))
  }
  if(body.source_id==='saturn'){
   const ring=new T.Mesh(keep(new T.RingGeometry(1.2,2.27,128)),keep(ringMaterial()));ring.scale.setScalar(radius);ring.position.copy(mesh.position);ring.rotation.x=.48;scene.add(ring)
  }
  if(body.source_id==='earth'||body.source_id==='mars'){
   const atmosphere=new T.Mesh(keep(new T.SphereGeometry(radius*(body.source_id==='earth'?1.018:1.01),48,32)),keep(atmosphereMaterial(body.source_id==='earth'?'#5cafff':'#ef9c68',body.source_id==='earth')))
   atmosphere.position.copy(mesh.position);scene.add(atmosphere);effects.push(atmosphere)
  }
  if(body.trajectory.length){
   const g=keep(new T.BufferGeometry().setFromPoints(body.trajectory.map(p=>new T.Vector3(...p.position_au))))
   const m=keep(new T.LineBasicMaterial({color:colors[body.source_id],transparent:true,opacity:.19}))
   const path=new T.Line(g,m);scene.add(path);paths.push(path)
  }
 }
 const beltGeometry=keep(new T.BufferGeometry());beltGeometry.setAttribute('position',new T.Float32BufferAttribute(aggregateBelt(6000),3));beltGeometry.setDrawRange(0,2400)
 const belt=new T.Points(beltGeometry,keep(new T.PointsMaterial({color:'#b8a28a',size:.012,sizeAttenuation:true,transparent:true,opacity:.6,depthWrite:false})));scene.add(belt);let beltVisible=true,beltDensity=2400
 const corona=new T.Mesh(keep(new T.PlaneGeometry(glyphRadius.sun*7,glyphRadius.sun*7)),keep(coronaMaterial()));scene.add(corona);effects.push(corona)
 const stars=decorativeStars(4000),starGeometry=keep(new T.BufferGeometry())
 starGeometry.setAttribute('position',new T.Float32BufferAttribute(stars.positions,3));starGeometry.setAttribute('color',new T.Float32BufferAttribute(stars.colors,3));starGeometry.setAttribute('pointSize',new T.Float32BufferAttribute(stars.sizes,1))
 const backdrop=new T.Mesh(keep(new T.SphereGeometry(110,96,64)),keep(backgroundMaterial()));backdrop.renderOrder=-3;scene.add(backdrop)
 const marker=document.createElement('div');marker.className='solar-selection';marker.setAttribute('aria-hidden','true');marker.hidden=true;host.append(marker)
 const field=new T.Points(starGeometry,keep(starsMaterial(pixelRatio)));field.renderOrder=-2;scene.add(field);effects.push(field)
 function draw(){
  if(disposed)return
  const start=performance.now();renderCount++;corona.quaternion.copy(camera.quaternion);gpu.begin();renderer.render(scene,camera);gpu.end()
  frameTimes.push(performance.now()-start);if(frameTimes.length>180)frameTimes.shift()
  const rect=host.getBoundingClientRect()
  marker.hidden=true
  for(const o of objects){
   const v=o.mesh.position.clone().project(camera),r=glyphRadius[o.id],edge=o.mesh.position.clone().add(new T.Vector3(r,0,0).applyQuaternion(camera.quaternion)).project(camera)
   const pixelRadius=Math.abs(edge.x-v.x)*rect.width/2
   if(o.id===selected&&v.z>-1&&v.z<1){const size=pixelRadius*2+22;marker.hidden=false;Object.assign(marker.style,{left:`${(v.x+1)*rect.width/2-size/2}px`,top:`${(1-v.y)*rect.height/2-size/2}px`,width:`${size}px`,height:`${size}px`})}
   const visible=v.z>-1&&v.z<1&&Math.abs(v.x)<.95&&Math.abs(v.y)<.88
   o.label.hidden=!visible;o.label.style.left=`${Math.min(rect.width-o.label.offsetWidth-10,Math.max(10,(v.x+1)*rect.width/2+pixelRadius+12))}px`;o.label.style.top=`${(1-v.y)*rect.height/2}px`;o.label.style.setProperty('--body-color',colors[o.id]);o.label.setAttribute('aria-pressed',String(o.id===selected))
  }
  // Keep another body's screen label from intercepting the selected globe.
  // All bodies remain selectable through the persistent body controls.
  if(!marker.hidden){const selectedRect=marker.getBoundingClientRect();for(const o of objects){if(o.id===selected||o.label.hidden)continue;const labelRect=o.label.getBoundingClientRect();if(labelRect.left<selectedRect.right&&labelRect.right>selectedRect.left&&labelRect.top<selectedRect.bottom&&labelRect.bottom>selectedRect.top)o.label.hidden=true}}
 }
 function updateControls(){updatingControls=true;controls.update();updatingControls=false}
 function projection(){const {width,height}=host.getBoundingClientRect();if(selected){const v=focusViewport(width,height);camera.setViewOffset(width,height,v.offsetX,v.offsetY,width,height)}else camera.clearViewOffset();camera.updateProjectionMatrix()}
 function cancelFlight(){flight=null;cancelAnimationFrame(raf);raf=0}
 function tick(now:number){if(disposed)return;raf=0;if(flight){const u=Math.min(1,Math.max(0,(now-flight.start)/900)),ease=u*u*(3-2*u);camera.position.fromArray(flight.from).lerp(new T.Vector3(...flight.pose.position),ease);controls.target.fromArray(flight.targetFrom).lerp(new T.Vector3(...flight.pose.target),ease);updateControls();if(u===1)flight=null;else raf=requestAnimationFrame(tick)}draw()}
 function move(pose:CameraPose,immediate=false){cancelFlight();if(reduced||immediate){camera.position.fromArray(pose.position);controls.target.fromArray(pose.target);updateControls();draw()}else{flight={start:performance.now(),from:camera.position.toArray(),targetFrom:controls.target.toArray(),pose};raf=requestAnimationFrame(tick)}}
 function focus(id:BodyId|null,close=false){if(disposed)return;selected=id;closeView=close;projection();controls.minDistance=id?glyphRadius[id]*1.65:.15;const p=snapshot.bodies.find(b=>b.source_id===id)?.position_au;move(id&&p?focusPose(id,p,camera.aspect,close,host.clientHeight):overviewPose(overviewAnchors(),camera.aspect))}
 const change=()=>{if(!updatingControls)draw()},start=()=>cancelFlight();controls.addEventListener('change',change);controls.addEventListener('start',start)
 let initialSize=true,lastAspect=0,lastFramingLimit=Infinity
 const resize=new ResizeObserver(()=>{const{width,height}=host.getBoundingClientRect();if(!width||!height)return
  const aspect=width/height,changedOrientation=(lastAspect<.75)!==(aspect<.75),framingLimit=focusViewport(width,height).maxGlobeRadius
  const compactResize=selected!==null&&(Number.isFinite(framingLimit)||Number.isFinite(lastFramingLimit))
  camera.aspect=aspect;camera.up.fromArray(overviewUp(aspect));projection();renderer.setSize(width,height)
  if(initialSize||changedOrientation||compactResize){const p=snapshot.bodies.find(b=>b.source_id===selected)?.position_au;move(selected&&p?focusPose(selected,p,aspect,closeView,height):overviewPose(overviewAnchors(),aspect),true)}else draw()
  initialSize=false;lastAspect=aspect;lastFramingLimit=framingLimit
 });resize.observe(host)
 const down=(e:PointerEvent)=>{if(e.isPrimary)press={x:e.clientX,y:e.clientY,id:e.pointerId};else press=null}
 const up=(e:PointerEvent)=>{if(!press||press.id!==e.pointerId||Math.hypot(e.clientX-press.x,e.clientY-press.y)>5){press=null;return}press=null;const r=renderer.domElement.getBoundingClientRect();pointer.set(2*(e.clientX-r.left)/r.width-1,1-2*(e.clientY-r.top)/r.height);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(objects.map(o=>o.mesh))[0],found=objects.find(o=>o.mesh===hit?.object);if(found)onPick(found.id)}
 const cancel=()=>{press=null}
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel)
 const contextLost=(e:Event)=>{e.preventDefault();cancelFlight();host.dispatchEvent(new CustomEvent('solar-render-error'))};renderer.domElement.addEventListener('webglcontextlost',contextLost)
 const rect=host.getBoundingClientRect();camera.aspect=rect.width/Math.max(1,rect.height);camera.up.fromArray(overviewUp(camera.aspect));camera.updateProjectionMatrix();renderer.setSize(rect.width,rect.height);move(overviewPose(overviewAnchors(),camera.aspect),true)
 return{
  focus,
  zoom(factor){if(disposed)return;cancelFlight();const delta=camera.position.clone().sub(controls.target),distance=Math.max(controls.minDistance,Math.min(controls.maxDistance,delta.length()*factor));camera.position.copy(controls.target).add(delta.setLength(distance));updateControls();draw()},
  orbit(angle){if(disposed)return;cancelFlight();const delta=camera.position.clone().sub(controls.target);delta.applyAxisAngle(new T.Vector3(0,0,1),angle);camera.position.copy(controls.target).add(delta);updateControls();draw()},
  setOverview(scope){overviewScope=scope;focus(null)},
  setBelt(visible,density){beltVisible=visible;beltDensity=Math.min(6000,Math.max(0,Math.floor(density)));belt.visible=visible;beltGeometry.setDrawRange(0,Math.min(beltDensity,quality==='efficient'?1000:quality==='balanced'?3000:6000));draw()},
  setOrbits(visible){orbitsVisible=visible;for(const p of paths)p.visible=visible;draw()},
  setEffects(visible){effectsVisible=visible;for(const e of effects)e.visible=visible;backdrop.visible=visible&&budget.background;draw()},
  setQuality(value){if(disposed)return;gpu.reset();frameTimes.length=0;quality=value;budget=qualityBudget(quality,devicePixelRatio);pixelRatio=budget.pixelRatio;renderer.setPixelRatio(pixelRatio);field.material.uniforms.pixelRatio.value=pixelRatio;starGeometry.setDrawRange(0,budget.starCount);beltGeometry.setDrawRange(0,Math.min(beltDensity,quality==='efficient'?1000:quality==='balanced'?3000:6000));backdrop.visible=effectsVisible&&budget.background;draw()},
  diagnostics(){const r=renderer.domElement.getBoundingClientRect(),sorted=[...frameTimes].sort((a,b)=>a-b);return{overviewScope,epoch:snapshot.epoch,frame:snapshot.frame,origin:snapshot.origin,units:snapshot.units,selected,renderCount,disposed,animating:!!flight,camera:camera.position.toArray(),target:controls.target.toArray(),bodies:objects.map(o=>{const p=o.mesh.position.clone().project(camera);return{id:o.id,position:o.mesh.position.toArray(),glyphRadius:glyphRadius[o.id],screen:[r.left+(p.x+1)*r.width/2,r.top+(1-p.y)*r.height/2]}}),drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,texturesReady,cloudsReady,quality,backgroundVisible:backdrop.visible,gpuMs:gpu.read(),orbitsVisible,effectsVisible,belt:{visible:beltVisible,requestedDensity:beltDensity,drawCount:beltGeometry.drawRange.count,model:'illustrative aggregate; no identities or precise asteroid ephemerides'},starfield:'illustrative',starCount:budget.starCount,renderCpuMs:{samples:sorted.length,median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)]},pixelRatio}},
  dispose(){if(disposed)return;disposed=true;cancelFlight();resize.disconnect();controls.removeEventListener('change',change);controls.removeEventListener('start',start);controls.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',cancel);renderer.domElement.removeEventListener('webglcontextlost',contextLost);marker.remove();gpu.dispose();for(const o of objects)o.label.remove();for(const r of resources)r.dispose();resources.clear();scene.clear();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}
 }
}
