export type Vec3=[number,number,number]
export type MissionQuality='reconstructed'|'predicted'|'mission-design'|'mixed'
export const missionQualityStyles:Record<MissionQuality,{color:string;label:string}>={reconstructed:{color:'#b8d5ee',label:'Reconstructed'},predicted:{color:'#e0a969',label:'Predicted'},'mission-design':{color:'#a99c88',label:'Mission design'},mixed:{color:'#b2a2df',label:'Mixed source'}}
export type Knot={epoch:string;jd_tdb:number;position:Vec3;velocity:Vec3}
export type MissionEvent={id:string;label:string;epoch:string;precision:string;target_id?:string|null;source_url:string;available?:boolean;view_epoch?:string|null}
export type MissionEntry={id:string;name:string;naif_id:string;summary:string;default_epoch:string|null;status?:string;representation?:string;targets:{id:string;naif_id:string;appearance_id:string}[];events:MissionEvent[];segments:{id:string;start:string;end:string;quality:MissionQuality;label:string;target_ids:string[]}[];limitations:string[]}
export type MissionCatalog={schema:'oras.mission-catalog.v1';release_id:string;missions:MissionEntry[]}
export type MissionTrack={segment_id:string;quality:MissionQuality;source_label:string;points:{epoch:string;position:Vec3}[];start:string;end:string}
export type MissionBody={id:string;name:string;naif_id:string;appearance_id:string;radius_km:number;position:Vec3;velocity:Vec3}
export type MissionState={schema:'oras.mission-state.v1';mission_id:string;epoch:string;jd_tdb:number;frame:'ICRF';origin:'sun';position_units:'AU';velocity_units:'AU/s';segment_id:string;quality:MissionQuality;source_label:string;craft:{id:string;naif_id:string;position:Vec3;velocity:Vec3};bodies:MissionBody[];tracks:MissionTrack[];coverage:MissionEntry['segments'];interpolation:{max_sampled_position_error_km:number;max_sampled_velocity_error_km_s:number;physical_uncertainty:string};attitude:{status:string;description:string};samples:{start:string;end:string;step_seconds:number|null;craft:Knot[];bodies:{id:string;samples:Knot[]}[]}}
export type MissionModel={modelUrl:string;sha256:string;bytes:number;metersPerSourceUnit:number;centerSource:Vec3;radiusMeters:number;configuration:{label:string};attitude:{label:string};scale:{status:string};sources:unknown;rights:unknown}
export type EvaluatedMission={epoch:string;craft:Vec3;bodies:Record<string,Vec3>}
export const missionIds=['voyager1','voyager2','cassini','newhorizons','pioneer10','pioneer11','juno','dawn','near','rosetta'] as const
export const missionNaif:Record<string,string>={voyager1:'-31',voyager2:'-32',cassini:'-82',newhorizons:'-98',pioneer10:'-23',pioneer11:'-24',juno:'-61',dawn:'-203',near:'-93',rosetta:'-226'}
export function missionSegment(s:MissionState){const segment=s.coverage.find(c=>c.id===s.segment_id);assert(segment,'Mission segment coverage missing');return segment}
const quality=(q:unknown)=>['reconstructed','predicted','mission-design','mixed'].includes(q as string)
export function missionEpochMs(value:string){const ms=Date.parse(value),fraction=/\.(\d+)Z$/.exec(value)?.[1];return ms+(fraction?Number('0.'+fraction)*1000-Number(fraction.slice(0,3).padEnd(3,'0')):0)}
const time=(s:unknown):s is string=>typeof s==='string'&&/Z$/.test(s)&&Number.isFinite(Date.parse(s))
const vector=(p:unknown):p is Vec3=>Array.isArray(p)&&p.length===3&&p.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<10000)
function assert(condition:unknown,message='Unqualified mission source contract'):asserts condition {if(!condition)throw Error(message)}
function knots(values:Knot[],start:number,end:number){assert(Array.isArray(values)&&values.length>=2&&values.length<=4096);let previous=-Infinity,previousTdb=-Infinity;for(const v of values){assert(time(v.epoch)&&Date.parse(v.epoch)>previous&&vector(v.position)&&vector(v.velocity)&&Number.isFinite(v.jd_tdb)&&v.jd_tdb>previousTdb&&Math.abs(v.jd_tdb-(Date.parse(v.epoch)/86400000+2440587.5))<.002);if(previous!==-Infinity)assert(Math.abs((v.jd_tdb-previousTdb)*86400000-(Date.parse(v.epoch)-previous))<=3,'UTC and TDB sample intervals disagree');previous=Date.parse(v.epoch);previousTdb=v.jd_tdb}assert(Date.parse(values[0].epoch)<=start&&previous>=end)}
export function validateMissionState(raw:unknown,id:string,epoch:string,entry:MissionEntry):MissionState{
 const s=raw as MissionState
 assert(s?.schema==='oras.mission-state.v1'&&s.mission_id===id&&s.craft?.id===id&&time(s.epoch)&&Date.parse(s.epoch)===Date.parse(epoch))
 assert(s.frame==='ICRF'&&s.origin==='sun'&&s.position_units==='AU'&&s.velocity_units==='AU/s'&&quality(s.quality))
 assert(Number.isFinite(s.jd_tdb)&&Math.abs(s.jd_tdb-(missionEpochMs(s.epoch)/86400000+2440587.5))<.002);assert(vector(s.craft.position)&&vector(s.craft.velocity)&&s.craft.naif_id===missionNaif[id]&&s.craft.naif_id===entry.naif_id&&entry.id===id)
 assert(time(s.samples?.start)&&time(s.samples?.end)&&Array.isArray(s.coverage))
 const segment=missionSegment(s),binding=entry.segments.find(c=>c.id===s.segment_id);assert(binding&&binding.quality===s.quality&&segment.quality===s.quality&&Date.parse(segment.start)>=Date.parse(binding.start)&&Date.parse(segment.end)<=Date.parse(binding.end));const start=Date.parse(s.samples.start),end=Date.parse(s.samples.end),now=Date.parse(epoch)
 assert(start<end&&now>=start&&now<=end&&start>=Date.parse(segment.start)&&end<=Date.parse(segment.end),'Mission epoch outside source coverage')
 knots(s.samples.craft,start,end);assert(Array.isArray(s.bodies)&&s.bodies.length<=20&&Array.isArray(s.samples.bodies)&&s.samples.bodies.length===s.bodies.filter(b=>b.id!=='sun').length)
 const ids=new Set<string>()
 for(const b of s.bodies){const target=entry.targets.find(t=>t.id===b.id);assert(target&&(b.id==='sun'||binding.target_ids.includes(b.id))&&target.naif_id===b.naif_id&&target.appearance_id===b.appearance_id);assert(!ids.has(b.id)&&b.id!==id&&typeof b.naif_id==='string'&&typeof b.appearance_id==='string'&&Number.isFinite(b.radius_km)&&b.radius_km>0&&vector(b.position)&&vector(b.velocity));ids.add(b.id);if(b.id==='sun'){assert(b.naif_id==='10'&&b.appearance_id==='sun'&&b.position.every(n=>n===0)&&b.velocity.every(n=>n===0));continue}const track=s.samples.bodies.find(t=>t.id===b.id);assert(track);knots(track.samples,start,end);assert(track.samples.length===s.samples.craft.length&&track.samples.every((k,i)=>Date.parse(k.epoch)===Date.parse(s.samples.craft[i].epoch)&&k.jd_tdb===s.samples.craft[i].jd_tdb),'Historical craft and target samples use different epochs')}
 assert(s.bodies.filter(b=>b.id!=='sun').length===binding.target_ids.length&&binding.target_ids.every(id=>ids.has(id)));assert(s.interpolation&&[s.interpolation.max_sampled_position_error_km,s.interpolation.max_sampled_velocity_error_km_s].every(n=>Number.isFinite(n)&&n>=0)&&s.attitude?.status==='unavailable');validateMissionTracks(s.tracks);for(const t of s.tracks)assert(t.segment_id===s.segment_id&&t.quality===s.quality&&Date.parse(t.start)>=Date.parse(binding.start)&&Date.parse(t.end)<=Date.parse(binding.end),'State path is outside its qualified segment');return s
}
export function validateMissionTracks(raw:unknown):MissionTrack[]{
 assert(Array.isArray(raw)&&raw.length<=32);let count=0
 for(const t of raw){assert(typeof t.segment_id==='string'&&quality(t.quality)&&time(t.start)&&time(t.end)&&Array.isArray(t.points)&&t.points.length>=2);let prior=-Infinity;for(const p of t.points){assert(time(p.epoch)&&Date.parse(p.epoch)>prior&&vector(p.position));prior=Date.parse(p.epoch);count++}assert(Date.parse(t.points[0].epoch)>=Date.parse(t.start)&&prior<=Date.parse(t.end))}assert(count<=16384,'Mission trajectory budget exceeded');return raw as MissionTrack[]
}
export function validateMissionTrajectory(raw:unknown,entry:MissionEntry):MissionTrack[]{const data=raw as {schema:string;mission_id:string;frame:string;origin:string;position_units:string;tracks:MissionTrack[];point_count:number};assert(data?.schema==='oras.mission-trajectory.v1'&&data.mission_id===entry.id&&data.frame==='ICRF'&&data.origin==='sun'&&data.position_units==='AU');const tracks=validateMissionTracks(data.tracks);assert(data.point_count===tracks.reduce((n,t)=>n+t.points.length,0));for(const t of tracks){const s=entry.segments.find(s=>s.id===t.segment_id);assert(s&&s.quality===t.quality&&Date.parse(t.start)>=Date.parse(s.start)&&Date.parse(t.end)<=Date.parse(s.end),'Trajectory is outside its catalog source segment')}return tracks}

function interpolate(samples:Knot[],ms:number,anchor:MissionState):Vec3{
 let lo=0,hi=samples.length-1;while(hi-lo>1){const mid=(hi+lo)>>1;if(missionEpochMs(samples[mid].epoch)<=ms)lo=mid;else hi=mid}
 // Use the source TDB anchor, not millisecond-truncated source UTC labels.
 // The backend clips windows at leap seconds; UTC elapsed seconds therefore
 // remain continuous here. Retain the two-part difference to avoid rounding
 // a sub-second clock step when adding it to a large Julian date.
 const a=samples[lo],b=samples[hi],seconds=(b.jd_tdb-a.jd_tdb)*86400,elapsed=(anchor.jd_tdb-a.jd_tdb)*86400+(ms-missionEpochMs(anchor.epoch))/1000,u=elapsed/seconds,u2=u*u,u3=u2*u
 return a.position.map((p,i)=>(2*u3-3*u2+1)*p+(u3-2*u2+u)*seconds*a.velocity[i]+(-2*u3+3*u2)*b.position[i]+(u3-u2)*seconds*b.velocity[i]) as Vec3
}
export function evaluateMission(s:MissionState,ms:number):EvaluatedMission{
 assert(Number.isFinite(ms)&&ms>=Date.parse(s.samples.start)&&ms<=Date.parse(s.samples.end),'Mission epoch outside source coverage')
 return{epoch:new Date(ms).toISOString(),craft:interpolate(s.samples.craft,ms,s),bodies:Object.fromEntries(s.samples.bodies.map(b=>[b.id,interpolate(b.samples,ms,s)]))}
}
export function missionPath(id:string,epoch?:string){assert(missionIds.includes(id as typeof missionIds[number]),'Unknown mission');return `/missions/${id}${epoch?'?'+new URLSearchParams({date:epoch}):''}`}
export function missionModel(raw:unknown,id:string):MissionModel|null{
 const data=raw as {schema:string;missions:Record<string,string>;models:Record<string,MissionModel>};assert(data?.schema==='astronomy-hub.mission-assets.v1');const key=data.missions?.[id];if(!key)return null
 const model=data.models?.[key];assert(model&&/^\/mission-assets\/v2\.5\/[a-z-]+\.glb$/.test(model.modelUrl)&&/^[a-f0-9]{64}$/.test(model.sha256)&&model.bytes>0&&model.bytes<=16*1024*1024&&model.metersPerSourceUnit>0&&model.metersPerSourceUnit<100&&vector(model.centerSource)&&model.radiusMeters>0&&model.radiusMeters<100);return model
}
export async function missionJson(url:string,signal:AbortSignal){const r=await fetch(url,{signal});if(!r.ok)throw Error(r.status===422?'This UTC is outside the qualified mission segments. Choose a supported event.':'Mission source unavailable. Retry or choose another mission.');assert(Number(r.headers.get('content-length'))<=16*1024*1024,'Mission response budget exceeded');const text=await r.text();assert(text.length<=16*1024*1024,'Mission response budget exceeded');return JSON.parse(text)}
export async function loadMissionCatalog(signal:AbortSignal):Promise<MissionCatalog>{const c=await missionJson('/api/v1/solar/missions',signal);assert(c?.schema==='oras.mission-catalog.v1'&&Array.isArray(c.missions)&&c.missions.length<=10);for(const m of c.missions){assert(missionIds.includes(m.id)&&m.naif_id===missionNaif[m.id]&&(m.default_epoch===null||time(m.default_epoch))&&Array.isArray(m.segments)&&Array.isArray(m.events)&&Array.isArray(m.targets));for(const s of m.segments)assert(time(s.start)&&time(s.end)&&Date.parse(s.start)<Date.parse(s.end)&&quality(s.quality));for(const e of m.events)assert(time(e.epoch)&&typeof e.label==='string'&&/^https:\/\//.test(e.source_url))}return c}
export async function loadMission(id:string,epoch:string,signal:AbortSignal,entry:MissionEntry){return validateMissionState(await missionJson(`/api/v1/solar/missions/${encodeURIComponent(id)}?${new URLSearchParams({epoch})}`,signal),id,epoch,entry)}

export async function loadMissionTrajectory(entry:MissionEntry,range:{start?:string;end?:string},signal:AbortSignal){const params=new URLSearchParams();if(range.start)params.set('start',range.start);if(range.end)params.set('end',range.end);return validateMissionTrajectory(await missionJson(`/api/v1/solar/missions/${encodeURIComponent(entry.id)}/trajectory${params.size?'?'+params:''}`,signal),entry)}
