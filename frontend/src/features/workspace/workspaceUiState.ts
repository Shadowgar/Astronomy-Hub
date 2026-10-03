export type ContextTab='tonight'|'observe'|'selection'
export type Surface='layers'|'context'|'time'|'diagnostics'|'navigation'|null
export type Preferences={pin:boolean;context:'tonight'|'observe';layers:string[]}
export const UI_KEY='oras.workspace.ui.v1'
const ids=['oras-site','satellites','aircraft','weather','earthquakes','fire-perimeters','weather-radar']
export function readPreferences(storage?:Pick<Storage,'getItem'>):Preferences{const fallback:Preferences={pin:false,context:'tonight',layers:['oras-site','satellites']};try{const text=storage?.getItem(UI_KEY);if(!text||text.length>1024)return fallback;const p=JSON.parse(text);if(p.version!==1||typeof p.pin!=='boolean'||!['tonight','observe'].includes(p.context)||!Array.isArray(p.layers)||p.layers.length>ids.length||!p.layers.every((id:unknown)=>typeof id==='string'&&ids.includes(id)))return fallback;return {pin:p.pin,context:p.context,layers:[...new Set<string>(p.layers)]}}catch{return fallback}}
export function savePreferences(p:Preferences){try{sessionStorage.setItem(UI_KEY,JSON.stringify({version:1,...p}))}catch{/* tab memory still works */}}
export function nextSnap(snap:number,delta:number,elapsed:number){const snaps=[96,360,640];const index=snaps.indexOf(snap);if(Math.abs(delta)>80||Math.abs(delta)/Math.max(elapsed,1)>.5)return snaps[Math.max(0,Math.min(2,index+(delta<0?1:-1)))];return snap}
