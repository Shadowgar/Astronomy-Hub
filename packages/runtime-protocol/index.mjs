/** Serializable protocol only. No renderer objects or libraries. */
export const PROTOCOL = Object.freeze({major:1,minor:0});
export const CAPABILITIES = Object.freeze(['destroy','timeIntent','observerIntent']);
const commands = new Set(['getVersion','getCapabilities','setTimeIntent','setObserverIntent','destroy']);
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
 if(!keys(v,['type','runtime','nonce','generation','id','command','payload']) || !matches(v,session) || !Number.isSafeInteger(v.id) || v.id<1 || !commands.has(v.command)) return false;
 if(v.type==='command') {
  if(v.command==='setTimeIntent') return keys(v.payload,['utc']) && utc(v.payload.utc);
  if(v.command==='setObserverIntent') return observer(v.payload);
  return keys(v.payload,[]) && Object.keys(v.payload).length===0;
 }
 if(v.type!=='result' || !keys(v.payload,['ok','error','version','capabilities','temporalMode','effectiveTime','effectiveObserver'])) return false;
 const p=v.payload;
 return typeof p.ok==='boolean' && (p.error===undefined || typeof p.error==='string' && p.error.length<=300) && (p.version===undefined || typeof p.version==='string' && p.version.length<=256) && (p.capabilities===undefined || Array.isArray(p.capabilities) && p.capabilities.length<=16 && p.capabilities.every(x=>CAPABILITIES.includes(x))) && (p.temporalMode===undefined || ['LIVE_ONLY','CONTROLLED','UNAVAILABLE'].includes(p.temporalMode)) && (p.effectiveTime===undefined || p.effectiveTime===null || utc(p.effectiveTime)) && (p.effectiveObserver===undefined || p.effectiveObserver===null || observer(p.effectiveObserver));
}
export function envelope(session,type,id,command,payload) { return {runtime:session.runtime,nonce:session.nonce,generation:session.generation,type,id,command,payload}; }
