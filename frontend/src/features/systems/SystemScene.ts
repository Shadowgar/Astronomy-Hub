import * as T from 'three'
import type {ScreenRect,SolarQuality} from '../solar/solarPresentation'
import {qualityBudget,decorativeStars} from '../solar/solarPresentation'
import {SolarCameraController,type NavigationMode} from '../solar/SolarCameraController'
import {SolarResourceOwner,SolarTextureBudget} from '../solar/solarAssets'
import {SolarTextureStreamer,solarTextureQuality} from '../solar/solarTextureStreaming'
import {createSolarRenderPipeline} from '../solar/solarRenderPipeline'
import {createSolarTakram} from '../solar/solarTakram'
import {backgroundMaterial,starsMaterial} from '../solar/solarMaterials'
import {setAtmosphereQuality} from '../solar/solarAtmosphere'
import {gpuTiming} from '../solar/solarGpuTiming'
import {createCelestialBody,setCelestialLight,setCelestialRingFrame,type CelestialBody} from '../celestial/CelestialBody'
import {celestialDetailAsset,loadCelestialDetail,KM_PER_AU} from '../celestial/celestialAssets'
import type {EvaluatedSystem,SystemSnapshot,SystemCamera,Vec3} from './systemTypes'
import {validCamera,systemDiskBudgets,systemViewport} from './systemSceneMath'
import {systemOverviewPose,systemSurfaceFrame,systemToAU,systemToKm} from './systemPresentation'
import {evaluateSystem} from './systemContracts'

export type SystemScene={ready:Promise<void>;update:(value:EvaluatedSystem)=>void;updateSource:(value:SystemSnapshot)=>void;setAnimation:(callback:((now:number)=>boolean)|null)=>void;setNavigation:(mode:NavigationMode)=>void;setQuality:(quality:SolarQuality)=>void;focus:(id:string|null)=>void;overview:()=>void;zoom:(factor:number)=>void;orbit:(angle:number)=>void;setSizeMode:(mode:'cinematic'|'physical')=>void;setOrbits:(show:boolean)=>void;restoreCamera:(value:SystemCamera)=>boolean;diagnostics:()=>unknown;dispose:()=>void}
type Body={id:string;radius:number;position:Vec3;visual:CelestialBody;label:HTMLButtonElement;marker:HTMLSpanElement;width:number;height:number;orientation:string;orientationQualified:boolean}
const hudSelector='.system-header,.system-footer,.system-context,.system-toolbar,.system-breadcrumb,.system-title,.system-moon-list'

/** Source positions and camera stay double precision in AU. Only camera-relative
 * coordinates reach the GPU. This scene owns one renderer, scheduler and asset
 * lifetime; appearance and navigation are the same implementations as Solar. */
export function mountSystemScene(host:HTMLElement,initial:SystemSnapshot,reduced:boolean,onPick:(id:string|null)=>void,onCamera:(camera:SystemCamera)=>void=()=>{},onNavigation:(mode:NavigationMode)=>void=()=>{}):SystemScene{
 let snapshot=initial,evaluated=evaluateSystem(snapshot,Date.parse(snapshot.epoch))
 let disposed=false,lost=false,raf=0,renderCount=0,selected:string|null=null,custom=false,sizeMode:'cinematic'|'physical'='cinematic',orbits=true,quality:SolarQuality='balanced'
 let shadersReady=false,shaderPreparation:unknown={state:'preparing'}
 let animation:((now:number)=>boolean)|null=null,previousFrame=0,press:null|{id:number;x:number;y:number}=null
 const uploads:{id:string;milliseconds:number;at:number}[]=[],firstDraws:{id:string;milliseconds:number;at:number}[]=[],awaitingDraw=new Map<string,any>(),drawnDetails=new Set<string>()
 const instanceId=crypto.randomUUID(),resources=new Set<{dispose:()=>void}>(),bodies:Body[]=[],paths:any[]=[]
 const keep=<R extends {dispose:()=>void}>(r:R):R=>{resources.add(r);return r}
 const textureBudget=new SolarTextureBudget(solarTextureQuality(quality).totalBytes),assets=new SolarResourceOwner(textureBudget)
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',logarithmicDepthBuffer:true})
 let budget=qualityBudget(quality,devicePixelRatio),pixelRatio=budget.pixelRatio
 renderer.setPixelRatio(pixelRatio);renderer.setClearColor('#02040a')
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label',`${snapshot.parent.name} system. Drag to orbit; pinch or scroll to zoom. Arrow keys orbit, plus and minus zoom, Home shows the system.`);host.append(canvas)
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(40,1,1e-10,150),viewCamera=new T.PerspectiveCamera(40,1,1e-10,150)
 camera.up.set(0,0,1);camera.position.set(0,-.03,.02)
 const gpu=gpuTiming(renderer.getContext()),pipeline=createSolarRenderPipeline(renderer,scene,viewCamera)
 pipeline.setSceneUnitsPerAU(KM_PER_AU*1000)
 const takram=snapshot.parent.id==='earth'?createSolarTakram(renderer,viewCamera,{requestFrame:requestDraw}):null
 if(takram)pipeline.setAtmospherePass(takram.pass)
 const navigator=new SolarCameraController(camera,canvas,()=>bodies.map(b=>({id:b.id,position:b.position,radius:b.visual.envelopeAU*(b.id==='saturn'?2.5:1)})),requestDraw,()=>{custom=true},onNavigation)
 navigator.setReduced(reduced);navigator.controls.enablePan=false
 const detail=new SolarTextureStreamer(quality,{budget:textureBudget,maxTextureSize:renderer.capabilities.maxTextureSize,select:celestialDetailAsset,load:loadCelestialDetail,apply(id,payload){if(payload){const start=performance.now();renderer.initTexture(payload.map);uploads.push({id,milliseconds:performance.now()-start,at:performance.now()});if(uploads.length>64)uploads.shift();awaitingDraw.set(id,payload.map)}else awaitingDraw.delete(id);bodies.find(b=>b.id===id)?.visual.setDetailMap(payload?.map??null)},requestFrame:requestDraw,onError(id){assetError(`${id} detail imagery unavailable; the overview remains available.`)}})
 let bounds=host.getBoundingClientRect(),width=Math.max(1,bounds.width),height=Math.max(1,bounds.height),hud:ScreenRect[]=[]
 let viewport=systemViewport(width,height,[])
 const timings:number[]=[],intervals:number[]=[],ray=new T.Raycaster(),pointer=new T.Vector2()
 const state=():SystemCamera=>({position:systemToKm(camera.position.toArray()),target:systemToKm(navigator.controls.target.toArray()),up:camera.up.toArray(),focus:selected})
 function assetError(message:string){if(!disposed)host.dispatchEvent(new CustomEvent('system-asset-error',{detail:message}))}
 const descriptors=[{id:snapshot.parent.id,name:snapshot.parent.name,naif:snapshot.parent.naif_id,radius:snapshot.parent.radius_km},...snapshot.satellites.filter(s=>s.status==='qualified'&&s.radius_km!==null&&snapshot.state[s.id]).map(s=>({id:s.id,name:s.name,naif:s.naif_id,radius:s.radius_km!}))]
 for(const d of descriptors){
  const visual=createCelestialBody({id:d.id,radiusAU:d.radius/KM_PER_AU,sourceIdentity:{target:d.naif,origin:snapshot.origin,frame:snapshot.frame,source:snapshot.source.sha256},assets,keep,request:requestDraw,onError:name=>assetError(`${name} unavailable; source positions remain available.`)})
  visual.mesh.onAfterRender=()=>{if(awaitingDraw.has(d.id)&&visual.mesh.material.uniforms.map.value===awaitingDraw.get(d.id))drawnDetails.add(d.id)}
  scene.add(visual.mesh,...visual.extras)
  const label=document.createElement('button');label.className='system-body-label';label.textContent=d.name;label.setAttribute('aria-label',`Select ${d.name} in system`);Object.assign(label.style,{position:'absolute',left:'0',top:'0',zIndex:'2'});label.onclick=()=>onPick(d.id);host.append(label)
  const marker=document.createElement('span');marker.className='system-position-marker';marker.setAttribute('aria-hidden','true');Object.assign(marker.style,{position:'absolute',width:'5px',height:'5px',borderRadius:'50%',background:'#c4d8ed',pointerEvents:'none'});host.append(marker)
  bodies.push({id:d.id,radius:d.radius,position:systemToAU(evaluated.positions[d.id]??[0,0,0]),visual,label,marker,width:80,height:32,orientation:'illustrative-source-registration',orientationQualified:false})
 }
 const stars=decorativeStars(4000),starGeometry=keep(new T.BufferGeometry())
 starGeometry.setAttribute('position',new T.Float32BufferAttribute(stars.positions,3));starGeometry.setAttribute('color',new T.Float32BufferAttribute(stars.colors,3));starGeometry.setAttribute('pointSize',new T.Float32BufferAttribute(stars.sizes,1))
 const backdrop=new T.Mesh(keep(new T.SphereGeometry(110,64,40)),keep(backgroundMaterial()));backdrop.renderOrder=-3;scene.add(backdrop)
 const field=new T.Points(starGeometry,keep(starsMaterial(pixelRatio)));field.renderOrder=-2;scene.add(field)
 function replacePaths(){
  for(const path of paths){scene.remove(path);path.geometry.dispose();resources.delete(path.geometry);path.material.dispose();resources.delete(path.material)}paths.length=0
  for(const track of snapshot.tracks){if(track.id===snapshot.parent.id||track.samples.length<2)continue
   const geometry=keep(new T.BufferGeometry()),positions=new Float32Array(track.samples.length*3);geometry.setAttribute('position',new T.BufferAttribute(positions,3))
   const path=new T.Line(geometry,keep(new T.LineBasicMaterial({color:'#839cb7',transparent:true,opacity:.18,depthWrite:false})));path.userData.points=track.samples.map(s=>systemToAU(s.position_km));path.userData.id=track.id;path.frustumCulled=false;paths.push(path);scene.add(path)
  }
 }
 function pole():Vec3{const q=evaluated.orientations[snapshot.parent.id];return q?new T.Vector3(0,0,1).applyQuaternion(new T.Quaternion(...q)).toArray():[0,0,1]}
 function overviewPose(){const pose=systemOverviewPose(bodies.map(b=>b.position),pole(),systemToAU(evaluated.sun),viewport.clearWidth,viewport.clearHeight,camera.fov,bodies.map(b=>b.visual.envelopeAU*(b.id==='saturn'?2.5:1))),scale=height/Math.max(1,viewport.clearHeight);return{...pose,position:pose.position.map((v,i)=>pose.target[i]+(v-pose.target[i])*scale) as Vec3}}
 function focusPose(body:Body){
  // A reproducible lit approach; dragging remains unconstrained around the body.
  const light=new T.Vector3(...systemToAU(evaluated.sun)).sub(new T.Vector3(...body.position)).normalize(),prior=camera.position.clone().sub(navigator.controls.target).normalize()
  const direction=light.multiplyScalar(.78).add(prior.multiplyScalar(.22)).normalize()
  if(body.id==='saturn')direction.add(new T.Vector3(...pole()).multiplyScalar(.45)).normalize()
  const radius=body.visual.envelopeAU,envelope=radius*(body.id==='saturn'?2.5:1)
  // Fit Saturn's projected ring ellipse, not an enclosing face-on circle.
  const ringPole=new T.Vector3(...pole()),halfWidth=envelope,halfHeight=body.id==='saturn'?Math.max(radius,envelope*Math.abs(ringPole.dot(direction))):radius
  if(body.id==='saturn')camera.up.copy(ringPole)
  const pixelsX=Math.max(20,viewport.clearWidth*.42),pixelsY=Math.max(20,viewport.clearHeight*.42)
  const distance=Math.max(envelope*1.12,height/(2*Math.tan(camera.fov*Math.PI/360))*Math.max(halfWidth/pixelsX,halfHeight/pixelsY)+(body.id==='saturn'?envelope:0))
  return{target:[...body.position] as Vec3,position:new T.Vector3(...body.position).addScaledVector(direction,distance).toArray() as Vec3}
 }
 function moveFocus(body:Body|undefined,immediate=false){const pose=body?focusPose(body):overviewPose();if(!body)camera.up.fromArray((pose as ReturnType<typeof overviewPose>).up);const envelope=body?.visual.envelopeAU??snapshot.parent.radius_km/KM_PER_AU;navigator.move(pose,Math.max(1e-13,envelope*.001),body?envelope*(body.id==='saturn'?2.55:1.08):1e-9,immediate)}
 function focus(id:string|null){if(disposed||lost)return;const body=bodies.find(b=>b.id===id);if(id&&!body)return;selected=id;custom=false;detail.setTarget(id);moveFocus(body);requestDraw()}
 function update(value:EvaluatedSystem){
  if(disposed||lost)return
  const previous=bodies.find(b=>b.id===selected)?.position
  evaluated=value
  for(const body of bodies){
   body.position=systemToAU(body.id===snapshot.parent.id?[0,0,0]:value.positions[body.id])
   setCelestialLight(body.visual,body.position,systemToAU(value.sun))
   const orientation=systemSurfaceFrame(body.id,value.orientations[body.id],snapshot.orientations?.[body.id],body.visual.appearance)
   body.orientation=orientation.classification;body.orientationQualified=orientation.qualified
   if(orientation.quaternion)body.visual.mesh.quaternion.fromArray(orientation.quaternion)
   for(const extra of body.visual.extras)if(extra.userData.clouds)extra.quaternion.copy(body.visual.mesh.quaternion)
   if(body.id==='saturn'&&value.orientations.saturn)setCelestialRingFrame(body.visual,new T.Quaternion(...value.orientations.saturn))
  }
  const next=bodies.find(b=>b.id===selected)?.position;if(previous&&next)navigator.follow(next.map((v,i)=>v-previous[i]) as Vec3)
  requestDraw()
 }
 function draw(){
  if(disposed||lost||!shadersReady)return
  const start=performance.now();camera.updateMatrixWorld();viewCamera.copy(camera);viewCamera.position.set(0,0,0);viewCamera.updateMatrixWorld()
  for(const body of bodies){body.visual.mesh.position.set(...body.position.map((v,i)=>v-camera.position.getComponent(i)) as Vec3);for(const extra of body.visual.extras)extra.position.copy(body.visual.mesh.position)}
  const projected=bodies.map(body=>{const p=body.visual.mesh.position.clone().project(viewCamera),distance=body.visual.mesh.position.length(),physical=body.visual.envelopeAU*height/(2*distance*Math.tan(camera.fov*Math.PI/360));return{body,p,distance,envelopeFactor:body.id==='saturn'?2.5:1,x:(p.x+1)*width/2,y:(1-p.y)*height/2,desired:body.id===snapshot.parent.id?Math.min(130,viewport.clearHeight*.22):Math.min(38,viewport.clearHeight*.075),physical}})
  const budgets=systemDiskBudgets(projected,width,height,hud)
  for(const [index,{body,physical}] of projected.entries()){
   const scale=selected||sizeMode==='physical'?1:Math.max(1,budgets[index]/Math.max(.000001,physical));body.visual.mesh.scale.setScalar(scale)
   for(const extra of body.visual.extras){extra.scale.setScalar(scale*(extra.userData.baseScale??1));if(extra.userData.clouds)extra.visible=body.visual.cloudsReady}
  }
  if(takram){const earth=bodies.find(b=>b.id==='earth')!,q=evaluated.orientations.earth,rotation=q?new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion(...q).invert()).elements:null
   takram.updateFrame({cameraPositionAU:camera.position.toArray(),earthPositionAU:earth.position,sunPositionAU:systemToAU(evaluated.sun),icrfToItrs:rotation?[rotation[0],rotation[4],rotation[8],rotation[1],rotation[5],rotation[9],rotation[2],rotation[6],rotation[10]]:[],kmPerAu:KM_PER_AU,earthRadiusM:earth.radius*1000,physicalScale:earth.visual.mesh.scale.x,frameAvailable:earth.orientationQualified,sceneUnitsPerAU:KM_PER_AU*1000})
   const active=takram.diagnostics().active;earth.visual.mesh.material.uniforms.customAtmosphere.value=!active;earth.visual.mesh.material.uniforms.hasCloudMap.value=earth.visual.cloudsReady
   for(const extra of earth.visual.extras)if(extra.userData.atmosphere)extra.visible=!active
  }
  for(const path of paths){path.visible=orbits&&selected===null;if(!path.visible)continue;const attribute=path.geometry.attributes.position;for(let i=0;i<path.userData.points.length;i++){const p=path.userData.points[i];attribute.setXYZ(i,p[0]-camera.position.x,p[1]-camera.position.y,p[2]-camera.position.z)}attribute.needsUpdate=true}
  drawnDetails.clear();gpu.begin();const renderStart=performance.now();pipeline.render();gpu.end();renderCount++;for(const [id,map] of awaitingDraw){const mesh=bodies.find(b=>b.id===id)?.visual.mesh;if(drawnDetails.has(id)&&mesh?.material.uniforms.map.value===map){firstDraws.push({id,milliseconds:performance.now()-renderStart,at:performance.now()});if(firstDraws.length>64)firstDraws.shift();awaitingDraw.delete(id)}}
  const disks=projected.map(p=>({...p,radius:p.physical*p.body.visual.mesh.scale.x*p.envelopeFactor})),occupied=[...hud,...disks.filter(({p})=>p.z>-1&&p.z<1).map(({x,y,radius})=>({left:x-radius-4,right:x+radius+4,top:y-radius-4,bottom:y+radius+4}))]
  for(const {body,p,x,y,radius} of disks.sort((a,b)=>Number(b.body.id===selected)-Number(a.body.id===selected))){
   const visible=p.z>-1&&p.z<1&&x>=0&&x<=width&&y>=0&&y<=height
   body.marker.hidden=!visible||radius>=3;body.marker.style.transform=`translate(${x-2.5}px,${y-2.5}px)`
   const candidates=[[x+radius+10,y-body.height/2],[x-radius-body.width-10,y-body.height/2],[x-body.width/2,y+radius+10],[x-body.width/2,y-radius-body.height-10]]
   const spot=candidates.find(([left,top])=>left>=5&&top>=5&&left+body.width<=width-5&&top+body.height<=height-5&&!occupied.some(r=>left<r.right&&left+body.width>r.left&&top<r.bottom&&top+body.height>r.top))
   body.label.hidden=!visible||!spot;body.label.setAttribute('aria-pressed',String(body.id===selected))
   if(visible&&spot){body.label.style.transform=`translate3d(${spot[0]}px,${spot[1]}px,0)`;occupied.push({left:spot[0],top:spot[1],right:spot[0]+body.width,bottom:spot[1]+body.height})}
  }
  timings.push(performance.now()-start);if(timings.length>600)timings.shift();onCamera(state())
 }
 function tick(now:number){raf=0;if(disposed||lost)return;const clockActive=animation?.(now)??false,travel=navigator.tick(now);if(previousFrame&&now-previousFrame<2000){intervals.push(now-previousFrame);if(intervals.length>600)intervals.shift()}previousFrame=clockActive||travel?now:0;draw();if(clockActive||travel)requestDraw()}
 function requestDraw(){if(!disposed&&!lost&&!raf)raf=requestAnimationFrame(tick)}
 function measure(){
  if(disposed)return;bounds=host.getBoundingClientRect();width=Math.max(1,bounds.width);height=Math.max(1,bounds.height)
  const shell=host.closest('.system-shell')??host.parentElement??host
  hud=[...shell.querySelectorAll(hudSelector)].map(e=>{const r=e.getBoundingClientRect();return{left:r.left-bounds.left,right:r.right-bounds.left,top:r.top-bounds.top,bottom:r.bottom-bounds.top}}).filter(r=>r.right>r.left&&r.bottom>r.top)
  viewport=systemViewport(width,height,hud);camera.aspect=width/height;camera.setViewOffset(width,height,viewport.rectangleOffsetX,viewport.rectangleOffsetY,width,height);camera.updateProjectionMatrix();renderer.setSize(width,height);pipeline.resize(width,height,pixelRatio)
  for(const body of bodies){body.label.hidden=false;body.width=body.label.offsetWidth||80;body.height=body.label.offsetHeight||32}
  if(!custom&&!navigator.animating)moveFocus(bodies.find(b=>b.id===selected),true)
  requestDraw()
 }
 const resize=new ResizeObserver(measure),shell=host.closest('.system-shell')??host.parentElement??host,observed=new Set<Element>();resize.observe(host)
 function watchHud(){for(const element of shell.querySelectorAll(hudSelector))if(!observed.has(element)){observed.add(element);resize.observe(element)}measure()}
 const layout=new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes,...r.removedNodes].some(n=>n instanceof Element&&(n.matches(hudSelector)||n.querySelector(hudSelector)))))watchHud()});layout.observe(shell,{childList:true,subtree:true})
 const down=(e:PointerEvent)=>{press=e.isPrimary?{id:e.pointerId,x:e.clientX,y:e.clientY}:null}
 const up=(e:PointerEvent)=>{if(!press||press.id!==e.pointerId||Math.hypot(e.clientX-press.x,e.clientY-press.y)>5){press=null;return}press=null;pointer.set((e.clientX-bounds.left)/width*2-1,1-(e.clientY-bounds.top)/height*2);ray.setFromCamera(pointer,viewCamera);const hit=ray.intersectObjects(bodies.map(b=>b.visual.mesh))[0],body=bodies.find(b=>b.visual.mesh===hit?.object);if(body)onPick(body.id)}
 const cancel=()=>{press=null}
 const key=(e:KeyboardEvent)=>{if(e.key==='+'||e.key==='='){navigator.zoom(.8);e.preventDefault()}else if(e.key==='-'){navigator.zoom(1.25);e.preventDefault()}else if(navigator.mode!=='free'&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){navigator.orbit(e.key==='ArrowLeft'?-.15:.15);e.preventDefault()}else if(e.key==='Home'){onPick(null);e.preventDefault()}}
 const contextLost=(e:Event)=>{e.preventDefault();lost=true;animation=null;navigator.cancel();cancelAnimationFrame(raf);raf=0;host.dispatchEvent(new CustomEvent('system-webgl-error',{detail:'Graphics context lost. Retry the system view.'}))}
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('keydown',key);canvas.addEventListener('webglcontextlost',contextLost)
 replacePaths();update(evaluated);watchHud()
 const ready=pipeline.prepare(assets.signal).then(result=>{shaderPreparation=result;if(disposed||result.state==='aborted')return;shadersReady=true;requestDraw()})
 const summary=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return{samples:sorted.length,median:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],maximum:sorted.at(-1)}}
 return{ready,update,focus,overview:()=>focus(null),zoom:f=>{if(Number.isFinite(f)&&f>0)navigator.zoom(f)},orbit:a=>{if(Number.isFinite(a))navigator.orbit(a)},
  updateSource(value){if(value.system_id!==snapshot.system_id||value.source.sha256!==snapshot.source.sha256||value.parent.naif_id!==snapshot.parent.naif_id||value.frame!==snapshot.frame||value.origin!==snapshot.origin||bodies.some(b=>b.id!==value.parent.id&&!value.state[b.id]))throw Error('Incompatible system source window');snapshot=value;replacePaths();requestDraw()},
  setAnimation(callback){animation=callback;previousFrame=0;requestDraw()},setNavigation(mode){navigator.setMode(mode)},
  setQuality(value){if(disposed)return;quality=value;detail.setQuality(value);budget=qualityBudget(value,devicePixelRatio);pixelRatio=budget.pixelRatio;renderer.setPixelRatio(pixelRatio);pipeline.setQuality(value);takram?.setQuality(value);pipeline.resize(width,height,pixelRatio);for(const b of bodies)for(const e of b.visual.extras)setAtmosphereQuality(e.material,value);field.material.uniforms.pixelRatio.value=pixelRatio;starGeometry.setDrawRange(0,budget.starCount);backdrop.visible=budget.background;gpu.reset();timings.length=0;intervals.length=0;requestDraw()},
  setSizeMode(mode){sizeMode=mode;requestDraw()},setOrbits(show){orbits=show;requestDraw()},
  restoreCamera(value){if(disposed||lost||!validCamera(value,bodies.map(b=>b.id)))return false;const position=systemToAU(value.position);if(bodies.some(b=>Math.hypot(...position.map((v,i)=>v-b.position[i]))<b.visual.envelopeAU*(b.id==='saturn'?2.5:1.05)))return false;selected=value.focus;custom=true;detail.setTarget(selected);camera.up.fromArray(value.up).normalize();const b=bodies.find(b=>b.id===selected),r=b?.visual.envelopeAU??1e-6;navigator.move({position,target:systemToAU(value.target)},Math.max(1e-13,r*.001),b?r*(b.id==='saturn'?2.55:1.08):1e-9,true);return true},
  diagnostics(){return{instanceId,shaderPreparation,epoch:evaluated.epoch,frame:snapshot.frame,origin:snapshot.origin,source:snapshot.source,sampledCoverage:snapshot.sampled_coverage,units:'km',sceneUnitKm:KM_PER_AU,precision:'camera-relative CPU64/GPU32',selected,sizeMode,effectiveScale:selected?'physical':sizeMode,orbitsRequested:orbits,orbitsVisible:paths.some(p=>p.visible),renderCount,disposed,contextLost:lost,animating:navigator.animating,navigation:navigator.mode,camera:systemToKm(camera.position.toArray()),target:systemToKm(navigator.controls.target.toArray()),cameraState:state(),viewport,quality,pixelRatio,assets:assets.diagnostics(),detail:detail.diagnostics(),pipeline:pipeline.diagnostics(),atmosphere:takram?.diagnostics()??null,texturesReady:bodies.filter(b=>b.visual.overviewReady).length,bodies:bodies.map(b=>{const p=b.visual.mesh.position.clone().project(viewCamera),r=b.visual.envelopeAU*b.visual.mesh.scale.x*height/(2*b.visual.mesh.position.length()*Math.tan(camera.fov*Math.PI/360));return{id:b.id,...b.visual.diagnostics() as object,position:systemToKm(b.position),radiusKm:b.radius,envelopeKm:b.visual.envelopeAU*KM_PER_AU,displayRadiusKm:b.radius*b.visual.mesh.scale.x,displayFactor:b.visual.mesh.scale.x,screenRadius:r,screen:[bounds.left+(p.x+1)*width/2,bounds.top+(1-p.y)*height/2],inView:p.z>-1&&p.z<1&&Math.abs(p.x)<1&&Math.abs(p.y)<1,labelVisible:!b.label.hidden,markerVisible:!b.marker.hidden,orientation:b.orientation,orientationQualified:b.orientationQualified,rings:b.visual.extras.filter(e=>e.userData.rings).map(e=>({quaternion:e.quaternion.toArray(),radialMap:!!e.material.uniforms.hasRadialMap.value}))}}),ownedResources:resources.size,ownedGeometries:[...resources].filter((r:any)=>r.isBufferGeometry).length,drawCalls:renderer.info.render.calls,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,gpuMs:gpu.read(),frameIntervalsMs:summary(intervals),renderCpuMs:summary(timings),starfield:'illustrative',loading:{uploadMetric:'CPU texture initialization/submission; not isolated GPU time',firstDrawMetric:'whole-scene CPU render span when installed detail first participates',uploads,firstDraws,shaderPrograms:renderer.info.programs?.length,shaderFailures:renderer.info.programs?.filter((p:any)=>p.diagnostics?.runnable===false).length},independentAnimationLoops:disposed?0:1}},
  dispose(){if(disposed)return;disposed=true;animation=null;cancelAnimationFrame(raf);raf=0;resize.disconnect();layout.disconnect();navigator.dispose();detail.dispose();assets.dispose();takram?.dispose();pipeline.dispose();gpu.dispose();canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('keydown',key);canvas.removeEventListener('webglcontextlost',contextLost);for(const b of bodies){b.label.remove();b.marker.remove()}for(const resource of resources)resource.dispose();resources.clear();scene.clear();renderer.dispose();renderer.forceContextLoss();canvas.remove()}
 }
}
