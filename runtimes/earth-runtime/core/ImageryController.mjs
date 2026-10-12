import {TileMapServiceImageryProvider,ImageryLayer,Cartesian2,Math as CesiumMath} from 'cesium';
import {MapSourceController} from 'gods-eye-view/maps/controller';
import {createAdmittedMapSources,createLabels,SOURCE_FACTS} from './AdmittedMapSources.mjs';
import {chooseImagery,contains,containsView,inRing,CONUS,PEMA_COVERAGE,ORAS_NAIP_RING} from './ImagerySelectionPolicy.mjs';
import {observeImageryRequests,createImageryAvailability} from './imageryRequests.mjs';
import {openImagerySession} from './imagerySession.mjs';

export class ImageryController {
 constructor(runtime,quality){
  this.runtime=runtime;this.viewer=runtime.viewer;this.quality=quality;this.epoch=0;this.session=openImagerySession();this.mode='auto';this.selectionGeneration=0;this.actual='local';this.status='loading';this.reason='';
  this.records=new Map();this.cooldowns=new Map();this.failureCounts=new Map();this.failedSources=new Set();this.cachedFallbacks=new Set();this.failedConstructions=new Set();this.budget=createImageryAvailability();this.controllersCreated=0;this.localAllocations=0;
  this.footprints=[{ring:ORAS_NAIP_RING,verifiedOras:true}];this.metadataLast=-Infinity;this.metadataCount=0;this.labelsWanted=false;
  runtime.lifecycle.add(()=>this.clear());
 }
 async retry(config=this.config){
  if(this.pending)return this.pending;
  this.pending=(this.base?this.retrySelected():this.initialize(config)).finally(()=>{this.pending=null});return this.pending;
 }
 async initialize(config){
  this.config=config;
  if(!this.base){
   const local=await TileMapServiceImageryProvider.fromUrl('/earth-runtime/cesium/Assets/Textures/NaturalEarthII');
   if(this.runtime.lifecycle.closed)return;
   this.base=this.viewer.imageryLayers.addImageryProvider(local,0);this.localAllocations++;
   this.localGuard=observeImageryRequests(local,{onLoad:()=>this.runtime.timings.firstImageryTileMs??=performance.now()});
   this.offCamera=this.viewer.camera.moveEnd.addEventListener(()=>{clearTimeout(this.cameraTimer);this.cameraTimer=setTimeout(()=>void this.updateView(),250)});
   this.wakeTimer=setInterval(()=>{if(this.runtime.lifecycle.closed)return;const previous=this.status,unsettled=this.viewer.scene.globe.tilesLoaded===false;if(this.map){this.status=this.loadingStatus();}if(this.map&&(previous!==this.status||unsettled||this.budget.stats.active))this.refresh();if(this.mode==='auto'&&!this.updating&&!this.switching&&this.needsUpdate())void this.updateView();},500);
   this.mountStatus();
  }
  await this.updateView();
 }
 view(){
  const camera=this.viewer.camera,p=camera.positionCartographic,r=camera.computeViewRectangle(this.viewer.scene.globe.ellipsoid);
  const rect=r?[r.west,r.south,r.east,r.north].map(CesiumMath.toDegrees):null;
  // The camera subpoint is not the displayed ground center when tilted. Prefer
  // the rendered globe intersection, with the public ellipsoid pick for startup.
  const scene=this.viewer.scene,pixel=new Cartesian2(this.viewer.canvas.clientWidth/2,this.viewer.canvas.clientHeight/2),ray=camera.getPickRay(pixel);
  const target=ray?scene.globe.pick(ray,scene)??camera.pickEllipsoid(pixel,scene.globe.ellipsoid):null;
  const ground=target?scene.globe.ellipsoid.cartesianToCartographic(target):null;
  const point=ground?[CesiumMath.toDegrees(ground.longitude),CesiumMath.toDegrees(ground.latitude)]:null;
  const corners=rect?[[rect[0],rect[1]],[rect[0],rect[3]],[rect[2],rect[1]],[rect[2],rect[3]]]:[];
  const footprint=point&&this.footprints.find(f=>inRing(point,f.ring)&&corners.length===4&&corners.every(c=>inRing(c,f.ring)));
  return {height:p.height,rect,point,naipCovered:!!footprint,verifiedOras:!!footprint?.verifiedOras,footprint};
 }
 eligible(id){return !this.failedSources.has(id)&&performance.now()>=(this.cooldowns.get(id)??0)&&this.budget.eligible(SOURCE_FACTS[id]?.host??'');}
 desired(view){
  let id=this.mode==='auto'?chooseImagery(view,this.actual):this.mode;
  if(id==='ion'&&!this.session.canUseIon(this.config?.ionSessionTileLimit)){this.reason='Ion tab-session limit reached or ledger unavailable';id='nasa';}
  if(id==='pema'&&!contains(PEMA_COVERAGE,view.point)){this.reason='Outside verified PEMA coverage';id='usgs-naip';}
  if(id==='usgs-naip'&&(!containsView(CONUS,view.rect)||!view.naipCovered)){this.reason='NAIP footprint unverified or partial view';id='eox-2016';}
  if(id==='eox-2016'&&!containsView([-180,-85.051129,180,85.051129],view.rect)){this.reason='Outside Web Mercator coverage';id='nasa';}
  const fallbacks={pema:'usgs-naip','usgs-naip':'eox-2016','eox-2016':'nasa',osm:'nasa',ion:'nasa',nasa:'local'};
  while(id!=='local'&&!this.eligible(id)){this.reason='Source cooldown or host unavailable';id=fallbacks[id]??'local';}
  return id;
 }
 async select(mode,force=false){
  if(this.runtime.lifecycle.closed||!this.base)return;
  if(!['auto','local',...Object.keys(SOURCE_FACTS).filter(id=>id!=='local')].includes(mode))return;
  if(mode==='ion'&&!this.registry?.sources.some(source=>source.descriptor.id==='ion')&&!this.config?.ionImageryOptIn){this.reason='Ion not configured or authorized';this.refresh();return;}
  if(this.mode!==mode){this.selectionGeneration++;this.metadataAbort?.abort();}this.mode=mode;const view=this.view(),key=this.cameraKey(view);if(key!==this.viewKey){this.viewKey=key;this.refinementStarted=performance.now();}this.reason='';const id=this.desired(view);
  if(id==='local'){this.terminal(mode==='local'?'Local selected':'Remote imagery unavailable');return;}
  if(!this.map)this.createController();
  if(!this.map.isStackAvailable(id)){this.reason='Source not admitted';this.refresh();return;}
  if(!force&&((id===this.map.getActiveId()&&this.managed&&!this.switching)||(id===this.requestedId&&this.switching))){this.refresh();return;}
  this.requestedId=id;this.switches=(this.switches??0)+1;this.switching=true;try{await this.map.setStack(id);}finally{this.switching=--this.switches>0;}if(!this.runtime.lifecycle.closed)this.refresh();
 }
 createController(){
  const epoch=++this.epoch;this.controllersCreated++;
  const config=this.session.canUseIon(this.config?.ionSessionTileLimit)?this.config:{...this.config,ionImageryOptIn:false};
  this.registry=createAdmittedMapSources(config,(id,factory,request)=>this.provider(id,factory,request,epoch));
  this.map=new MapSourceController(this.viewer,{registry:this.registry,initialStack:'nasa',requestRender:()=>this.viewer.scene.requestRender(),
   createImageryLayer:provider=>{const record=this.records.get(provider);if(record){this.replacedRecord=this.activeRecord;this.activeRecord=record;}this.managed=new ImageryLayer(provider);return this.managed;},
   onChange:state=>{if(epoch!==this.epoch)return;if(state.status==='switching')this.status='loading';this.refresh();},
   onError:()=>{if(epoch===this.epoch)this.reason='Selected source unavailable; fallback retained';},
  });
  this.unsubscribe=this.map.subscribe(state=>{
   if(epoch!==this.epoch)return;
   // Activation can report a nominal ready state after a rejected factory. A
   // managed layer actually attached to the collection is the ownership proof.
   if(!this.managed||this.viewer.imageryLayers.indexOf(this.managed)<0){this.terminal('Remote construction failed');return;}
   if(state.switchOrigin==='automatic'&&state.activeId!==this.requestedId){for(const id of this.failedConstructions)this.cachedFallbacks.add(id);}
   if(state.switchOrigin==='automatic'&&this.replacedRecord?.tileFailures&&this.replacedRecord.id!==state.activeId)this.markFailed(this.replacedRecord.id);this.replacedRecord=null;
   this.actual=state.activeId;this.activeRecord=this.records.get(this.managed.imageryProvider);if(this.eligible(this.actual))this.activeRecord?.guard.resume();else{this.status='unavailable';queueMicrotask(()=>{if(epoch===this.epoch&&!this.runtime.lifecycle.closed)void this.select(this.mode,true)});return;}
   this.status=this.loadingStatus();if(state.lastError)this.reason='Selected source unavailable; showing fallback';
   this.order();void this.syncLabels();this.refresh();
  });
 }
 async provider(id,factory,{signal},epoch){
  if(!this.eligible(id))throw Error('Source cooling down');
  let provider;
  try{provider=await factory();signal.throwIfAborted();if(epoch!==this.epoch)throw Error('Stale imagery construction');}
  catch(error){if(provider&&typeof provider.destroy==='function'&&!provider.isDestroyed?.())provider.destroy();if(epoch===this.epoch&&!this.runtime.lifecycle.closed){this.budget.block(SOURCE_FACTS[id].host,error);this.markFailed(id);this.failedConstructions.add(id);}throw error;}
  const record={id,provider,loaded:false,epoch,reportedErrors:new WeakSet()};
  const owned=()=>epoch===this.epoch&&this.activeRecord===record&&!this.runtime.lifecycle.closed;
  const live=()=>owned()&&this.map?.getState().status!=='switching'&&!record.guard.paused;
  const hardFailure=error=>{this.budget.block(SOURCE_FACTS[id].host,error?.error??error);return !this.budget.eligible(SOURCE_FACTS[id].host);};
  const fail=error=>{if(epoch!==this.epoch||this.runtime.lifecycle.closed)return;
   const wasLive=live(),hard=hardFailure(error);if(hard){this.markFailed(id);this.stopBlockedHost(SOURCE_FACTS[id].host);}if(!wasLive)return;
   if(hard||id==='nasa'){this.markFailed(id);this.reason='Imagery tiles unavailable';this.stopBlockedHost(SOURCE_FACTS[id].host);queueMicrotask(()=>{if(owned()){if(id==='nasa')this.terminal('NASA unavailable; local safety base');else void this.select(this.mode,true);}});}
   else{record.partial=true;this.refresh();if(error.imageryGuardFailure)setTimeout(()=>{if(live()&&!record.reportedErrors.has(error))provider.errorEvent.raiseEvent(error);},0);}
  };
  record.guard=observeImageryRequests(provider,{budget:this.budget,host:SOURCE_FACTS[id].host,
   canDispatch:()=>id!=='ion'||this.session.canUseIon(this.config.ionSessionTileLimit),
   onDispatch:()=>{if(id==='ion')this.session.recordIonRequest();},onLimit:()=>fail(Error('Ion tab-session limit reached or ledger unavailable')),
   isEmpty:id==='usgs-naip'?(image,args)=>this.emptyImage(image,record,args[2]):()=>false,
   onLoad:(_image,args)=>{if(!live())return;record.loaded=true;this.failureCounts.delete(id);this.status=this.loadingStatus();this.runtime.timings.firstImageryTileMs??=performance.now();if((id==='usgs-naip'&&args[2]>=17)||(id==='pema'&&args[2]>=18))this.runtime.timings.firstHdTileMs??=performance.now();},onError:fail});
  record.off=provider.errorEvent.addEventListener(error=>{
   if(error)error.retry=false;if(!live())return;const cause=error?.error??error;if(cause&&typeof cause==='object')record.reportedErrors.add(cause);record.tileFailures=(record.tileFailures??0)+1;
   if(hardFailure(error)||id==='nasa'){this.markFailed(id);this.stopBlockedHost(SOURCE_FACTS[id].host);queueMicrotask(()=>{if(owned()){if(id==='nasa')this.terminal('NASA unavailable; local safety base');else void this.select(this.mode,true);}});}
   else record.partial=true;
   this.refresh();
  });
  this.records.set(provider,record);
  return provider;
 }
 emptyImage(image,record,level){
  if(typeof document==='undefined'||!image?.width||!image?.height)return false;
  try{const canvas=document.createElement('canvas');canvas.width=canvas.height=16;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,16,16);const pixels=context.getImageData(0,0,16,16).data;let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])visible++;if(level>=12&&visible&&visible<256)record.partial=true;return level>=12&&!visible;}catch{record.partial=true;return false;}
 }
 stopBlockedHost(host){if(this.budget.eligible(host))return;for(const record of this.records.values())if(SOURCE_FACTS[record.id].host===host)record.guard.pause();if(host==='tiles.maps.eox.at'){this.labelsWanted=false;this.removeLabels();}}
 order(){
  // Upstream inserts at index zero. Raise only the exact owned handle once,
  // leaving all independent event imagery identities and relative order intact.
  const layers=this.viewer.imageryLayers;if(this.managed&&layers.indexOf(this.managed)===0)layers.raise(this.managed);
  if(this.labels?.layer){while(layers.indexOf(this.labels.layer)<2)layers.raise(this.labels.layer);}
  this.viewer.scene.requestRender();
 }
 disposeController(){
  this.epoch++;this.unsubscribe?.();this.unsubscribe=null;for(const record of this.records.values()){record.off();record.guard.stop();}
  this.map?.destroy();this.map=null;this.managed=null;this.activeRecord=null;this.records.clear();this.cachedFallbacks.clear();this.failedConstructions.clear();this.removeLabels();this.runtime.attribution.remove('imagery');
 }
 terminal(reason){this.disposeController();this.actual='local';this.status=this.mode==='local'?'ready':'unavailable';this.reason=reason;this.refresh();}
 markFailed(id){
  // Duplicate SDK/guard notifications represent one failure, not two attempts.
  if(this.failedSources.has(id))return;
  const count=(this.failureCounts.get(id)??0)+1;this.failureCounts.set(id,count);
  this.failedSources.add(id);this.cooldowns.set(id,performance.now()+Math.min(900000,60000*2**Math.min(count-1,4)));
 }
 canQueryFootprint(view=this.view()){
  return !(this.eligible('pema')&&chooseImagery(view,this.actual)==='pema')&&!!view.point&&view.height<150000&&!view.naipCovered&&containsView(CONUS,view.rect)&&this.mode==='auto'&&this.metadataCount<32&&!this.metadataPending&&performance.now()-this.metadataLast>=60000&&this.eligible('usgs-naip');
 }
 needsUpdate(){
  if(this.canQueryFootprint())return true;
  return [...this.failedSources].some(id=>{
   const host=SOURCE_FACTS[id]?.host??'',blocked=this.budget.blocked.get(host);
   return performance.now()>=(this.cooldowns.get(id)??0)&&(!blocked||(blocked.status===429&&performance.now()>=blocked.until));
  });
 }
 recoverEligible(){
  for(const id of this.failedSources){const host=SOURCE_FACTS[id]?.host??'';
   if(performance.now()<(this.cooldowns.get(id)??0)||!this.budget.retryHost(host)||!this.budget.eligible(host))continue;
   this.failedSources.delete(id);
  }
 }
 async retrySelected(){return this.updateView();}
 cameraKey(view=this.view()){const c=this.viewer.camera,p=c.positionCartographic;return JSON.stringify([p.longitude,p.latitude,p.height,c.heading,c.pitch,c.roll,view.rect]);}
 async updateView(){
  if(this.runtime.lifecycle.closed||!this.base)return;
  const generation=this.updateGeneration=(this.updateGeneration??0)+1;
  if(this.metadataPending&&this.metadataKey!==this.cameraKey())this.metadataAbort?.abort();
  {
   this.recoverEligible();
   const wanted=this.desired(this.view());
   // Public API has no single-entry eviction. Only retrying a successful cached
   // construction fallback requires losing remote caches; ordinary retries keep them.
   if(this.cachedFallbacks.has(wanted)&&this.eligible(wanted))this.disposeController();
   await this.select(this.mode);
  }
  if(generation!==this.updateGeneration||this.runtime.lifecycle.closed)return;
  const view=this.view();if(this.canQueryFootprint(view))await this.queryFootprint(view);
 }
 async queryFootprint(view){
  this.metadataPending=true;this.metadataLast=performance.now();this.metadataCount++;
  this.metadataAbort?.abort();this.metadataAbort=new AbortController();const epoch=this.epoch,key=this.cameraKey(view),generation=this.selectionGeneration;this.metadataKey=key;
  const params=new URLSearchParams({f:'json',geometry:JSON.stringify({x:view.point[0],y:view.point[1],spatialReference:{wkid:4326}}),geometryType:'esriGeometryPoint',inSR:'4326',outSR:'4326',spatialRel:'esriSpatialRelIntersects',where:'Category=1',outFields:'Name',returnGeometry:'true',resultRecordCount:'1'});
  try{const response=await fetch('https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer/query?'+params,{signal:AbortSignal.any([this.metadataAbort.signal,this.runtime.lifecycle.controller.signal,AbortSignal.timeout(20000)])});if(!response.ok){this.budget.block(SOURCE_FACTS['usgs-naip'].host,{statusCode:response.status,retryAfter:response.headers.get('retry-after')});if(response.status===429)this.markFailed('usgs-naip');return;}
   const reader=response.body.getReader(),chunks=[];let bytes=0;while(true){const item=await reader.read();if(item.done)break;bytes+=item.value.length;if(bytes>1048576){await reader.cancel();return;}chunks.push(item.value);}const buffer=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}const value=JSON.parse(new TextDecoder().decode(buffer));if(value.spatialReference?.wkid!==4326||value.features?.length!==1||value.features[0].geometry?.rings?.length!==1)return;const ring=value.features[0].geometry.rings[0];
   if(!Array.isArray(ring)||ring.length<4||ring.length>128||ring.some(p=>!Array.isArray(p)||p.length!==2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||!contains(CONUS,p)))return;
   if(this.runtime.lifecycle.closed||epoch!==this.epoch||generation!==this.selectionGeneration||key!==this.cameraKey()||this.metadataAbort.signal.aborted)return;
   // Cache a genuine center footprint even when it covers only part of this
   // view. view()/desired() still require every corner before using NAIP; a
   // subsequent closer camera can qualify from this cache without a new query.
   if(!inRing(view.point,ring))return;
   this.footprints.push({ring,verifiedOras:false,rasterName:typeof value.features[0].attributes?.Name==='string'?value.features[0].attributes.Name:null});if(this.footprints.length>32)this.footprints.splice(1,1);
   await this.select(this.mode);
  }catch{/* Unverified coverage retains global imagery; at most one request/minute. */}
  finally{this.metadataPending=false;}
 }
 async setLabels(enabled){if(enabled)this.budget.retryHost('tiles.maps.eox.at');this.labelsWanted=!!enabled&&this.budget.eligible('tiles.maps.eox.at');await this.syncLabels();this.refresh();}
 async syncLabels(){
  if(!this.labelsWanted||!this.map||this.actual==='local'||!this.budget.eligible('tiles.maps.eox.at')){this.removeLabels();return;}
  if(this.labels){this.labels.guard.resume();this.order();return;}
  const provider=createLabels(),record={provider};record.guard=observeImageryRequests(provider,{budget:this.budget,host:'tiles.maps.eox.at',onError:()=>{this.labelsWanted=false;this.removeLabels();this.refresh();},onLoad:()=>this.viewer.scene.requestRender()});
  record.off=provider.errorEvent.addEventListener(error=>{if(error)error.retry=false;this.labelsWanted=false;this.removeLabels();this.refresh();});record.layer=this.viewer.imageryLayers.addImageryProvider(provider,2);this.labels=record;
  this.runtime.attribution.set('map-labels','EOX::Maps · EOX/MapServer · © OpenStreetMap contributors','https://maps.eox.at/');this.order();
 }
 removeLabels(){if(!this.labels)return;this.labels.off();this.labels.guard.stop();this.viewer.imageryLayers.remove(this.labels.layer,true);this.labels=null;this.runtime.attribution.remove('map-labels');}
 loadingStatus(){
  const unsettled=this.viewer.scene.globe.tilesLoaded===false;
  return this.activeRecord?.loaded?(unsettled||this.activeRecord.partial?'partial':'ready'):(unsettled&&performance.now()-(this.refinementStarted??performance.now())>=15000?'slow':'loading');
 }
 mountStatus(){if(typeof document!=='undefined'){this.statusNode=document.querySelector('#imagery-status');this.summaryNode=document.querySelector('#imagery-summary');}}
 refresh(){
  if(this.runtime.lifecycle.closed)return;
  const facts=SOURCE_FACTS[this.actual]??SOURCE_FACTS.local,view=this.view();
  if(this.map)this.status=this.loadingStatus();
  const slow=this.viewer.scene.globe.tilesLoaded===false&&performance.now()-(this.refinementStarted??performance.now())>=15000;
  this.loadingNote=slow?'Detail is refining slowly; currently available imagery remains usable.':'';
  const localProof=this.actual==='usgs-naip'&&view.verifiedOras;
  this.metadata={...facts,...(localProof?{date:'2022-06-23',gsd:0.6,product:'NAIP · ORAS matched-image acquisition 2022-06-23'}:{}),coverageRasterName:this.actual==='usgs-naip'?view.footprint?.rasterName??null:null,selected:this.mode,actual:this.actual,status:this.status,reason:this.reason,loadingNote:this.loadingNote};
  if(this.actual!=='local')this.runtime.attribution.set('imagery',facts.credit,facts.url);
  this.quality.imagery=`${facts.label} · ${this.status}${this.reason?' · fallback':''}`;
  if(this.summaryNode)this.summaryNode.textContent=`${facts.label} · ${this.status}`;
  if(this.statusNode)this.statusNode.textContent=`Showing ${facts.label}. ${this.metadata.product}. ${this.metadata.date?'Acquired '+this.metadata.date+'. ':'Exact capture date unavailable. '}${this.metadata.gsd?'Native '+this.metadata.gsd.toFixed(this.metadata.gsd<1?4:0)+' m. ':''}${facts.coverage}${this.loadingNote?' · '+this.loadingNote:''}${this.reason?' · '+this.reason:''}`;
  this.viewer.scene.requestRender();
 }
 diagnostics(){return {selected:this.mode,actual:this.actual,status:this.status,fallbackReason:this.reason??null,metadata:this.metadata,localAllocations:this.localAllocations,controllersCreated:this.controllersCreated,managedLayers:this.managed&&this.viewer.imageryLayers.indexOf(this.managed)>=0?1:0,labelsLayers:this.labels?1:0,budget:{...this.budget.stats},ionSessionRequests:this.session.ionUsed,ionSessionLedgerAvailable:this.session.available,metadataRequests:this.metadataCount,metadataPending:!!this.metadataPending,view:this.runtime.lifecycle.closed?null:this.view(),sources:Object.fromEntries([...this.records.values()].map(record=>[record.id,{...record.guard.stats,paused:record.guard.paused,partial:!!record.partial,preparing:false}]))};}
 clear(){clearTimeout(this.cameraTimer);clearInterval(this.wakeTimer);this.metadataAbort?.abort();this.offCamera?.();this.disposeController();this.localGuard?.stop();if(this.base)this.viewer.imageryLayers.remove(this.base,true);this.base=null;}
}
