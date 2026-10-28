import * as T from 'three'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'
import {TilesRenderer,Ellipsoid} from '3d-tiles-renderer'
import {LRUCache,PriorityQueue,DownloadPriorityQueue} from '3d-tiles-renderer/core'
import {gpuTiming} from '../solar/solarGpuTiming'
import {lunarFrame,localToBodyFixed,terrainBudget,type TerrainManifest,type TerrainQuality,type Vec3} from './terrainContracts'
import {TerrainTransport} from './terrainTransport'

export type TerrainPose={camera:Vec3;target:Vec3}
export type TerrainStatus={ready:boolean;lost:boolean;failed:number;visible:number;levels:number[];notice:string}
export type TerrainScene={dispose:()=>void;diagnostics:()=>any;pose:()=>TerrainPose;zoom:(factor:number)=>void;orbit:(angle:number)=>void;view:(preset:'overview'|'detail'|'top')=>void;retry:()=>void;setQuality:(quality:TerrainQuality)=>void;setReducedMotion:(reduced:boolean)=>void;setRelief:(enabled:boolean)=>void}

/** NASA owns tile traversal/loading; this adapter owns a single local lunar scene. */
export function mountTerrainScene(host:HTMLElement,manifest:TerrainManifest,options:{quality:TerrainQuality;reduced:boolean;initial?:TerrainPose;onStatus:(status:TerrainStatus)=>void;onRestore:(pose:TerrainPose)=>void}):TerrainScene{
 const started=performance.now(),frame=lunarFrame(manifest.latitudeDeg,manifest.longitudeDeg,manifest.centerBodyFixedM)
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(45,1,1,150000)
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:options.quality==='efficient'?'low-power':'high-performance'})
 renderer.setClearColor('#03060c');renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NoToneMapping
 const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Apollo 17 measured terrain. Drag to orbit, two fingers to pan, pinch or scroll to zoom. Arrow keys orbit; plus and minus zoom; Home restores the overview.');host.append(canvas)
 camera.up.set(0,0,1)
 const gpu=gpuTiming(renderer.getContext()),controls=new OrbitControls(camera,canvas)
 controls.enableDamping=!options.reduced;controls.dampingFactor=.13;controls.screenSpacePanning=false;controls.minDistance=80;controls.maxDistance=Math.max(...manifest.extentM)*12;controls.maxPolarAngle=Math.PI*.475;controls.minPolarAngle=.04;controls.zoomSpeed=.8
 const tiles=new TilesRenderer(manifest.tilesetUrl),transport=new TerrainTransport(manifest,location.origin)
 // The package defaults to WGS84. This dataset is a 1,737,400 m lunar sphere.
 tiles.ellipsoid=new Ellipsoid(manifest.radiusM,manifest.radiusM,manifest.radiusM);tiles.ellipsoid.name='Moon reference sphere';tiles.surface=tiles.ellipsoid
 // Own the caches and queues: v0.5.3 otherwise shares global defaults.
 const lru=new LRUCache();lru.unloadPriorityCallback=tiles.lruCache.unloadPriorityCallback;tiles.lruCache=lru
 const downloads=new DownloadPriorityQueue();downloads.priorityCallback=tiles.downloadQueue.priorityCallback;tiles.downloadQueue=downloads
 const parsing=new PriorityQueue();parsing.priorityCallback=tiles.parseQueue.priorityCallback;tiles.parseQueue=parsing
 const nodes=new PriorityQueue();nodes.priorityCallback=tiles.processNodeQueue.priorityCallback;tiles.processNodeQueue=nodes
 tiles.registerPlugin(transport);tiles.setCamera(camera)
 const f=frame,dot=(v:Vec3)=>v.reduce((sum,n,i)=>sum+n*f.origin[i],0)
 tiles.group.matrixAutoUpdate=false
 tiles.group.matrix.set(...[...f.east,-dot(f.east),...f.north,-dot(f.north),...f.up,-dot(f.up),0,0,0,1])
 scene.add(tiles.group)
 const sun=new T.DirectionalLight('#ffffff',2);sun.position.set(-1,-1,2);scene.add(sun,new T.AmbientLight('#ffffff',.6))
 const span=Math.max(...manifest.extentM),originHeight=Math.hypot(...manifest.centerBodyFixedM)-manifest.radiusM
 const middle=(manifest.heightRangeM[0]+manifest.heightRangeM[1])/2-originHeight
 let disposed=false,lost=false,raf=0,renderCount=0,quality=options.quality,reduced=options.reduced,relief=false,notice='',lastStatus=0,lastFrame=0,firstModelMs:number|null=null,firstVisibleMs:number|null=null
 let frameIntervals:number[]=[],cpuMs:number[]=[],loadedCount=0,disposedModels=0,lastPublished='',cameraDirty=true
 const auxiliaryMaterials=new Map<any,any[]>(),visibleLevels=()=>[...new Set([...tiles.visibleTiles].map(t=>t.internal.depth))].sort((a,b)=>a-b)
 const request=()=>{if(!disposed&&!lost&&!document.hidden&&!raf)raf=requestAnimationFrame(tick)}
 function pose():TerrainPose{return{camera:camera.position.toArray(),target:controls.target.toArray()}}
 function status(force=false){const now=performance.now(),value={ready:tiles.visibleTiles.size>0,lost,failed:(tiles as any).stats.failed,visible:tiles.visibleTiles.size,levels:visibleLevels(),notice},key=JSON.stringify(value);if(!force&&key===lastPublished&&now-lastStatus<350)return;lastPublished=key;lastStatus=now;options.onStatus(value)}
 function setQuality(value:TerrainQuality){quality=value;const budget=terrainBudget(value,devicePixelRatio);renderer.setPixelRatio(budget.pixelRatio);tiles.errorTarget=budget.errorTarget;tiles.maxTilesProcessed=budget.maxTilesProcessed;lru.maxSize=budget.cacheTiles;lru.minSize=Math.floor(budget.cacheTiles*.65);lru.maxBytesSize=budget.cacheBytes;lru.minBytesSize=Math.floor(budget.cacheBytes*.65);lru.unloadPercent=1;downloads.maxJobsPerOrigin=budget.downloadJobs;parsing.maxJobs=budget.parseJobs;nodes.maxJobs=budget.nodeJobs;resize()}
 function resize(){if(disposed)return;const rect=host.getBoundingClientRect();if(rect.width<1||rect.height<1)return;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();tiles.setResolutionFromRenderer(camera,renderer);request()}
 function view(preset:'overview'|'detail'|'top'){
  controls.target.set(0,0,middle)
  const fit=Math.max(1,1/Math.max(camera.aspect,.35)),distance=span*(preset==='detail'?.24:1.15)*fit
  if(preset==='top')camera.position.set(0,-distance*.02,middle+distance)
  else camera.position.set(distance*.33,-distance*.78,middle+distance*.67)
  controls.update();lastFrame=0;request()
 }
 function zoom(factor:number){if(!Number.isFinite(factor)||factor<=0)return;camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();lastFrame=0;request()}
 function orbit(angle:number){const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new T.Vector3(0,0,1),angle);camera.position.copy(controls.target).add(offset);controls.update();lastFrame=0;request()}
 const ray=new T.Raycaster(),down=new T.Vector3(0,0,-1)
 function constrain(){
  controls.target.x=T.MathUtils.clamp(controls.target.x,-manifest.extentM[0]*.48,manifest.extentM[0]*.48)
  controls.target.y=T.MathUtils.clamp(controls.target.y,-manifest.extentM[1]*.48,manifest.extentM[1]*.48)
  camera.position.z=Math.max(camera.position.z,manifest.heightRangeM[0]-originHeight+25)
  if(tiles.visibleTiles.size&&Math.abs(camera.position.x)<manifest.extentM[0]/2&&Math.abs(camera.position.y)<manifest.extentM[1]/2){
   ray.set(new T.Vector3(camera.position.x,camera.position.y,manifest.heightRangeM[1]-originHeight+1000),down)
   ray.firstHitOnly=true
   const hit=ray.intersectObject(tiles.group,true)[0]
   if(hit)camera.position.z=Math.max(camera.position.z,hit.point.z+25)
  }
 }
 function tick(now:number){
  raf=0;if(disposed||lost||document.hidden)return
  const begin=performance.now(),moved=controls.update();if(moved||cameraDirty)constrain();cameraDirty=false
  camera.updateMatrixWorld();scene.updateMatrixWorld(true);tiles.update()
  gpu.begin();renderer.render(scene,camera);gpu.end();renderCount++
  if(firstVisibleMs===null&&tiles.visibleTiles.size)firstVisibleMs=performance.now()-started
  cpuMs.push(performance.now()-begin);if(cpuMs.length>180)cpuMs.shift()
  if(lastFrame&&now-lastFrame<250){frameIntervals.push(now-lastFrame);if(frameIntervals.length>180)frameIntervals.shift()}lastFrame=now
  status();if(moved&&controls.enableDamping)request()
 }
 function onModel(event:any){
  if(disposed)return;loadedCount++;if(firstModelMs===null)firstModelMs=performance.now()-started
  const extras:any[]=[]
  event.scene.traverse((mesh:any)=>{if(!mesh.isMesh)return;const original=mesh.material;mesh.userData.terrainOriginal=original;mesh.userData.terrainRelief=null;mesh.userData.terrainExtras=extras;if(relief)applyRelief(mesh)})
  auxiliaryMaterials.set(event.scene,extras);cameraDirty=true;request();status(true)
 }
 function applyRelief(mesh:any){
  if(relief&&!mesh.userData.terrainRelief){
   if(!mesh.geometry.attributes.normal){mesh.geometry.computeVertexNormals();const tile=mesh.userData.tile;if(tile)lru.setMemoryUsage(tile,lru.getMemoryUsage(tile)+mesh.geometry.attributes.normal.array.byteLength)}
   const material=new T.MeshLambertMaterial({color:'#adadad',side:T.FrontSide})
   mesh.userData.terrainRelief=material;mesh.userData.terrainExtras.push(material)
  }
  mesh.material=relief?mesh.userData.terrainRelief:mesh.userData.terrainOriginal
 }
 function onDisposeModel(event:any){disposedModels++;for(const material of auxiliaryMaterials.get(event.scene)||[])material.dispose();auxiliaryMaterials.delete(event.scene)}
 const onUpdate=()=>{cameraDirty=true;request()},onLoadError=(event:any)=>{if(disposed||transport.diagnostics().disposed)return;notice=event.error?.message||'A local terrain tile failed. Retry retains the camera.';status(true);request()}
 tiles.addEventListener('load-model',onModel);tiles.addEventListener('dispose-model',onDisposeModel);tiles.addEventListener('needs-update',onUpdate);tiles.addEventListener('tile-visibility-change',onUpdate);tiles.addEventListener('load-error',onLoadError)
 const onChange=()=>{cameraDirty=true;request()},onKey=(event:KeyboardEvent)=>{if(event.altKey||event.ctrlKey||event.metaKey)return;let handled=true;if(event.key==='ArrowLeft')orbit(-.12);else if(event.key==='ArrowRight')orbit(.12);else if(event.key==='+'||event.key==='=')zoom(.8);else if(event.key==='-')zoom(1.25);else if(event.key==='Home')view('overview');else if(event.key==='ArrowUp'||event.key==='ArrowDown'){const offset=camera.position.clone().sub(controls.target),r=offset.length(),az=Math.atan2(offset.y,offset.x),el=T.MathUtils.clamp(Math.asin(offset.z/r)+(event.key==='ArrowUp'?.1:-.1),.1,1.5);camera.position.set(controls.target.x+r*Math.cos(el)*Math.cos(az),controls.target.y+r*Math.cos(el)*Math.sin(az),controls.target.z+r*Math.sin(el));controls.update();request()}else handled=false;if(handled)event.preventDefault()}
 const onVisibility=()=>{lastFrame=0;if(document.hidden){cancelAnimationFrame(raf);raf=0}else request()}
 const onLost=(event:Event)=>{event.preventDefault();lost=true;cancelAnimationFrame(raf);raf=0;notice='The terrain graphics context stopped. Restore or retry keeps this camera and UTC.';status(true)}
 const onRestored=()=>{if(!disposed)options.onRestore(pose())}
 controls.addEventListener('change',onChange);canvas.addEventListener('keydown',onKey);canvas.addEventListener('webglcontextlost',onLost);canvas.addEventListener('webglcontextrestored',onRestored);document.addEventListener('visibilitychange',onVisibility)
 const observer=new ResizeObserver(resize);observer.observe(host)
 setQuality(quality);view('overview')
 if(options.initial&&[...options.initial.camera,...options.initial.target].every(Number.isFinite)){camera.position.fromArray(options.initial.camera);controls.target.fromArray(options.initial.target);controls.update();request()}
 const summarize=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b);return{samples:sorted.length,median:sorted.length?sorted[Math.floor(sorted.length*.5)]:null,p95:sorted.length?sorted[Math.floor(sorted.length*.95)]:null}}
 return{
  pose,zoom,orbit,view,setQuality,
  setReducedMotion(value){reduced=value;controls.enableDamping=!value;request()},
  setRelief(value){relief=value;tiles.forEachLoadedModel((model:any)=>model.traverse((mesh:any)=>{if(mesh.isMesh)applyRelief(mesh)}));request()},
  retry(){if(disposed||lost)return;notice='';tiles.resetFailedTiles();status(true);request()},
  diagnostics(){return{library:{name:'3d-tiles-renderer',version:'0.5.3',constructor:tiles.constructor.name,instanceOfTilesRenderer:tiles instanceof TilesRenderer,threeRevision:T.REVISION},source:{region:manifest.regionId,frame:manifest.frame,heightDatum:manifest.heightDatum,elevationResolutionM:manifest.elevationResolutionM,imageryResolutionM:manifest.imageryResolutionM,centerBodyFixedM:manifest.centerBodyFixedM,ellipsoidRadiiM:tiles.ellipsoid.radius.toArray()},disposed,lost,quality,reduced,relief,pose:pose(),cameraBodyFixedM:localToBodyFixed(camera.position.toArray(),frame),renderCount,firstModelMs,firstVisibleMs,stats:{...(tiles as any).stats},visibleLevels:visibleLevels(),visibleTiles:[...tiles.visibleTiles].map(t=>({depth:t.internal.depth,geometricError:t.geometricError,uri:t.content?.uri})),loadedCount,disposedModels,cache:{bytes:(lru as any).cachedBytes,maxBytes:lru.maxBytesSize,maxTiles:lru.maxSize},transport:transport.diagnostics(),queues:{downloads:downloads.maxJobsPerOrigin,parse:parsing.maxJobs,nodes:nodes.maxJobs},graphics:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:renderer.info.programs?.length??0,pixelRatio:renderer.getPixelRatio()},activeFrameIntervalsMs:summarize(frameIntervals),cpuFrameMs:summarize(cpuMs),gpuMs:gpu.read()}}
  ,dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);raf=0;observer.disconnect();document.removeEventListener('visibilitychange',onVisibility);canvas.removeEventListener('keydown',onKey);canvas.removeEventListener('webglcontextlost',onLost);canvas.removeEventListener('webglcontextrestored',onRestored);controls.removeEventListener('change',onChange);controls.dispose();transport.dispose();tiles.dispose();tiles.removeEventListener('load-model',onModel);tiles.removeEventListener('dispose-model',onDisposeModel);tiles.removeEventListener('needs-update',onUpdate);tiles.removeEventListener('tile-visibility-change',onUpdate);tiles.removeEventListener('load-error',onLoadError);for(const materials of auxiliaryMaterials.values())for(const material of materials)material.dispose();auxiliaryMaterials.clear();gpu.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove()}
 }
}
