import * as T from 'three'
import type {SolarQuality} from './solarPresentation'
import type {PopulationKind,PopulationSummary,PopulationSearchRow,PopulationReply,PopulationRequest,PopulationEvaluation} from './solarPopulations'

export type SolarPopulationStatus={state:'loading'|'ready'|'updating'|'unavailable'|'error';summary:PopulationSummary|null;population:'asteroid-belt'|'trans-neptunian'|null;displayedJdTdb:number|null;requestedJdTdb:number|null;lagSeconds:number|null;availableCount:number;drawnCount:number;message:string}
type WorkerPort=Pick<Worker,'postMessage'|'terminate'|'onmessage'|'onerror'>
type Pending={resolve:(value:PopulationSearchRow[]|PopulationSearchRow)=>void;reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}
export const POPULATION_EVALUATION_INTERVAL_MS=100,POPULATION_MAX_WALL_AGE_MS=500
export const populationQualityStride=(quality:SolarQuality)=>quality==='efficient'?6:quality==='balanced'?2:1
export const populationVertexShader=`
#include <common>
#include <logdepthbuf_pars_vertex>
attribute vec3 positionLow;
attribute float selected;
varying float vSelected;
uniform vec3 originHigh;
uniform vec3 originLow;
uniform float pointPixels;
void main(){
 // Subtract before multiplying by modelViewMatrix: its model term contains the
 // HDR compositor's AU-to-metre scene scale, which must not be bypassed.
 vec3 relative=(position-originHigh)+(positionLow-originLow);
 vec4 mvPosition=modelViewMatrix*vec4(relative,1.0);
 gl_Position=projectionMatrix*mvPosition;
 vSelected=selected;
 gl_PointSize=pointPixels+3.0*selected;
 #include <logdepthbuf_vertex>
}`
export const populationFragmentShader=`
#include <common>
#include <logdepthbuf_pars_fragment>
uniform vec3 symbolColor;
varying float vSelected;
void main(){
 vec2 point=gl_PointCoord-vec2(.5);float radius=length(point);
 if(radius>.5)discard;
 #include <logdepthbuf_fragment>
 gl_FragColor=vec4(mix(symbolColor,vec3(1.,.95,.65),vSelected),mix(.8,1.,vSelected)*(1.-smoothstep(.32,.5,radius)));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`

/** One bounded worker, one point draw call and stable vertex-to-source indexes.
 * Positions are sampled at the disclosed worker epoch; no velocity extrapolation. */
export class SolarPopulationLayer{
 private worker:WorkerPort|null=null
 private geometry=new T.BufferGeometry()
 private material=new T.ShaderMaterial({name:'SolarSourcePopulation',vertexShader:populationVertexShader,fragmentShader:populationFragmentShader,uniforms:{originHigh:{value:new T.Vector3()},originLow:{value:new T.Vector3()},pointPixels:{value:1.8},symbolColor:{value:new T.Color('#d0bea3')}},transparent:true,depthWrite:false,depthTest:true})
 private points=new T.Points(this.geometry,this.material)
 private disposed=false
 private summary:PopulationSummary|null=null
 private population:'asteroid-belt'|'trans-neptunian'|null=null
 private selectedSourceIndex:number|null=null
 private quality:SolarQuality='balanced'
 private origin=[0,0,0]
 private requestedJd=NaN
 private requestId=0
 private generation=0
 private pendingEvaluation:{requestId:number;generation:number;population:PopulationKind;jd:number;timer:ReturnType<typeof setTimeout>}|null=null
 private pending=new Map<number,Pending>()
 private evaluation:PopulationEvaluation|null=null
 private acceptedAt=-Infinity
 private lastRequestAt=-Infinity
 private lastStatusAt=-Infinity
 private lastStatusKey=''
 private wakeTimer:ReturnType<typeof setTimeout>|null=null
 private staleTimer:ReturnType<typeof setTimeout>|null=null
 private loadTimer:ReturnType<typeof setTimeout>|null=null
 private sourceIndices=new Uint32Array()
 private failed=false
 private evaluations=0
 private ignored=0
 private loadId=0
 constructor(private scene:any,private requestFrame:()=>void,private onStatus:(status:SolarPopulationStatus)=>void=()=>{},workerFactory:()=>WorkerPort=()=>new Worker(new URL('./solarPopulation.worker.ts',import.meta.url),{type:'module'}),private now:()=>number=()=>performance.now()){
  this.geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(0),3));this.geometry.setAttribute('positionLow',new T.BufferAttribute(new Float32Array(0),3));this.geometry.setAttribute('selected',new T.BufferAttribute(new Float32Array(0),1));this.geometry.setDrawRange(0,0)
  this.points.name='Source-backed Solar population';this.points.frustumCulled=false;this.points.visible=false;scene.add(this.points)
  try{this.worker=workerFactory();this.worker.onmessage=event=>this.receive(event.data as PopulationReply);this.worker.onerror=()=>this.workerFailed();this.loadId=++this.requestId;this.worker.postMessage({type:'load',requestId:this.loadId} satisfies PopulationRequest);this.loadTimer=setTimeout(()=>this.workerFailed(),30000)}catch{this.workerFailed()}
  this.emit(true)
 }
 private workerFailed(){
  if(this.disposed)return
  this.failed=true;this.points.visible=false
  if(this.loadTimer)clearTimeout(this.loadTimer);this.loadTimer=null
  if(this.pendingEvaluation)clearTimeout(this.pendingEvaluation.timer);this.pendingEvaluation=null
  for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('Solar population worker unavailable.'))}this.pending.clear()
  this.worker?.terminate();this.worker=null;this.emit(true);this.requestFrame()
 }
 private receive(message:PopulationReply){
  if(this.disposed||this.failed)return
  if(message.type==='loaded'&&message.requestId===this.loadId){if(this.loadTimer)clearTimeout(this.loadTimer);this.loadTimer=null;this.summary=message.summary;this.emit(true);this.requestFrame();return}
  const rpc=this.pending.get(message.requestId)
  if(rpc){clearTimeout(rpc.timer);this.pending.delete(message.requestId);if(message.type==='search')rpc.resolve(message.rows);else if(message.type==='detail')rpc.resolve({sourceIndex:message.sourceIndex,body:message.body});else rpc.reject(Error('Population catalog request unavailable.'));return}
  const pending=this.pendingEvaluation
  if(pending&&message.requestId===pending.requestId){
   clearTimeout(pending.timer);this.pendingEvaluation=null
   if(pending.generation!==this.generation||pending.population!==this.population){this.ignored++;this.requestFrame();return}
   if(message.type==='evaluated'&&message.population===pending.population&&message.jdTdb===pending.jd){
    if(!this.validBuffers(message)){this.workerFailed();return}
    this.evaluation=message;this.acceptedAt=this.now();this.evaluations++;this.installBuffers();this.refreshVisibility()
    if(this.staleTimer)clearTimeout(this.staleTimer);this.staleTimer=setTimeout(()=>{this.staleTimer=null;this.requestFrame()},POPULATION_MAX_WALL_AGE_MS+1)
   }else {this.evaluation=null;this.points.visible=false}
   this.emit(true);this.requestFrame();return
  }
  if(message.type==='error'&&message.requestId===this.loadId)this.workerFailed()
 }
 private validBuffers(e:PopulationEvaluation){
  return e.indices instanceof Uint32Array&&e.positionsHigh instanceof Float32Array&&e.positionsLow instanceof Float32Array&&e.velocities instanceof Float32Array&&e.availableCount===e.indices.length&&e.positionsHigh.length===e.availableCount*3&&e.positionsLow.length===e.availableCount*3&&e.velocities.length===e.availableCount*3&&e.indices.every(i=>i<(this.summary?.bodyCount??0))&&e.positionsHigh.every(Number.isFinite)&&e.positionsLow.every(Number.isFinite)
 }
 private installBuffers(){
  const e=this.evaluation;if(!e)return
  const stride=populationQualityStride(this.quality),chosen:number[]=[]
  for(let vertex=0;vertex<e.indices.length;vertex++)if(e.indices[vertex]%stride===0||e.indices[vertex]===this.selectedSourceIndex)chosen.push(vertex)
  const high=new Float32Array(chosen.length*3),low=new Float32Array(chosen.length*3),ids=new Uint32Array(chosen.length),selected=new Float32Array(chosen.length)
  chosen.forEach((vertex,i)=>{ids[i]=e.indices[vertex];selected[i]=ids[i]===this.selectedSourceIndex?1:0;high.set(e.positionsHigh.subarray(vertex*3,vertex*3+3),i*3);low.set(e.positionsLow.subarray(vertex*3,vertex*3+3),i*3)})
  // Reuse attributes at stable capacity; a smaller visible set changes drawRange.
  const current=this.geometry.getAttribute('position')
  if(current.array.length<high.length){this.geometry.dispose();this.geometry.setAttribute('position',new T.BufferAttribute(high,3));this.geometry.setAttribute('positionLow',new T.BufferAttribute(low,3));this.geometry.setAttribute('selected',new T.BufferAttribute(selected,1))}
  else{current.array.set(high);current.needsUpdate=true;const residual=this.geometry.getAttribute('positionLow');residual.array.set(low);residual.needsUpdate=true;const highlight=this.geometry.getAttribute('selected');highlight.array.set(selected);highlight.needsUpdate=true}
  this.geometry.setDrawRange(0,chosen.length);this.sourceIndices=ids
 }
 private refreshVisibility(){
  const e=this.evaluation,epochMatches=!!e&&Math.abs(e.jdTdb-this.requestedJd)<=1e-12
  this.points.visible=!!(this.population&&e&&e.population===this.population&&e.availableCount>0&&Number.isFinite(this.requestedJd)&&e.coverageStartJdTdb!==null&&e.coverageEndJdTdb!==null&&this.requestedJd>=e.coverageStartJdTdb&&this.requestedJd<=e.coverageEndJdTdb&&(epochMatches||this.now()-this.acceptedAt<=POPULATION_MAX_WALL_AGE_MS))
 }
 private emit(force=false){
  if(this.disposed)return
  const status=this.status(),key=[status.state,status.population,status.drawnCount].join('|')
  if(!force&&key===this.lastStatusKey&&this.now()-this.lastStatusAt<100)return
  this.lastStatusAt=this.now();this.lastStatusKey=key;this.onStatus(status)
 }
 private status():SolarPopulationStatus{
  const e=this.evaluation,lag=e&&Number.isFinite(this.requestedJd)?(this.requestedJd-e.jdTdb)*86400:null
  const state=this.failed?'error':!this.summary?'loading':!this.population?'ready':this.points.visible?'ready':this.pendingEvaluation?'updating':e&&!e.availableCount?'unavailable':'updating'
  return {state,summary:this.summary,population:this.population,displayedJdTdb:e?.jdTdb??null,requestedJdTdb:Number.isFinite(this.requestedJd)?this.requestedJd:null,lagSeconds:lag,availableCount:e?.availableCount??0,drawnCount:this.points.visible?this.sourceIndices.length:0,message:state==='error'?'Population source unavailable.':state==='loading'?'Loading source catalog…':!this.population?'Population symbols hidden.':state==='unavailable'?'No source orbits are qualified at this epoch.':!this.points.visible?'Updating source positions…':'Approximate catalog symbols; source epoch shown below.'}
 }
 setPopulation(population:'asteroid-belt'|'trans-neptunian'|null){
  if(this.disposed||population===this.population)return
  if(population!==null&&!['asteroid-belt','trans-neptunian'].includes(population))throw Error('Unsupported population display.')
  this.population=population;this.material.uniforms.symbolColor.value.set(population==='trans-neptunian'?'#8fc4dd':'#d0bea3');this.invalidateEpoch()
 }
 setSelected(sourceIndex:number|null){
  if(this.disposed||sourceIndex===this.selectedSourceIndex)return
  if(sourceIndex!==null&&(!Number.isSafeInteger(sourceIndex)||sourceIndex<0||sourceIndex>=(this.summary?.bodyCount??25856)))throw Error('Invalid population selection.')
  this.selectedSourceIndex=sourceIndex;this.installBuffers();this.refreshVisibility();this.emit(true);this.requestFrame()
 }
 /** The parent clock calls this on a seek, independent of continuous rate/reverse playback. */
 invalidateEpoch(){if(this.disposed)return;this.generation++;this.evaluation=null;this.sourceIndices=new Uint32Array();this.geometry.setDrawRange(0,0);this.points.visible=false;this.lastRequestAt=-Infinity;this.emit(true);this.requestFrame()}
 update(epochTdb:number,cameraOriginAU:readonly number[],quality:SolarQuality){
  if(this.disposed)return
  if(cameraOriginAU.length!==3||!cameraOriginAU.every(Number.isFinite)){this.points.visible=false;return}
  this.origin=[...cameraOriginAU];this.requestedJd=epochTdb
  for(let i=0;i<3;i++){const high=Math.fround(this.origin[i]);this.material.uniforms.originHigh.value.setComponent(i,high);this.material.uniforms.originLow.value.setComponent(i,Math.fround(this.origin[i]-high))}
  if(quality!==this.quality){this.quality=quality;this.material.uniforms.pointPixels.value=quality==='efficient'?1.4:quality==='balanced'?1.8:2.1;this.installBuffers()}
  this.refreshVisibility();this.emit()
  if(!this.worker||!this.summary||!this.population||this.pendingEvaluation||!Number.isFinite(epochTdb)||(this.evaluation?.population===this.population&&this.evaluation.jdTdb===epochTdb))return
  const delay=POPULATION_EVALUATION_INTERVAL_MS-(this.now()-this.lastRequestAt)
  if(delay>0){if(!this.wakeTimer)this.wakeTimer=setTimeout(()=>{this.wakeTimer=null;if(!this.disposed)this.requestFrame()},delay);return}
  const requestId=++this.requestId
  this.lastRequestAt=this.now();this.pendingEvaluation={requestId,generation:this.generation,population:this.population,jd:epochTdb,timer:setTimeout(()=>this.workerFailed(),15000)}
  this.worker.postMessage({type:'evaluate',requestId,jdTdb:epochTdb,population:this.population} satisfies PopulationRequest)
 }
 private rpc(request:{type:'search';query:string;population?:PopulationKind}|{type:'detail';sourceIndex:number}):Promise<PopulationSearchRow[]|PopulationSearchRow>{
  if(this.disposed||!this.worker||!this.summary)return Promise.reject(Error('Population catalog is not available.'))
  const requestId=++this.requestId
  return new Promise((resolve,reject)=>{this.pending.set(requestId,{resolve,reject,timer:setTimeout(()=>{this.pending.delete(requestId);reject(Error('Population catalog request timed out.'))},15000)});this.worker!.postMessage({...request,requestId})})
 }
 query(query:string,population?:PopulationKind){return this.rpc({type:'search',query,population}) as Promise<PopulationSearchRow[]>}
 detail(sourceIndex:number){return this.rpc({type:'detail',sourceIndex}) as Promise<PopulationSearchRow>}
 /** x/y are local viewport CSS pixels; camera is the camera-relative AU view camera.
  * Root tests opaque-body hits first, because DOM picking has no depth buffer. */
 pick(camera:any,x:number,y:number,width:number,height:number,radius=7):number|null{
  if(this.disposed||!this.points.visible||width<=0||height<=0)return null
  const high=this.geometry.getAttribute('position').array,low=this.geometry.getAttribute('positionLow').array,point=new T.Vector3();let nearest=radius*radius,result:number|null=null
  for(let vertex=0;vertex<this.sourceIndices.length;vertex++){
   const i=vertex*3;point.set(high[i]+low[i]-this.origin[0],high[i+1]+low[i+1]-this.origin[1],high[i+2]+low[i+2]-this.origin[2]).project(camera)
   if(!Number.isFinite(point.x)||point.z< -1||point.z>1)continue
   const distance=((point.x+1)*width/2-x)**2+((1-point.y)*height/2-y)**2
   if(distance<nearest){nearest=distance;result=this.sourceIndices[vertex]}
  }
  return result
 }
 diagnostics(){return {...this.status(),disposed:this.disposed,evaluations:this.evaluations,ignoredResponses:this.ignored,pendingEvaluation:!!this.pendingEvaluation,pendingCatalogRequests:this.pending.size,workerActive:!!this.worker,drawCalls:this.points.visible?1:0,qualityStride:populationQualityStride(this.quality),selectedSourceIndex:this.selectedSourceIndex,maxWallAgeMs:POPULATION_MAX_WALL_AGE_MS,extrapolation:false}}
 dispose(){
  if(this.disposed)return;this.disposed=true
  for(const timer of [this.wakeTimer,this.staleTimer,this.loadTimer,this.pendingEvaluation?.timer])if(timer)clearTimeout(timer)
  for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('Solar population view closed.'))}this.pending.clear()
  if(this.worker){this.worker.onmessage=null;this.worker.onerror=null;this.worker.terminate();this.worker=null}
  this.scene.remove(this.points);this.geometry.dispose();this.material.dispose();this.sourceIndices=new Uint32Array();this.evaluation=null;this.summary=null;this.pendingEvaluation=null
 }
}
