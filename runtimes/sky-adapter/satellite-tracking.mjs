// Native camera tracking only. UTC, propagation and photometry stay in Stellarium.
export function satelliteTracking(stel){
 const satellite=obj=>!!obj&&obj.jsonData?.model==='tle_satellite';
 const trackable=()=>satellite(stel.core.selection);
 const active=()=>satellite(stel.core.lock);
 function selectionChanged(){
  // Native wrappers are recreated; v is the native object identity.
  if(active() && stel.core.selection?.v !== stel.core.lock.v)stel.core.lock=0;
 }
 function set(enabled,reduced=false){
  if(!enabled){if(active())stel.core.lock=0;return {ok:true};}
  const target=stel.core.selection;
  if(!satellite(target))return {ok:false,error:'Select an available satellite to track.'};
  // core_lookat(0) clears the lock; retain the already qualified sub-frame path.
  stel.pointAndLock(target,reduced?1e-6:1);return {ok:true};
 }
 return {trackable,active,set,selectionChanged};
}
