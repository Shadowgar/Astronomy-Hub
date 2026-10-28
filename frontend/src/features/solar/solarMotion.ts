/** Checked JPL source windows; renderer lifetime is independent of scientific time. */
import {bodyIds,type BodyId,type Vector} from './solarContracts'
import {parseSceneDate} from '../runtime/productState'

export type SolarMotionSample={epoch:string;jd_tdb:number;position_au:Vector;velocity_au_s:Vector}
export type SolarMotion={schema:'oras.solar-motion.v1';epoch:string;origin:'Sun center (10)';frame:'ICRF';units:'AU,AU/s';source:{id:string;release:string;sha256:string};coverage:{start:string;end:string};sampled_coverage:{start:string;end:string};tracks:{id:BodyId;ephemeris_target:string;position_reference:string;samples:SolarMotionSample[]}[];sampling:{step_seconds:number;interpolation:'cubic-hermite';max_position_error_km:number;qualification_points_per_segment:3;qualification:string}}
const targets=['10','199','299','399','4','5','6','7','8']
const stamp=(value:unknown)=>typeof value==='string'&&parseSceneDate(value)?Date.parse(value):NaN
const vector=(v:unknown,bound:number):v is Vector=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<bound)
const fail=()=>{throw Error('Invalid Solar motion source/frame/coverage contract.')}

export function validateSolarMotion(raw:unknown,epoch?:string):SolarMotion{
 const s=raw as SolarMotion
 if(!s||s.schema!=='oras.solar-motion.v1'||s.origin!=='Sun center (10)'||s.frame!=='ICRF'||s.units!=='AU,AU/s'||!Number.isFinite(stamp(s.epoch))||(epoch!==undefined&&stamp(s.epoch)!==stamp(epoch))||s.source?.id!=='jpl_de442s_local'||!/^[a-f0-9]{64}$/.test(s.source.sha256)||!s.source.release||s.sampling?.interpolation!=='cubic-hermite'||s.sampling.qualification_points_per_segment!==3||s.sampling.step_seconds!==3600||!Number.isFinite(s.sampling.max_position_error_km)||s.sampling.max_position_error_km<0||s.sampling.max_position_error_km>=1||!s.sampling.qualification||!Array.isArray(s.tracks)||s.tracks.length!==9)fail()
 const start=stamp(s.sampled_coverage?.start),end=stamp(s.sampled_coverage?.end),coverageStart=stamp(s.coverage?.start),coverageEnd=stamp(s.coverage?.end)
 if(![start,end,coverageStart,coverageEnd].every(Number.isFinite)||start>=end||start<coverageStart||end>coverageEnd||stamp(s.epoch)<start||stamp(s.epoch)>end||end-start>16*86400000)fail()
 const seen=new Set<string>()
 for(const track of s.tracks){
  if(!track||!bodyIds.includes(track.id)||seen.has(track.id)||track.ephemeris_target!==targets[bodyIds.indexOf(track.id)]||!track.position_reference||!Array.isArray(track.samples)||track.samples.length<2||track.samples.length>385)fail()
  let previous:SolarMotionSample|undefined
  for(const sample of track.samples){
   const time=stamp(sample?.epoch)
   if(!Number.isFinite(time)||!Number.isFinite(sample.jd_tdb)||Math.abs(sample.jd_tdb-(time/86400000+2440587.5))>.01||!vector(sample.position_au,100)||!vector(sample.velocity_au_s,.001)||(track.id==='sun'&&[...sample.position_au,...sample.velocity_au_s].some(n=>n!==0)))fail()
   if(previous){const utc=(time-stamp(previous.epoch))/1000,tdb=(sample.jd_tdb-previous.jd_tdb)*86400;if(utc<=0||utc>3600.001||tdb<=0||Math.abs(tdb-utc)>.01)fail()}
   previous=sample
  }
  if(stamp(track.samples[0].epoch)!==start||stamp(track.samples.at(-1)!.epoch)!==end)fail()
  seen.add(track.id)
 }
 return s
}

export function solarMotionContains(s:SolarMotion,utcMs:number){return Number.isFinite(utcMs)&&utcMs>=Date.parse(s.sampled_coverage.start)&&utcMs<=Date.parse(s.sampled_coverage.end)}
/** Begin one bounded prefetch within 30 wall seconds or 10% of the window edge. */
export function solarMotionNeedsRefresh(s:SolarMotion,utcMs:number,rate:number){
 if(!solarMotionContains(s,utcMs))return true
 if(!Number.isFinite(rate)||rate===0)return false
 const start=Date.parse(s.sampled_coverage.start),end=Date.parse(s.sampled_coverage.end),margin=Math.min((end-start)*.1,Math.max(60000,Math.abs(rate)*30000))
 return rate>0?end-utcMs<margin:utcMs-start<margin
}
export function evaluateSolarMotion(s:SolarMotion,utcMs:number):{epoch:string;jd_tdb:number;positions:Record<BodyId,Vector>}{
 if(!solarMotionContains(s,utcMs))throw Error('Time is outside sampled Solar source coverage.')
 // Browser Date/URL state has millisecond resolution. Preserve one epoch for
 // reported UTC and all vectors even when the animation clock has fractions.
 utcMs=Math.trunc(utcMs)
 let jd=0
 const positions={} as Record<BodyId,Vector>
 for(const track of s.tracks){
  const samples=track.samples;let lo=0,hi=samples.length-1
  while(hi-lo>1){const mid=(lo+hi)>>1;if(Date.parse(samples[mid].epoch)<=utcMs)lo=mid;else hi=mid}
  const a=samples[lo],b=samples[hi],u=(utcMs-Date.parse(a.epoch))/(Date.parse(b.epoch)-Date.parse(a.epoch)),dt=(b.jd_tdb-a.jd_tdb)*86400,u2=u*u,u3=u2*u
  jd=a.jd_tdb+u*(b.jd_tdb-a.jd_tdb)
  positions[track.id]=u===0?[...a.position_au]:u===1?[...b.position_au]:a.position_au.map((p,i)=>(2*u3-3*u2+1)*p+(u3-2*u2+u)*dt*a.velocity_au_s[i]+(-2*u3+3*u2)*b.position_au[i]+(u3-u2)*dt*b.velocity_au_s[i]) as Vector
 }
 return {epoch:new Date(utcMs).toISOString(),jd_tdb:jd,positions}
}
export async function loadSolarMotion(epoch:string,signal:AbortSignal,fetcher:typeof fetch=fetch){
 signal.throwIfAborted()
 const response=await fetcher('/api/v1/solar-system/motion?'+new URLSearchParams({epoch}),{signal})
 if(!response.ok)throw Error(response.status===422?'This time is outside qualified Solar motion coverage.':'Solar motion source unavailable. Playback is paused.')
 const raw=await response.json();signal.throwIfAborted();return validateSolarMotion(raw,epoch)
}
