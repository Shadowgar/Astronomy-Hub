// Shared input safeguard only; each renderer qualifies its own boundary.
export function ContinuedInput() {
 this.reset=function(blockUntil=0){this.phase='idle';this.last=null;this.start=0;this.total=0;this.count=0;this.blockUntil=blockUntil;};
 this.input=function({atBoundary,withinBoundary=atBoundary,continuing,pixels,now}){
  if(!Number.isFinite(pixels)||!Number.isFinite(now)||pixels<=0||now<this.blockUntil||this.phase==='request')return {phase:'idle',progress:0};
  if(!continuing||!withinBoundary){this.reset();return {phase:'idle',progress:0};}
  if(!atBoundary){this.phase='boundary';this.last=now;this.total=0;this.count=0;return {phase:'boundary',progress:0};}
  const gap=this.last===null?null:now-this.last;this.last=now;
  if(this.phase==='idle'){this.phase='boundary';return {phase:'boundary',progress:0};}
  // A sustained zoom burst and its inertia may reach the clamp, but cannot arm.
  if(gap>=280){this.phase='progress';this.start=now;this.total=0;this.count=0;}
  if(this.phase==='boundary')return {phase:'boundary',progress:0};
  this.total+=Math.min(120,pixels);this.count++;
  const progress=Math.min(1,this.total/360,(now-this.start)/200,this.count/3);
  if(progress>=1)this.phase='request';
  return {phase:this.phase,progress};
 };
 this.reset();
}
