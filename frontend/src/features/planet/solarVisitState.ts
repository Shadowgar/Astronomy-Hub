import type {Vector} from '../solar/solarContracts'
import type {SolarCameraView,SolarPreset,SolarQuality,SolarSizeMode} from '../solar/solarPresentation'
export type SolarVisitState={schema:'oras.solar-return.v1';epoch:string;anchor?:{id:string;position:Vector};camera:Vector;target:Vector;cameraUp:Vector;cameraView:SolarCameraView;closeView:boolean;near:number;preferences:{overview:SolarPreset;quality:SolarQuality;sizeMode:SolarSizeMode;orbits:boolean;effects:boolean;belt:boolean;beltDensity:number;navigation?:'orbit'|'follow'|'free';asteroids?:boolean;rate?:number;population?:'asteroid-belt'|'trans-neptunian'|null}}
export function readSolarVisitState(raw:unknown,epoch:string):SolarVisitState|null{
 const s=raw as SolarVisitState;const vec=(v:unknown):v is Vector=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<1e5)
 if(!s||s.schema!=='oras.solar-return.v1'||Date.parse(s.epoch)!==Date.parse(epoch)||!vec(s.camera)||!vec(s.target)||!vec(s.cameraUp)||Math.hypot(...s.cameraUp)<1e-9||Math.hypot(...s.camera.map((n,i)=>n-s.target[i]))<1e-14||!['full','inner','outer','belt','kuiper','body','custom'].includes(s.cameraView)||typeof s.closeView!=='boolean'||!Number.isFinite(s.near)||s.near<=0||s.near>10)return null
 if(s.anchor!==undefined&&(!s.anchor||typeof s.anchor.id!=='string'||!vec(s.anchor.position)))return null
 const p=s.preferences;if(!p||!['full','inner','outer','belt','kuiper'].includes(p.overview)||!['efficient','balanced','detailed'].includes(p.quality)||!['cinematic','physical'].includes(p.sizeMode)||typeof p.orbits!=='boolean'||typeof p.effects!=='boolean'||typeof p.belt!=='boolean'||!Number.isFinite(p.beltDensity)||p.beltDensity<0||p.beltDensity>6000)return null
 if(p.navigation!==undefined&&!['orbit','follow','free'].includes(p.navigation)||p.asteroids!==undefined&&typeof p.asteroids!=='boolean'||p.rate!==undefined&&(!Number.isFinite(p.rate)||![-86400,-3600,1,3600,86400].includes(p.rate)))return null
 if(p.population!==undefined&&p.population!==null&&!['asteroid-belt','trans-neptunian'].includes(p.population))return null
 return s
}

/** Rebase only an explicitly selected source body, using its Solar ephemeris
 * identity. Physical local-system centers never substitute for Solar barycenters. */
export function rebaseSolarVisitState(state:SolarVisitState,bodies:{source_id:string;position_au:Vector}[]):SolarVisitState{
 if(state.preferences?.navigation==='free')return state
 const body=state.anchor&&bodies.find(b=>b.source_id===state.anchor!.id)
 if(!body||!state.anchor)return state
 const delta=body.position_au.map((n,i)=>n-state.anchor!.position[i])
 return{...state,camera:state.camera.map((n,i)=>n+delta[i]) as Vector,target:state.target.map((n,i)=>n+delta[i]) as Vector,anchor:{id:body.source_id,position:[...body.position_au]}}
}
