import {normalizeAdsbLolPointResponse} from 'gods-eye-view/sources/adsb-lol';
import {normalizeOpenSkyAircraft} from 'gods-eye-view/sources/live';
import {PollingLayer} from './PollingLayer.mjs';
import {admitAircraft,readCapped} from './data.mjs';
import {entityRenderer} from './entities.mjs';
export function createFlightsAdapter(context){
 const renderer=entityRenderer(context,'aircraft','#ffe185');
 const layer=new PollingLayer({id:'aircraft',interval:30000,read:async signal=>{
  const observer=context.observer(),response=await fetch(`/api/earth/aircraft?lat=${observer.lat}&lon=${observer.lon}`,{signal,cache:'no-store'});
  const payload=JSON.parse(await readCapped(response));if(!Number.isFinite(payload.now))throw Error('Feed epoch unavailable');
  payload.ac=payload.ac.filter(row=>Number.isFinite(row.seen_pos)||Number.isFinite(row.seen));const snapshot=normalizeAdsbLolPointResponse(payload);const records=admitAircraft(snapshot).map(normalizeOpenSkyAircraft).filter(Boolean);
  return {records,observedAt:new Date(snapshot.time*1000).toISOString()};
 },render:({records,observedAt})=>{renderer.replace(records.map(r=>({id:r.id,name:r.callsign||r.id,lon:r.longitude,lat:r.latitude,heightM:r.ellipsoidAltitudeM,detail:`adsb.lol · source-reported geometric altitude ${r.ellipsoidAltitudeM.toFixed(0)} m · ${observedAt} · LIVE_ONLY; no historical trajectory`})));},clear:()=>renderer.clear()});
 const initialize=layer.initialize.bind(layer);layer.initialize=ctx=>{initialize(ctx);ctx.attribution.set('aircraft','adsb.lol · ODbL 1.0 · source data','https://www.adsb.lol/docs/open-data/api/')};
 const destroy=layer.destroy.bind(layer);layer.destroy=()=>{destroy();context.attribution.remove('aircraft')};return layer;
}
