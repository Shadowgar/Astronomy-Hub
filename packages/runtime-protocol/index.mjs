import {WORKSPACE_CAPABILITIES,COMMAND_CAPABILITY,validState,validWorkspaceCommand,validWorkspaceEvent} from './workspace.mjs';
import {validNavigationState} from './navigation.mjs';
/** Serializable protocol only. No renderer objects or libraries. */
export const PROTOCOL = Object.freeze({major:1,minor:3});
export const CAPABILITIES = Object.freeze(['destroy','timeIntent','observerIntent',...WORKSPACE_CAPABILITIES]);
const commands = new Set(['getVersion','getCapabilities','setTimeIntent','setSimulation','setObserverIntent','destroy',...Object.keys(COMMAND_CAPABILITY)]);
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v) && (Object.getPrototypeOf(v) === Object.prototype || Object.getPrototypeOf(v) === null);
const keys = (v, allowed) => object(v) && Object.keys(v).every(k => allowed.includes(k));
const utc = v => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,3})?Z$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0,19)===v.slice(0,19);
const observer = v => keys(v,['lat','lon','elevationM']) && Number.isFinite(v.lat) && v.lat >= -90 && v.lat <= 90 && Number.isFinite(v.lon) && v.lon >= -180 && v.lon <= 180 && Number.isFinite(v.elevationM) && v.elevationM >= -1000 && v.elevationM <= 100000;
export function validSession(v) {
 return object(v) && ['sky','earth'].includes(v.runtime) && typeof v.nonce==='string' && /^[a-f0-9]{32}$/.test(v.nonce) && Number.isSafeInteger(v.generation) && v.generation > 0;
}
export function validHello(v) {
 return keys(v,['type','protocol','runtime','nonce','generation']) && v.type==='hello' && validSession(v) && keys(v.protocol,['major','minor']) && v.protocol.major===1 && Number.isSafeInteger(v.protocol.minor) && v.protocol.minor>=0;
}
const matches = (v,s) => validSession(v) && v.runtime===s.runtime && v.nonce===s.nonce && v.generation===s.generation;
export function validateBootstrap(event, expected) {
 const v=event.data;
 return event.origin===expected.origin && event.source===expected.source && keys(v,['type','protocol','runtime','nonce','generation','version','capabilities']) && matches(v,expected) && v.type==='ready' && keys(v.protocol,['major','minor']) && v.protocol.major===1 && Number.isSafeInteger(v.protocol.minor) && v.protocol.minor>=0 && typeof v.version==='string' && v.version.length>0 && v.version.length<=256 && Array.isArray(v.capabilities) && v.capabilities.length<=16 && v.capabilities.every(c=>typeof c==='string' && c.length<=64);
}
export function validateMessage(v, session) {
 if(!keys(v,['type','runtime','nonce','generation','id','command','payload']) || !matches(v,session) || !Number.isSafeInteger(v.id) || v.id<1 || !(commands.has(v.command)||v.type==='event'&&['interaction','navigationIntent'].includes(v.command))) return false;
 if(v.type==='event')return validWorkspaceEvent(v.command,v.payload)&&(v.command!=='navigationIntent'||v.payload.target!==session.runtime);
 if(v.type==='command') {
  if(v.command==='setNavigationView'&&v.payload?.mode!==session.runtime)return false;
  if(COMMAND_CAPABILITY[v.command])return validWorkspaceCommand(v.command,v.payload);
  if(v.command==='setSimulation') return session.runtime==='sky' && keys(v.payload,['utc','playing']) && typeof v.payload.playing==='boolean' && (v.payload.utc===undefined||utc(v.payload.utc));
  if(v.command==='setTimeIntent') return keys(v.payload,['utc','live']) && utc(v.payload.utc) && (v.payload.live===undefined||typeof v.payload.live==='boolean');
  if(v.command==='setObserverIntent'){const p=v.payload;return keys(p,['lat','lon','elevationM','elevationSource'])&&observer({lat:p.lat,lon:p.lon,elevationM:p.elevationM})&&(p.elevationSource===undefined||['provided','oras-site','unavailable-zero'].includes(p.elevationSource)&&(p.elevationSource!=='unavailable-zero'||p.elevationM===0));}
  return keys(v.payload,[]) && Object.keys(v.payload).length===0;
 }
 if(v.type!=='result' || !keys(v.payload,['ok','error','version','capabilities','temporalMode','effectiveTime','effectiveObserver','state','navigation','simulation'])) return false;
 const p=v.payload;
 if(p.simulation!==undefined&&p.simulation!==null&&!(session.runtime==='sky'&&keys(p.simulation,['utc','playing','speed'])&&utc(p.simulation.utc)&&typeof p.simulation.playing==='boolean'&&p.simulation.speed===1))return false;
 if(p.state!==undefined&&!validState(p.state))return false;
 if(p.navigation!==undefined&&(!validNavigationState(p.navigation)||p.navigation.mode!==session.runtime))return false;
 return typeof p.ok==='boolean' && (p.error===undefined || typeof p.error==='string' && p.error.length<=300) && (p.version===undefined || typeof p.version==='string' && p.version.length<=256) && (p.capabilities===undefined || Array.isArray(p.capabilities) && p.capabilities.length<=16 && p.capabilities.every(x=>CAPABILITIES.includes(x))) && (p.temporalMode===undefined || ['LIVE_ONLY','CONTROLLED','UNAVAILABLE'].includes(p.temporalMode)) && (p.effectiveTime===undefined || p.effectiveTime===null || utc(p.effectiveTime)) && (p.effectiveObserver===undefined || p.effectiveObserver===null || observer(p.effectiveObserver));
}
export function envelope(session,type,id,command,payload) { return {runtime:session.runtime,nonce:session.nonce,generation:session.generation,type,id,command,payload}; }
