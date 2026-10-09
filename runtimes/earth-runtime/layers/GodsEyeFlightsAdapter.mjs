import {Cartesian2,Math as CesiumMath} from 'cesium';
import {normalizeAdsbLolPointResponse} from 'gods-eye-view/sources/adsb-lol';
import {normalizeOpenSkyAircraft} from 'gods-eye-view/sources/live';
import {createFlightFeed,createIngestion} from 'gods-eye-view/layers/flights/ingestion';
import {PollingLayer} from './PollingLayer.mjs';
import {readCapped} from './data.mjs';
import {regionPoint,regionKey,regionalAircraft,validRawPositionAge,distanceM,AIRCRAFT_RADIUS_M,viewRegion} from './aircraftPolicy.mjs';
import {aircraftDisplay} from './aircraftDisplay.mjs';

function sourceError(code){return Object.assign(Error(code),{name:'LiveSourceError',code,retryAfterMs:30000})}
export function createFlightsAdapter(context){
 const display=aircraftDisplay(context),cache=new Map();let region=regionPoint(context.observer()),chosen=false,last=null,prepared=null,debounce=null,displayTimer=null;
 const coverage=()=>({provider:'adsb.lol',center:{...region},radiusNM:100,scope:'regional'});
 const summary=(counts={},mode='loading')=>`adsb.lol · ${mode.slice(0,28)} · 100 NM @ ${region.lat}, ${region.lon} · raw ${counts.fetched??0} / admitted ${counts.admitted??0} / filtered ${counts.filtered??0} / capped ${counts.capped??0} / renderable ${counts.renderable??0} / visible ${counts.visible??0}`.slice(0,160);
 const source={label:'adsb.lol',async getSnapshot(query,{signal}){
  const key=regionKey(query),cached=cache.get(key);let payload,isCached=false;
  if(cached&&Date.now()-cached.received<30000){payload=cached.payload;isCached=true}
  else{
   const response=await fetch(`/api/earth/aircraft?lat=${query.lat}&lon=${query.lon}`,{signal,cache:'no-store'});
   if(!response.ok)throw sourceError('HTTP '+response.status);
   try{payload=JSON.parse(await readCapped(response))}catch{throw sourceError('Malformed or oversized feed')}
   signal.throwIfAborted();
   if(!Number.isFinite(payload?.now)||!Array.isArray(payload?.ac)||payload.ac.length>2000)throw sourceError('Malformed feed');
   isCached=payload.cached===true;
  }
  const snapshot=normalizeAdsbLolPointResponse({...payload,ac:payload.ac.filter(validRawPositionAge)});
  let admitted;try{admitted=regionalAircraft(snapshot,query)}catch{throw sourceError('Stale, future or unknown source time')}
  const records=admitted.records.map(normalizeOpenSkyAircraft).filter(Boolean),observedAtMs=snapshot.time*1000;
  const counts={...admitted.counts,fetched:payload.ac.length,filtered:payload.ac.length-records.length};
  signal.throwIfAborted();if(!cached||payload!==cached.payload){cache.set(key,{payload,center:{...query},received:Date.now()});while(cache.size>8)cache.delete(cache.keys().next().value)}
  return {records,center:{...query},observedAtMs,ageMs:Date.now()-observedAtMs,stale:false,source:'adsb.lol',coverage:`100 NM regional @ ${query.lat}, ${query.lon}`,counts,cached:isCached};
 }};
 const feed=createFlightFeed(source);feed._lastCoverage='100 NM regional; worldwide acquisition disabled';
 const ingestion=createIngestion({feed,getQuery:()=>({...region}),setSourceLabel:()=>{},applyPendingTrackingRestore:()=>{},applySnapshot:snapshot=>{prepared={...snapshot,observedAt:new Date(snapshot.observedAtMs).toISOString()};return {count:snapshot.records.length,ids:new Set(snapshot.records.map(r=>r.id))}}});
 const describe=()=>{
  const same=last&&regionKey(last.center)===regionKey(region),counts={...(same?last.counts:{}),...display.counts()},ageMs=same?Math.max(0,Date.now()-last.observedAtMs):null;
  const mode=last?.cached?'cached':last?.counts.fetched===0?'empty snapshot':last?.records.length===0?'positions filtered':counts.renderable===0?'positions expired':counts.visible===0?'outside view':'snapshot';return {coverage:coverage(),counts,ageMs,cached:last?.cached===true,summary:summary(counts,mode),observedAt:last?.observedAt??null,count:last?.records.length??0};
 };
 const layer=new PollingLayer({id:'aircraft',interval:30000,temporalMode:'CURRENT_SNAPSHOT',read:async signal=>{
  prepared=null;await ingestion.methods.update(context.viewer,{signal});signal.throwIfAborted();if(!prepared)throw sourceError(feed._lastError||'Source unavailable');return prepared;
 },render:data=>{display.replace(data.records,data.observedAt);last=data},clear:unavailable=>display.clear(unavailable),describe,loading:()=>({observedAt:last?.observedAt??null,coverage:coverage(),summary:summary({},'loading')}),failure:error=>{const reason=typeof error.code==='string'?error.code:error.name==='AbortError'||error.name==='TimeoutError'?'Source deadline exceeded':'Source unavailable';return {...describe(),reason,summary:summary({},reason),count:0}}});
 function anchor(){const viewer=context.viewer,p=viewer.camera.pickEllipsoid(new Cartesian2(viewer.canvas.clientWidth/2,viewer.canvas.clientHeight/2),viewer.scene.globe.ellipsoid);if(!p)return null;const c=viewer.scene.globe.ellipsoid.cartesianToCartographic(p);return regionPoint({lat:CesiumMath.toDegrees(c.latitude),lon:CesiumMath.toDegrees(c.longitude)})}
 function cancel(){++layer.generation;clearTimeout(layer.timer);layer.timer=null;layer.controller?.abort();layer.controller=null;for(const controller of feed._activeUpdateControllers)controller.abort();clearTimeout(debounce);debounce=null}
 function cameraChanged(){
  if(!layer.active||layer.closed||context.viewer.trackedEntity?.orasMetadata?.layerId==='aircraft'||context.camera.focusTarget===context.selection.value&&context.selection.value?.orasMetadata?.layerId==='aircraft')return;const next=viewRegion(region,anchor(),cache);
  if(regionKey(next)===regionKey(region)||distanceM(next,region)<AIRCRAFT_RADIUS_M/2)return;
  chosen=true;cancel();display.clear();region=next;
  context.providerStatus.set('aircraft',{status:'loading',temporalMode:'CURRENT_SNAPSHOT',coverage:coverage(),summary:summary({},'loading'),observedAt:last?.observedAt??null});
  debounce=setTimeout(()=>{debounce=null;void layer.poll(layer.generation)},1000);
 }
 const enable=layer.enable.bind(layer);layer.enable=async()=>{
  if(layer.closed||layer.active)return;
  const next=viewRegion(region,anchor(),cache);if(regionKey(next)!==regionKey(region)){region=next;chosen=true;}
  context.viewer.camera.changed.addEventListener(cameraChanged);context.viewer.camera.moveEnd.addEventListener(cameraChanged);
  displayTimer=setInterval(()=>{if(!layer.active||layer.closed)return;display.animate();const status=context.providerStatus.get('aircraft');if(status?.status==='ready')context.providerStatus.set('aircraft',{...status,...describe()})},200);
  await enable();
 };
 const disable=layer.disable.bind(layer);layer.disable=()=>{cancel();clearInterval(displayTimer);displayTimer=null;context.viewer.camera.changed.removeEventListener(cameraChanged);context.viewer.camera.moveEnd.removeEventListener(cameraChanged);disable()};
 layer.update=async()=>{if(!layer.active||layer.closed||chosen)return;const next=regionPoint(context.observer());if(regionKey(next)===regionKey(region))return;cancel();display.clear();region=next;await layer.poll(layer.generation)};
 const initialize=layer.initialize.bind(layer);layer.initialize=ctx=>{initialize(ctx);ctx.attribution.set('aircraft','adsb.lol · ODbL 1.0 · regional source data','https://www.adsb.lol/docs/open-data/api/')};
 const destroy=layer.destroy.bind(layer);layer.destroy=()=>{destroy();cache.clear();context.attribution.remove('aircraft')};return layer;
}
