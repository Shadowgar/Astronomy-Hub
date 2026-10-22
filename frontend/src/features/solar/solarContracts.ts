import {parseSceneDate} from '../runtime/productState'
export type Vector=[number,number,number]
export const bodyIds=['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune'] as const
export type BodyId=typeof bodyIds[number]
export type SolarBody={catalog:'Solar System (JPL)';source_id:BodyId;model:'sun'|'planet';name:string;ephemeris_target:string;position_reference:string;position_au:Vector;trajectory:{epoch:string;position_au:Vector}[];body_fixed_frame:null;shape:{model:string;mean_radius_km:number;units:'km';source:string};orientation:{status:'unavailable';source:null};surface:{available:false;reason:string}}
export type SolarSnapshot={schema:'oras.solar.v1';epoch:string;time_scale:string;origin:'Sun center (10)';frame:'ICRF';units:'AU';km_per_au:number;corrections:string;source:{id:string;release:string;sha256:string};trajectory_model:string;bodies:SolarBody[]}
const vector=(v:unknown):v is Vector=>Array.isArray(v)&&v.length===3&&v.every(x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<100)
export function validateSnapshot(raw:unknown):SolarSnapshot{
 const s=raw as SolarSnapshot
 if(!s||s.schema!=='oras.solar.v1'||s.units!=='AU'||s.origin!=='Sun center (10)'||s.frame!=='ICRF'||s.km_per_au!==149597870.7||!parseSceneDate(s.epoch)||!s.source||s.source.id!=='jpl_de442s_local'||!/^[a-f0-9]{64}$/.test(s.source.sha256)||!Array.isArray(s.bodies)||s.bodies.length!==9)throw Error('Invalid Solar source/frame contract.')
 const ids=new Set<string>()
 for(const b of s.bodies){
  const target={sun:'10',mercury:'199',venus:'299',earth:'399',mars:'4',jupiter:'5',saturn:'6',uranus:'7',neptune:'8'}[b.source_id]
  if(!target||ids.has(b.source_id)||b.catalog!=='Solar System (JPL)'||b.ephemeris_target!==target||b.model!==(b.source_id==='sun'?'sun':'planet')||!vector(b.position_au)||!Array.isArray(b.trajectory)||b.trajectory.length>129||b.trajectory.some(p=>!vector(p.position_au)||!parseSceneDate(p.epoch.replace(/(\.\d{3})\d+(Z)$/,'$1$2')))||!b.shape||b.shape.units!=='km'||!Number.isFinite(b.shape.mean_radius_km)||b.shape.mean_radius_km<=0||b.orientation?.status!=='unavailable'||b.surface?.available!==false||typeof b.surface.reason!=='string')throw Error('Invalid Solar body/vector contract.')
  ids.add(b.source_id)
 }
 return s
}
export async function loadSolarSnapshot(epoch:string,signal:AbortSignal,fetcher:typeof fetch=fetch){
 signal.throwIfAborted()
 const response=await fetcher('/api/v1/solar-system?'+new URLSearchParams({epoch}),{signal})
 if(!response.ok)throw Error(response.status===422?'This epoch is outside local ephemeris coverage.':'Local Solar ephemeris is unavailable. Retry or return to your previous view.')
 const raw=await response.json();signal.throwIfAborted();return validateSnapshot(raw)
}
export function solarReturnPath(path:string,epoch:string){
 const u=new URL(path,'http://local')
 if(u.origin!=='http://local'||!['/earth','/sky-engine','/'].includes(u.pathname))return '/sky-engine?'+new URLSearchParams({date:epoch})
 u.searchParams.set('date',epoch);for(const key of ['solarBody','solarFrom'])u.searchParams.delete(key)
 return u.pathname+'?'+u.searchParams
}
export function planetIntent(snapshot:SolarSnapshot,body:SolarBody,returnPath:string,requestId:string){
 return{schema:'oras.planet-intent.v1' as const,requestId,identity:{catalog:body.catalog,source_id:body.source_id,model:body.model},ephemerisTarget:body.ephemeris_target,positionReference:body.position_reference,referenceBody:'Sun center (10)',frame:snapshot.frame,epoch:snapshot.epoch,timeScale:snapshot.time_scale,units:snapshot.units,camera:{target_au:body.position_au,arrival:'body-context' as const},shape:body.shape,orientation:body.orientation,bodyFixedFrame:body.body_fixed_frame,longitudeConvention:null,surface:body.surface,returnPath:solarReturnPath(returnPath,snapshot.epoch),lifecycle:{onFailure:'retain-current' as const,onCancel:'retain-current' as const,onExit:'dispose-renderer' as const}}
}
export function negotiatePlanet(intent:ReturnType<typeof planetIntent>,capabilities:{bodyIds:string[];frames:string[]},cancelled:boolean){
 if(cancelled)return{status:'cancelled' as const,returnPath:intent.returnPath}
 if(!intent.surface.available||!intent.bodyFixedFrame||intent.orientation.status==='unavailable'||!capabilities.bodyIds.includes(intent.identity.source_id)||!capabilities.frames.includes(intent.frame))return{status:'unavailable' as const,reason:intent.surface.reason,returnPath:intent.returnPath}
 // A future R4 renderer must separately qualify all surface/frame/shape requirements.
 return{status:'unavailable' as const,reason:'No qualified Planet renderer.',returnPath:intent.returnPath}
}
