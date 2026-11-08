import test from 'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{runInNewContext}from'node:vm';
// Emulate Cesium1.138's public resolution contract: recommended resolution
// defaults to CSS pixels, while false uses the browser's real device pixel ratio.
const source=readFileSync(new URL('../../runtimes/earth-runtime/core/ViewerController.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export class','class')+';ViewerController';
for(const dpr of[1,2,3])test(`Earth DPR${dpr} keeps sharp bounded framebuffer and unchanged camera/lighting`,async()=>{
 class Viewer{constructor(_container,options){this.useBrowserRecommendedResolution=options.useBrowserRecommendedResolution??true;this.resolutionScale=1;this.scene={globe:{tileLoadProgressEvent:{addEventListener(){return()=>{}}}},skyBox:{sources:{}},skyAtmosphere:{},fog:{},screenSpaceCameraController:{},requestRender(){}};this.canvas={dataset:{},setAttribute(){}};this.screenSpaceEventHandler={removeInputAction(){}}}isDestroyed(){return false}destroy(){}}
 const Controller=runInNewContext(source,{Viewer,EllipsoidTerrainProvider:class{},Color:{fromCssColorString:()=>({})},ScreenSpaceEventType:{LEFT_DOUBLE_CLICK:1},Resource:class{},Promise,Object,devicePixelRatio:dpr});const c=new Controller({},{});await c.skyboxReady;const effective=(c.viewer.useBrowserRecommendedResolution?1:dpr)*c.viewer.resolutionScale;
 assert.equal(effective,Math.min(dpr,1.5),'Framebuffer must cap at1.5 device pixels per CSS pixel without undersampling high-DPI screens');assert.equal(c.viewer.scene.globe.enableLighting,true);assert.equal(c.viewer.scene.screenSpaceCameraController.maximumZoomDistance,30000000);c.destroy();
});
