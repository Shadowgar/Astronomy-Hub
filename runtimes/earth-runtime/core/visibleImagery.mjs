// Visible-center readiness inside the existing imagery factory. Native Cesium
// selects/refines tiles; at most an ancestor and detail tile are held, never a layer.
export async function prepareVisibleTile(provider,{tile,tiles=[tile],request,requestFactory=()=>request,guard,signal,timeoutMs=20000,onUse=()=>{}}){
 const original=provider.requestImage.bind(provider),abort=new AbortController(),cache=new Map(),requests=[];
 const combined=AbortSignal.any([signal,abort.signal]);let timer,onAbort,used=false,disposed=false;
 const key=t=>`${t.x}/${t.y}/${t.level}`,failure=()=>Object.assign(Error('Visible imagery readiness unavailable or timed out'),{readinessTimedOut:abort.signal.aborted});
 const release=()=>{disposed=true;for(const image of cache.values())image?.close?.();cache.clear();};
 const stop=()=>{for(const request of requests)request.cancel();guard.pause();};combined.addEventListener('abort',stop,{once:true});
 timer=setTimeout(()=>abort.abort(failure()),timeoutMs);guard.resume();
 try{
  if(!tiles.length||tiles.length>2)throw Error('Visible readiness sample bound exceeded');
  const load=async sample=>{const native=requestFactory();requests.push(native);let pending;
   while(pending===undefined){combined.throwIfAborted();pending=original(sample.x,sample.y,sample.level,native);if(pending===undefined)await new Promise(resolve=>setTimeout(resolve,50));}
   const image=await pending;if(combined.aborted||disposed){image?.close?.();throw failure();}if(image==null)throw Error('Visible imagery readiness returned no image');cache.set(key(sample),image);
  };
  await Promise.race([Promise.all(tiles.map(load)),new Promise((_,reject)=>{if(combined.aborted)reject(failure());else{onAbort=()=>reject(failure());combined.addEventListener('abort',onAbort,{once:true});}})]);
  combined.throwIfAborted();
  provider.requestImage=(x,y,level,...args)=>{
   if(guard.paused)return undefined;const sample={x,y,level},id=key(sample);
   if(cache.has(id)){const ready=cache.get(id);cache.delete(id);used=true;onUse(sample);return Promise.resolve(ready);}
   return original(x,y,level,...args);
  };
  return {get used(){return used},dispose:release};
 }catch(error){stop();release();throw combined.aborted?failure():error;}
 finally{clearTimeout(timer);combined.removeEventListener('abort',stop);if(onAbort)combined.removeEventListener('abort',onAbort);guard.pause();}
}
