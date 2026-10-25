// Public native presentation controls only. Photometry, SGP4 and models stay native.
export function satellitePresentation(core){
 const sats=core.satellites;let originalVisible=null,appliedVisible=null,originalOffset=null,appliedOffset=null,close=false;
 const set=(key,value)=>{if(sats[key]!==value)sats[key]=value;};
 const visible=value=>{appliedVisible=value;set('hints_visible',value);};
 function applyOffset(value,minimum=false){
  if(originalOffset===null||sats.hints_mag_offset!==appliedOffset)originalOffset=sats.hints_mag_offset;
  appliedOffset=minimum?Math.max(originalOffset,value):value;set('hints_mag_offset',appliedOffset);
 }
 function restoreOffset(){if(originalOffset!==null){if(sats.hints_mag_offset!==appliedOffset)originalOffset=sats.hints_mag_offset;const value=originalOffset;originalOffset=null;appliedOffset=null;set('hints_mag_offset',value);}}
 function release(){if(!sats||originalVisible===null)return;if(sats.hints_visible!==appliedVisible)originalVisible=sats.hints_visible;restoreOffset();visible(originalVisible);originalVisible=null;appliedVisible=null;close=false;}
 function update(embedded,fovRad,selectedSatellite){
  if(!sats)return;if(!embedded){release();return;}
  if(originalVisible===null||sats.hints_visible!==appliedVisible)originalVisible=sats.hints_visible;
  // Native property JSON rounds radians; tolerate its sub-nanodegree error.
  const degrees=fovRad*180/Math.PI;close=Number.isFinite(degrees)&&(close?degrees<7-1e-8:degrees<=5+1e-8);
  if(close&&originalVisible){
   // The native point and hint magnitude gates differ. Offset 4 reveals the
   // measured close-view point-only cases without changing their photometry.
   applyOffset(4,true);visible(originalVisible);
  }else if(!close&&selectedSatellite){
   // Native rendering exempts the selected object from the magnitude hint gate.
   // Suppress other hints without changing any satellite's computed brightness.
   applyOffset(-30);visible(originalVisible);
  }else{restoreOffset();visible(originalVisible&&close);}
 }
 return {update,release};
}
