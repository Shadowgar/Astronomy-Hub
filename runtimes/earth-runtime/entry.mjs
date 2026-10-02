import 'cesium/Build/Cesium/Widgets/widgets.css';
import './style.css';
import {EarthRuntime} from './core/EarthRuntime.mjs';
import {RuntimeBridge} from './core/RuntimeBridge.mjs';
let runtime,bridge;
async function start(){
 document.querySelector('#failure').hidden=true;document.querySelector('#loading').hidden=false;
 try{runtime=new EarthRuntime();await runtime.initialize();bridge=RuntimeBridge(runtime);bridge.ready();
  // Serializable lifecycle evidence; no renderer objects exposed to the Hub.
  window.orasEarthDiagnostics=()=>({owner:'Astronomy Hub',ready:runtime.ready,disposed:runtime.lifecycle.closed,viewerDestroyed:runtime.viewer.isDestroyed(),site:{...runtime.site},layers:runtime.registry.snapshot(),timings:{...runtime.timings},tracking:runtime.viewer.isDestroyed()?null:runtime.viewer.trackedEntity?.id??null,selection:runtime.selectionMetadata});
 }catch{await runtime?.destroy();document.querySelector('#failure').hidden=false;document.querySelector('#loading').hidden=true;}
}
document.querySelector('#retry').addEventListener('click',()=>{bridge?.close();void start()});
window.addEventListener('pagehide',()=>{bridge?.close();void runtime?.destroy()},{once:true});
void start();
