/** Optional precise sources. Failure never invalidates the existing nine-body Solar contract. */
import type {Vector} from './solarContracts'
import type {SolarMotionSample} from './solarMotion'
import type {SystemBodyOrientation,SystemQuaternion} from '../systems/systemTypes'
import {interpolateOrientation} from '../systems/systemOrientation'

export const destinationIds=['pluto','ceres','vesta','eris','eros','halley','67p','borisov'] as const
export type DestinationId=typeof destinationIds[number]
const identities:Record<DestinationId,string>={pluto:'999',ceres:'20000001',vesta:'20000004',eris:'20136199',eros:'20000433',halley:'1000036','67p':'1000012',borisov:'1003639'}
export type CelestialClass='star'|'planet'|'dwarf-planet'|'natural-satellite'|'asteroid'|'trans-neptunian-object'|'comet'|'spacecraft'|'theoretical-population'
type Coverage={start:string;end:string}
type State={position_au:Vector;velocity_au_s:Vector}
export type SolarDestination={id:DestinationId;name:string;classification:'dwarf-planet'|'asteroid'|'comet';identity:{catalog:'JPL-SPK'|'JPL-SBDB';source_id:string;model:string;reference:string};status:'qualified'|'unavailable';reason:string|null;radius_km:number|null;radius_source:string|null;state:State|null;coverage:Coverage;sampled_coverage:Coverage|null;source:{id:string;url:string;sha256:string;solution:string;uncertainty:string};orientation_available:boolean;surface_orientation_status:string;eccentricity:number|null}
type DestinationTrack={id:DestinationId;samples:SolarMotionSample[];step_seconds:number;max_sampled_error_km:number;interpolation:'cubic-hermite'}
export type SolarDestinations={schema:'oras.solar-destinations.v1';epoch:string;jd_tdb:number;frame:'ICRF';origin:'Sun center (10)';units:'AU; AU/s';corrections:'geometric; no light-time or aberration';source:{id:'jpl_solar_destinations_local';release:string;sha256:string;url:string};bodies:SolarDestination[];tracks:DestinationTrack[];orientations:Record<string,SystemBodyOrientation>;pluto_barycenter:State|null;qualification:string}
export type EvaluatedDestinations={epoch:string;positions:Partial<Record<DestinationId,Vector>>;orientations:Record<string,SystemQuaternion>}
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)
const stamp=(v:unknown)=>typeof v==='string'&&/Z$|[+-]\d\d:\d\d$/.test(v)?Date.parse(v):NaN
const text=(v:unknown):v is string=>typeof v==='string'&&v.length>0&&v.length<20000
const hash=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v)
const vector=(v:unknown,bound:number):v is Vector=>Array.isArray(v)&&v.length===3&&v.every(n=>finite(n)&&Math.abs(n)<bound)
const state=(s:State|null)=>!!s&&vector(s.position_au,10000)&&vector(s.velocity_au_s,.01)
const coverage=(c:Coverage|null)=>!!c&&Number.isFinite(stamp(c.start))&&Number.isFinite(stamp(c.end))&&stamp(c.start)<stamp(c.end)
const fail=():never=>{throw Error('New destination source, identity, frame or coverage is unavailable.')}
export const isDestinationId=(id:unknown):id is DestinationId=>typeof id==='string'&&Object.hasOwn(identities,id)

export function validateSolarDestinations(raw:unknown,epoch?:string):SolarDestinations{
 const s=raw as SolarDestinations,now=stamp(s?.epoch)
 if(!s||s.schema!=='oras.solar-destinations.v1'||!Number.isFinite(now)||(epoch!==undefined&&now!==stamp(epoch))||!finite(s.jd_tdb)||Math.abs(s.jd_tdb-(now/86400000+2440587.5))>.01||s.frame!=='ICRF'||s.origin!=='Sun center (10)'||s.units!=='AU; AU/s'||s.corrections!=='geometric; no light-time or aberration'||s.source?.id!=='jpl_solar_destinations_local'||!hash(s.source.sha256)||!text(s.source.release)||!s.source.url?.startsWith('https://')||!text(s.qualification)||!Array.isArray(s.bodies)||s.bodies.length<1||s.bodies.length>8||!Array.isArray(s.tracks)||s.tracks.length>8||!s.orientations||typeof s.orientations!=='object'||Array.isArray(s.orientations))fail()
 const bodies=new Map<string,SolarDestination>(),tracks=new Map<string,DestinationTrack>()
 for(const b of s.bodies){
  if(!b||!isDestinationId(b.id)||bodies.has(b.id)||!text(b.name)||!['dwarf-planet','asteroid','comet'].includes(b.classification)||b.identity?.source_id!==identities[b.id]||b.identity.catalog!==(b.id==='pluto'?'JPL-SPK':'JPL-SBDB')||!text(b.identity.model)||!text(b.identity.reference)||!coverage(b.coverage)||!hash(b.source?.sha256)||!b.source?.url?.startsWith('https://')||![b.source.id,b.source.solution,b.source.uncertainty,b.surface_orientation_status].every(text)||typeof b.orientation_available!=='boolean'||(b.radius_km!==null&&(!finite(b.radius_km)||b.radius_km<=0||b.radius_km>2000||!text(b.radius_source)))||(b.eccentricity!==null&&(!finite(b.eccentricity)||b.eccentricity<0)))fail()
  if(b.status==='qualified'){
   const c=b.sampled_coverage
   if(!state(b.state)||!coverage(c)||stamp(c!.start)<stamp(b.coverage.start)||stamp(c!.end)>stamp(b.coverage.end)||now<stamp(c!.start)||now>stamp(c!.end)||stamp(c!.end)-stamp(c!.start)>16*86400000+1||b.reason!==null)fail()
  }else if(b.status!=='unavailable'||b.state!==null||b.sampled_coverage!==null||!text(b.reason)||b.orientation_available)fail()
  bodies.set(b.id,b)
 }
 for(const t of s.tracks){
  const b=bodies.get(t?.id)??fail()
  if(!b||b.status!=='qualified'||tracks.has(t.id)||t.interpolation!=='cubic-hermite'||!finite(t.step_seconds)||t.step_seconds<=0||t.step_seconds>86400||!finite(t.max_sampled_error_km)||t.max_sampled_error_km<0||t.max_sampled_error_km>=1||!Array.isArray(t.samples)||t.samples.length<2||t.samples.length>5000)fail()
  let prev:SolarMotionSample|undefined
  for(const sample of t.samples){
   const time=stamp(sample?.epoch)
   if(!Number.isFinite(time)||!finite(sample.jd_tdb)||!state(sample)||Math.abs((sample.jd_tdb-s.jd_tdb)*86400000-(time-now))>3)fail()
   if(prev&&(time<=stamp(prev.epoch)||time-stamp(prev.epoch)>t.step_seconds*1000+1||sample.jd_tdb<=prev.jd_tdb))fail()
   prev=sample
  }
  if(stamp(t.samples[0].epoch)!==stamp(b.sampled_coverage!.start)||stamp(t.samples.at(-1)!.epoch)!==stamp(b.sampled_coverage!.end))fail()
  const p=interpolate(t.samples,now)
  if(Math.hypot(...p.map((v,i)=>v-b.state!.position_au[i]))*149597870.7>1)fail()
  tracks.set(t.id,t)
 }
 for(const b of s.bodies){if((b.status==='qualified')!==tracks.has(b.id)||b.orientation_available!==Object.hasOwn(s.orientations,b.id))fail()}
 for(const [id,t] of Object.entries(s.orientations)){
  const b=bodies.get(id)??fail(),legacyId=id==='ceres'?'2000001':id==='vesta'?'2000004':id==='eros'?'2000433':b?.identity.source_id
  if(!b?.sampled_coverage||!t||t.body_id!==id||t.naif_id!==legacyId||t.from_frame!=='body-fixed'||t.to_frame!=='ICRF'||t.body_fixed_frame!==(id==='eros'?'PDS_GASKELL_EROS':'IAU_'+id.toUpperCase())||t.quaternion_order!=='xyzw'||t.interpolation!=='shortest-slerp'||!text(t.model)||!text(t.accuracy)||!hash(t.source?.sha256)||!text(t.source.id)||!t.source.url?.startsWith('https://')||!finite(t.max_sampled_interpolation_error_arcsec)||t.max_sampled_interpolation_error_arcsec<0||t.max_sampled_interpolation_error_arcsec>=1||!Array.isArray(t.samples)||t.samples.length<2||t.samples.length>5000)fail()
  if(id==='eros'&&(t.model_id!=='pds-gaskell-eros-alex'||t.source.sha256!=='0b410adcbd14bc6f678781524050b979714c7f64acd8693786f35acaa1363673'))fail()
  if(id==='vesta'&&(t.model_id!=='dawn-vesta-grv221108-v1'||t.source.sha256!=='bb17489f6d933124b502a3a9a5e3491a0d94ab34bb06a7addfa760bd8c681278'))fail()
  const c=b.sampled_coverage??fail()
  let previous=-Infinity
  for(const sample of t.samples){const time=stamp(sample?.epoch),q=sample?.quaternion;if(!Number.isFinite(time)||time<=previous||(Number.isFinite(previous)&&time-previous>600001)||!finite(sample.jd_tdb)||Math.abs((sample.jd_tdb-s.jd_tdb)*86400000-(time-now))>3||!Array.isArray(q)||q.length!==4||!q.every(finite)||Math.abs(Math.hypot(...q)-1)>1e-6)fail();previous=time}
  if(stamp(t.samples[0].epoch)>stamp(c.start)||previous<stamp(c.end))fail()
 }
 if(s.pluto_barycenter!==null&&!state(s.pluto_barycenter))fail()
 if(bodies.get('pluto')?.status==='qualified'&&!s.pluto_barycenter)fail()
 return s
}
function interpolate(samples:SolarMotionSample[],utcMs:number):Vector{
 let lo=0,hi=samples.length-1
 while(hi-lo>1){const mid=(lo+hi)>>1;if(stamp(samples[mid].epoch)<=utcMs)lo=mid;else hi=mid}
 const a=samples[lo],b=samples[hi],u=(utcMs-stamp(a.epoch))/(stamp(b.epoch)-stamp(a.epoch)),dt=(b.jd_tdb-a.jd_tdb)*86400,u2=u*u,u3=u2*u
 return a.position_au.map((p,i)=>(2*u3-3*u2+1)*p+(u3-2*u2+u)*dt*a.velocity_au_s[i]+(-2*u3+3*u2)*b.position_au[i]+(u3-u2)*dt*b.velocity_au_s[i]) as Vector
}
export function evaluateSolarDestinations(s:SolarDestinations,utcMs:number):EvaluatedDestinations{
 if(!finite(utcMs))throw Error('Invalid destination epoch.')
 utcMs=Math.trunc(utcMs)
 const positions:EvaluatedDestinations['positions']={},orientations:EvaluatedDestinations['orientations']={}
 for(const t of s.tracks){if(utcMs<stamp(t.samples[0].epoch)||utcMs>stamp(t.samples.at(-1)!.epoch))continue;positions[t.id]=interpolate(t.samples,utcMs);const rotation=s.orientations[t.id];if(rotation)orientations[t.id]=interpolateOrientation(rotation,utcMs)}
 return{epoch:new Date(utcMs).toISOString(),positions,orientations}
}
export async function loadSolarDestinations(epoch:string,signal:AbortSignal,fetcher:typeof fetch=fetch){
 signal.throwIfAborted();const response=await fetcher('/api/v1/solar-system/destinations?'+new URLSearchParams({epoch}),{signal})
 if(!response.ok)throw Error('Dwarf planet and comet sources are unavailable. The original planets remain usable.')
 const raw=await response.json();signal.throwIfAborted();return validateSolarDestinations(raw,epoch)
}
/** Four-day windows last four wall seconds at the fastest supported rate. Give
 * source loading a quarter-window lead, capped at thirty wall seconds. */
export function destinationNeedsRefresh(c:Coverage,utcMs:number,rate:number){
 const start=stamp(c.start),end=stamp(c.end)
 if(!Number.isFinite(utcMs)||utcMs<start||utcMs>end)return true
 if(!Number.isFinite(rate)||rate===0)return false
 const margin=Math.min((end-start)*.25,Math.max(60000,Math.abs(rate)*30000))
 return rate>0?end-utcMs<margin:utcMs-start<margin
}
