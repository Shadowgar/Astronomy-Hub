import {PROTOCOL,validateBootstrap,validateMessage,envelope} from './index.mjs';
export function connectRuntime(frame,session,{timeoutMs=90000,windowImpl=window,signal}={}){
 return new Promise((resolve,reject)=>{
  const source=frame.contentWindow,origin=windowImpl.location.origin;
  let done=false;
  const timer=setTimeout(()=>finish(new Error('Runtime bridge timed out')),timeoutMs);
  function finish(error,client){if(done)return;done=true;clearTimeout(timer);windowImpl.removeEventListener('message',receive);frame.removeEventListener('load',hello);signal?.removeEventListener('abort',cancel);error?reject(error):resolve(client);}
  function cancel(){finish(new Error('Disposed session'));}
  function hello(){source?.postMessage({...session,type:'hello',protocol:PROTOCOL},origin);}
  function receive(event){
   if(!validateBootstrap(event,{...session,source,origin}))return;
   const channel=new MessageChannel();const pending=new Map();let id=0,closed=false;
   channel.port1.onmessage=({data})=>{if(closed || !validateMessage(data,session) || data.type!=='result')return;const request=pending.get(data.id);if(!request || request.command!==data.command)return;clearTimeout(request.timer);pending.delete(data.id);request.resolve(data.payload);};channel.port1.start();
   source.postMessage({...session,type:'connect'},origin,[channel.port2]);
   const client={version:event.data.version,capabilities:event.data.capabilities,
    request(command,payload={},deadline=4000){if(closed)return Promise.reject(new Error('Disposed session'));return new Promise((resolve,reject)=>{const current=++id;const timer=setTimeout(()=>{pending.delete(current);reject(new Error('Runtime command timed out'));},deadline);pending.set(current,{resolve,reject,timer,command});channel.port1.postMessage(envelope(session,'command',current,command,payload));});},
    close(){closed=true;channel.port1.close();for(const item of pending.values()){clearTimeout(item.timer);item.reject(new Error('Disposed session'));}pending.clear();}
   };finish(null,client);
  }
  windowImpl.addEventListener('message',receive);frame.addEventListener('load',hello);signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();else hello();
 });
}
