/** One abortable request and one completion-scheduled timer; no overlapping polls. */
export class PollingLayer {
  constructor({id,read,render,clear,interval,observerDependent=false}){Object.assign(this,{id,read,render,clear,interval,observerDependent});this.timer=null;this.controller=null;this.active=false;this.closed=false;this.generation=0;}
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
    const controller=new AbortController();this.controller=controller;
    this.context.providerStatus.set(this.id,{status:'loading',temporalMode:'LIVE_ONLY'});
    try{
      const data=await this.read(AbortSignal.any([controller.signal,this.context.abortSignal,AbortSignal.timeout(timeout)]));
      if(!this.active||this.closed||generation!==this.generation)return;
      await this.render(data);
      if(!this.active||this.closed||generation!==this.generation)return;
      this.context.providerStatus.set(this.id,{status:'ready',temporalMode:'LIVE_ONLY',observedAt:data.observedAt??null,count:data.records?.length??1});
    }catch{
      if(!this.active||this.closed||generation!==this.generation)return;
      this.clear(true);this.context.providerStatus.set(this.id,{status:'unavailable',temporalMode:'LIVE_ONLY',message:'Source unavailable. Retry the layer; Earth remains interactive.'});
    }finally{if(this.controller===controller)this.controller=null;}
    if(this.active&&!this.closed&&generation===this.generation)this.timer=setTimeout(()=>{this.timer=null;void this.poll(generation)},this.interval);
  }
  disable(){this.active=false;++this.generation;if(this.timer!==null)clearTimeout(this.timer);this.timer=null;this.controller?.abort();this.controller=null;this.clear();}
  destroy(){if(this.closed)return;this.disable();this.closed=true;}
}
