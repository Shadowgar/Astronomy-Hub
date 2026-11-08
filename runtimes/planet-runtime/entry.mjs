import 'cesium/Build/Cesium/Widgets/widgets.css';
import './style.css';
import {PlanetRuntime} from './PlanetRuntime.mjs';
import {NAMESPACE,acceptsBridgeMessage,validateMoonContract} from './contracts.mjs';
const channel=new URLSearchParams(location.search).get('channel');
const parent=window.parent,origin=location.origin;
const validChannel=typeof channel==='string'&&/^[a-zA-Z0-9-]{8,100}$/.test(channel)&&parent!==window;
let runtime,starting=false,closed=false;
const status=document.querySelector('#status');
function post(type,extra={}){if(validChannel)parent.postMessage({namespace:NAMESPACE,channel,type,...extra},origin);}
function fail(message,requestId){status.hidden=false;status.textContent=message;status.setAttribute('role','alert');post('error',{message,requestId,state:runtime?.diagnostics()});}
window.addEventListener('message',async event=>{
 if(!validChannel||!acceptsBridgeMessage(event,{parent,origin,channel}))return;
 const message=event.data;
 if(message.type==='initialize'){
  if(starting||runtime||closed)return;starting=true;
  try{
   validateMoonContract(message.contract);
   runtime=new PlanetRuntime(document.querySelector('#viewer'),{contract:message.contract,onNavigation:state=>post('navigation',{state}),onError:message=>fail(message)});
   await runtime.initialize(message.camera);
   if(closed||runtime.disposed)return;
   status.hidden=true;post('ready',{state:runtime.diagnostics()});
  }catch(error){runtime?.dispose();if(!closed)fail(error instanceof Error?error.message:'Lunar globe unavailable. Return to Solar and retry.');}
  finally{starting=false;}
  return;
 }
 if(message.type!=='command'||typeof message.requestId!=='string'||message.requestId.length>150)return;
 try{
  if(!runtime)throw Error('Lunar runtime is not initialized');
  let state;const p=message.payload??{};
  switch(message.command){
   case'navigate':state=runtime.navigate(p);break;
   case'zoom':state=runtime.zoom(p.factor);break;
   case'orbit':state=runtime.orbit(p.radians);break;
   case'getState':state=runtime.diagnostics();break;
   case'dispose':closed=true;state=runtime.dispose();break;
   default:throw Error('Unsupported lunar command');
  }
  post('ack',{requestId:message.requestId,state});
 }catch(error){post('error',{requestId:message.requestId,message:error instanceof Error?error.message:'Lunar command failed',state:runtime?.diagnostics()});}
});
window.addEventListener('pagehide',()=>{closed=true;runtime?.dispose();});
if(validChannel)post('frameReady');else fail('Open the Moon from Astronomy Hub Solar System.');
// Serializable qualification evidence; no renderer objects cross the bridge.
window.orasPlanetDiagnostics=()=>runtime?.diagnostics()??{ready:false,disposed:closed};
