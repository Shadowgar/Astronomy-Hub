// Optional 1.1 workspace DTOs. Whitelisted fields; no raw provider/renderer state.
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const keys=(v,k)=>obj(v)&&Object.keys(v).every(x=>k.includes(x));
const text=(v,n=256)=>typeof v==='string'&&v.length>0&&v.length<=n;
const optional=(v,fn)=>v===undefined||fn(v);
const finite=v=>typeof v==='number'&&Number.isFinite(v);
export const LAYER_IDS=Object.freeze(['oras-site','satellites','aircraft','weather','earthquakes','fire-perimeters','weather-radar']);
export const WORKSPACE_CAPABILITIES=Object.freeze(['nativeTools','presentation','interactionEvents','selection','workspaceState','layers','navigation','providers']);
export const COMMAND_CAPABILITY=Object.freeze({openNativeTools:'nativeTools',setPresentation:'presentation',getWorkspaceState:'workspaceState',selectEntity:'selection',clearSelection:'selection',focusSelection:'selection',setLayerEnabled:'layers',retryLayer:'layers',globalView:'navigation',returnToOras:'navigation',setTracking:'navigation',retryImagery:'providers'});
export function validEntity(v){return keys(v,['catalog','source_id','model','ra','dec'])&&text(v.catalog)&&text(v.source_id)&&text(v.model)&&optional(v.ra,x=>finite(x)&&x>=0&&x<360)&&optional(v.dec,x=>finite(x)&&Math.abs(x)<=90);}
export function validSelection(v){return v===null||keys(v,['id','name','kind','catalog','source_id','model','ra','dec','detail','facts','available','focusable','trackable','link'])&&text(v.id)&&text(v.name)&&['dso','star','planet','moon','satellite','aircraft','site','weather','earthquake','fire','object'].includes(v.kind)&&typeof v.available==='boolean'&&typeof v.focusable==='boolean'&&typeof v.trackable==='boolean'&&optional(v.catalog,text)&&optional(v.source_id,text)&&optional(v.model,text)&&optional(v.ra,finite)&&optional(v.dec,finite)&&optional(v.detail,x=>typeof x==='string'&&x.length<=1500)&&optional(v.facts,x=>Array.isArray(x)&&x.length<=12&&x.every(f=>keys(f,['label','value'])&&text(f.label,80)&&text(f.value,256)))&&optional(v.link,x=>text(x,2048)&&x.startsWith('/oras-sky-engine/'));}
export function validLayer(v){return keys(v,['id','title','enabled','status','source','sourceTime','count','category','temporalMode'])&&LAYER_IDS.includes(v.id)&&text(v.title,80)&&typeof v.enabled==='boolean'&&['off','loading','live','ready','stale','unavailable'].includes(v.status)&&optional(v.source,x=>text(x,160))&&optional(v.sourceTime,x=>x===null||text(x,40))&&optional(v.category,x=>['Events','Environment','Site context','Live Earth','Space activity'].includes(x))&&optional(v.temporalMode,x=>['LIVE_ONLY','CURRENT_SNAPSHOT','EVENT_FEED','SCHEDULED_EVENT'].includes(x))&&optional(v.count,x=>Number.isSafeInteger(x)&&x>=0&&x<=5000);}
export function validState(v){return keys(v,['selection','layers','tracking','quality'])&&validSelection(v.selection)&&Array.isArray(v.layers)&&v.layers.length<=LAYER_IDS.length&&v.layers.every(validLayer)&&new Set(v.layers.map(x=>x.id)).size===v.layers.length&&typeof v.tracking==='boolean'&&optional(v.quality,x=>keys(x,['imagery','terrain','buildings','photorealistic'])&&Object.values(x).every(s=>typeof s==='string'&&s.length<=120));}
export function validWorkspaceCommand(name,p){
 if(name==='selectEntity')return validEntity(p);
 if(name==='setPresentation')return keys(p,['embedded','creditsAtTop'])&&typeof p.embedded==='boolean'&&optional(p.creditsAtTop,x=>typeof x==='boolean');
 if(name==='setLayerEnabled')return keys(p,['id','enabled'])&&LAYER_IDS.includes(p.id)&&typeof p.enabled==='boolean';
 if(name==='retryLayer')return keys(p,['id'])&&LAYER_IDS.includes(p.id);
 if(name==='setTracking')return keys(p,['enabled'])&&typeof p.enabled==='boolean';
 return keys(p,[])&&Object.keys(p).length===0;
}
export function validWorkspaceEvent(name,p){return name==='interaction'&&keys(p,['active','focused','key'])&&typeof p.active==='boolean'&&typeof p.focused==='boolean'&&optional(p.key,x=>['Escape','Tab'].includes(x));}
