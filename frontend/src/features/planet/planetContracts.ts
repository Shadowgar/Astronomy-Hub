import {safeHierarchyReturn} from '../systems/systemContracts'
import {apiGet} from '../../lib/api/client'
import {ApiError} from '../../lib/api/errors'
export type PlanetCamera={latitudeDeg:number;longitudeDeg:number;heightM:number;headingRad?:number;pitchRad?:number;rollRad?:number}
export type PlanetContract={schema:'oras.planet-view.v1';body:{catalog:'Solar System (JPL)';source_id:'moon';model:'moon';name:string;naif_id:'301';position_reference:string};epoch:string;time:{input_scale:'UTC';evaluation_scale:'TDB';jd_tdb:number};frame:{inertial:'ICRF';body_fixed:'MOON_ME_DE440_ME421';naif_frame_id:'31009';icrf_to_body_fixed:number[][]};shape:{model:string;radii_m:number[];source:string};coordinates:{latitude:string;longitude:string;height:string};illumination:{direction_body_fixed:number[];source:string;corrections?:string};capabilities:{orientation:boolean;globe:boolean;terrain:false;terrain_reason:string};sources:{id:string;url:string;sha256:string}[];coverage:{start:string;end:string};uncertainty:string}
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v)
const vector=(v:unknown):v is number[]=>Array.isArray(v)&&v.length===3&&v.every(finite)
export function validPlanetCamera(raw:unknown):raw is PlanetCamera{
 const c=raw as PlanetCamera;return !!c&&finite(c.latitudeDeg)&&Math.abs(c.latitudeDeg)<=90&&finite(c.longitudeDeg)&&c.longitudeDeg>=-180&&c.longitudeDeg<=180&&finite(c.heightM)&&c.heightM>=30000-1e-3&&c.heightM<=12000000+1e-3&&(!['headingRad','pitchRad','rollRad'].some(k=>c[k as keyof PlanetCamera]!==undefined)||(['headingRad','pitchRad','rollRad'].every(k=>finite(c[k as keyof PlanetCamera]))&&Math.abs(c.headingRad!)<=Math.PI*2&&c.pitchRad!>=-Math.PI/2-1e-8&&c.pitchRad!<=0&&Math.abs(c.rollRad!)<=Math.PI*2))
}
export function validatePlanetContract(raw:unknown):PlanetContract{
 const c=raw as PlanetContract,fail=()=>{throw Error('Planet source/frame qualification is unavailable.')}
 if(!c||c.schema!=='oras.planet-view.v1'||c.body?.catalog!=='Solar System (JPL)'||c.body.source_id!=='moon'||c.body.model!=='moon'||c.body.naif_id!=='301'||c.frame?.inertial!=='ICRF'||c.frame.body_fixed!=='MOON_ME_DE440_ME421'||c.frame.naif_frame_id!=='31009'||c.time?.input_scale!=='UTC'||c.time.evaluation_scale!=='TDB'||!finite(c.time.jd_tdb)||!Number.isFinite(Date.parse(c.epoch))||!vector(c.shape?.radii_m)||c.shape.radii_m.some(r=>Math.abs(r-1737400)>1e-6)||!c.capabilities?.orientation||!c.capabilities.globe||c.capabilities.terrain!==false||!c.capabilities.terrain_reason)fail()
 const m=c.frame.icrf_to_body_fixed;if(!Array.isArray(m)||m.length!==3||!m.every(vector))fail()
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)if(Math.abs(m[i].reduce((n,v,k)=>n+v*m[j][k],0)-(i===j?1:0))>1e-6)fail()
 const det=m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);if(Math.abs(det-1)>1e-6)fail()
 if(!vector(c.illumination?.direction_body_fixed)||Math.abs(Math.hypot(...c.illumination.direction_body_fixed)-1)>1e-6||!Array.isArray(c.sources)||!c.sources.length||c.sources.some(s=>!/^https:\/\//.test(s.url)||!/^[a-f0-9]{64}$/.test(s.sha256))||!c.coordinates?.height||!c.uncertainty)fail()
 const epoch=Date.parse(c.epoch),start=Date.parse(c.coverage?.start),end=Date.parse(c.coverage?.end);if(!Number.isFinite(start)||!Number.isFinite(end)||epoch<start||epoch>end)fail()
 // API UTC serializes milliseconds with three extra zero digits; bookmarks use JS precision.
 return {...c,epoch:c.epoch.replace(/(\.\d{3})000Z$/,'$1Z')}
}
export async function loadPlanetContract(body:string,epoch:string,signal:AbortSignal){
 try{return validatePlanetContract(await apiGet('/planet-view/'+encodeURIComponent(body),{query:{time:epoch},signal}))}
 catch(error){if(signal.aborted)throw error;if(error instanceof ApiError){if(error.status===404)throw Error('This body has no qualified Planet View.');if(error.status===422)throw Error('Use a valid UTC epoch within qualified lunar coverage (1900–2051).');throw Error('Qualified local lunar science sources are unavailable. Retry or return to Solar.')}throw error}
}
export function safeSolarReturn(path:unknown,epoch:string){return safeHierarchyReturn(path,epoch)}

export function planetModeReturn(returned:any,mode:'sky'|'earth',epoch:string){
 const target=mode==='earth'?'/earth':'/sky-engine',originReturn=returned?.state?.systemReturn?.state?.solarReturn||returned?.state?.solarReturn
 const original=new URL(typeof originReturn?.path==='string'?originReturn.path:'/', 'http://local')
 const sameOrigin=original.origin==='http://local'&&['/earth','/sky-engine','/'].includes(original.pathname)
 const p=new URLSearchParams(sameOrigin&&originReturn?.path?original.search:safeSolarReturn(returned?.path,epoch).split('?')[1]);p.set('date',epoch)
 for(const k of ['solarBody','solarSatellite','solarFrom','moon','camera'])p.delete(k)
 return {path:target+'?'+p,state:originReturn?.state}
}

// getRandomValues is available on the owner's LAN HTTP preview as well as HTTPS.
// randomUUID requires a secure context and is unavailable on that preview origin.
export function createPlanetChannel(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('')}

export function cameraFromPlanetSearch(search:string):PlanetCamera|undefined{
 const q=new URLSearchParams(search),lat=q.get('lat'),lon=q.get('lon'),height=q.get('height');if(lat===null||lon===null||height===null||!lat.trim()||!lon.trim()||!height.trim())return
 const candidate={latitudeDeg:Number(lat),longitudeDeg:Number(lon),heightM:Number(height),headingRad:Number(q.get('heading')??0),pitchRad:Number(q.get('pitch')??-Math.PI/2),rollRad:Number(q.get('roll')??0)}
 return validPlanetCamera(candidate)?candidate:undefined
}
