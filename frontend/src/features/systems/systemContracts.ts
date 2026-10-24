import type {EvaluatedSystem,SystemCamera,SystemCatalog,SystemEntry,SystemParent,SystemSatellite,SystemSnapshot,SystemTrack,SystemVisitState,Vec3} from './systemTypes'
export const systemIds=['earth','mars','jupiter','saturn','uranus','neptune'] as const
export const parentCenters:Record<string,string>={earth:'399',mars:'499',jupiter:'599',saturn:'699',uranus:'799',neptune:'899'}
const finite=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n)
const vector=(v:unknown):v is Vec3=>Array.isArray(v)&&v.length===3&&v.every(finite)
const timestamp=(s:unknown):number=>typeof s==='string'&&/Z$|[+-]\d\d:\d\d$/.test(s)?Date.parse(s):NaN
const validId=(s:unknown):s is string=>typeof s==='string'&&/^[a-z0-9][a-z0-9_-]{0,60}$/.test(s)
const fail=():never=>{throw Error('Planetary system source, identity or time contract is unavailable.')}
function parent(p:SystemParent,id:string){if(!p||p.id!==id||p.naif_id!==parentCenters[id]||!p.name||!finite(p.radius_km)||p.radius_km<=0||!p.radius_source||!p.material)fail()}
function satellites(list:SystemSatellite[],id:string){
 if(!Array.isArray(list)||list.length>1000)fail();const ids=new Set<string>(),targets=new Set<string>()
 for(const s of list){if(!s||!validId(s.id)||ids.has(s.id)||!s.name||typeof s.naif_id!=='string'||!/^\d+$/.test(s.naif_id)||targets.has(s.naif_id)||s.naif_id===parentCenters[id]||!(s.naif_id.startsWith(parentCenters[id][0]))||!['qualified','unavailable'].includes(s.status)||!s.surface||typeof s.surface.available!=='boolean')fail();if(s.status==='qualified'&&(!finite(s.radius_km)||s.radius_km<=0||!s.radius_source))fail();if(s.surface.available&&(s.id!=='moon'||s.naif_id!=='301'||s.surface.destination!=='/planet-view/moon'))fail();if(s.surface.destination!==null&&s.surface.destination!=='/planet-view/moon')fail();if(id==='earth'&&(s.id!=='moon'||s.naif_id!=='301'))fail();ids.add(s.id);targets.add(s.naif_id)}
}
export function validateSystemCatalog(raw:unknown):SystemCatalog{
 const c=raw as SystemCatalog;if(!c||c.schema!=='oras.planetary-systems.v1'||!Array.isArray(c.systems)||c.systems.length>6)fail();const ids=new Set<string>()
 for(const s of c.systems){if(!s||!parentCenters[s.id]||ids.has(s.id)||!s.name||!['qualified','unavailable'].includes(s.status))fail();parent(s.parent,s.id);satellites(s.satellites,s.id);ids.add(s.id)}return c
}
export function validateSystemSnapshot(raw:unknown,id:string,epoch:string):SystemSnapshot{
 const s=raw as SystemSnapshot;if(!s||s.schema!=='oras.planetary-system.v1'||s.system_id!==id||!parentCenters[id]||timestamp(s.epoch)!==timestamp(epoch)||!Number.isFinite(timestamp(epoch))||s.frame!=='ICRF'||s.units!=='km'||s.origin!==`${s.parent?.name} center (${parentCenters[id]})`||s.time?.input_scale!=='UTC'||s.time.evaluation_scale!=='TDB'||!finite(s.time.jd_tdb)||!s.source||!/^[a-f0-9]{64}$/.test(s.source.sha256)||!s.source.url?.startsWith('https://')||s.sampling?.interpolation!=='cubic-hermite'||!finite(s.sampling.step_seconds)||s.sampling.step_seconds<=0||!finite(s.sampling.max_position_error_km)||s.sampling.max_position_error_km<0||!s.sampling.qualification)fail()
 parent(s.parent,id);satellites(s.satellites,id)
 const start=timestamp(s.sampled_coverage?.start),end=timestamp(s.sampled_coverage?.end),fullStart=timestamp(s.coverage?.start),fullEnd=timestamp(s.coverage?.end),now=timestamp(s.epoch)
 if(![start,end,fullStart,fullEnd].every(Number.isFinite)||start>=end||start<fullStart||end>fullEnd||now<start||now>end)fail()
 if(!Array.isArray(s.tracks)||s.tracks.length!==s.satellites.filter(m=>m.status==='qualified').length||!s.sun_track||s.sun_track.id!=='sun')fail()
 const seen=new Set<string>();for(const track of [...s.tracks,s.sun_track]){if(!track||seen.has(track.id)||(track.id!=='sun'&&!s.satellites.some(m=>m.id===track.id&&m.status==='qualified'))||!Array.isArray(track.samples)||track.samples.length<2||track.samples.length>10000)fail();let last=-Infinity,lastJd=-Infinity
 for(const p of track.samples){const t=timestamp(p.epoch);if(!Number.isFinite(t)||t<=last||!finite(p.jd_tdb)||p.jd_tdb<=lastJd||!vector(p.position_km)||!vector(p.velocity_km_s)||Math.max(...p.position_km.map(Math.abs))>1e11)fail();last=t;lastJd=p.jd_tdb}
 if(timestamp(track.samples[0].epoch)>start||last<end)fail();seen.add(track.id)}return s
}
/** Cubic Hermite between source position/velocity samples; never extrapolates. */
export function interpolateTrack(track:SystemTrack,utcMs:number):Vec3{
 const a=track.samples;if(!Number.isFinite(utcMs)||!a.length||utcMs<Date.parse(a[0].epoch)||utcMs>Date.parse(a[a.length-1].epoch))throw Error('Time is outside sampled source coverage.')
 let lo=0,hi=a.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(Date.parse(a[mid].epoch)<=utcMs)lo=mid;else hi=mid}
 const left=a[lo],right=a[hi],t0=Date.parse(left.epoch),t1=Date.parse(right.epoch);if(utcMs===t0)return [...left.position_km];if(utcMs===t1)return [...right.position_km]
 const u=(utcMs-t0)/(t1-t0),dt=(right.jd_tdb-left.jd_tdb)*86400,u2=u*u,u3=u2*u
 return left.position_km.map((p,i)=>(2*u3-3*u2+1)*p+(u3-2*u2+u)*dt*left.velocity_km_s[i]+(-2*u3+3*u2)*right.position_km[i]+(u3-u2)*dt*right.velocity_km_s[i]) as Vec3
}
export function evaluateSystem(s:SystemSnapshot,utcMs:number):EvaluatedSystem{
 const first=s.sun_track.samples[0],last=s.sun_track.samples.at(-1)!,fraction=(utcMs-Date.parse(first.epoch))/(Date.parse(last.epoch)-Date.parse(first.epoch))
 return {epoch:new Date(utcMs).toISOString(),jd_tdb:first.jd_tdb+fraction*(last.jd_tdb-first.jd_tdb),positions:Object.fromEntries(s.tracks.map(t=>[t.id,interpolateTrack(t,utcMs)])),sun:interpolateTrack(s.sun_track,utcMs)}
}
export async function loadSystemCatalog(signal:AbortSignal):Promise<SystemCatalog>{const r=await fetch('/api/v1/planetary-systems',{signal});if(!r.ok)throw Error('Natural satellite sources are unavailable.');const data=await r.json();signal.throwIfAborted();return validateSystemCatalog(data)}
export async function loadSystemSnapshot(id:string,epoch:string,signal:AbortSignal):Promise<SystemSnapshot>{const r=await fetch('/api/v1/planetary-systems/'+encodeURIComponent(id)+'?'+new URLSearchParams({epoch}),{signal});if(!r.ok)throw Error(r.status===422?'This epoch is outside qualified system coverage.':r.status===404?'This planetary system has no qualified local positional source.':'Local planetary-system sources are unavailable. Retry or return to Solar.');const data=await r.json();signal.throwIfAborted();return validateSystemSnapshot(data,id,epoch)}
export function validSystemCamera(raw:unknown):raw is SystemCamera{const c=raw as SystemCamera;return !!c&&vector(c.position)&&vector(c.target)&&vector(c.up)&&[...c.position,...c.target].every(n=>Math.abs(n)<1e10)&&Math.hypot(...c.up)>1e-9&&Math.hypot(...c.position.map((n,i)=>n-c.target[i]))>1e-6&&(c.focus===null||validId(c.focus))}
export function readSystemCamera(search:string):SystemCamera|null{try{const raw=JSON.parse(new URLSearchParams(search).get('camera')||'null');return validSystemCamera(raw)?raw:null}catch{return null}}
export function systemPath(id:string,epoch:string,selected:string|null=null,camera?:SystemCamera){const p=new URLSearchParams({date:epoch});if(selected)p.set('moon',selected);if(camera&&validSystemCamera(camera))p.set('camera',JSON.stringify(camera));return '/planetary-system/'+encodeURIComponent(id)+'?'+p}
export function readSystemVisit(raw:unknown,id:string,epoch:string):SystemVisitState|null{const s=raw as SystemVisitState;return s?.schema==='oras.system-return.v1'&&s.system===id&&Date.parse(s.epoch)===Date.parse(epoch)&&validSystemCamera(s.camera)&&['cinematic','physical'].includes(s.sizeMode)&&typeof s.orbits==='boolean'?s:null}
export function safeHierarchyReturn(path:unknown,epoch:string){const fallback='/solar-system?'+new URLSearchParams({date:epoch});if(typeof path!=='string')return fallback;try{const u=new URL(path,'http://local');if(u.origin!=='http://local'||!(u.pathname==='/solar-system'||systemIds.some(id=>u.pathname==='/planetary-system/'+id)))return fallback;u.searchParams.set('date',epoch);return u.pathname+'?'+u.searchParams}catch{return fallback}}
