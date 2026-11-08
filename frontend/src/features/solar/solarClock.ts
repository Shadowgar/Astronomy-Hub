export type ClockState={epochMs:number;rate:number;running:boolean;reason:null|'coverage'|'suspended'}

/** Scientific UTC clock. It owns time, never scene resources or provider requests. */
export class SolarClock{
 private epochMs:number
 private last:number|null=null
 private running=false
 private rate=86400
 constructor(epoch:string){this.epochMs=SolarClock.parse(epoch)}
 private static parse(epoch:string){const ms=Date.parse(epoch);if(!Number.isFinite(ms))throw Error('Invalid Solar clock epoch.');return ms}
 seek(epoch:string){this.epochMs=SolarClock.parse(epoch);this.last=null}
 play(now:number,rate=this.rate){if(!Number.isFinite(now)||!Number.isFinite(rate)||Math.abs(rate)>86400*32||rate===0)throw Error('Invalid Solar clock rate.');this.rate=rate;this.running=true;this.last=now}
 pause(){this.running=false;this.last=null}
 tick(now:number,coverage?:readonly [number,number]):ClockState{
  let reason:ClockState['reason']=null
  if(this.running&&this.last!==null){
   const elapsed=Math.max(0,now-this.last)
   if(elapsed>5000){this.pause();reason='suspended'}
   else{
    let next=this.epochMs+elapsed*this.rate
    if(coverage&&(next<coverage[0]||next>coverage[1])){next=Math.max(coverage[0],Math.min(coverage[1],next));this.pause();reason='coverage'}
    this.epochMs=next
   }
  }
  this.last=now
  return{epochMs:this.epochMs,rate:this.rate,running:this.running,reason}
 }
}
