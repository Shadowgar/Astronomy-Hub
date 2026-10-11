// Shared admission preserves Cesium's undefined-return scheduler contract.
export function createImageryBudget({clock=()=>performance.now(),globalLimit=6,hostLimit=4,rate=2,burst=6}={}){
 const hosts=new Map(),blocked=new Map();let tokens=burst,last=clock();
 const stats={active:0,peak:0,requested:0,throttled:0};
 return {stats,clock,blocked,globalLimit,eligible(host){return !blocked.has(host);},block(host,error){const status=error?.statusCode??error?.status;if([401,403,429].includes(status)){const raw=error?.responseHeaders?.['retry-after']??error?.retryAfter,seconds=Number(raw);const wait=Number.isFinite(seconds)?seconds*1000:Math.max(0,Date.parse(raw)-Date.now())||0;blocked.set(host,{status,until:clock()+Math.max(300000,wait)});}},retryHost(host){const entry=blocked.get(host);if(!entry)return true;if(entry.status!==429||clock()<entry.until)return false;blocked.delete(host);return true;},
  take(host,limit=hostLimit){const now=clock();tokens=Math.min(burst,tokens+(now-last)*rate/1000);last=now;
   if(!this.eligible(host)||stats.active>=this.globalLimit||(hosts.get(host)??0)>=Math.min(hostLimit,limit)||tokens<1){stats.throttled++;stats.lastThrottledAt=now;return null;}
   tokens--;stats.active++;stats.peak=Math.max(stats.peak,stats.active);hosts.set(host,(hosts.get(host)??0)+1);let done=false;
   return {commit(){stats.requested++;},release(refund=false){if(done)return;done=true;stats.active--;hosts.set(host,hosts.get(host)-1);if(refund)tokens=Math.min(burst,tokens+1);}};
  }
 };
}
export function boundImageryRequests(provider,{limit=4,timeoutMs=12000,budget,host='',onLoad=()=>{},onError=()=>{},isEmpty=()=>false,canDispatch=()=>true,onDispatch=()=>{},onLimit=()=>{}}={}) {
 const original=provider.requestImage.bind(provider),pending=new Set();let stopped=false,paused=false;
 const stats={requested:0,loaded:0,failed:0,cancelled:0,active:0,peak:0};
 provider.requestImage=(...args)=>{
  if(stopped||paused||pending.size>=limit)return undefined;
  if(!canDispatch()){onLimit();return undefined;}
  const lease=budget?.take(host,limit);if(budget&&!lease)return undefined;
  let image;try{image=original(...args);}catch(error){lease?.release(true);budget?.block(host,error);onError(error);return Promise.reject(error);}
  if(image===undefined){lease?.release(true);return undefined;}
  lease?.commit();onDispatch();stats.requested++;stats.active++;stats.peak=Math.max(stats.peak,stats.active);
  return new Promise((resolve,reject)=>{
   let finished=false;
   const finish=(kind,value)=>{
    if(finished)return;finished=true;clearTimeout(timer);pending.delete(cancel);lease?.release();stats.active--;stats[kind]++;
    if(kind==='loaded'){onLoad(value);resolve(value);}else{reject(value);if(kind==='failed'&&!stopped&&!paused){budget?.block(host,value);onError(value);}}
   };
   const cancel=(kind,message)=>{args[3]?.cancel?.();finish(kind,new Error(message));};
   const timer=setTimeout(()=>cancel('failed','Imagery tile timed out'),timeoutMs);pending.add(cancel);
   Promise.resolve(image).then(value=>{try{if(isEmpty(value,args))finish('failed',new Error('No imagery data'));else finish('loaded',value);}catch(error){finish('failed',error);}},error=>finish(error===undefined?'cancelled':'failed',error??new Error('Imagery request cancelled')));
  });
 };
 const cancelAll=message=>{for(const cancel of [...pending])cancel('cancelled',message);};
 return {stats,pause(){paused=true;cancelAll('Imagery provider paused');},resume(){if(!stopped)paused=false;},stop(){stopped=true;cancelAll('Imagery provider disposed');},get paused(){return paused||stopped;}};
}
