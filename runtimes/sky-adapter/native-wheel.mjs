// Browser input compatibility belongs in the contained SWE frame.
export function installNativeWheel(canvas, engine) {
 const onWheel=event=>{
  if(!Number.isFinite(event.deltaY)||event.deltaY===0)return;
  const rect=canvas.getBoundingClientRect();
  // Preserve SWE's legacy notch factor where exposed; normalize standard-only devices.
  const delta=Number.isFinite(event.wheelDelta)&&event.wheelDelta!==0?event.wheelDelta/120:
   -event.deltaY*(event.deltaMode===1?40:event.deltaMode===2?rect.height:1)/120;
  event.preventDefault();
  engine._core_on_zoom(1.05**(2*Math.max(-10,Math.min(10,delta))),event.clientX-rect.left,event.clientY-rect.top);
 };
 canvas.addEventListener('wheel',onWheel,{passive:false});
 return ()=>canvas.removeEventListener('wheel',onWheel);
}
