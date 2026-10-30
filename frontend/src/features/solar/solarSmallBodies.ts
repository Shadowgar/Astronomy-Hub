/** Source-backed osculating elements, independent of display points and NASA shapes.
 * Spacekit's pinned KeplerParticles informed the one-population/buffer technique;
 * this solver is original, limited to the acquired elliptical orbit domain.
 */
import type {Vector} from './solarContracts'
export type SmallBody={catalog:'JPL SBDB';source_id:string;designation:string;name:string;model:'asteroid';population:'main-belt-subset'|'near-earth-destination';diameter_km:number;elements:{epoch_jd_tdb:number;a_au:number;e:number;i_rad:number;om_rad:number;w_rad:number;ma_rad:number;n_rad_day:number}}
export type SmallBodyPack={schema:'oras.solar-small-bodies.v1';origin:'Sun center (10)';frame:'ECLIPJ2000';units:'AU,rad,day';time_scale:'TDB';acquired_utc:string;population_count:number;population_available:number;selection:string;sources:{url:string;sha256:string;bytes:number}[];model:{kind:'two-body-osculating';max_days_from_epoch:180;population_wide_accuracy_qualified:false;output_frame:'ICRF';ecliptic_obliquity_arcsec:84381.448;disclosure:string};qualification:{max_comparison_error_km:number;reference:string};bodies:SmallBody[]}
const EPSILON=84381.448/3600*Math.PI/180,TAU=2*Math.PI
const fail=()=>{throw Error('Invalid local asteroid source/element contract.')}

export function validateSolarSmallBodies(raw:unknown):SmallBodyPack{
 const p=raw as SmallBodyPack
 if(!p||p.schema!=='oras.solar-small-bodies.v1'||p.origin!=='Sun center (10)'||p.frame!=='ECLIPJ2000'||p.units!=='AU,rad,day'||p.time_scale!=='TDB'||p.population_count!==2048||!p.selection||!Number.isFinite(Date.parse(p.acquired_utc))||p.model?.kind!=='two-body-osculating'||p.model.max_days_from_epoch!==180||p.model.population_wide_accuracy_qualified!==false||p.model.output_frame!=='ICRF'||p.model.ecliptic_obliquity_arcsec!==84381.448||!p.model.disclosure||!Array.isArray(p.sources)||p.sources.length!==2||p.sources.some(s=>!s.url.startsWith('https://ssd-api.jpl.nasa.gov/')||!/^[a-f0-9]{64}$/.test(s.sha256)||!Number.isFinite(s.bytes)||s.bytes<=0)||!Array.isArray(p.bodies)||p.bodies.length!==2049||!Number.isFinite(p.qualification?.max_comparison_error_km)||p.qualification.max_comparison_error_km<0)fail()
 const ids=new Set<string>();let population=0
 for(const b of p.bodies){
  const e=b?.elements
  if(!b||b.catalog!=='JPL SBDB'||typeof b.source_id!=='string'||!/^\d+$/.test(b.source_id)||ids.has(b.source_id)||typeof b.designation!=='string'||!b.name||b.model!=='asteroid'||!['main-belt-subset','near-earth-destination'].includes(b.population)||!Number.isFinite(b.diameter_km)||b.diameter_km<=0||b.diameter_km>10000||!e||![e.epoch_jd_tdb,e.a_au,e.e,e.i_rad,e.om_rad,e.w_rad,e.ma_rad,e.n_rad_day].every(Number.isFinite)||e.epoch_jd_tdb!==2461200.5||e.e<0||e.e>=.8||e.a_au<=0||e.a_au>=6||e.i_rad<0||e.i_rad>Math.PI||e.n_rad_day<=0||e.n_rad_day>=TAU)fail()
  ids.add(b.source_id);if(b.population==='main-belt-subset')population++
 }
 if(population!==p.population_count)fail()
 return p
}
export function smallBodyEpochAvailable(p:SmallBodyPack,jdTdb:number){return Number.isFinite(jdTdb)&&p.bodies.every(b=>Math.abs(jdTdb-b.elements.epoch_jd_tdb)<=p.model.max_days_from_epoch)}

/** Simultaneous heliocentric geometric ICRF AU. No perturbations or light time. */
export function propagateSmallBody(body:SmallBody,jdTdb:number):Vector{
 const e=body.elements
 if(!Number.isFinite(jdTdb)||Math.abs(jdTdb-e.epoch_jd_tdb)>180)throw Error('Outside bounded asteroid approximation coverage.')
 const unwrapped=e.ma_rad+e.n_rad_day*(jdTdb-e.epoch_jd_tdb),mean=((unwrapped+Math.PI)%TAU+TAU)%TAU-Math.PI
 let eccentric=mean
 for(let iteration=0;iteration<16;iteration++){
  const delta=(eccentric-e.e*Math.sin(eccentric)-mean)/(1-e.e*Math.cos(eccentric));eccentric-=delta
  if(Math.abs(delta)<1e-14)break
 }
 if(Math.abs(eccentric-e.e*Math.sin(eccentric)-mean)>1e-12)throw Error('Asteroid orbital solve unavailable.')
 const x=e.a_au*(Math.cos(eccentric)-e.e),y=e.a_au*Math.sqrt(1-e.e*e.e)*Math.sin(eccentric)
 const px=x*Math.cos(e.w_rad)-y*Math.sin(e.w_rad),py=x*Math.sin(e.w_rad)+y*Math.cos(e.w_rad)
 const ex=px*Math.cos(e.om_rad)-py*Math.cos(e.i_rad)*Math.sin(e.om_rad),ey=px*Math.sin(e.om_rad)+py*Math.cos(e.i_rad)*Math.cos(e.om_rad),ez=py*Math.sin(e.i_rad)
 return [ex,ey*Math.cos(EPSILON)-ez*Math.sin(EPSILON),ey*Math.sin(EPSILON)+ez*Math.cos(EPSILON)]
}
/** Reuse one GPU point buffer; no object/geometry creation during playback. */
export function writeSmallBodyPositions(pack:SmallBodyPack,jdTdb:number,output:Float32Array):number{
 if(!smallBodyEpochAvailable(pack,jdTdb))throw Error('Outside bounded asteroid approximation coverage.')
 if(output.length<pack.population_count*3)throw Error('Asteroid output buffer too small.')
 let index=0
 for(const body of pack.bodies){if(body.population!=='main-belt-subset')continue;output.set(propagateSmallBody(body,jdTdb),index*3);index++}
 return index
}
export async function loadSolarSmallBodies(signal:AbortSignal,fetcher:typeof fetch=fetch){
 signal.throwIfAborted();const response=await fetcher('/api/v1/solar-system/small-bodies',{signal})
 if(!response.ok)throw Error('Local asteroid source unavailable.')
 const data=await response.json();signal.throwIfAborted();return validateSolarSmallBodies(data)
}
