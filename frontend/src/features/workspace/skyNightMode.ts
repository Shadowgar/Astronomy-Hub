// The preference remembers native SWE state; it never creates a second toggle.
export const SKY_NIGHT_MODE_KEY='oras.sky.night-mode.v1'
let remembered=false
export function readSkyNightMode(storage?:Pick<Storage,'getItem'>):boolean{
 try{return (storage??window.localStorage).getItem(SKY_NIGHT_MODE_KEY)==='true'}catch{return remembered}
}
export function saveSkyNightMode(enabled:boolean,storage?:Pick<Storage,'setItem'>){
 remembered=enabled
 try{(storage??window.localStorage).setItem(SKY_NIGHT_MODE_KEY,String(enabled))}catch{/* native state remains usable when browser storage is blocked */}
}
