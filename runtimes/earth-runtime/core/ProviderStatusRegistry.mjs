export class ProviderStatusRegistry {
  constructor(changed){this.values=new Map();this.changed=changed;}
  set(id,status){this.values.set(id,status);this.changed(id,status);}
  get(id){return this.values.get(id);}
  clear(){this.values.clear();}
}
