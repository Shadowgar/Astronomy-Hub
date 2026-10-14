// Browser input compatibility belongs in the contained SWE frame.
import {ContinuedInput} from '../../packages/runtime-protocol/continued-input.mjs';
import {SKY_OUTWARD_FOV} from '../../packages/runtime-protocol/navigation.mjs';
export function installNativeWheel(canvas, engine, {enabled=()=>false,onBoundary=()=>{},now=event=>event?event.timeStamp:performance.now()}={}) {
 const gate=new ContinuedInput();let lastPhase='idle',latched=false;
 const report=value=>{if(value.phase!==lastPhase||value.phase==='progress'){lastPhase=value.phase;onBoundary(value);}};
 const reset=()=>{gate.reset(now()+1000);latched=false;report({phase:'idle',progress:0});};
 const onWheel=event=>{
  if(!Number.isFinite(event.deltaY)||event.deltaY===0)return;
  const rect=canvas.getBoundingClientRect();
  // Preserve SWE's legacy notch factor where exposed; normalize standard-only devices.
  const delta=Number.isFinite(event.wheelDelta)&&event.wheelDelta!==0?event.wheelDelta/120:
   -event.deltaY*(event.deltaMode===1?40:event.deltaMode===2?rect.height:1)/120;
  event.preventDefault();
  engine._core_on_zoom(1.05**(2*Math.max(-10,Math.min(10,delta))),event.clientX-rect.left,event.clientY-rect.top);
  if(!enabled()||event.ctrlKey)return;
  const max=SKY_OUTWARD_FOV[engine.core?.projection]*Math.PI/180,fov=engine.core?.fov;
  if(!Number.isFinite(max)||!Number.isFinite(fov)){latched=false;gate.reset();report({phase:'idle',progress:0});return;}
  if(fov>=max-1e-7)latched=true;else if(fov<max-5*Math.PI/180)latched=false;
  report(gate.input({atBoundary:fov>=max-1e-7,withinBoundary:latched,continuing:delta<0,pixels:Math.abs(delta)*120,now:now(event)}));
 };
 canvas.addEventListener('wheel',onWheel,{passive:false});
 canvas.addEventListener('pointerdown',reset,{passive:true});
 const remove=()=>{canvas.removeEventListener('wheel',onWheel);canvas.removeEventListener('pointerdown',reset);gate.reset();};remove.reset=reset;return remove;
}
