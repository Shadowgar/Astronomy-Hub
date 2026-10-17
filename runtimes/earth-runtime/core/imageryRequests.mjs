// Observe public SDK requests; Cesium exclusively owns admission, priority and deadlines.
const disposeImage=value=>{try{value?.close?.();}catch{/* Preserve the original request outcome. */}};
export function createImageryAvailability({clock=()=>performance.now()}={}){
 const blocked=new Map(),stats={active:0,requested:0};
 return {clock,blocked,stats,eligible(host){return !blocked.has(host)},block(host,error){const status=error?.statusCode??error?.status;if(![401,403,429].includes(status))return;const raw=error?.responseHeaders?.['retry-after']??error?.retryAfter,seconds=Number(raw),wait=Number.isFinite(seconds)?seconds*1000:Math.max(0,Date.parse(raw)-Date.now())||0;blocked.set(host,{status,until:clock()+Math.max(300000,wait)});},retryHost(host){const item=blocked.get(host);if(!item)return true;if(item.status!==429||clock()<item.until)return false;blocked.delete(host);return true;}};
}
export function observeImageryRequests(provider,{budget,host='',onLoad=()=>{},onError=()=>{},isEmpty=()=>false,canDispatch=()=>true,onDispatch=()=>{},onLimit=()=>{}}={}){
 const original=provider.requestImage.bind(provider),pending=new Set();let stopped=false,paused=false;
 const stats={requested:0,loaded:0,failed:0,cancelled:0,active:0,peak:0};
 provider.requestImage=(...args)=>{
  if(stopped||paused||budget&&!budget.eligible(host))return undefined;
  if(!canDispatch()){onLimit();return undefined;}
  let image;try{image=original(...args);}catch(error){budget?.block(host,error);onError(error);return Promise.reject(error);}
  if(image===undefined)return undefined;
  onDispatch();stats.requested++;stats.active++;stats.peak=Math.max(stats.peak,stats.active);if(budget){budget.stats.requested++;budget.stats.active++;}
  return new Promise((resolve,reject)=>{
   let finished=false;
   const finish=(kind,value)=>{if(finished){if(kind==='loaded')disposeImage(value);return;}finished=true;pending.delete(cancel);stats.active--;if(budget)budget.stats.active--;stats[kind]++;
    if(kind==='loaded'){onLoad(value,args);resolve(value);}else{reject(value);if(kind==='failed'&&!stopped&&!paused){budget?.block(host,value);onError(value);}}};
   const cancel=message=>{args[3]?.cancel?.();finish('cancelled',Error(message));};pending.add(cancel);
   Promise.resolve(image).then(value=>{let empty;try{empty=isEmpty(value,args);}catch(error){disposeImage(value);finish('failed',error);return;}
    try{if(empty){disposeImage(value);finish('failed',Object.assign(Error('No imagery data'),{imageryGuardFailure:true}));}else finish('loaded',value);}catch(error){finish('failed',error);}
   },error=>finish(error===undefined?'cancelled':'failed',error??Error('Imagery request cancelled')));
  });
 };
 const cancelAll=message=>{for(const cancel of [...pending])cancel(message)};
 return {stats,pause(){paused=true;cancelAll('Imagery provider paused')},resume(){if(!stopped)paused=false},stop(){stopped=true;cancelAll('Imagery provider disposed')},get paused(){return paused||stopped}};
}
