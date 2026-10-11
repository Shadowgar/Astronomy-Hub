import {Cartesian3,JulianDate} from 'cesium';
// Explicit loopback-only proof seam: accepts serializable camera coordinates,
// never exposes Viewer objects or changes observer/science/selection contracts.
export function installLocalVisualProof(runtime){
 if(typeof location==='undefined'||!['localhost','127.0.0.1','[::1]'].includes(location.hostname)||new URLSearchParams(location.search).get('orasProof')!=='1')return;
 window.orasEarthProofView=async({lon,lat,height,heading=0,pitch=-Math.PI/2,roll=0,utc})=>{
  if(runtime.lifecycle.closed||![lon,lat,height,heading,pitch,roll].every(Number.isFinite)||Math.abs(lon)>180||Math.abs(lat)>90||height<100||height>30000000)throw Error('Invalid proof view');
  runtime.viewer.camera.cancelFlight();runtime.viewer.camera.setView({destination:Cartesian3.fromDegrees(lon,lat,height),orientation:{heading,pitch,roll}});
  if(utc)runtime.setTime(utc);await runtime.visual.configPromise;await runtime.visual.imagery.updateView();runtime.viewer.scene.requestRender();
 };
 window.orasEarthProofState=()=>{const v=runtime.viewer,c=v.camera,p=c.positionCartographic,gl=v.canvas.getContext('webgl2')??v.canvas.getContext('webgl');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return {camera:{longitude:p.longitude,latitude:p.latitude,height:p.height,heading:c.heading,pitch:c.pitch,roll:c.roll,position:[c.positionWC.x,c.positionWC.y,c.positionWC.z]},utc:JulianDate.toDate(v.clock.currentTime).toISOString(),viewport:{width:v.canvas.clientWidth,height:v.canvas.clientHeight,dpr:devicePixelRatio},renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unavailable',globeTilesLoaded:v.scene.globe.tilesLoaded,imageryOrder:Array.from({length:v.imageryLayers.length},(_,i)=>{const layer=v.imageryLayers.get(i);return layer===runtime.visual.imagery.base?'local':layer===runtime.visual.imagery.managed?runtime.visual.imagery.actual:layer===runtime.visual.imagery.labels?.layer?'labels':'independent-overlay';})};};
 runtime.lifecycle.add(()=>{delete window.orasEarthProofView;delete window.orasEarthProofState;});
}
