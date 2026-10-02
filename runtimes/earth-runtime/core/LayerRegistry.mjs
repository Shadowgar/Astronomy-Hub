/** ORAS owns registration and lazy activation. Each layer owns only its resources. */
export class LayerRegistry {
  constructor(context, changed) { this.context=context;this.changed=changed;this.entries=new Map();this.closed=false; }
  register(definition) {
    if(this.entries.has(definition.id)||this.closed)throw Error('Duplicate or closed layer registry');
    this.entries.set(definition.id,{definition,instance:null,status:'disabled',generation:0});
  }
  snapshot(){return [...this.entries.values()].map(({definition,status})=>({id:definition.id,title:definition.title,category:definition.category,capabilities:definition.capabilities,attribution:definition.attribution,status}));}
  notify(){this.changed(this.snapshot());}
  async enable(id){
    const entry=this.entries.get(id);if(!entry||this.closed||['loading','ready'].includes(entry.status))return;
    const generation=++entry.generation;entry.status='loading';this.notify();
    try {
      if(!entry.instance){
        const instance=await entry.definition.load();
        if(this.closed||entry.generation!==generation){instance.destroy?.();return;}
        entry.instance=instance;await instance.initialize(this.context);
      }
      if(this.closed||entry.generation!==generation)return;
      await entry.instance.enable();
      if(!this.closed&&entry.generation===generation){entry.status='ready';this.notify();}
    }catch{if(!this.closed&&entry.generation===generation){entry.instance?.destroy();entry.instance=null;entry.status='unavailable';this.notify();}}
  }
  async disable(id){const entry=this.entries.get(id);if(!entry)return;++entry.generation;entry.instance?.disable();entry.status='disabled';this.notify();}
  async update(context){for(const entry of this.entries.values())if(entry.status==='ready')await entry.instance?.update?.(context);}
  async destroy(){if(this.closed)return;this.closed=true;for(const entry of this.entries.values()){++entry.generation;entry.instance?.destroy();entry.instance=null;entry.status='destroyed';}this.notify();}
}
