/** ORAS owns registration and lazy activation. Each layer owns only its resources. */
export class LayerRegistry {
  constructor(context, changed) { this.context=context;this.changed=changed;this.entries=new Map();this.closed=false; }
  register(definition) {
    if(this.entries.has(definition.id)||this.closed)throw Error('Duplicate or closed layer registry');
    this.entries.set(definition.id,{definition,instance:null,initialized:false,pending:null,status:'disabled',generation:0});
  }
  snapshot(){return [...this.entries.values()].map(({definition,status})=>({id:definition.id,title:definition.title,category:definition.category,capabilities:definition.capabilities,attribution:definition.attribution,status}));}
  notify(){this.changed(this.snapshot());}
  async enable(id){
    const entry=this.entries.get(id);if(!entry||this.closed||['loading','ready'].includes(entry.status))return;
    const pending=this.activateLayer(id);entry.pending=pending;
    try{await pending;}finally{if(entry.pending===pending)entry.pending=null;}
  }
  async activateLayer(id){
    const entry=this.entries.get(id);if(!entry||this.closed||['loading','ready'].includes(entry.status))return;
    const generation=++entry.generation;entry.status='loading';this.notify();
    try {
      if(!entry.instance){
        const instance=await entry.definition.load();
        if(this.closed||entry.generation!==generation){instance.destroy?.();return;}
        entry.instance=instance;await instance.initialize(this.context);entry.initialized=true;
      }
      if(this.closed||entry.generation!==generation)return;
      await entry.instance.enable();
      if(!this.closed&&entry.generation===generation){entry.status='ready';this.notify();}
    }catch{if(!this.closed&&entry.generation===generation){entry.instance?.destroy();entry.instance=null;entry.initialized=false;entry.status='unavailable';this.notify();}}
  }
  async retry(id){
    const entry=this.entries.get(id);if(!entry||this.closed)return;
    if(entry.instance?.retry&&['ready','loading'].includes(entry.status)){await entry.instance.retry();return;}
    await this.disable(id);await this.enable(id);
  }
  async disable(id){const entry=this.entries.get(id);if(!entry)return;++entry.generation;entry.instance?.disable();entry.status='disabled';this.notify();}
  async update(context){await Promise.all([...this.entries.values()].filter(entry=>['ready','loading'].includes(entry.status)).map(entry=>entry.initialized?entry.instance?.update?.(context):entry.pending));}
  async destroy(){if(this.closed)return;this.closed=true;for(const entry of this.entries.values()){++entry.generation;entry.instance?.destroy();entry.instance=null;entry.initialized=false;entry.status='destroyed';}this.notify();}
}
