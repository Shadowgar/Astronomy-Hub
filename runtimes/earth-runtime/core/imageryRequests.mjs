// Keep Cesium's scheduler/cancellation contract: undefined means try a later frame.
export function boundImageryRequests(provider,{limit=4,timeoutMs=12000,onLoad=()=>{},onError=()=>{}}={}) {
 const original=provider.requestImage.bind(provider),pending=new Set();let stopped=false;
 const stats={requested:0,loaded:0,failed:0,cancelled:0,active:0,peak:0};
 provider.requestImage=(...args)=>{
  if(stopped||pending.size>=limit)return undefined;
  const image=original(...args);if(image===undefined)return undefined;
  stats.requested++;stats.active++;stats.peak=Math.max(stats.peak,stats.active);
  return new Promise((resolve,reject)=>{
   let finished=false;
   const finish=(kind,value)=>{
    if(finished)return;finished=true;clearTimeout(timer);pending.delete(cancel);stats.active--;stats[kind]++;
    if(kind==='loaded'){onLoad();resolve(value);}else{reject(value);if(kind==='failed'&&!stopped)onError();}
   };
   const cancel=(kind,message)=>{args[3]?.cancel?.();finish(kind,new Error(message));};
   const timer=setTimeout(()=>cancel('failed','Imagery tile timed out'),timeoutMs);pending.add(cancel);
   // Cesium RequestScheduler rejects cancelled work with no error value.
   Promise.resolve(image).then(value=>finish('loaded',value),error=>finish(error===undefined?'cancelled':'failed',error??new Error('Imagery request cancelled')));
  });
 };
 return {stats,stop(){stopped=true;for(const cancel of [...pending])cancel('cancelled','Imagery provider disposed');}};
}
