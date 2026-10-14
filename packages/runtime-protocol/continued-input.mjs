// Shared input safeguard only; each renderer qualifies its own boundary.
export function ContinuedInput() {
 this.reset=function(blockUntil=0){this.phase='idle';this.last=null;this.start=null;this.total=0;this.count=0;this.previous=0;this.decaying=0;this.blockUntil=blockUntil;};
 this.input=function({atBoundary,withinBoundary=atBoundary,continuing,pixels,now}){
  const idle={phase:'idle',progress:0};
  if(!Number.isFinite(pixels)||!Number.isFinite(now)||pixels<=0||now<this.blockUntil)return idle;
  if(!continuing||!withinBoundary){this.reset();return idle;}
  if(this.phase==='request')return idle;
  if(!atBoundary){this.phase='boundary';this.last=now;this.start=null;this.total=0;this.count=0;return {phase:'boundary',progress:0};}
  if(this.start===null){this.start=now;this.phase='boundary';this.last=now;this.previous=pixels;return {phase:'boundary',progress:0};}
  const gap=now-this.last;this.last=now;
  // Only abandoned intent expires. Mouse notches can be much slower than 280ms.
  if(gap>2500){this.total=0;this.count=0;this.decaying=0;}
  // A decaying trackpad tail is not deliberate continuation. Separate notches
  // and renewed/stable input can continue immediately, without a required pause.
  this.decaying=gap<160&&pixels<this.previous*.98?this.decaying+1:0;this.previous=pixels;
  if(this.decaying>=3){this.total=0;this.count=0;this.phase='boundary';return {phase:'boundary',progress:0};}
  // Ignore arrival/short inertial overshoot, then require meaningful extra travel,
  // several events and time at the clamp. One large event cannot switch views.
  if(now-this.start<350||pixels<2)return {phase:'boundary',progress:0};
  this.total+=Math.min(120,pixels);this.count++;this.phase='progress';
  const progress=Math.min(1,this.total/480,(now-this.start)/650,this.count/4);
  if(progress>=1)this.phase='request';
  return {phase:this.phase,progress};
 };
 this.reset();
}
