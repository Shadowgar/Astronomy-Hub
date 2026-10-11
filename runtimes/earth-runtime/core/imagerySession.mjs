// Tab-scoped public preferences/accounting only; never store provider tokens.
const KEY='oras-earth-imagery-session.v1';
const MODES=new Set(['auto','local','nasa','eox-2016','usgs-naip','pema','osm','ion']);
export function openImagerySession(storage){
 if(storage===undefined){try{storage=globalThis.sessionStorage;}catch{storage=null;}}
 let mode='auto',ionUsed=0,available=false;
 try{const saved=JSON.parse(storage?.getItem(KEY)??'null');if(MODES.has(saved?.mode))mode=saved.mode;if(Number.isSafeInteger(saved?.ionUsed)&&saved.ionUsed>=0)ionUsed=saved.ionUsed;}catch{/* Invalid data never authorizes ion. */storage=null;}
 const save=()=>{try{if(!storage)throw Error('No tab storage');storage.setItem(KEY,JSON.stringify({mode,ionUsed}));available=true;}catch{available=false;}};
 save();
 return {get mode(){return mode;},get ionUsed(){return ionUsed;},get available(){return available;},setMode(value){if(MODES.has(value)){mode=value;save();}},canUseIon(limit){return available&&Number.isSafeInteger(limit)&&ionUsed<limit;},recordIonRequest(){ionUsed++;save();}};
}
