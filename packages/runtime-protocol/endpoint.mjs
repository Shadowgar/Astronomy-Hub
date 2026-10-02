import {PROTOCOL,validHello,validateMessage,envelope} from './index.mjs';
/** Own only this document's bridge; renderer lifecycle remains with the adapter. */
export function createRuntimeEndpoint({runtime,version,capabilities,execute,windowImpl=window}) {
 let session=null, port=null, ready=false, active=true;
 function close() { port?.close(); port=null; session=null; }
 function publish() { if(session && ready && active) windowImpl.parent.postMessage({...session,type:'ready',protocol:PROTOCOL,version,capabilities},windowImpl.location.origin); }
 function receive(event) {
  if(!active || windowImpl.parent===windowImpl || event.origin!==windowImpl.location.origin || event.source!==windowImpl.parent) return;
  const data=event.data;
  if(validHello(data) && data.runtime===runtime) {close();session={runtime,nonce:data.nonce,generation:data.generation};publish();return;}
  if(data?.type!=='connect' || !session || Object.keys(data).sort().join(',')!=='generation,nonce,runtime,type' || data.nonce!==session.nonce || data.generation!==session.generation || data.runtime!==runtime || event.ports.length!==1 || port) return;
  port=event.ports[0];const channel=port;const current=session;
  port.onmessage=async ({data:message})=>{
   if(!active || port!==channel || !validateMessage(message,current) || message.type!=='command') return;
   let payload;
   try {
    if(message.command==='getVersion') payload={ok:true,version};
    else if(message.command==='getCapabilities') payload={ok:true,capabilities};
    else {
     const cap={destroy:'destroy',setTimeIntent:'timeIntent',setObserverIntent:'observerIntent'}[message.command];
     payload=capabilities.includes(cap)?await execute(message.command,message.payload):{ok:false,error:'Unsupported capability'};
    }
   } catch {payload={ok:false,error:'Runtime command failed'};}
   if(port===channel && active) channel.postMessage(envelope(current,'result',message.id,message.command,payload));
  };
  port.start();
 }
 windowImpl.addEventListener('message',receive);
 return {ready(){ready=true;publish();},close(){active=false;close();windowImpl.removeEventListener('message',receive);}};
}
