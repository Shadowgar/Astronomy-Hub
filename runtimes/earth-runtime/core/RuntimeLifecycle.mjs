export class RuntimeLifecycle {
  constructor(){this.controller=new AbortController();this.closed=false;this.cleanups=[];this.cleanupFailures=0;}
  add(cleanup){this.cleanups.push(cleanup);return cleanup;}
  async destroy(){if(this.closed)return;this.closed=true;this.controller.abort();for(const cleanup of this.cleanups.reverse())try{await cleanup()}catch{this.cleanupFailures++}this.cleanups=[];}
}
