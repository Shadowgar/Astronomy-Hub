import * as T from 'three'
import {readSolarVisitState,type SolarVisitState} from '../planet/solarVisitState'
import {SolarCameraController,type NavigationMode} from './SolarCameraController'
import {SolarResourceOwner} from './solarAssets'
import {relativeVector,pointOccluded} from './solarPrecision'
import {createSolarTakram} from './solarTakram'
import {earthSurfaceQuaternion} from './solarEarthFrame'
import {createSolarRenderPipeline} from './solarRenderPipeline'
import {SATURN_RING_INNER_RATIO,SATURN_RING_OUTER_RATIO} from './solarRings'
import {setAtmosphereQuality,atmosphereForBody,atmosphereShellRatio} from './solarAtmosphere'
import {solarVisualAsset,solarRingAsset} from './solarVisualAssets'
import {loadSolarSmallBodies,propagateSmallBody,smallBodyEpochAvailable,type SmallBodyPack} from './solarSmallBodies'
import type {SolarSnapshot,BodyId,Vector} from './solarContracts'
import {physicalRadii,cinematicRadius,cinematicOverviewPose,diskBudget,displayScale,presetAnchors,arrangeLabels,cameraTransition,visualRadius,overviewPose,overviewUp,focusPose,decorativeStars,clearViewport,qualityBudget,type SolarSizeMode,type SolarQuality,type SolarPreset,type SolarCameraView,type CameraPose,type ScreenRect} from './solarPresentation'
import {setSolarMaterialLight,sunMaterial,coronaMaterial,atmosphereMaterial,starsMaterial,earthMaterial,cloudsMaterial,backgroundMaterial,planetMaterial,ringMaterial} from './solarMaterials'

import {aggregateBelt} from './solarBelt'
import {gpuTiming} from './solarGpuTiming'

export type SolarObjectId=BodyId|'eros'
export type SolarScene={updateSnapshot:(snapshot:SolarSnapshot,jdTdb?:number,icrfToItrs?:number[]|null)=>void;setAtmosphereMethod:(method:'takram'|'custom')=>void;setAnimation:(callback:((now:number)=>boolean)|null)=>void;setNavigation:(mode:NavigationMode,preserveView?:boolean)=>void;flightInput:(direction:string|null)=>void;setReducedMotion:(value:boolean)=>void;setAsteroids:(visible:boolean)=>void;restoreView:(state:SolarVisitState)=>boolean;focus:(id:SolarObjectId|null,close?:boolean)=>void;zoom:(factor:number)=>void;orbit:(angle:number)=>void;setOrbits:(visible:boolean)=>void;setEffects:(visible:boolean)=>void;setOverview:(scope:SolarPreset)=>void;setSizeMode:(mode:SolarSizeMode)=>void;setBelt:(visible:boolean,density:number)=>void;setQuality:(quality:SolarQuality)=>void;diagnostics:()=>unknown;dispose:()=>void}
const colors:Record<BodyId,string>={sun:'#ffbd68',mercury:'#aaa398',venus:'#e7c387',earth:'#8ec5ff',mars:'#ec9466',jupiter:'#d4b191',saturn:'#dfcc9b',uranus:'#8bd8dc',neptune:'#547ed8'}
const earthUrl=new URL('./assets/earth-blue-marble.png',import.meta.url).href
const cloudUrl=new URL('./assets/earth-clouds-2002.jpg',import.meta.url).href
const marsUrl=new URL('./assets/mars-nasa.glb',import.meta.url).href

/** A contained renderer: source geometry is immutable, effects own no science state. */
export function mountSolarScene(host:HTMLElement,snapshot:SolarSnapshot,reduced:boolean,onPick:(id:SolarObjectId)=>void,onView:(view:SolarCameraView)=>void=()=>{},onNavigation:(mode:NavigationMode)=>void=()=>{}):SolarScene{
 const glyphRadius=physicalRadii(snapshot)
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(42,1,.001,2000),viewCamera=new T.PerspectiveCamera()
 const assets=new SolarResourceOwner(),instanceId=crypto.randomUUID()
 let icrfToItrs:number[]|null=null,atmosphereMethod:'takram'|'custom'='takram'
 let jdTdb=NaN,pathSourceEpoch=snapshot.epoch
 let smallPack:SmallBodyPack|null=null,asteroidsVisible=false,smallAvailable=false,pendingErosFocus=false,notifiedSmallAvailable:boolean|null=null,smallPosition:[number,number,number]|null=null
 let animate:((now:number)=>boolean)|null=null,inFrame=false,frameIntervals:number[]=[],lastFrame=0
 const positions=()=>snapshot.bodies.map(b=>({position:b.position_au,radius:glyphRadius[b.source_id],clearanceAU:b.source_id==='earth'?1000/(snapshot.km_per_au*1000):undefined})).concat(smallPosition?[{position:smallPosition,radius:glyphRadius.eros,clearanceAU:undefined}]:[])
 const sourcePosition=(id:string)=>id==='eros'?smallPosition:snapshot.bodies.find(b=>b.source_id===id)?.position_au
 const request=()=>{if(!disposed&&!raf)raf=requestAnimationFrame(tick)}
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',logarithmicDepthBuffer:true})
 let quality:SolarQuality='balanced',budget=qualityBudget(quality,devicePixelRatio),pixelRatio=budget.pixelRatio
 const gpu=gpuTiming(renderer.getContext())
 renderer.setClearColor('#02040a');renderer.setPixelRatio(pixelRatio);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0
 renderer.domElement.setAttribute('aria-label','Solar System 3D view. Drag to orbit, pinch or scroll to zoom. Body and camera controls follow.');renderer.domElement.tabIndex=0
 host.append(renderer.domElement);camera.up.set(0,0,1)
 const navigator=new SolarCameraController(camera,renderer.domElement,positions,request,()=>setView('custom'),onNavigation),controls=navigator.controls
 navigator.setReduced(reduced)
 const pipeline=createSolarRenderPipeline(renderer,scene,viewCamera)
 const light=new T.PointLight('#fff5ed',2.8,0,0);scene.add(light);scene.add(new T.AmbientLight('#bac6e0',.045))
 const resources=new Set<{dispose:()=>void}>(),objects:{id:SolarObjectId;mesh:any;label:HTMLButtonElement;anchor:HTMLSpanElement;leader:SVGLineElement;extras:any[]}[]=[],paths:any[]=[],effects:any[]=[]
 const keep=<A extends {dispose:()=>void}>(r:A):A=>{resources.add(r);return r}
 let sizeMode:SolarSizeMode='cinematic'
 let overviewScope:SolarPreset='inner',cameraView:SolarCameraView='inner',restingMinimum=.001,restingNear=.001
 const overviewAnchors=()=>presetAnchors(snapshot.bodies,overviewScope)
 const setView=(view:SolarCameraView)=>{cameraView=view;onView(view)}
 const leaders=document.createElementNS('http://www.w3.org/2000/svg','svg');leaders.classList.add('solar-leaders');leaders.setAttribute('aria-hidden','true');host.append(leaders)
 let disposed=false,raf=0,renderCount=0,selected:SolarObjectId|null=null,closeView=false,orbitsVisible=true,effectsVisible=false,texturesReady=0,cloudsReady=false,updatingControls=false
 const takram=createSolarTakram(renderer,viewCamera,{requestFrame:request,onStatus:status=>host.dispatchEvent(new CustomEvent('solar-atmosphere-status',{detail:status}))})
 pipeline.setAtmospherePass(takram.pass);pipeline.setSceneUnitsPerAU(snapshot.km_per_au*1000)
 let press:null|{x:number;y:number;id:number}=null
 const vFinite=(v:{x:number;y:number;z:number})=>Number.isFinite(v.x)&&Number.isFinite(v.y)&&v.z>-1&&v.z<1
 const ray=new T.Raycaster(),pointer=new T.Vector2(),frameTimes:number[]=[]
 function textureFailure(body:string){if(!disposed)host.dispatchEvent(new CustomEvent('solar-asset-error',{detail:`${body} imagery unavailable; showing an untextured body. Positions and navigation remain available.`}))}
 function loadBodyModel(object:typeof objects[number],url:string,radius:number){
  void assets.model(url,2048).then(gltf=>{
   if(disposed)return
   gltf.scene.updateMatrixWorld(true);let node:any=null
   gltf.scene.traverse((n:any)=>{if(n.isMesh&&!node)node=n})
   if(!node)throw Error('Model has no body mesh.')
   const geometry=keep(node.geometry.clone());geometry.applyMatrix4(node.matrixWorld);geometry.computeBoundingSphere()
   const center=geometry.boundingSphere.center.clone(),scale=radius/geometry.boundingSphere.radius
   geometry.translate(-center.x,-center.y,-center.z);geometry.scale(scale,scale,scale)
   // The qualified contract is a mean-radius sphere, not an oblate shape model.
   // Retain original source UVs while projecting planetary vertices onto it.
   if(object.id!=='eros'){
    const vertices=geometry.attributes.position
    for(let i=0;i<vertices.count;i++){const v=new T.Vector3().fromBufferAttribute(vertices,i).normalize().multiplyScalar(radius);vertices.setXYZ(i,v.x,v.y,v.z)}
    vertices.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingSphere()
   }
   object.mesh.geometry=geometry
   if(object.id==='mars'||object.id==='eros')object.mesh.material=keep(new T.MeshStandardMaterial({map:node.material.map,roughness:.93,metalness:0}))
   else{object.mesh.material.uniforms.map.value=node.material.map;object.mesh.material.uniforms.hasMap.value=!!node.material.map}
   object.mesh.userData.visualSource=url;texturesReady++;request()
  }).catch(()=>textureFailure(object.id))
 }
 for(const body of snapshot.bodies){
  const radius=glyphRadius[body.source_id],geometry=keep(new T.SphereGeometry(radius,body.source_id==='earth'?256:64,body.source_id==='earth'?128:40))
  const material=keep(body.source_id==='sun'?sunMaterial():body.source_id==='earth'?earthMaterial():planetMaterial(body.source_id))
  const mesh=new T.Mesh(geometry,material);mesh.position.fromArray(body.position_au);scene.add(mesh)
  // Static presentation orientation. Never claimed as a measured body-fixed frame.
  mesh.rotation.x=Math.PI/2+(body.source_id==='saturn'?.48:0);mesh.rotation.y=body.source_id==='earth'?-.7:.35
  const label=document.createElement('button');label.className='solar-body-label';label.textContent=body.name;label.setAttribute('aria-label',`Select ${body.name} in 3D view`);label.onclick=()=>onPick(body.source_id);host.append(label)
  const anchor=document.createElement('span');anchor.className='solar-position-marker';anchor.setAttribute('aria-hidden','true');anchor.style.setProperty('--body-color',colors[body.source_id]);host.append(anchor)
  const leader=document.createElementNS('http://www.w3.org/2000/svg','line');leader.setAttribute('stroke',colors[body.source_id]);leaders.append(leader)
  label.style.left='0';label.style.top='0'
  const object={id:body.source_id,mesh,label,anchor,leader,extras:[] as any[]};objects.push(object)
  if(body.source_id==='earth'){
   void assets.texture(earthUrl,2048).then(t=>{if(disposed)return;material.uniforms.map.value=t;material.uniforms.hasMap.value=true;texturesReady++;request()}).catch(()=>textureFailure('Earth'))
   const cloudMaterial=keep(cloudsMaterial()),clouds=new T.Mesh(keep(new T.SphereGeometry(radius*1.008,256,128)),cloudMaterial)
   clouds.position.copy(mesh.position);clouds.rotation.copy(mesh.rotation);clouds.userData.clouds=true;scene.add(clouds);effects.push(clouds);object.extras.push(clouds)
   void assets.texture(cloudUrl,2048,false).then(t=>{if(disposed)return;cloudMaterial.uniforms.map.value=t;material.uniforms.cloudMap.value=t;material.uniforms.hasCloudMap.value=effectsVisible;cloudsReady=true;clouds.visible=effectsVisible;request()}).catch(()=>textureFailure('Cloud'))
  }
  const visual=solarVisualAsset(body.source_id)
  if(body.source_id==='mars'||visual)loadBodyModel(object,body.source_id==='mars'?marsUrl:visual!.url,radius)
  if(body.source_id==='saturn'){
   const ring=new T.Mesh(keep(new T.RingGeometry(SATURN_RING_INNER_RATIO,SATURN_RING_OUTER_RATIO,256)),keep(ringMaterial()));ring.scale.setScalar(radius);ring.position.copy(mesh.position);ring.rotation.x=.48;scene.add(ring);ring.userData.baseScale=radius;object.extras.push(ring)
   void assets.texture(solarRingAsset.url,4096).then(t=>{if(disposed)return;ring.material.uniforms.radialMap.value=t;ring.material.uniforms.hasRadialMap.value=true;ring.material.uniforms.mapInner.value=solarRingAsset.innerEquatorialRadiusRatio*60268/58232;ring.material.uniforms.mapOuter.value=solarRingAsset.outerEquatorialRadiusRatio*60268/58232;request()}).catch(()=>textureFailure('Saturn rings'))
  }
  if(atmosphereShellRatio(body.source_id)){
   const atmosphere=new T.Mesh(keep(new T.SphereGeometry(radius*atmosphereShellRatio(body.source_id)!,48,32)),keep(atmosphereForBody(body.source_id)!))
   atmosphere.userData.atmosphere=true;atmosphere.position.copy(mesh.position);scene.add(atmosphere);effects.push(atmosphere);object.extras.push(atmosphere)
  }
  if(body.source_id!=='sun'){
   const g=keep(new T.BufferGeometry());g.setAttribute('position',new T.BufferAttribute(new Float32Array(129*3),3));g.setDrawRange(0,body.trajectory.length)
   const m=keep(new T.LineBasicMaterial({color:colors[body.source_id],transparent:true,opacity:.19}))
   const path=new T.Line(g,m);path.userData.id=body.source_id;path.userData.trajectory=body.trajectory;path.userData.source=body.trajectory.map(p=>p.position_au);path.frustumCulled=false;scene.add(path);paths.push(path)
  }
 }
 const beltGeometry=keep(new T.BufferGeometry());beltGeometry.setAttribute('position',new T.Float32BufferAttribute(aggregateBelt(6000),3));beltGeometry.setDrawRange(0,2400)
 const belt=new T.Points(beltGeometry,keep(new T.PointsMaterial({color:'#b8a28a',size:.012,sizeAttenuation:true,transparent:true,opacity:.6,depthWrite:false})));scene.add(belt);let beltVisible=false,beltDensity=2400;belt.visible=false
 const smallGeometry=keep(new T.BufferGeometry()),smallArray=new Float32Array(2048*3)
 smallGeometry.setAttribute('position',new T.BufferAttribute(smallArray,3))
 const smallPoints=new T.Points(smallGeometry,keep(new T.PointsMaterial({color:'#d4c6ac',size:1.6,sizeAttenuation:false,transparent:true,opacity:.65,depthWrite:false})))
 smallPoints.frustumCulled=false;smallPoints.visible=false;scene.add(smallPoints)
 void loadSolarSmallBodies(assets.signal).then(pack=>{
  if(disposed)return;smallPack=pack;const eros=pack.bodies.find(b=>b.designation==='433')!
  glyphRadius.eros=eros.diameter_km/2/snapshot.km_per_au
  const mesh=new T.Mesh(keep(new T.SphereGeometry(glyphRadius.eros,32,24)),keep(new T.MeshStandardMaterial({color:'#a79782',roughness:.93})))
  const label=document.createElement('button');label.className='solar-body-label';label.textContent='433 Eros';label.setAttribute('aria-label','Select 433 Eros in 3D view');label.onclick=()=>onPick('eros');host.append(label)
  const anchor=document.createElement('span');anchor.className='solar-position-marker';anchor.setAttribute('aria-hidden','true');host.append(anchor)
  const leader=document.createElementNS('http://www.w3.org/2000/svg','line');leader.setAttribute('stroke','#cfbea5');leaders.append(leader)
  const object={id:'eros' as const,mesh,label,anchor,leader,extras:[]};objects.push(object);scene.add(mesh)
  loadBodyModel(object,solarVisualAsset('eros')!.url,glyphRadius.eros);measureLabels();request()
 }).catch(()=>{if(!disposed)host.dispatchEvent(new CustomEvent('solar-asset-error',{detail:'Asteroid source unavailable. Planetary positions remain available.'}))})
 const corona=new T.Mesh(keep(new T.PlaneGeometry(glyphRadius.sun*7,glyphRadius.sun*7)),keep(coronaMaterial()));scene.add(corona);effects.push(corona)
 const stars=decorativeStars(4000),starGeometry=keep(new T.BufferGeometry())
 starGeometry.setAttribute('position',new T.Float32BufferAttribute(stars.positions,3));starGeometry.setAttribute('color',new T.Float32BufferAttribute(stars.colors,3));starGeometry.setAttribute('pointSize',new T.Float32BufferAttribute(stars.sizes,1))
 const backdrop=new T.Mesh(keep(new T.SphereGeometry(110,96,64)),keep(backgroundMaterial()));backdrop.renderOrder=-3;scene.add(backdrop)
 const marker=document.createElement('div');marker.className='solar-selection';marker.setAttribute('aria-hidden','true');marker.hidden=true;host.append(marker)
 const field=new T.Points(starGeometry,keep(starsMaterial(pixelRatio)));field.renderOrder=-2;scene.add(field);effects.push(field)
 function hudRects(){const bounds=host.getBoundingClientRect();return [...host.closest('.solar-shell')!.querySelectorAll('.solar-header,.solar-destinations>summary,.solar-view-tools,.solar-context,.solar-camera,.solar-time-bar,.solar-caption')].map(e=>{const r=e.getBoundingClientRect();return{left:r.left-bounds.left,right:r.right-bounds.left,top:r.top-bounds.top,bottom:r.bottom-bounds.top}}).filter(r=>r.right>r.left&&r.bottom>r.top)}
 let cachedHud:ScreenRect[]=[],labelMetrics=new Map<SolarObjectId,{width:number;height:number}>()
 function measureLabels(){for(const o of objects)o.label.hidden=false;for(const o of objects)labelMetrics.set(o.id,{width:o.label.offsetWidth,height:o.label.offsetHeight})}
 const viewport=()=>{cachedHud=hudRects();return clearViewport(host.clientWidth,host.clientHeight,cachedHud)}
 const overlaps=(a:ScreenRect,b:ScreenRect)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top
 function draw(){
  if(disposed)return
  const start=performance.now(),rect=host.getBoundingClientRect();renderCount++
  camera.updateMatrixWorld();viewCamera.copy(camera);viewCamera.position.set(0,0,0);viewCamera.updateMatrixWorld()
  const origin=camera.position.toArray() as Vector,sun=snapshot.bodies.find(b=>b.source_id==='sun')!.position_au
  smallAvailable=!!smallPack&&smallBodyEpochAvailable(smallPack,jdTdb)
  if(smallAvailable!==notifiedSmallAvailable){notifiedSmallAvailable=smallAvailable;host.dispatchEvent(new CustomEvent('solar-small-bodies-status',{detail:smallAvailable}))}
  if(smallPack&&smallAvailable){
   smallPosition=propagateSmallBody(smallPack.bodies.find(b=>b.designation==='433')!,jdTdb)
   if(selected==='eros'&&pendingErosFocus){pendingErosFocus=false;queueMicrotask(()=>{if(!disposed)focus('eros')})}
   if(asteroidsVisible){let i=0;for(const body of smallPack.bodies){if(body.population!=='main-belt-subset')continue;smallArray.set(relativeVector(propagateSmallBody(body,jdTdb),origin),i++*3)}smallGeometry.attributes.position.needsUpdate=true}
  }else smallPosition=null
  smallPoints.visible=asteroidsVisible&&smallAvailable
  for(const object of objects){
   const source=sourcePosition(object.id);object.mesh.visible=!!source
   if(!source)continue
   if(object.id==='earth'&&icrfToItrs){object.mesh.quaternion.copy(earthSurfaceQuaternion(icrfToItrs));for(const extra of object.extras)if(extra.userData.clouds)extra.quaternion.copy(object.mesh.quaternion)}
   object.mesh.position.fromArray(relativeVector(source,origin));setSolarMaterialLight(object.mesh.material,source,sun)
   for(const extra of object.extras){extra.position.copy(object.mesh.position);setSolarMaterialLight(extra.material,source,sun)}
  }
  for(let i=0;i<paths.length;i++){
   const values=paths[i].userData.source as Vector[]|undefined
   if(values){const a=paths[i].geometry.attributes.position;for(let j=0;j<values.length;j++)a.setXYZ(j,...relativeVector(values[j],origin));a.needsUpdate=true}
  }
  belt.position.fromArray(origin.map(n=>-n));light.position.fromArray(relativeVector(sun,origin));corona.position.copy(light.position)

  const anchors=objects.map(o=>{const v=o.mesh.position.clone().project(viewCamera),edge=o.mesh.position.clone().add(new T.Vector3(visualRadius(glyphRadius,o.id),0,0).applyQuaternion(camera.quaternion)).project(viewCamera);return{o,v,x:(v.x+1)*rect.width/2,y:(1-v.y)*rect.height/2,physicalPixels:Math.abs(edge.x-v.x)*rect.width/2}})
  const sunDistance=objects[0].mesh.position.distanceTo(viewCamera.position)
  const desired=(id:SolarObjectId)=>{const body=objects.find(o=>o.id===id)!,perspective=Math.min(1,Math.pow(sunDistance/Math.max(1e-15,body.mesh.position.distanceTo(viewCamera.position)),.65));return cinematicRadius(id,rect.width,rect.height)*perspective}
  for(const a of anchors){
   const neighbors=anchors.filter(b=>b!==a&&vFinite(b.v)).map(b=>({distance:Math.hypot(a.x-b.x,a.y-b.y),desired:desired(b.o.id)}))
   const hudClearance=cachedHud.map(o=>Math.max(o.left-a.x,a.x-o.right,o.top-a.y,a.y-o.bottom))
   const edge=Math.max(0,Math.min(a.x,rect.width-a.x,a.y,rect.height-a.y,...(a.o.id==='sun'?[]:hudClearance))-12),budget=diskBudget(desired(a.o.id),neighbors,edge)
   const scale=vFinite(a.v)?displayScale(selected?'physical':sizeMode,a.physicalPixels,budget,Infinity):1
   a.o.mesh.scale.setScalar(scale);for(const extra of a.o.extras)extra.scale.setScalar(scale*(extra.userData.baseScale||1))
  }
  const earth=objects.find(o=>o.id==='earth')!
  takram.setEnabled(effectsVisible&&atmosphereMethod==='takram')
  takram.updateFrame({cameraPositionAU:origin,earthPositionAU:sourcePosition('earth')!,sunPositionAU:sun,icrfToItrs:icrfToItrs||[],kmPerAu:snapshot.km_per_au,earthRadiusM:glyphRadius.earth*snapshot.km_per_au*1000,physicalScale:earth.mesh.scale.x,frameAvailable:!!icrfToItrs,sceneUnitsPerAU:snapshot.km_per_au*1000})
  const active=takram.diagnostics().active
  for(const extra of earth.extras){if(extra.userData.atmosphere)extra.visible=effectsVisible&&quality!=='efficient'&&!active;if(extra.userData.clouds)extra.visible=effectsVisible&&cloudsReady&&earth.mesh.position.length()>glyphRadius.earth*earth.mesh.scale.x*1.008}
  earth.mesh.material.uniforms.customAtmosphere.value=!active
  corona.scale.setScalar(objects[0].mesh.scale.x);corona.quaternion.copy(camera.quaternion);gpu.begin();pipeline.render();gpu.end()
  marker.hidden=true
  const occluded=(object:typeof objects[number])=>pointOccluded(object.mesh.position.toArray(),objects.filter(o=>o!==object&&o.mesh.visible).map(o=>({position:o.mesh.position.toArray(),radius:glyphRadius[o.id]*o.mesh.scale.x})))
  const projected=objects.map(o=>{const v=o.mesh.position.clone().project(viewCamera),edge=o.mesh.position.clone().add(new T.Vector3(visualRadius(glyphRadius,o.id)*o.mesh.scale.x,0,0).applyQuaternion(camera.quaternion)).project(viewCamera);return{o,v,x:(v.x+1)*rect.width/2,y:(1-v.y)*rect.height/2,radius:Math.abs(edge.x-v.x)*rect.width/2}})
  const occupied:ScreenRect[]=cachedHud.map(r=>({left:r.left-6,right:r.right+6,top:r.top-6,bottom:r.bottom+6}))
  const bodies=projected.filter(p=>p.o.mesh.visible&&p.v.z>-1&&p.v.z<1).map(p=>{const pad=p.o.id===selected?12:4;return{left:p.x-p.radius-pad,right:p.x+p.radius+pad,top:p.y-p.radius-pad,bottom:p.y+p.radius+pad}})
  const labels=projected.filter(({o,v})=>o.mesh.visible&&!occluded(o)&&v.z>-1&&v.z<1&&Math.abs(v.x)<.95&&Math.abs(v.y)<.88).sort((a,b)=>b.o.mesh.position.lengthSq()-a.o.mesh.position.lengthSq()).map(({o,x,y,radius})=>{return{id:o.id,x,y,radius,...labelMetrics.get(o.id)!}})
  const placements=arrangeLabels(labels,rect.width,rect.height,[...occupied,...bodies],selected)
  for(const {o,v,x,y,radius} of [...projected].sort((a,b)=>Number(b.o.id===selected)-Number(a.o.id===selected)||b.o.mesh.position.lengthSq()-a.o.mesh.position.lengthSq())){
   const r=glyphRadius[o.id]*o.mesh.scale.x,edge=o.mesh.position.clone().add(new T.Vector3(r,0,0).applyQuaternion(camera.quaternion)).project(viewCamera)
   const pixelRadius=Math.abs(edge.x-v.x)*rect.width/2
   if(o.id===selected&&v.z>-1&&v.z<1){const size=pixelRadius*2+22;marker.hidden=false;Object.assign(marker.style,{left:`${(v.x+1)*rect.width/2-size/2}px`,top:`${(1-v.y)*rect.height/2-size/2}px`,width:`${size}px`,height:`${size}px`})}
   const visible=o.mesh.visible&&!occluded(o)&&v.z>-1&&v.z<1&&Math.abs(v.x)<.95&&Math.abs(v.y)<.88
   o.label.hidden=!visible;o.anchor.hidden=!visible||pixelRadius>=3;o.leader.style.display='none';if(!visible)continue
   Object.assign(o.anchor.style,{left:`${x}px`,top:`${y}px`})
   const{width:w,height:h}=labelMetrics.get(o.id)!
   const spot=placements.get(o.id)
   o.label.hidden=!spot
   if(spot){const[left,top]=spot;o.label.style.transform=`translate3d(${left}px,${top}px,0)`
    const endX=Math.max(left,Math.min(left+w,x)),endY=Math.max(top,Math.min(top+h,y)),length=Math.hypot(endX-x,endY-y),start=Math.min(radius,length)
    o.leader.setAttribute('x1',String(x+(endX-x)*start/Math.max(1,length)));o.leader.setAttribute('y1',String(y+(endY-y)*start/Math.max(1,length)));o.leader.setAttribute('x2',String(endX));o.leader.setAttribute('y2',String(endY));o.leader.style.display=''
   }
   o.label.style.setProperty('--body-color',colors[o.id as BodyId]||'#cfbea5');o.label.setAttribute('aria-pressed',String(o.id===selected))
  }
  // Keep another body's screen label from intercepting the selected globe.
  // All bodies remain selectable through the persistent body controls.
  if(!marker.hidden){const p=projected.find(p=>p.o.id===selected)!,r=p.radius+12,selectedRect={left:p.x-r,right:p.x+r,top:p.y-r,bottom:p.y+r};for(const o of objects){if(o.id===selected||o.label.hidden)continue;const spot=placements.get(o.id);if(!spot)continue;const m=labelMetrics.get(o.id)!,labelRect={left:spot[0],right:spot[0]+m.width,top:spot[1],bottom:spot[1]+m.height};if(overlaps(labelRect,selectedRect)){o.label.hidden=true;o.leader.style.display='none'}}}
  frameTimes.push(performance.now()-start);if(frameTimes.length>180)frameTimes.shift()
 }
 function updateControls(){navigator.updateControls()}
 function projection(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;const v=viewport();camera.setViewOffset(width,height,sizeMode==='cinematic'&&!selected?v.rectangleOffsetX:v.offsetX,sizeMode==='cinematic'&&!selected?v.rectangleOffsetY:v.offsetY,width,height);camera.updateProjectionMatrix()}
 function cancelFlight(){navigator.cancel()}
 function tick(now:number){
  if(disposed)return;raf=0;inFrame=true
  if(lastFrame&&now-lastFrame<5000){frameIntervals.push(now-lastFrame);if(frameIntervals.length>240)frameIntervals.shift()}lastFrame=now
  const running=animate?.(now)||false,moving=navigator.tick(now);draw();inFrame=false
  if(running||moving)request()
 }
 function move(pose:CameraPose,immediate=false){navigator.move(pose,restingNear,restingMinimum,immediate)}
 function systemPose(aspect:number,height:number){
  return sizeMode==='cinematic'?cinematicOverviewPose(glyphRadius,overviewAnchors(),aspect,height,viewport()):overviewPose(glyphRadius,overviewAnchors(),aspect,height,viewport(),false)
 }
 function focus(id:SolarObjectId|null,close=false){if(disposed)return;pendingErosFocus=id==='eros'&&!smallPosition;if(id==='eros'&&!smallPosition){selected=id;request();return}selected=id;closeView=close;setView(id?'body':overviewScope);restingNear=id==='earth'?100/(snapshot.km_per_au*1000):id?glyphRadius[id]*.02:.001;projection();restingMinimum=id==='earth'?glyphRadius.earth+1000/(snapshot.km_per_au*1000):id?visualRadius(glyphRadius,id)*1.1:.001;const p=id?sourcePosition(id):null;if(id&&!p){request();return}move(id&&p?focusPose(glyphRadius,id,p,camera.aspect,close,host.clientHeight,viewport()):systemPose(camera.aspect,host.clientHeight))}
 const resize=new ResizeObserver(()=>{const{width,height}=host.getBoundingClientRect();if(!width||!height)return
  const aspect=width/height
  measureLabels();camera.aspect=aspect;if(cameraView!=='custom')camera.up.fromArray(overviewUp(aspect));projection();renderer.setSize(width,height);pipeline.resize(width,height,pixelRatio)
  if(cameraView==='custom'||selected){request();return}
  const p=snapshot.bodies.find(b=>b.source_id===selected)?.position_au,pose=selected&&p?focusPose(glyphRadius,selected,p,aspect,closeView,height,viewport()):systemPose(aspect,height)
  // HUD insertion/reflow may change the fit during an approach. Preserve its
  // original clock and interpolation; only replace the destination camera pose.
  if(!navigator.animating)move(pose,true);else request()
 });resize.observe(host)
 const watchHud=()=>{for(const e of host.closest('.solar-shell')!.querySelectorAll('.solar-header,.solar-destinations>summary,.solar-view-tools,.solar-context,.solar-camera,.solar-time-bar'))resize.observe(e)};watchHud()
 const layout=new MutationObserver(()=>watchHud());layout.observe(host.closest('.solar-shell')!,{childList:true,subtree:true})
 const down=(e:PointerEvent)=>{if(e.isPrimary)press={x:e.clientX,y:e.clientY,id:e.pointerId};else press=null}
 const up=(e:PointerEvent)=>{if(!press||press.id!==e.pointerId||Math.hypot(e.clientX-press.x,e.clientY-press.y)>5){press=null;return}press=null;const r=renderer.domElement.getBoundingClientRect();pointer.set(2*(e.clientX-r.left)/r.width-1,1-2*(e.clientY-r.top)/r.height);ray.setFromCamera(pointer,viewCamera);const hit=ray.intersectObjects(objects.filter(o=>o.mesh.visible).map(o=>o.mesh))[0],found=objects.find(o=>o.mesh===hit?.object);if(found)onPick(found.id)}
 const cancel=()=>{press=null}
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',cancel)
 const contextLost=(e:Event)=>{e.preventDefault();cancelFlight();host.dispatchEvent(new CustomEvent('solar-render-error'))};renderer.domElement.addEventListener('webglcontextlost',contextLost)
 measureLabels();const rect=host.getBoundingClientRect();camera.aspect=rect.width/Math.max(1,rect.height);camera.up.fromArray(overviewUp(camera.aspect));camera.updateProjectionMatrix();renderer.setSize(rect.width,rect.height);pipeline.resize(rect.width,rect.height,pixelRatio);projection();move(systemPose(camera.aspect,host.clientHeight),true)
 return{
  focus,
  setAtmosphereMethod(method){atmosphereMethod=method;request()},
  updateSnapshot(next,jd,rotation){
   if(disposed)return
   if(next.source.sha256!==snapshot.source.sha256||next.frame!==snapshot.frame||next.origin!==snapshot.origin)throw Error('Solar source changed during playback.')
   const previous=selected?sourcePosition(selected):null
   for(const path of paths){const body=next.bodies.find(b=>b.source_id===path.userData.id);if(body&&body.trajectory!==path.userData.trajectory){pathSourceEpoch=next.epoch;path.userData.trajectory=body.trajectory;path.userData.source=body.trajectory.map(p=>p.position_au);path.geometry.setDrawRange(0,body.trajectory.length)}}
   snapshot=next;jdTdb=jd??NaN;icrfToItrs=rotation??null
   if(selected==='eros'&&smallPack&&smallBodyEpochAvailable(smallPack,jdTdb))smallPosition=propagateSmallBody(smallPack.bodies.find(b=>b.designation==='433')!,jdTdb)
   const current=selected?sourcePosition(selected):null
   if(previous&&current)navigator.follow(relativeVector(current,previous))
   if(!inFrame)request()
  },
  setAnimation(callback){animate=callback;request()},
  setNavigation(mode,preserveView=false){navigator.setMode(mode);if(!preserveView)setView(mode==='free'?'custom':selected?'body':overviewScope)},
  flightInput(direction){navigator.press(direction)},
  setReducedMotion(value){navigator.setReduced(value)},
  setAsteroids(visible){asteroidsVisible=visible;request()},
  restoreView(value){const saved=readSolarVisitState(value,snapshot.epoch);if(disposed||!saved)return false;pendingErosFocus=false;cancelFlight();closeView=saved.closeView;restingNear=saved.near;restingMinimum=Math.min(restingMinimum,Math.hypot(...saved.camera.map((n,i)=>n-saved.target[i]))*.1);camera.up.fromArray(saved.cameraUp);camera.near=saved.near;camera.updateProjectionMatrix();setView(saved.cameraView);move({position:saved.camera,target:saved.target},true);return true},
  zoom(factor){if(!disposed)navigator.zoom(factor)},
  orbit(angle){if(!disposed)navigator.orbit(angle)},
  setSizeMode(mode){sizeMode=mode;draw()},
  setOverview(scope){overviewScope=scope;focus(null)},
  setBelt(visible,density){beltVisible=visible;beltDensity=Math.min(6000,Math.max(0,Math.floor(density)));belt.visible=visible;beltGeometry.setDrawRange(0,Math.min(beltDensity,quality==='efficient'?1000:quality==='balanced'?3000:6000));draw()},
  setOrbits(visible){orbitsVisible=visible;for(const p of paths)p.visible=visible;draw()},
  setEffects(visible){effectsVisible=visible;const earth=objects.find(o=>o.id==='earth');if(earth)earth.mesh.material.uniforms.hasCloudMap.value=visible&&cloudsReady;pipeline.setEffects(visible);for(const e of effects)e.visible=visible;backdrop.visible=visible&&budget.background;draw()},
  setQuality(value){if(disposed)return;gpu.reset();frameTimes.length=0;quality=value;budget=qualityBudget(quality,devicePixelRatio);pixelRatio=budget.pixelRatio;renderer.setPixelRatio(pixelRatio);pipeline.setQuality(value);takram.setQuality(value);pipeline.resize(host.clientWidth,host.clientHeight,pixelRatio);for(const o of objects)for(const e of o.extras)setAtmosphereQuality(e.material,value);field.material.uniforms.pixelRatio.value=pixelRatio;starGeometry.setDrawRange(0,budget.starCount);beltGeometry.setDrawRange(0,Math.min(beltDensity,quality==='efficient'?1000:quality==='balanced'?3000:6000));backdrop.visible=effectsVisible&&budget.background;draw()},
  diagnostics(){const r=renderer.domElement.getBoundingClientRect(),sorted=[...frameTimes].sort((a,b)=>a-b);return{instanceId,navigation:navigator.mode,precision:'camera-relative CPU64/GPU32',assets:assets.diagnostics(),pipeline:pipeline.diagnostics(),atmosphere:{method:atmosphereMethod,...takram.diagnostics()},earthOrientation:{frame:icrfToItrs?'ITRS':'unavailable',icrfToItrs},frameIntervalsMs:{samples:frameIntervals.length,median:[...frameIntervals].sort((a,b)=>a-b)[Math.floor(frameIntervals.length*.5)],p95:[...frameIntervals].sort((a,b)=>a-b)[Math.floor(frameIntervals.length*.95)]},trajectoryEpoch:pathSourceEpoch,trajectoryPoints:paths.map(p=>({id:p.userData.id,first:p.userData.trajectory[0]?.epoch,last:p.userData.trajectory.at(-1)?.epoch,count:p.geometry.drawRange.count})),asteroids:{visible:asteroidsVisible,available:smallAvailable,count:smallPoints.visible?2048:0,source:smallPack?.sources,model:smallPack?.model},overviewScope,cameraView,closeView,sizeMode,scale:sizeMode==='physical'?'physical-mean-radii-AU':'independently-enlarged-display-radii',near:camera.near,cameraUp:camera.up.toArray(),cameraQuaternion:camera.quaternion.toArray(),epoch:snapshot.epoch,frame:snapshot.frame,origin:snapshot.origin,units:snapshot.units,selected,renderCount,disposed,animating:navigator.animating,camera:camera.position.toArray(),target:controls.target.toArray(),bodies:objects.map(o=>{const p=o.mesh.position.clone().project(viewCamera),edge=o.mesh.position.clone().add(new T.Vector3(visualRadius(glyphRadius,o.id)*o.mesh.scale.x,0,0).applyQuaternion(camera.quaternion)).project(viewCamera);if(!o.mesh.geometry.boundingSphere)o.mesh.geometry.computeBoundingSphere();return{id:o.id,position:sourcePosition(o.id),renderPosition:o.mesh.position.toArray(),visualSource:o.mesh.userData.visualSource,geometryRadiusAu:o.mesh.geometry.boundingSphere.radius,displayFactor:o.mesh.scale.x,displayRadiusAu:glyphRadius[o.id]*o.mesh.scale.x,cameraDistance:o.mesh.position.length(),inView:vFinite(p)&&Math.abs(p.x)<=1&&Math.abs(p.y)<=1, radiusAu:glyphRadius[o.id],glyphRadius:glyphRadius[o.id],markerVisible:!o.anchor.hidden,labelVisible:!o.label.hidden,visible:o.mesh.visible,screenRadius:Math.abs(edge.x-p.x)*r.width/2,screen:[r.left+(p.x+1)*r.width/2,r.top+(1-p.y)*r.height/2]}}),drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,texturesReady,cloudsReady,quality,backgroundVisible:backdrop.visible,gpuMs:gpu.read(),orbitsVisible,effectsVisible,belt:{visible:beltVisible,requestedDensity:beltDensity,drawCount:beltGeometry.drawRange.count,model:'illustrative aggregate; no identities or precise asteroid ephemerides'},starfield:'illustrative',starCount:budget.starCount,renderCpuMs:{samples:sorted.length,median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)]},pixelRatio}},
  dispose(){if(disposed)return;disposed=true;cancelFlight();resize.disconnect();layout.disconnect();cancelAnimationFrame(raf);animate=null;navigator.dispose();assets.dispose();takram.dispose();pipeline.dispose();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',cancel);renderer.domElement.removeEventListener('webglcontextlost',contextLost);marker.remove();leaders.remove();gpu.dispose();for(const o of objects){o.label.remove();o.anchor.remove()}for(const r of resources)r.dispose();resources.clear();scene.clear();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}
 }
}
