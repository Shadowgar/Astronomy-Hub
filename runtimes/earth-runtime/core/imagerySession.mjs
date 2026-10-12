// Tab-scoped ion accounting only; legacy manual preferences are discarded. Never store tokens.
const KEY='oras-earth-imagery-session.v1';
export function openImagerySession(storage){
 if(storage===undefined){try{storage=globalThis.sessionStorage;}catch{storage=null;}}
 let ionUsed=0,available=false;
 try{const saved=JSON.parse(storage?.getItem(KEY)??'null');if(Number.isSafeInteger(saved?.ionUsed)&&saved.ionUsed>=0)ionUsed=saved.ionUsed;}catch{/* Invalid data never authorizes ion. */storage=null;}
 const save=()=>{try{if(!storage)throw Error('No tab storage');storage.setItem(KEY,JSON.stringify({ionUsed}));available=true;}catch{available=false;}};
 save();
 return {get ionUsed(){return ionUsed;},get available(){return available;},canUseIon(limit){return available&&Number.isSafeInteger(limit)&&ionUsed<limit;},recordIonRequest(){ionUsed++;save();}};
}
