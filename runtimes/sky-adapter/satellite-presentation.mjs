// Public native presentation controls only. Photometry, SGP4 and models stay native.
export function satellitePresentation(core){
 const sats=core.satellites;let originalVisible=null,originalOffset=null,close=false;
 const set=(key,value)=>{if(sats[key]!==value)sats[key]=value;};
 function restoreOffset(){if(originalOffset!==null){set('hints_mag_offset',originalOffset);originalOffset=null;}}
 function release(){if(!sats||originalVisible===null)return;restoreOffset();set('hints_visible',originalVisible);originalVisible=null;close=false;}
 function update(embedded,fovRad,selectedSatellite){
  if(!sats)return;if(!embedded){release();return;}
  if(originalVisible===null)originalVisible=sats.hints_visible;
  // Native property JSON rounds radians; tolerate its sub-nanodegree error.
  const degrees=fovRad*180/Math.PI;close=Number.isFinite(degrees)&&(close?degrees<7-1e-8:degrees<=5+1e-8);
  if(!close&&selectedSatellite){
   // Native rendering exempts the selected object from the magnitude hint gate.
   // Suppress other hints without changing any satellite's computed brightness.
   if(originalOffset===null||sats.hints_mag_offset!==-30)originalOffset=sats.hints_mag_offset;
   set('hints_mag_offset',-30);set('hints_visible',originalVisible);
  }else{restoreOffset();set('hints_visible',originalVisible&&close);}
 }
 return {update,release};
}
