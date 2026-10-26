// Explicit product intent around the existing native clock; no propagated positions.
export function createSimulation(getAdapter) {
 let active=false,playing=false;
 const utc=()=>new Date(Math.round((getAdapter().observer.utc-40587)*86400000)).toISOString();
 return {
  active:()=>active,
  status:()=>active?{utc:utc(),playing,speed:1}:null,
  clear(){active=false;playing=false;},
  set(value){
   if(typeof value.playing!=='boolean'||(!active&&!value.utc))throw new Error('Choose a simulation epoch first');
   if(value.utc!==undefined&&(!Number.isFinite(Date.parse(value.utc))||new Date(value.utc).toISOString().slice(0,19)!==value.utc.slice(0,19)))throw new Error('Invalid simulation UTC');
   const adapter=getAdapter();
   adapter.setLive(value.playing);
   if(value.utc!==undefined)adapter.observer.utc=Date.parse(value.utc)/86400000+40587;
   active=true;playing=value.playing;
   return {ok:true,temporalMode:'CONTROLLED',effectiveTime:utc(),simulation:this.status()};
  }
 };
}
