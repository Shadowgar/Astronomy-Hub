import type {SystemBodyOrientation,SystemQuaternion,SystemSnapshot} from './systemTypes'

const finite=(n:unknown):n is number=>typeof n==='number'&&Number.isFinite(n)
const timestamp=(v:unknown)=>typeof v==='string'&&/Z$|[+-]\d\d:\d\d$/.test(v)?Date.parse(v):NaN
const digest=(v:unknown)=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v)
const fail=():never=>{throw Error('Source body orientation is unavailable or outside qualified coverage.')}

/** Validate exact source-frame identity and the bounded samples before rendering. */
export function validateSystemOrientations(snapshot:SystemSnapshot):void{
 if(snapshot.orientations===undefined)return
 const orientations=snapshot.orientations
 if(!orientations||typeof orientations!=='object'||Array.isArray(orientations))fail()
 const identities:Record<string,string>={[snapshot.system_id]:snapshot.parent.naif_id}
 for(const moon of snapshot.satellites)if(moon.status==='qualified')identities[moon.id]=moon.naif_id
 if(Object.keys(orientations).length>Object.keys(identities).length)fail()
 const start=timestamp(snapshot.sampled_coverage.start),end=timestamp(snapshot.sampled_coverage.end)
 for(const [body,track] of Object.entries(orientations)){
  const frame=body==='earth'?'ITRS':body==='moon'?'MOON_ME_DE440_ME421':body==='deimos'?'PDS_THOMAS_DEIMOS':'IAU_'+body.toUpperCase()
  if(!Object.hasOwn(identities,body)||!track||track.body_id!==body||track.naif_id!==identities[body]||track.from_frame!=='body-fixed'||track.to_frame!=='ICRF'||track.body_fixed_frame!==frame||track.quaternion_order!=='xyzw'||track.interpolation!=='shortest-slerp'||!track.model||!track.accuracy||!track.source?.id||!track.source.url?.startsWith('https://')||!digest(track.source.sha256)||!finite(track.max_sampled_interpolation_error_arcsec)||track.max_sampled_interpolation_error_arcsec<0||track.max_sampled_interpolation_error_arcsec>=1||!Array.isArray(track.samples)||track.samples.length<2||track.samples.length>5000)fail()
  if(body==='deimos'&&(track.model_id!=='pds-thomas-deimos-label-v1'||track.source.sha256!=='74b4c557e6827940430b2d670ec972d9a5d5dc63ef0a95b2b6ebd141ab78f634'))fail()
  if(body==='phobos'&&(track.model_id!=='pds-gaskell-phobos-pck00006'||track.source.sha256!=='8aacb5dff544bed1f7cf0659296a1ca75896128a0a729447be0a4deb4de4ecb4'))fail()
  let previous=-Infinity,previousTdb=-Infinity
  const maximumGap=(body==='earth'||body==='moon'?3600:600)*1000
  for(const sample of track.samples){
   const stamp=timestamp(sample?.epoch),q=sample?.quaternion
   if(!Number.isFinite(stamp)||stamp<=previous||!finite(sample?.jd_tdb)||sample.jd_tdb<=previousTdb||!Array.isArray(q)||q.length!==4||!q.every(finite)||Math.abs(Math.hypot(...q)-1)>1e-6)fail()
   if(Math.abs((sample.jd_tdb-snapshot.time.jd_tdb)*86400000-(stamp-timestamp(snapshot.epoch)))>3)fail()
   if(Number.isFinite(previous)&&(stamp-previous>maximumGap+1||Math.abs((sample.jd_tdb-previousTdb)*86400000-(stamp-previous))>2.5))fail()
   previous=stamp;previousTdb=sample.jd_tdb
  }
  if(timestamp(track.samples[0].epoch)>start||previous<end)fail()
 }
}

/** Source-sample SLERP only. The caller supplies the same UTC used for positions. */
export function interpolateOrientation(track:SystemBodyOrientation,utcMs:number):SystemQuaternion{
 const samples=track.samples
 if(!finite(utcMs)||samples.length<2||utcMs<timestamp(samples[0].epoch)||utcMs>timestamp(samples[samples.length-1].epoch))return fail()
 let low=0,high=samples.length-1
 while(high-low>1){const middle=(low+high)>>1;if(timestamp(samples[middle].epoch)<=utcMs)low=middle;else high=middle}
 const a=samples[low],b=samples[high]
 if(utcMs===timestamp(a.epoch))return [...a.quaternion]
 if(utcMs===timestamp(b.epoch))return [...b.quaternion]
 const u=(utcMs-timestamp(a.epoch))/(timestamp(b.epoch)-timestamp(a.epoch))
 let dot=a.quaternion.reduce((total,value,index)=>total+value*b.quaternion[index],0)
 const sign=dot<0?-1:1;dot=Math.max(-1,Math.min(1,Math.abs(dot)))
 const theta=Math.acos(dot),sine=Math.sin(theta)
 const left=theta<1e-8?1-u:Math.sin((1-u)*theta)/sine,right=theta<1e-8?u:Math.sin(u*theta)/sine
 const result=a.quaternion.map((value,index)=>left*value+right*sign*b.quaternion[index]) as SystemQuaternion
 const norm=Math.hypot(...result)
 if(!Number.isFinite(norm)||norm<1e-12)return fail()
 return result.map(value=>value/norm) as SystemQuaternion
}
