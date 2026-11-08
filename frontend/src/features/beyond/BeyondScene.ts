import * as T from 'three'
import {SolarCameraController,type NavigationMode} from '../solar/SolarCameraController'
import {SolarResourceOwner} from '../solar/solarAssets'
import {createSolarRenderPipeline} from '../solar/solarRenderPipeline'
import {gpuTiming} from '../solar/solarGpuTiming'
import {backgroundMaterial,starsMaterial} from '../solar/solarMaterials'
import {decorativeStars,qualityBudget,type SolarQuality,type ScreenRect} from '../solar/solarPresentation'
import {systemViewport} from '../systems/systemSceneMath'
import type {SolarSnapshot,Vector} from '../solar/solarContracts'
import {AU_KM,eclipticDirection,illustrativeCloud,scalePose,validBeyondCamera,type BeyondCamera} from './beyondMath'
import {beyondViews,type BeyondContext,type BeyondView} from './beyondContracts'

export type BeyondLabel={id:string;text:string;x:number;y:number;visible:boolean}
type Options={reduced?:boolean;onChange?:()=>void;onError?:(error:Error)=>void}
type Layer={object:any;world:Vector[];visible:()=>boolean}
type Anchor={id:string;text:string;position:Vector;visible:()=>boolean}
const HUD='.beyond-header,.beyond-tabs,.beyond-intro,.beyond-context,.beyond-footer'
const colours:Record<string,number>={sun:0xffcd77,mercury:0xa4a4a4,venus:0xd3b883,earth:0x69b7e9,mars:0xe49675,jupiter:0xdac3a3,saturn:0xc7b89c,uranus:0x8cd3d8,neptune:0x719cea}

/** One active Solar-family renderer. Points are unresolved symbols, not enlarged
 * bodies. All admitted positions stay CPU doubles in ICRF AU until subtraction. */
export class BeyondScene{
 private renderer:any=null
 private scene:any=null
 private camera:any=null
 private viewCamera:any=null
 private navigator:SolarCameraController|null=null
 private pipeline:ReturnType<typeof createSolarRenderPipeline>|null=null
 private gpu:ReturnType<typeof gpuTiming>|null=null
 private assets=new SolarResourceOwner(128*1024*1024)
 private layers:Layer[]=[]
 private anchors:Anchor[]=[]
 private labels:BeyondLabel[]=[]
 private planetLayers:Layer[]=[]
 private planetAnchors:Anchor[]=[]
 private context:BeyondContext|null=null
 private snapshot:SolarSnapshot|null=null
 private resize:ResizeObserver|null=null
 private mutation:MutationObserver|null=null
 private externalSignal:AbortSignal|undefined
 private width=1
 private height=1
 private hud:ScreenRect[]=[]
 private viewport=systemViewport(1440,900,[])
 private view:BeyondView='outer'
 private radius=50
 private quality:SolarQuality='balanced'
 private pixelRatio=1
 private ready=false
 private disposed=false
 private initialized=false
 private contextLost=false
 private custom=false
 private raf=0
 private renderCount=0
 private preparation:unknown=null
 private cpu:number[]=[]
 private frameIntervals:number[]=[]
 private lastFrame=0
 private instanceId=crypto.randomUUID()
 private rendererName:string|null=null
 private domainClamps=0
 private geometryBufferBytes=0

 constructor(private host:HTMLElement,private options:Options={}){}

 async initialize(context:BeyondContext,snapshot:SolarSnapshot|null,signal?:AbortSignal){
  signal?.throwIfAborted()
  if(this.disposed||this.initialized)throw Error('Beyond scene lifetime is unavailable')
  this.initialized=true;this.context=context;this.externalSignal=signal
  signal?.addEventListener('abort',this.abort,{once:true})
  try{
   this.renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance',logarithmicDepthBuffer:true})
   this.pixelRatio=qualityBudget(this.quality,devicePixelRatio).pixelRatio
   this.renderer.setPixelRatio(this.pixelRatio);this.renderer.setClearColor('#02040a')
   const canvas=this.renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Beyond the Planets. Drag to orbit, scroll to change scale. Arrow keys orbit; Home restores the scale overview.')
   this.host.append(canvas);canvas.addEventListener('keydown',this.key);canvas.addEventListener('webglcontextlost',this.lost)
   this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(42,1,.001,4000000);this.camera.up.set(0,0,1);this.camera.position.fromArray(scalePose(this.radius).position)
   this.viewCamera=this.camera.clone()
   this.pipeline=createSolarRenderPipeline(this.renderer,this.scene,this.viewCamera);this.pipeline.setSceneUnitsPerAU(AU_KM*1000)
   const gl=this.renderer.getContext();this.gpu=gpuTiming(gl)
   // Optional diagnostic string; never required to create or retain a renderer.
   const debug=gl.getExtension?.('WEBGL_debug_renderer_info');if(debug)this.rendererName=gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
   this.navigator=new SolarCameraController(this.camera,canvas,()=>[],this.request,()=>{this.custom=true;this.constrainCamera()},()=>{}, {maxDistanceAU:1e6,maxFlightSpeedAU:10000})
   this.navigator.setReduced(this.options.reduced??false)
   this.buildBackground();this.buildContext(context);this.setSnapshot(snapshot)
   const geometries=new Set<any>();this.scene.traverse((object:any)=>{if(object.geometry)geometries.add(object.geometry)})
   this.geometryBufferBytes=[...geometries].reduce((bytes,geometry)=>bytes+Object.values(geometry.attributes).reduce((size:number,attribute:any)=>size+attribute.array.byteLength,0)+(geometry.index?.array.byteLength??0),0)
   if(this.geometryBufferBytes>64*1024*1024)throw Error('Beyond geometry allocation exceeds its budget')
   this.resize=new ResizeObserver(this.measure);this.resize.observe(this.host)
   const shell=this.host.closest('.beyond-shell')
   if(shell){this.resize.observe(shell);this.mutation=new MutationObserver(this.measure);this.mutation.observe(shell,{childList:true,subtree:true,attributes:true,attributeFilter:['open']})}
   this.measure()
   this.preparation=await this.pipeline.prepare(this.assets.signal)
   if(this.disposed||this.assets.signal.aborted)return
   if((this.preparation as {state:string}).state!=='ready')throw Error('Beyond shader preparation did not complete')
   this.ready=true;this.request();this.options.onChange?.()
  }catch(error){this.dispose();throw error}
 }

 private keep=<R extends {dispose:()=>void}>(resource:R)=>this.assets.keep(resource)
 private addLayer(world:Vector[],kind:'points'|'line',colour:number,opacity:number,visible:()=>boolean,size=3){
  const geometry=this.keep(new T.BufferGeometry());geometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(world.length*3),3))
  const material=this.keep(kind==='points'?new T.PointsMaterial({color:colour,size,sizeAttenuation:false,transparent:true,opacity,depthWrite:false}):new T.LineBasicMaterial({color:colour,transparent:true,opacity,depthWrite:false}))
  const object=kind==='points'?new T.Points(geometry,material):new T.Line(geometry,material)
  object.frustumCulled=false;this.scene.add(object)
  const layer={object,world:world.map(p=>[...p] as Vector),visible};this.layers.push(layer);return layer
 }
 private buildBackground(){
  const data=decorativeStars(1600),geometry=this.keep(new T.BufferGeometry())
  geometry.setAttribute('position',new T.Float32BufferAttribute(data.positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(data.colors,3));geometry.setAttribute('pointSize',new T.Float32BufferAttribute(data.sizes,1))
  const stars=new T.Points(geometry,this.keep(starsMaterial(this.pixelRatio)));stars.name='decorative-background';stars.renderOrder=-2;this.scene.add(stars)
  const background=new T.Mesh(this.keep(new T.SphereGeometry(110,48,32)),this.keep(backgroundMaterial()));background.renderOrder=-3;this.scene.add(background)
 }
 private buildContext(context:BeyondContext){
  const spatial=()=>this.view!=='ibex'&&this.view!=='imap'
  this.addLayer([[0,0,0]],'points',colours.sun,1,spatial,8)
  this.anchors.push({id:'sun',text:'Sun',position:[0,0,0],visible:spatial})
  const outer=()=>this.view==='outer'
  for(const radius of [30,50])this.addLayer(Array.from({length:257},(_,i)=>eclipticDirection(i*360/256,0).map(v=>v*radius) as Vector),'line',0x899cb8,.25,outer)
  this.anchors.push({id:'kuiper-guide',text:'Kuiper region · schematic 30–50 AU guide',position:eclipticDirection(100,0).map(v=>v*50) as Vector,visible:outer})
  for(const crossing of context.crossings){
   if(!crossing.geometry)continue
   const visible=()=>this.view==='comparison'||this.view===crossing.mission_id
   const p=crossing.geometry.position,colour=crossing.mission_id==='voyager1'?0x83d3f2:0xf2ba83
   this.addLayer([p],'points',colour,1,visible,8)
   this.addLayer([[0,0,0],p],'line',colour,.35,visible)
   this.anchors.push({id:crossing.id,text:`${crossing.mission_id==='voyager1'?'Voyager 1':'Voyager 2'} · ${crossing.observed.date}`,position:[...p],visible})
  }
  // Artistic dimensions belong only to this conceptual diagram. They do not
  // reproduce a scientific MHD surface or use observed crossing radii as a fit.
  const schematic=()=>this.view==='heliosphere'
  for(const [scale,colour,opacity] of [[65,0x63b5db,.38],[112,0x82a8c0,.25]] as const){
   const shape=(theta:number,phi:number):Vector=>{
    const x=Math.sin(phi)*Math.cos(theta),y=Math.sin(phi)*Math.sin(theta),z=Math.cos(phi)
    return[scale*(x-.12*(1-x*x)),scale*y*(1.1+.25*(1-x)),scale*z*.78]
   }
   const geometry=this.keep(new T.SphereGeometry(1,64,32)),positions=geometry.attributes.position,world:Vector[]=[]
   for(let i=0;i<positions.count;i++){const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);world.push([scale*(x-.12*(1-x*x)),scale*y*(1.1+.25*(1-x)),scale*z*.78])}
   const material=this.keep(new T.MeshBasicMaterial({color:colour,transparent:true,opacity:scale===65?.055:.045,side:T.DoubleSide,depthWrite:false})),object=new T.Mesh(geometry,material)
   object.frustumCulled=false;object.renderOrder=scale===65?2:1;this.scene.add(object);this.layers.push({object,world,visible:schematic})
   this.addLayer(Array.from({length:129},(_,i)=>shape(i*Math.PI/64,Math.PI*.5)),'line',colour,opacity,schematic)
   for(const theta of [0,Math.PI/2])this.addLayer(Array.from({length:129},(_,i)=>shape(theta,i*Math.PI/64)),'line',colour,opacity*.7,schematic)
  }
  // Open streamlines are a static teaching symbol, not measured particle paths.
  for(let i=0;i<12;i++){
   const angle=i*Math.PI/6,world=Array.from({length:33},(_,j)=>{const r=10+j*2;return[r*Math.cos(angle),r*Math.sin(angle),Math.sin(angle*2)*r*.16] as Vector})
   this.addLayer(world,'line',0xe9b879,.28,schematic)
  }
  this.anchors.push({id:'concept-shock',text:'Termination shock · schematic',position:[55,12,32],visible:schematic},{id:'concept-pause',text:'Heliopause · schematic',position:[90,45,42],visible:schematic})
  const oort=()=>this.view==='oort'
  this.addLayer(illustrativeCloud(1800),'points',0xa8b6c9,.55,oort,1.5)
  for(const extent of [...context.oort.inner_extent_au,...context.oort.outer_extent_au]){
   for(const latitude of [0,90]){
    const points=Array.from({length:257},(_,i)=>{const angle=i*360/256,p=latitude===0?eclipticDirection(angle,0):eclipticDirection(angle<180?0:180,angle<180?angle-90:270-angle);return p.map(v=>v*extent) as Vector})
    this.addLayer(points,'line',extent<10000?0xa998c3:0x6e8baf,.2,oort)
   }
   this.anchors.push({id:`oort-${extent}`,text:`${extent.toLocaleString('en-US')} AU · theoretical range`,position:eclipticDirection(35,0).map(v=>v*extent) as Vector,visible:oort})
  }
 }
 private planetsVisible=()=>{
  if(!this.snapshot||!['outer','voyager1','voyager2'].includes(this.view))return false
  if(this.view==='outer')return true
  const crossing=this.context?.crossings.find(c=>c.mission_id===this.view)
  return !!crossing?.geometry&&Date.parse(crossing.geometry.epoch)===Date.parse(this.snapshot.epoch)
 }
 setSnapshot(snapshot:SolarSnapshot|null){
  if(this.disposed)return
  this.snapshot=snapshot
  if(!this.scene)return
  // Fixed nine-body slots keep geometry/material ownership stable as time moves.
  if(!this.planetLayers.length){
   for(const id of ['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune']){
    const marker=this.addLayer([[0,0,0]],'points',colours[id],.9,this.planetsVisible,4)
    marker.object.userData.body=id;marker.object.userData.kind='marker';this.planetLayers.push(marker)
    const trajectory=this.addLayer(Array.from({length:129},()=>[0,0,0] as Vector),'line',colours[id],.22,this.planetsVisible)
    trajectory.object.userData.body=id;trajectory.object.userData.kind='trajectory';this.planetLayers.push(trajectory)
    const anchor={id,text:id[0].toUpperCase()+id.slice(1),position:[0,0,0] as Vector,visible:this.planetsVisible};this.planetAnchors.push(anchor);this.anchors.push(anchor)
   }
  }
  for(const layer of this.planetLayers){const body=snapshot?.bodies.find(b=>b.source_id===layer.object.userData.body),points=layer.object.userData.kind==='marker'?(body?[body.position_au]:[]):body?.trajectory.map(p=>p.position_au)??[];layer.world=points.map(p=>[...p] as Vector);layer.object.geometry.setDrawRange(0,points.length)}
  for(const anchor of this.planetAnchors){const body=snapshot?.bodies.find(b=>b.source_id===anchor.id);if(body)anchor.position=[...body.position_au]}
  this.request()
 }
 setView(view:BeyondView){if(this.disposed)return;if(!beyondViews.includes(view))throw Error('Unknown Beyond view');this.view=view;this.request();this.options.onChange?.()}
 setRadius(radius:number){if(this.disposed)return;scalePose(radius);this.radius=radius;this.custom=false;this.fit(false);this.request()}
 private fit(immediate:boolean){
  if(!this.navigator||!this.camera)return
  const pose=scalePose(this.radius),clear=Math.max(32,Math.min(this.viewport.clearWidth,this.viewport.clearHeight)),fit=Math.max(1,Math.min(2.7,this.height*.68/clear))
  pose.position=pose.position.map(v=>v*fit) as Vector
  this.navigator.move(pose,.001,.1,immediate)
 }
 private constrainCamera(){
  if(!this.navigator||!this.camera||this.disposed)return
  const target=this.navigator.controls.target,shift=new T.Vector3(),inside=1e6-1e-6
  for(let axis=0;axis<3;axis++){
   const low=Math.min(this.camera.position.getComponent(axis),target.getComponent(axis)),high=Math.max(this.camera.position.getComponent(axis),target.getComponent(axis))
   shift.setComponent(axis,high>1e6?inside-high:low< -1e6?-inside-low:0)
  }
  if(!shift.lengthSq())return
  // Translate both endpoints: panning/free-flight keeps the view direction and
  // camera-target offset, while every reachable pose remains serializable. The
  // inward 1e-6 AU margin absorbs OrbitControls' spherical round-trip rounding.
  this.camera.position.add(shift);target.add(shift);this.navigator.updateControls();this.domainClamps++
 }
 getCamera():BeyondCamera{this.constrainCamera();return{position:this.camera?.position.toArray()??scalePose(this.radius).position,target:this.navigator?.controls.target.toArray()??[0,0,0],up:this.camera?.up.toArray()??[0,0,1],radius:this.radius}}
 restoreCamera(camera:BeyondCamera){if(this.disposed||!this.navigator||!validBeyondCamera(camera))return false;this.radius=camera.radius;this.custom=true;this.camera.up.fromArray(camera.up).normalize();this.navigator.move({position:camera.position,target:camera.target},.001,.1,true);this.request();return true}
 getLabels(){return this.labels.map(label=>({...label}))}
 zoom(factor:number){if(!this.disposed)this.navigator?.zoom(factor)}
 orbit(angle:number){if(!this.disposed)this.navigator?.orbit(angle)}
 setNavigation(mode:NavigationMode){if(!this.disposed)this.navigator?.setMode(mode)}
 setQuality(quality:SolarQuality){if(this.disposed)return;this.quality=quality;this.pixelRatio=qualityBudget(quality,devicePixelRatio).pixelRatio;this.renderer?.setPixelRatio(this.pixelRatio);this.pipeline?.setQuality(quality);const stars=this.scene?.getObjectByName('decorative-background');if(stars)stars.material.uniforms.pixelRatio.value=this.pixelRatio;this.measure();this.gpu?.reset();this.request()}
 private measure=()=>{
  if(this.disposed||!this.camera)return
  const bounds=this.host.getBoundingClientRect();this.width=Math.max(1,bounds.width);this.height=Math.max(1,bounds.height)
  this.hud=[...(this.host.closest('.beyond-shell')?.querySelectorAll(HUD)??[])].map(e=>{const r=e.getBoundingClientRect();return{left:r.left-bounds.left,right:r.right-bounds.left,top:r.top-bounds.top,bottom:r.bottom-bounds.top}}).filter(r=>r.right>r.left&&r.bottom>r.top)
  this.viewport=systemViewport(this.width,this.height,this.hud);this.camera.aspect=this.width/this.height;this.camera.setViewOffset(this.width,this.height,this.viewport.rectangleOffsetX,this.viewport.rectangleOffsetY,this.width,this.height);this.camera.updateProjectionMatrix()
  this.renderer.setSize(this.width,this.height);this.pipeline?.resize(this.width,this.height,this.pixelRatio)
  if(!this.custom&&!this.navigator?.animating)this.fit(true);this.request()
 }
 private draw(){
  if(this.disposed||!this.ready)return
  const started=performance.now();this.camera.updateMatrixWorld();this.viewCamera.copy(this.camera);this.viewCamera.position.set(0,0,0);this.viewCamera.updateMatrixWorld()
  const origin=this.camera.position.toArray() as Vector
  for(const layer of this.layers){layer.object.visible=layer.visible()&&layer.world.length>0;if(!layer.object.visible)continue;const positions=layer.object.geometry.attributes.position;layer.world.forEach((p,i)=>positions.setXYZ(i,p[0]-origin[0],p[1]-origin[1],p[2]-origin[2]));positions.needsUpdate=true}
  const occupied=[...this.hud]
  this.labels=this.anchors.map(anchor=>{
   const p=new T.Vector3(...anchor.position.map((v,i)=>v-origin[i])).project(this.viewCamera),x=(p.x+1)*this.width/2,y=(1-p.y)*this.height/2
   const box={left:x+12,right:x+20+anchor.text.length*7,top:y-15,bottom:y+15}
   const visible=anchor.visible()&&p.z>-1&&p.z<1&&box.left>8&&box.right<this.width-8&&box.top>8&&box.bottom<this.height-8&&!occupied.some(r=>box.left<r.right&&box.right>r.left&&box.top<r.bottom&&box.bottom>r.top)
   if(visible)occupied.push(box)
   return{id:anchor.id,text:anchor.text,x,y,visible}
  })
  this.gpu?.begin();this.pipeline!.render();this.gpu?.end();this.renderCount++;this.cpu.push(performance.now()-started);if(this.cpu.length>600)this.cpu.shift();this.options.onChange?.()
 }
 private tick=(now:number)=>{this.raf=0;if(this.disposed)return;const travel=this.navigator?.tick(now)??false;this.constrainCamera();if(this.lastFrame&&now-this.lastFrame<2000){this.frameIntervals.push(now-this.lastFrame);if(this.frameIntervals.length>600)this.frameIntervals.shift()}this.lastFrame=travel?now:0;this.draw();if(travel)this.request()}
 private request=()=>{if(!this.disposed&&!this.raf)this.raf=requestAnimationFrame(this.tick)}
 private key=(event:KeyboardEvent)=>{if(event.key==='Home'){this.custom=false;this.fit(false);event.preventDefault()}else if(event.key==='+'||event.key==='='){this.zoom(.8);event.preventDefault()}else if(event.key==='-'){this.zoom(1.25);event.preventDefault()}else if(this.navigator?.mode!=='free'&&['ArrowLeft','ArrowRight'].includes(event.key)){this.orbit(event.key==='ArrowLeft'?-.15:.15);event.preventDefault()}}
 private lost=(event:Event)=>{event.preventDefault();if(this.disposed)return;this.contextLost=true;this.dispose();this.options.onError?.(new Error('Graphics context lost. Retry to restore this view.'))}
 private abort=()=>this.dispose()
 diagnostics(){
  const summary=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return{samples:sorted.length,median:sorted[Math.floor(sorted.length*.5)]??null,p95:sorted[Math.floor(sorted.length*.95)]??null,maximum:sorted.at(-1)??null}}
  return{instanceId:this.instanceId,ready:this.ready,view:this.view,radius:this.radius,camera:this.getCamera(),target:this.getCamera().target,renderer:this.rendererName,disposed:this.disposed,contextLost:this.contextLost,domainClamps:this.domainClamps,coordinateLimitAU:1e6,geometryBufferBytes:this.geometryBufferBytes,geometryBufferBudget:64*1024*1024,renderCount:this.renderCount,quality:this.quality,pixelRatio:this.pixelRatio,viewport:this.viewport,animating:this.navigator?.animating??false,navigation:this.navigator?.mode??'orbit',independentAnimationLoops:this.disposed?0:this.initialized?1:0,ownedResources:this.assets.diagnostics().resources,assets:this.assets.diagnostics(),pipeline:this.pipeline?.diagnostics(),shaderPreparation:this.preparation,shaderFailures:this.renderer?.info.programs?.filter((p:any)=>p.diagnostics?.runnable===false).length??0,drawCalls:this.renderer?.info.render.calls??0,geometries:this.renderer?.info.memory.geometries??0,textures:this.renderer?.info.memory.textures??0,gpuMs:this.gpu?.read(),renderCpuMs:summary(this.cpu),frameIntervalsMs:summary(this.frameIntervals),frame:'ICRF',origin:'sun',units:'AU',precision:'camera-relative CPU64/GPU32',representation:this.view==='heliosphere'?'illustrative schematic; dimensions are artistic':this.view==='oort'?'theoretical range; unnamed illustrative samples':'source-position symbols; not physical disk sizes',planetsVisible:this.planetsVisible(),snapshotEpoch:this.snapshot?.epoch??null,snapshotSource:this.snapshot?.source??null,crossings:this.context?.crossings.map(c=>({id:c.id,visible:this.view==='comparison'||this.view===c.mission_id,observedDate:c.observed.date,sourceEpoch:c.geometry?.epoch??null,position:c.geometry?.position??null,quality:c.geometry?.quality??null,sourceManifest:c.geometry?.source_manifest_sha256??null}))??[],labels:this.getLabels()}
 }
 dispose(){
  if(this.disposed)return;this.disposed=true;this.ready=false;cancelAnimationFrame(this.raf);this.raf=0
  this.externalSignal?.removeEventListener('abort',this.abort);this.resize?.disconnect();this.mutation?.disconnect();this.navigator?.dispose();this.assets.dispose();this.pipeline?.dispose();this.gpu?.dispose()
  const canvas=this.renderer?.domElement;canvas?.removeEventListener('keydown',this.key);canvas?.removeEventListener('webglcontextlost',this.lost);this.scene?.clear();this.renderer?.dispose();this.renderer?.forceContextLoss();canvas?.remove();this.layers.length=0;this.anchors.length=0;this.labels.length=0
 }
}
