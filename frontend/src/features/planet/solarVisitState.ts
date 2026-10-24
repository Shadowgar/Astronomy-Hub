import type {Vector} from '../solar/solarContracts'
import type {SolarCameraView,SolarPreset,SolarQuality,SolarSizeMode} from '../solar/solarPresentation'
export type SolarVisitState={schema:'oras.solar-return.v1';epoch:string;camera:Vector;target:Vector;cameraUp:Vector;cameraView:SolarCameraView;closeView:boolean;near:number;preferences:{overview:SolarPreset;quality:SolarQuality;sizeMode:SolarSizeMode;orbits:boolean;effects:boolean;belt:boolean;beltDensity:number}}
export function readSolarVisitState(raw:unknown,epoch:string):SolarVisitState|null{
 const s=raw as SolarVisitState;const vec=(v:unknown):v is Vector=>Array.isArray(v)&&v.length===3&&v.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<1e5)
 if(!s||s.schema!=='oras.solar-return.v1'||Date.parse(s.epoch)!==Date.parse(epoch)||!vec(s.camera)||!vec(s.target)||!vec(s.cameraUp)||Math.hypot(...s.cameraUp)<1e-9||Math.hypot(...s.camera.map((n,i)=>n-s.target[i]))<1e-14||!['full','inner','outer','body','custom'].includes(s.cameraView)||typeof s.closeView!=='boolean'||!Number.isFinite(s.near)||s.near<=0||s.near>10)return null
 const p=s.preferences;if(!p||!['full','inner','outer'].includes(p.overview)||!['efficient','balanced','detailed'].includes(p.quality)||!['cinematic','physical'].includes(p.sizeMode)||typeof p.orbits!=='boolean'||typeof p.effects!=='boolean'||typeof p.belt!=='boolean'||!Number.isFinite(p.beltDensity)||p.beltDensity<0||p.beltDensity>6000)return null
 return s
}
