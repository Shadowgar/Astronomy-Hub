/** One abortable request and one completion-scheduled timer; no overlapping polls. */
export class PollingLayer {
  constructor({id,read,render,clear,interval,observerDependent=false,temporalMode="LIVE_ONLY"}){Object.assign(this,{id,read,render,clear,interval,observerDependent,temporalMode});this.timer=null;this.controller=null;this.active=false;this.closed=false;this.generation=0;}
  initialize(context){this.context=context;}
  async enable(){if(this.closed||this.active)return;this.active=true;const generation=++this.generation;await this.poll(generation);}
  async update(context){
    this.context=context;
    if(!this.observerDependent||!this.active||this.closed)return;
    const generation=++this.generation;
    if(this.timer!==null)clearTimeout(this.timer);this.timer=null;
    this.controller?.abort();this.controller=null;this.clear();
    await this.poll(generation,10000);
  }
  async poll(generation,timeout=12000){
    if(!this.active||this.closed||generation!==this.generation)return;
    const controller=new AbortController();this.controller=controller;const signal=AbortSignal.any([controller.signal,this.context.abortSignal,AbortSignal.timeout(timeout)]);
    this.context.providerStatus.set(this.id,{status:'loading',temporalMode:this.temporalMode});
    const started=performance.now();let acquired=started;
    try{
      const data=await this.read(signal);
      if(!this.active||this.closed||generation!==this.generation)return;
      acquired=performance.now();await this.render(data,{signal,isCurrent:()=>this.active&&!this.closed&&generation===this.generation});
      if(!this.active||this.closed||generation!==this.generation)return;
      this.context.providerStatus.set(this.id,{status:'ready',temporalMode:this.temporalMode,observedAt:data.observedAt??null,count:data.records?.length??1,metrics:{acquisitionMs:acquired-started,renderMs:performance.now()-acquired}});
    }catch{
      if(!this.active||this.closed||generation!==this.generation)return;
      this.clear(true);this.context.providerStatus.set(this.id,{status:'unavailable',temporalMode:this.temporalMode,message:'Source unavailable. Retry the layer; Earth remains interactive.'});
    }finally{if(this.controller===controller)this.controller=null;}
    if(this.active&&!this.closed&&generation===this.generation)this.timer=setTimeout(()=>{this.timer=null;void this.poll(generation)},this.interval);
  }
  disable(){this.active=false;++this.generation;if(this.timer!==null)clearTimeout(this.timer);this.timer=null;this.controller?.abort();this.controller=null;this.clear();}
  destroy(){if(this.closed)return;this.disable();this.closed=true;}
}
