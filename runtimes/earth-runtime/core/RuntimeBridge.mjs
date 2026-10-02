import {createRuntimeEndpoint} from '../../../packages/runtime-protocol/endpoint.mjs';
export function RuntimeBridge(runtime){
  const endpoint=createRuntimeEndpoint({runtime:'earth',version:'oras-earth.v1',capabilities:['destroy','timeIntent','observerIntent'],execute:async(command,value)=>{
    if(command==='setTimeIntent')return runtime.setTime(value.utc);
    if(command==='setObserverIntent')return runtime.setObserver(value);
    if(command==='destroy'){await runtime.destroy();setTimeout(()=>endpoint.close(),0);return {ok:true};}
    return {ok:false,error:'Unsupported command'};
  }});
  return endpoint;
}
