import {startImageryCache} from '../../packages/imagery-cache/client.mjs';
import {installLocalVisualProof} from './core/LocalVisualProof.mjs';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import './style.css';
import {EllipsoidalOccluder} from 'cesium';
import {EarthRuntime} from './core/EarthRuntime.mjs';
import {RuntimeBridge} from './core/RuntimeBridge.mjs';
let runtime,bridge,starting,stopping,leaving=false;
function stop(){bridge?.close();return stopping??=(runtime?.destroy()??Promise.resolve());}
function start(){
 if(starting)return starting;
 if(runtime?.ready&&!runtime.lifecycle.closed)return Promise.resolve();
 starting=initialize().finally(()=>{starting=null});
 return starting;
}
void startImageryCache();
async function initialize(){
 await stop();stopping=undefined;
 if(leaving)return;
 document.querySelector('#layers').replaceChildren();document.querySelector('#selection').hidden=true;
 document.querySelector('#earth').dataset.status='loading';
 document.querySelector('#failure').hidden=true;document.querySelector('#loading').hidden=false;
 try{runtime=new EarthRuntime();await runtime.initialize();
  if(leaving||runtime.lifecycle.closed){await stop();return;}
  bridge=RuntimeBridge(runtime);bridge.ready();installLocalVisualProof(runtime);
  // Serializable lifecycle evidence; no renderer objects exposed to the Hub.
  window.orasEarthVisibleTargets=()=>{if(runtime.viewer.isDestroyed())return [];const viewer=runtime.viewer,occluder=new EllipsoidalOccluder(viewer.scene.globe.ellipsoid,viewer.camera.positionWC);return viewer.entities.values.filter(entity=>entity.orasMetadata&&entity.show).flatMap(entity=>{const point=entity.position?.getValue(viewer.clock.currentTime);if(!point||!occluder.isPointVisible(point))return [];const screen=viewer.scene.cartesianToCanvasCoordinates(point);return screen?[{id:entity.id,name:entity.name,kind:entity.orasMetadata.layerId,x:screen.x,y:screen.y}]:[]})};
  window.orasEarthDiagnostics=()=>({owner:'Astronomy Hub',monotonicMs:performance.now(),globeTilesLoaded:runtime.viewer.isDestroyed()?null:runtime.viewer.scene.globe.tilesLoaded,ready:runtime.ready,disposed:runtime.lifecycle.closed,viewerDestroyed:runtime.viewer.isDestroyed(),site:{...runtime.site},layers:runtime.registry.snapshot(),providers:Object.fromEntries(runtime.providerStatus.values),entityCount:runtime.viewer.isDestroyed()?0:runtime.viewer.entities.values.length,timings:{...runtime.timings},cameraMotion:runtime.camera.motionState(),cameraHeightM:runtime.viewer.isDestroyed()?null:runtime.viewer.camera.positionCartographic.height,navigation:runtime.viewer.isDestroyed()?null:runtime.navigation(),tracking:runtime.viewer.isDestroyed()?null:runtime.viewer.trackedEntity?.id??null,selection:runtime.selectionMetadata,quality:runtime.visual?.quality,imagery:runtime.visual?.imagery.diagnostics()});
 }catch{await stop();document.querySelector('#failure').hidden=false;document.querySelector('#loading').hidden=true;}
}
document.querySelector('#retry').addEventListener('click',()=>{void start()});
window.addEventListener('pagehide',event=>{
 if(event.persisted){runtime?.camera?.interrupt(true,{preserveTracking:true});return;} // Preserve the runtime, never a pending camera gesture.
 leaving=true;void stop();
});
window.addEventListener('pageshow',async event=>{
 if(!event.persisted)return;
 leaving=false;await starting;
 if(!runtime||runtime.lifecycle.closed)await start();
});
void start();
