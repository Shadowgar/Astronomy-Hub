import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import {PlanetRuntime} from '../../../runtimes/planet-runtime/PlanetRuntime.mjs';
import {createLolaTerrainProvider} from '../../../runtimes/planet-runtime/lolaTerrain.mjs';
import {loadLolaHeightGrid} from '../../../frontend/src/features/planet/lolaHeightGrid.ts';
import './style.css';

const status=document.querySelector('#status'),abort=new AbortController();
let runtime,terrain,active='sphere',ready=false;
const errors=[];
const epoch='2026-10-28T00:00:00Z';
const fail=error=>{errors.push(String(error?.message||error));status.textContent=errors.at(-1);document.body.dataset.status='error';};
function diagnostics(){
 const alive=runtime&&!runtime.disposed;
 return {ready,active,epoch,errors:[...errors],native:runtime?.diagnostics(),terrain:terrain?.diagnostics(),rendererCount:document.querySelectorAll('#viewer canvas').length,
 terrainInstalled:alive?runtime.viewer.terrainProvider===terrain:false,
 renderedHeightProbes:alive?[10,13,16].map(latitude=>({longitude:-23,latitude,heightMeters:runtime.viewer.scene.globe.getHeight(Cesium.Cartographic.fromDegrees(-23,latitude))??null})):[]};
}
window.orasTerrainDemo={diagnostics};
function setSurface(mode){
 if(!ready||runtime.disposed)return;
 runtime.viewer.terrainProvider=mode==='terrain'?terrain:new Cesium.EllipsoidTerrainProvider({ellipsoid:runtime.ellipsoid});
 runtime.viewer.scene.verticalExaggeration=1;active=mode;
 runtime.viewer.scene.requestRender();
 status.textContent=mode==='terrain'?'LOLA coarse terrain active · source LOD0–3 · higher mesh LOD is interpolation only':'Reference sphere active · no elevation';
}
function oblique(){runtime.navigate({longitudeDeg:-23,latitudeDeg:5,heightM:85000,headingRad:0,pitchRad:-.42,rollRad:0});}
function globe(){runtime.navigate({longitudeDeg:-23,latitudeDeg:5,heightM:3600000});}
function dispose(){abort.abort();terrain?.dispose();if(runtime&&!runtime.disposed)runtime.dispose();ready=false;status.textContent='Native Moon renderer and terrain source released';document.body.dataset.status='disposed';}
document.querySelector('#terrain').onclick=()=>setSurface('terrain');
document.querySelector('#sphere').onclick=()=>setSurface('sphere');
document.querySelector('#oblique').onclick=()=>ready&&oblique();
document.querySelector('#globe').onclick=()=>ready&&globe();
document.querySelector('#dispose').onclick=dispose;
window.addEventListener('pagehide',dispose,{once:true});
async function initialize(){try{
 const response=await fetch('/api/v1/planet-view/moon?time='+encodeURIComponent(epoch),{signal:abort.signal});
 if(!response.ok)throw Error('Qualified lunar API unavailable: '+response.status);
 const contract=await response.json();
 const grid=await loadLolaHeightGrid(abort.signal,'/owner-review/solar2-terrain/data/ldem_4.img');
 terrain=createLolaTerrainProvider(Cesium,grid,{signal:abort.signal});
 runtime=new PlanetRuntime(document.querySelector('#viewer'),{contract,onError:fail});
 runtime.viewer.scene.globe.maximumScreenSpaceError=4;
 runtime.viewer.scene.globe.tileCacheSize=64;
 await runtime.initialize({longitudeDeg:-23,latitudeDeg:5,heightM:3600000});
 // Release may happen while the original runtime is awaiting WAC imagery.
 // Its initialize promise resolves after disposal; do not resurrect this demo.
 if(abort.signal.aborted||runtime.disposed)return;
 ready=true;setSurface('terrain');document.body.dataset.status='ready';
 window.orasTerrainDemo={diagnostics,setSurface,oblique,globe,dispose};
}catch(error){if(!abort.signal.aborted)fail(error);terrain?.dispose();runtime?.dispose();}}
initialize();
