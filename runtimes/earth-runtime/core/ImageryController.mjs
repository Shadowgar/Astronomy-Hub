import {TileMapServiceImageryProvider,ImageryLayer,Math as CesiumMath} from 'cesium';
import {MapSourceController} from 'gods-eye-view/maps/controller';
import {createAdmittedMapSources,createLabels,SOURCE_FACTS} from './AdmittedMapSources.mjs';
import {chooseImagery,contains,containsView,inRing,CONUS,PEMA_COVERAGE,ORAS_NAIP_RING} from './ImagerySelectionPolicy.mjs';
import {boundImageryRequests,createImageryBudget} from './imageryRequests.mjs';
import {openImagerySession} from './imagerySession.mjs';

export class ImageryController {
 constructor(runtime,quality){
  this.runtime=runtime;this.viewer=runtime.viewer;this.quality=quality;this.epoch=0;this.session=openImagerySession();this.mode=this.session.mode;this.actual='local';this.status='loading';this.reason='';
  this.records=new Map();this.cooldowns=new Map();this.failedSources=new Set();this.cachedFallbacks=new Set();this.failedConstructions=new Set();this.budget=createImageryBudget();this.controllersCreated=0;this.localAllocations=0;
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
   this.localGuard=boundImageryRequests(local,{onLoad:()=>this.runtime.timings.firstImageryTileMs??=performance.now()});
   this.offCamera=this.viewer.camera.moveEnd.addEventListener(()=>{clearTimeout(this.cameraTimer);this.cameraTimer=setTimeout(()=>void this.updateView(),250)});
   this.wakeTimer=setInterval(()=>{if(this.runtime.lifecycle.closed)return;const previous=this.status,unsettled=this.viewer.scene.globe.tilesLoaded===false;if(this.map){this.status=unsettled?(performance.now()-(this.budget.stats.lastThrottledAt??-Infinity)<1000?'throttled':'loading'):(this.activeRecord?.loaded?(this.activeRecord.partial?'partial':'ready'):'loading');}if(this.map&&(previous!==this.status||unsettled||this.budget.stats.active))this.refresh();},500);
   this.mountControls();
  }
  await this.select(this.mode,true);
 }
 view(){
  const camera=this.viewer.camera,p=camera.positionCartographic,r=camera.computeViewRectangle(this.viewer.scene.globe.ellipsoid);
  const rect=r?[r.west,r.south,r.east,r.north].map(CesiumMath.toDegrees):null,point=[CesiumMath.toDegrees(p.longitude),CesiumMath.toDegrees(p.latitude)];
  const corners=rect?[[rect[0],rect[1]],[rect[0],rect[3]],[rect[2],rect[1]],[rect[2],rect[3]]]:[];
  const footprint=this.footprints.find(f=>inRing(point,f.ring)&&corners.length===4&&corners.every(c=>inRing(c,f.ring)));
  return {height:p.height,rect,point,naipCovered:!!footprint,verifiedOras:!!footprint?.verifiedOras};
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
  this.mode=mode;this.session.setMode(mode);this.reason='';const view=this.view(),id=this.desired(view);
  if(id==='local'){this.terminal(mode==='local'?'Local selected':'Remote imagery unavailable');return;}
  if(!this.map)this.createController();
  if(!this.map.isStackAvailable(id)){this.reason='Source not admitted';this.refresh();return;}
  if(!force&&id===this.map.getActiveId()&&this.managed){this.refresh();return;}
  this.requestedId=id;await this.map.setStack(id);if(!this.runtime.lifecycle.closed)this.refresh();
 }
 createController(){
  const epoch=++this.epoch;this.controllersCreated++;
  const config=this.session.canUseIon(this.config?.ionSessionTileLimit)?this.config:{...this.config,ionImageryOptIn:false};
  this.registry=createAdmittedMapSources(config,(id,factory,request)=>this.provider(id,factory,request,epoch));
  this.map=new MapSourceController(this.viewer,{registry:this.registry,initialStack:'nasa',requestRender:()=>this.viewer.scene.requestRender(),
   createImageryLayer:provider=>{this.pauseAll();const record=this.records.get(provider);if(record){if(this.eligible(record.id))record.guard.resume();this.activeRecord=record;this.budget.globalLimit=record.id==='ion'?4:6;}this.managed=new ImageryLayer(provider);return this.managed;},
   onChange:state=>{if(epoch!==this.epoch)return;if(state.status==='switching'){this.pauseAll();this.status='loading';}this.refresh();},
   onError:()=>{if(epoch===this.epoch)this.reason='Selected source unavailable; fallback retained';},
  });
  this.unsubscribe=this.map.subscribe(state=>{
   if(epoch!==this.epoch)return;
   // Activation can report a nominal ready state after a rejected factory. A
   // managed layer actually attached to the collection is the ownership proof.
   if(!this.managed||this.viewer.imageryLayers.indexOf(this.managed)<0){this.terminal('Remote construction failed');return;}
   if(state.switchOrigin==='automatic'&&state.activeId!==this.requestedId){for(const id of this.failedConstructions)this.cachedFallbacks.add(id);}
   this.actual=state.activeId;this.activeRecord=this.records.get(this.managed.imageryProvider);if(this.eligible(this.actual))this.activeRecord?.guard.resume();else{this.status='unavailable';queueMicrotask(()=>{if(epoch===this.epoch&&!this.runtime.lifecycle.closed)void this.select(this.mode,true)});return;}
   this.budget.globalLimit=this.actual==='ion'?4:6;this.status=this.activeRecord?.loaded?'ready':'loading';if(state.lastError)this.reason='Selected source unavailable; showing fallback';
   this.order();void this.syncLabels();this.refresh();
  });
 }
 async provider(id,factory,{signal},epoch){
  if(!this.eligible(id))throw Error('Source cooling down');
  let timer,expired=false;
  const task=Promise.resolve().then(factory);task.then(provider=>{if(expired||epoch!==this.epoch){if(typeof provider.destroy==='function'&&!provider.isDestroyed?.())provider.destroy();}},()=>{});
  let provider;
  try{provider=await Promise.race([task,new Promise((_,reject)=>{timer=setTimeout(()=>{expired=true;reject(Error('Imagery construction timed out'))},20000)})]);signal.throwIfAborted();}
  catch(error){if(epoch===this.epoch&&!this.runtime.lifecycle.closed){this.budget.block(SOURCE_FACTS[id].host,error);this.cooldowns.set(id,performance.now()+60000);this.failedConstructions.add(id);this.failedSources.add(id);}throw error;}
  finally{clearTimeout(timer);}
  if(epoch!==this.epoch)throw Error('Stale imagery construction');
  const record={id,provider,loaded:false,epoch};
  const owned=()=>epoch===this.epoch&&this.activeRecord===record&&!this.runtime.lifecycle.closed;
  const live=()=>owned()&&!record.guard.paused;
  const fail=error=>{if(!live())return;this.failedSources.add(id);this.cooldowns.set(id,performance.now()+60000);this.reason='Imagery tiles unavailable';this.stopBlockedHost(SOURCE_FACTS[id].host);
   if(id==='nasa'){queueMicrotask(()=>{if(owned())this.terminal('NASA unavailable; local safety base');});}
   else{provider.errorEvent.raiseEvent(error);}
  };
  record.guard=boundImageryRequests(provider,{budget:this.budget,host:SOURCE_FACTS[id].host,limit:['usgs-naip','pema','ion'].includes(id)?2:4,
   canDispatch:()=>id!=='ion'||this.session.canUseIon(this.config.ionSessionTileLimit),
   onDispatch:()=>{if(id==='ion')this.session.recordIonRequest();},onLimit:()=>fail(Error('Ion tab-session limit reached or ledger unavailable')),
   isEmpty:id==='usgs-naip'?(image,args)=>this.emptyImage(image,record,args[2]):()=>false,
   onLoad:()=>{if(!live())return;record.loaded=true;this.status=record.partial?'partial':'ready';this.runtime.timings.firstImageryTileMs??=performance.now();if(['usgs-naip','pema'].includes(id))this.runtime.timings.firstHdTileMs??=performance.now();this.refresh();},onError:fail});
  record.guard.pause();record.off=provider.errorEvent.addEventListener(error=>{if(error)error.retry=false;if(!live())return;this.budget.block(SOURCE_FACTS[id].host,error);this.stopBlockedHost(SOURCE_FACTS[id].host);this.failedSources.add(id);this.cooldowns.set(id,performance.now()+60000);if(id==='nasa')queueMicrotask(()=>{if(owned())this.terminal('NASA unavailable; local safety base');});this.refresh();});
  this.records.set(provider,record);return provider;
 }
 emptyImage(image,record,level){
  if(typeof document==='undefined'||!image?.width||!image?.height)return false;
  try{const canvas=document.createElement('canvas');canvas.width=canvas.height=16;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,16,16);const pixels=context.getImageData(0,0,16,16).data;let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])visible++;if(level>=12&&visible&&visible<256)record.partial=true;return level>=12&&!visible;}catch{record.partial=true;return false;}
 }
 stopBlockedHost(host){if(this.budget.eligible(host))return;for(const record of this.records.values())if(SOURCE_FACTS[record.id].host===host)record.guard.pause();if(host==='tiles.maps.eox.at'){this.labelsWanted=false;this.removeLabels();}}
 pauseAll(){for(const record of this.records.values())record.guard.pause();this.labels?.guard.pause();}
 order(){
  // Upstream inserts at index zero. Raise only the exact owned handle once,
  // leaving all independent event imagery identities and relative order intact.
  const layers=this.viewer.imageryLayers;if(this.managed&&layers.indexOf(this.managed)===0)layers.raise(this.managed);
  if(this.labels?.layer){while(layers.indexOf(this.labels.layer)<2)layers.raise(this.labels.layer);}
  this.viewer.scene.requestRender();
 }
 disposeController(){
  this.epoch++;this.unsubscribe?.();this.unsubscribe=null;this.pauseAll();for(const record of this.records.values()){record.off();record.guard.stop();}
  this.map?.destroy();this.map=null;this.managed=null;this.activeRecord=null;this.records.clear();this.cachedFallbacks.clear();this.failedConstructions.clear();this.removeLabels();this.runtime.attribution.remove('imagery');
 }
 terminal(reason){this.disposeController();this.actual='local';this.status=this.mode==='local'?'ready':'unavailable';this.reason=reason;this.refresh();}
 async retrySelected(){
  const target=this.mode==='auto'?chooseImagery(this.view(),this.actual):this.mode;
  if(target==='local')return;
  this.budget.retryHost(SOURCE_FACTS[target]?.host??'');
  if(performance.now()<(this.cooldowns.get(target)??0)||!this.budget.eligible(SOURCE_FACTS[target]?.host??'')){this.reason='Retry waits for source/host cooldown';this.refresh();return;}
  // A successful construction fallback remains cached under its original ID.
  // Only this explicit exceptional retry drops it; ordinary switches keep caches.
  this.failedSources.delete(target);if(this.cachedFallbacks.has(target))this.disposeController();
  await this.select(this.mode,true);
 }
 async updateView(){
  if(this.runtime.lifecycle.closed)return;await this.select(this.mode);
  const view=this.view();if(view.height<150000&&!view.naipCovered&&containsView(CONUS,view.rect)&&['auto','usgs-naip','pema'].includes(this.mode)&&this.metadataCount<32&&performance.now()-this.metadataLast>=60000&&this.budget.eligible(SOURCE_FACTS['usgs-naip'].host))await this.queryFootprint(view);
 }
 async queryFootprint(view){
  this.metadataLast=performance.now();this.metadataCount++;this.metadataAbort?.abort();this.metadataAbort=new AbortController();const epoch=this.epoch;
  const params=new URLSearchParams({f:'json',geometry:view.point.join(','),geometryType:'esriGeometryPoint',inSR:'4326',outSR:'4326',spatialRel:'esriSpatialRelIntersects',where:'Category=1',outFields:'Name',returnGeometry:'true',resultRecordCount:'1'});
  try{const response=await fetch('https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer/query?'+params,{signal:AbortSignal.any([this.metadataAbort.signal,this.runtime.lifecycle.controller.signal,AbortSignal.timeout(20000)])});if(!response.ok){this.budget.block(SOURCE_FACTS['usgs-naip'].host,{statusCode:response.status});return;}
   const reader=response.body.getReader(),chunks=[];let bytes=0;while(true){const item=await reader.read();if(item.done)break;bytes+=item.value.length;if(bytes>1048576){await reader.cancel();return;}chunks.push(item.value);}const buffer=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}const value=JSON.parse(new TextDecoder().decode(buffer));if(value.spatialReference?.wkid!==4326||value.features?.length!==1||value.features[0].geometry?.rings?.length!==1)return;const ring=value.features[0].geometry.rings[0];
   if(!Array.isArray(ring)||ring.length<4||ring.length>128||ring.some(p=>!Array.isArray(p)||p.length!==2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||!contains(CONUS,p)))return;
   if(this.runtime.lifecycle.closed||epoch!==this.epoch)return;this.footprints.push({ring,verifiedOras:false});if(this.footprints.length>32)this.footprints.splice(1,1);await this.select(this.mode);
  }catch{/* Unverified coverage retains global imagery; no metadata retry loop. */}
 }
 async setLabels(enabled){if(enabled)this.budget.retryHost('tiles.maps.eox.at');this.labelsWanted=!!enabled&&this.budget.eligible('tiles.maps.eox.at');await this.syncLabels();this.refresh();}
 async syncLabels(){
  if(!this.labelsWanted||!this.map||this.actual==='local'||!this.budget.eligible('tiles.maps.eox.at')){this.removeLabels();return;}
  if(this.labels){this.labels.guard.resume();this.order();return;}
  const provider=createLabels(),record={provider};record.guard=boundImageryRequests(provider,{budget:this.budget,host:'tiles.maps.eox.at',onError:()=>{this.labelsWanted=false;this.removeLabels();this.refresh();},onLoad:()=>this.viewer.scene.requestRender()});
  record.off=provider.errorEvent.addEventListener(error=>{if(error)error.retry=false;this.labelsWanted=false;this.removeLabels();this.refresh();});record.layer=this.viewer.imageryLayers.addImageryProvider(provider,2);this.labels=record;
  this.runtime.attribution.set('map-labels','EOX::Maps · EOX/MapServer · © OpenStreetMap contributors','https://maps.eox.at/');this.order();
 }
 removeLabels(){if(!this.labels)return;this.labels.off();this.labels.guard.stop();this.viewer.imageryLayers.remove(this.labels.layer,true);this.labels=null;this.runtime.attribution.remove('map-labels');}
 mountControls(){
  if(typeof document==='undefined')return;
  this.selectNode=document.querySelector('#imagery-source');this.statusNode=document.querySelector('#imagery-status');this.labelsNode=document.querySelector('#imagery-labels');
  const change=()=>void this.select(this.selectNode.value),labels=()=>void this.setLabels(this.labelsNode.checked),retry=()=>void this.retrySelected();
  this.selectNode.addEventListener('change',change);this.labelsNode.addEventListener('change',labels);const button=document.querySelector('#imagery-retry');button.addEventListener('click',retry);
  this.removeControls=()=>{this.selectNode.removeEventListener('change',change);this.labelsNode.removeEventListener('change',labels);button.removeEventListener('click',retry);};
 }
 refresh(){
  if(this.runtime.lifecycle.closed)return;
  const facts=SOURCE_FACTS[this.actual]??SOURCE_FACTS.local,view=this.view();
  const localProof=this.actual==='usgs-naip'&&view.verifiedOras;
  this.metadata={...facts,...(localProof?{date:'2022-06-23',gsd:0.6,product:'NAIP · ORAS matched-image acquisition 2022-06-23'}:{}),selected:this.mode,actual:this.actual,status:this.status,reason:this.reason};
  if(this.actual!=='local')this.runtime.attribution.set('imagery',facts.credit,facts.url);
  this.quality.imagery=`${facts.label} · ${this.status}${this.reason?' · fallback':''}`;
  if(this.selectNode){this.selectNode.value=this.mode;this.selectNode.querySelector('[value="ion"]').disabled=!this.session.canUseIon(this.config?.ionSessionTileLimit)||!this.registry?.sources.some(source=>source.descriptor.id==='ion');this.labelsNode.checked=this.labelsWanted;
   this.statusNode.textContent=`Selected: ${this.mode==='auto'?'Auto':SOURCE_FACTS[this.mode]?.label}. Showing: ${facts.label} · ${this.status}. ${this.metadata.product}. ${this.metadata.date?'Acquired '+this.metadata.date+'. ':'Exact capture date unavailable. '}${this.metadata.gsd?'Native '+this.metadata.gsd.toFixed(this.metadata.gsd<1?4:0)+' m. ':''}${facts.coverage}${this.actual==='pema'&&!containsView(PEMA_COVERAGE,view.rect)?' · partial view outside verified extent':''}${this.reason?' · '+this.reason:''}`;}
  this.viewer.scene.requestRender();
 }
 diagnostics(){return {selected:this.mode,actual:this.actual,status:this.status,metadata:this.metadata,localAllocations:this.localAllocations,controllersCreated:this.controllersCreated,managedLayers:this.managed&&this.viewer.imageryLayers.indexOf(this.managed)>=0?1:0,labelsLayers:this.labels?1:0,budget:{...this.budget.stats},ionSessionRequests:this.session.ionUsed,ionSessionLedgerAvailable:this.session.available,metadataRequests:this.metadataCount,view:this.runtime.lifecycle.closed?null:this.view(),sources:Object.fromEntries([...this.records.values()].map(record=>[record.id,{...record.guard.stats,paused:record.guard.paused,partial:!!record.partial}]))};}
 clear(){clearTimeout(this.cameraTimer);clearInterval(this.wakeTimer);this.metadataAbort?.abort();this.offCamera?.();this.removeControls?.();this.disposeController();this.localGuard?.stop();if(this.base)this.viewer.imageryLayers.remove(this.base,true);this.base=null;}
}
